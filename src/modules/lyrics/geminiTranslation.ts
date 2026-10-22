import { ALL_GEMINI_MODELS, isGeminiModel, LYRICS_CACHE_TTL_MS, TRANSLATION_ERROR_LOG } from "@constants";
import { AppState } from "@core/appState";
import { getLanguageDisplayName, t } from "@core/i18n";
import { logCore } from "@core/logger";
import { getTransientStorage, setTransientStorage } from "@core/storage";
import { createScriptClassifier, type ScriptClassifier } from "@modules/lyrics/nonLatinScript";
import { findBestLanguageMatch, langCodesMatch, languageMatchesAny } from "@utils";
import type { Lyric } from "./providers/shared";
import {
  type BatchRequest,
  type BatchTranslationResponse,
  type TranslationResult,
  translateBatch,
} from "./translation";

interface GeminiFlightResult {
  parsedLines: string[];
  model: string;
}

const inFlightGemini = new Map<string, { promise: Promise<GeminiFlightResult | null>; signal?: AbortSignal }>();

/**
 * Translates a batch of lyric lines using Gemini models with model fallback.
 */
export async function translateBatchGemini(request: BatchRequest): Promise<BatchTranslationResponse> {
  const { lines, targetLanguage, sourceLanguage, scripts, signal } = request;
  if (!targetLanguage || lines.length === 0) {
    return { results: lines.map(() => null), detectedLanguage: "" };
  }

  const videoId = request.videoId || AppState.lastLoadedVideoId;
  const lineCount = lines.length;
  const configuredModels =
    AppState.geminiModelFallback && AppState.geminiModelFallback.length > 0
      ? AppState.geminiModelFallback
      : ALL_GEMINI_MODELS;
  const models = configuredModels.filter(m => !m.startsWith("d_") && isGeminiModel(m));
  const apiKey = AppState.geminiApiKey.trim();
  const lyricSource = request.providerKey || AppState.currentProviderKey || "unknown";
  const mode = AppState.geminiTranslationMode === "quality" ? "quality" : "speed";
  const resolvedSourceLang = sourceLanguage || "";

  if (models.length === 0) {
    logCore(TRANSLATION_ERROR_LOG, "All Gemini models are disabled in fallback sequence");
    return { results: lines.map(() => null), detectedLanguage: resolvedSourceLang };
  }

  if (!apiKey) {
    logCore(TRANSLATION_ERROR_LOG, "Gemini API key is missing");
    return { results: lines.map(() => null), detectedLanguage: "" };
  }

  const results: (TranslationResult | null)[] = new Array(lines.length).fill(null);

  for (const model of models) {
    const cacheKey = `gemini_${lyricSource}_${model}_${mode}_${videoId}_${targetLanguage}_${lineCount}`;
    try {
      const cachedData = await getTransientStorage(cacheKey);
      if (cachedData) {
        const cachedLines = JSON.parse(cachedData);
        if (Array.isArray(cachedLines) && cachedLines.length === lineCount) {
          cachedLines.forEach((t, i) => {
            const lineLang = scripts.detectScriptLanguage(lines[i]) || resolvedSourceLang;
            results[i] = { originalLanguage: lineLang, translatedText: t };
          });
          return { results, detectedLanguage: resolvedSourceLang, translationSource: model };
        }
      }
    } catch (e) {
      logCore(TRANSLATION_ERROR_LOG, "Cache read error", e);
    }
  }

  const flightKey = `${lyricSource}_${mode}_${videoId}_${targetLanguage}_${lineCount}`;
  const existingFlight = inFlightGemini.get(flightKey);
  let flightPromise: Promise<GeminiFlightResult | null>;

  if (existingFlight && !existingFlight.signal?.aborted) {
    flightPromise = existingFlight.promise;
  } else {
    flightPromise = (async (): Promise<GeminiFlightResult | null> => {
      const targetLanguageName = getLanguageDisplayName(targetLanguage, "en");
      const prompt = `Translate the following lyrics to ${targetLanguageName}. Here are the lyrics:\n\n${JSON.stringify(lines)}`;

      for (const model of models) {
        try {
          const isQualityMode = AppState.geminiTranslationMode === "quality";
          const useQuality = isQualityMode;

          const systemInstruction = useQuality
            ? `Translate the input JSON array of lyrics to the target language. Return a JSON array of translated strings matching the input length.`
            : `You are a translation API for a music player feature.

The user is actively listening to music and needs synchronized lyric translations displayed in real time.

Output format: Return a JSON array of translated strings matching the input length.
Example input: ["Hello", "World"]
Example output: ["你好", "世界"]

Rules:
1. Never merge multiple lines into one
2. Never split one line into multiple lines
3. Maintain the exact same number of lines
4. If text is empty or just symbols, return it unchanged
`;

          const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: {
              parts: [
                {
                  text: systemInstruction,
                },
              ],
            },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "ARRAY",
                items: { type: "STRING" },
                minItems: Math.min(2, lineCount),
              },
              thinkingConfig: {
                thinkingLevel: useQuality ? "medium" : "minimal",
              },
            },
          };

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(payload),
            signal,
          });

          if (!response.ok) {
            logCore(TRANSLATION_ERROR_LOG, `Gemini API error with model ${model}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (text) {
            let parsedLines: string[];
            try {
              parsedLines = JSON.parse(text);
            } catch (e) {
              logCore(TRANSLATION_ERROR_LOG, `Failed to parse Gemini response for model ${model}`, e);
              continue;
            }

            if (Array.isArray(parsedLines) && parsedLines.length === lineCount) {
              const cacheKey = `gemini_${lyricSource}_${model}_${mode}_${videoId}_${targetLanguage}_${lineCount}`;
              await setTransientStorage(cacheKey, JSON.stringify(parsedLines), LYRICS_CACHE_TTL_MS);
              return { parsedLines, model };
            } else {
              logCore(
                TRANSLATION_ERROR_LOG,
                `Model ${model} returned ${parsedLines.length} lines, expected ${lineCount}`
              );
            }
          }
        } catch (error) {
          if ((error as Error).name === "AbortError") throw error;
          logCore(TRANSLATION_ERROR_LOG, `Gemini translation failed with model ${model}`, error);
        }
      }

      return null;
    })();

    inFlightGemini.set(flightKey, { promise: flightPromise, signal });
    flightPromise.finally(() => {
      if (inFlightGemini.get(flightKey)?.promise === flightPromise) {
        inFlightGemini.delete(flightKey);
      }
    });
  }

  const flightResult = await flightPromise;
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (flightResult) {
    flightResult.parsedLines.forEach((t, i) => {
      const lineLang = scripts.detectScriptLanguage(lines[i]) || resolvedSourceLang;
      results[i] = { originalLanguage: lineLang, translatedText: t };
    });
    return { results, detectedLanguage: resolvedSourceLang, translationSource: flightResult.model };
  }

  return { results, detectedLanguage: resolvedSourceLang, translationError: true };
}

interface GeminiTranslationBatchItem {
  index: number;
  text: string;
}

export function getGeminiTranslationBatchItems(
  lyrics: readonly Lyric[],
  sourceLanguage: string | null | undefined,
  targetLanguage: string,
  scripts: ScriptClassifier,
  isTranslationDisabledForLang: (lang: string) => boolean
): GeminiTranslationBatchItem[] {
  if (!targetLanguage || lyrics.length === 0) return [];

  const hasFileTranslation = lyrics.some(
    item =>
      (item.translations &&
        Object.entries(item.translations).some(
          ([lang, text]) => langCodesMatch(targetLanguage, lang) && Boolean(text?.trim())
        )) ||
      (item.translation &&
        langCodesMatch(targetLanguage, item.translation.lang) &&
        Boolean(item.translation.text?.trim()))
  );
  if (hasFileTranslation) return [];

  const batch: GeminiTranslationBatchItem[] = [];

  lyrics.forEach((item, index) => {
    if (item.isInstrumental) return;
    if (item.words === t("lyrics_notFound")) return;

    const scriptLanguage = scripts.detectScriptLanguage(item.words);
    const trustedLanguage =
      sourceLanguage && scriptLanguage && !langCodesMatch(sourceLanguage, scriptLanguage) ? undefined : sourceLanguage;

    const isSourceLangDisabled = !!trustedLanguage && isTranslationDisabledForLang(trustedLanguage);
    if (isSourceLangDisabled) return;

    const matchedLang = item.translations && findBestLanguageMatch(targetLanguage, Object.keys(item.translations));
    if (item.translations && matchedLang) return;
    if (item.translation && findBestLanguageMatch(targetLanguage, [item.translation.lang])) return;

    if (sourceLanguage !== targetLanguage || scripts.hasNonLatinScript(item.words) || !sourceLanguage) {
      batch.push({ index, text: item.words });
    }
  });

  return batch;
}

export async function preTranslateLyricsGemini(
  lyrics: Lyric[],
  providerKey: string,
  videoId: string,
  sourceLanguage?: string | null,
  signal?: AbortSignal
): Promise<void> {
  const targetLanguage = AppState.translationLanguage;
  if (!targetLanguage || lyrics.length === 0) return;

  const scripts = createScriptClassifier(lyrics.map(item => item.words));
  const batch = getGeminiTranslationBatchItems(lyrics, sourceLanguage, targetLanguage, scripts, (lang: string) =>
    languageMatchesAny(lang, AppState.translationDisabledLanguages)
  );

  if (batch.length === 0) return;

  logCore("Pre-translating lyrics with Gemini for", videoId, providerKey, `lines: ${batch.length}`);

  await translateBatch({
    scripts,
    lines: batch.map(b => b.text),
    targetLanguage,
    sourceLanguage: sourceLanguage || undefined,
    videoId,
    providerKey,
    signal,
  });
}

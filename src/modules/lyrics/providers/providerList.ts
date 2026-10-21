import { ALL_GEMINI_MODELS, isGeminiModel } from "@constants";

const stripDisabledPrefix = (id: string): string => (id.startsWith("d_") ? id.slice(2) : id);

export function mergePreferredProviders(stored: readonly string[], defaults: readonly string[]): string[] {
  const merged = [...stored];
  const indexOfKey = (key: string): number => merged.findIndex(id => stripDisabledPrefix(id) === key);

  defaults.forEach((key, defaultIndex) => {
    if (indexOfKey(key) !== -1) return;

    let insertAt = -1;
    for (let i = defaultIndex - 1; i >= 0 && insertAt === -1; i--) {
      const predecessor = indexOfKey(defaults[i]);
      if (predecessor !== -1) insertAt = predecessor + 1;
    }
    for (let i = defaultIndex + 1; i < defaults.length && insertAt === -1; i++) {
      const successor = indexOfKey(defaults[i]);
      if (successor !== -1) insertAt = successor;
    }
    if (insertAt === -1) insertAt = merged.length;

    merged.splice(insertAt, 0, key);
  });

  return merged;
}

export function resolveGeminiFallbackModels(stored: readonly string[] | null | undefined): string[] {
  const list = Array.isArray(stored) && stored.length > 0 ? stored : [...ALL_GEMINI_MODELS];
  const merged = mergePreferredProviders(list, ALL_GEMINI_MODELS);
  const filtered = merged.filter(entry => isGeminiModel(stripDisabledPrefix(entry)));
  return filtered.length > 0 ? filtered : [...ALL_GEMINI_MODELS];
}

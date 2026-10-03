import type { LyricPart } from "@braccato/types";

/**
 * Unicode range for CJK Unified Ideographs (Kanji).
 */
export const KANJI_REGEX = /[\p{Script=Han}\u3005]/u;
export const ALL_KANJI_REGEX = /^[\p{Script=Han}\u3005]+$/u;
export const HAS_KANJI_REGEX = /[\p{Script=Han}\u3005]/u;
export const KANJI_BLOCK_GLOBAL =
  /(?:[0-9０-９]*[\p{Script=Han}\u3005][0-9０-９\p{Script=Han}\u3005]*)/gu;

/**
 * Checks if a string contains any Japanese Kanji characters.
 */
export function containsKanji(text: string): boolean {
  return HAS_KANJI_REGEX.test(text);
}

/**
 * Counts the number of Kanji characters in a string.
 */
export function countKanji(text: string): number {
  if (!text) return 0;
  let count = 0;
  for (const ch of text) {
    if (KANJI_REGEX.test(ch)) count++;
  }
  return count;
}

/**
 * Converts Katakana characters in text to Hiragana.
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, match => String.fromCharCode(match.charCodeAt(0) - 0x60));
}

/**
 * Romanization to Hiragana mapping dictionary (Hepburn and common variants).
 */
const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  // 3-letter combos
  kya: "きゃ",
  kyu: "きゅ",
  kyo: "きょ",
  sha: "しゃ",
  shu: "しゅ",
  sho: "しょ",
  shi: "し",
  cha: "ちゃ",
  chu: "ちゅ",
  cho: "ちょ",
  che: "ちぇ",
  she: "しぇ",
  je: "じぇ",
  tsa: "つぁ",
  tse: "つぇ",
  tso: "つぉ",
  chi: "ち",
  nya: "にゃ",
  nyu: "にゅ",
  nyo: "にょ",
  hya: "ひゃ",
  hyu: "ひゅ",
  hyo: "ひょ",
  mya: "みゃ",
  myu: "みゅ",
  myo: "みょ",
  rya: "りゃ",
  ryu: "りゅ",
  ryo: "りょ",
  gya: "ぎゃ",
  gyu: "ぎゅ",
  gyo: "ぎょ",
  bya: "びゃ",
  byu: "びゅ",
  byo: "びょ",
  pya: "ぴゃ",
  pyu: "ぴゅ",
  pyo: "ぴょ",
  ja: "じゃ",
  ju: "じゅ",
  jo: "じょ",
  ji: "じ",
  jya: "じゃ",
  jyu: "じゅ",
  jyo: "じょ",
  tsu: "つ",
  dzu: "づ",
  dji: "ぢ",
  // Kunrei-shiki / Nihon-shiki 3-letter combos
  sya: "しゃ",
  syu: "しゅ",
  syo: "しょ",
  tya: "ちゃ",
  tyu: "ちゅ",
  tyo: "ちょ",
  zya: "じゃ",
  zyu: "じゅ",
  zyo: "じょ",
  dya: "ぢゃ",
  dyu: "ぢゅ",
  dyo: "ぢょ",

  // 2-letter combos
  ka: "か",
  ki: "き",
  ku: "く",
  ke: "け",
  ko: "こ",
  sa: "さ",
  su: "す",
  se: "せ",
  so: "そ",
  si: "し",
  ta: "た",
  te: "て",
  to: "と",
  ti: "ち",
  tu: "つ",
  na: "な",
  ni: "に",
  nu: "ぬ",
  ne: "ね",
  no: "の",
  ha: "は",
  hi: "ひ",
  fu: "ふ",
  hu: "ふ",
  he: "へ",
  ho: "ほ",
  ma: "ま",
  mi: "み",
  mu: "む",
  me: "め",
  mo: "も",
  ya: "や",
  yu: "ゆ",
  yo: "よ",
  ra: "ら",
  ri: "り",
  ru: "る",
  re: "れ",
  ro: "ろ",
  la: "ら",
  li: "り",
  lu: "る",
  le: "れ",
  lo: "ろ",
  wa: "わ",
  wo: "を",
  ga: "が",
  gi: "ぎ",
  gu: "ぐ",
  ge: "げ",
  go: "ご",
  za: "ざ",
  zu: "ず",
  ze: "ぜ",
  zo: "ぞ",
  zi: "じ",
  da: "だ",
  de: "で",
  do: "ど",
  di: "ぢ",
  du: "づ",
  ba: "ば",
  bi: "び",
  bu: "ぶ",
  be: "べ",
  bo: "ぼ",
  pa: "ぱ",
  pi: "ぴ",
  pu: "ぷ",
  pe: "ぺ",
  po: "ぽ",
  fa: "ふぁ",
  fi: "ふぃ",
  fe: "ふぇ",
  fo: "ふぉ",
  va: "ゔぁ",
  vi: "ゔぃ",
  vu: "ゔ",
  ve: "ゔぇ",
  vo: "ゔぉ",

  // Small vowels & kana
  xa: "ぁ",
  xi: "ぃ",
  xu: "ぅ",
  xe: "ぇ",
  xo: "ぉ",
  xwa: "ゎ",
  xtsu: "っ",
  xtu: "っ",
  xya: "ゃ",
  xyu: "ゅ",
  xyo: "ょ",

  // 1-letter vowels
  a: "あ",
  i: "い",
  u: "う",
  e: "え",
  o: "お",
  n: "ん",
};

/**
 * Normalizes romaji or mixed reading into pure Hiragana.
 * Handles macrons (ō, ū, etc.), gemination (double consonants -> っ), and particles.
 */
export function romajiToHiragana(input: string, keepSpaces = false): string {
  if (!input) return "";

  // Convert katakana first if any
  let str = katakanaToHiragana(input.trim());

  // Replace macron / circumflex long vowels to romaji equivalents first
  str = str
    .replace(/[āâ]/g, "aa")
    .replace(/[īî]/g, "ii")
    .replace(/[ūû]/g, "uu")
    .replace(/[ēê]/g, "ee")
    .replace(/[ōô]/g, "ou");

  // If already predominantly Hiragana, normalize spaces and return
  if (/^[\u3040-\u309F\s?!.,~:;？！、。〜：；]+$/u.test(str)) {
    return keepSpaces ? str.replace(/\s+/g, " ") : str.replace(/[\s?!.,~:;？！、。〜：；]+/g, "");
  }

  let result = "";
  let i = 0;
  const len = str.length;

  while (i < len) {
    const ch = str[i];

    // Preserve existing hiragana
    if (ch >= "\u3040" && ch <= "\u309F") {
      result += ch;
      i++;
      continue;
    }

    // Preserve whitespace as single space when requested
    if (/\s/.test(ch)) {
      if (keepSpaces && !result.endsWith(" ")) {
        result += " ";
      }
      i++;
      continue;
    }

    // Preserve punctuation marks when keepSpaces is true
    if (keepSpaces && /[?!.,~:;？！、。〜：；]/.test(ch)) {
      result += ch;
      i++;
      continue;
    }

    // Skip symbols
    if (/[^a-z]/i.test(ch)) {
      i++;
      continue;
    }

    const lowerStr = str.toLowerCase();
    const lowerCh = lowerStr[i];

    // Double consonant for sokuon (っ) e.g., "tte", "kki", "ssh"
    if (i + 1 < len && lowerCh === lowerStr[i + 1] && /[bcdfghjklmpqrstvwxyz]/i.test(lowerCh) && lowerCh !== "n") {
      result += "っ";
      i++;
      continue;
    }

    // "tch" / "cch" -> っ + ch
    if (i + 2 < len && (lowerStr.slice(i, i + 3) === "tch" || lowerStr.slice(i, i + 3) === "cch")) {
      result += "っ";
      i++;
      continue;
    }

    // Syllabic 'n' before 'y' (e.g., "konya" -> "kon" + "ya", "kinyou" -> "kin" + "you", "shinyu" -> "shin" + "yu")
    // When 'nya', 'nyu', or 'nyo' follows a vowel, it represents syllabic 'n' (ん) followed by 'ya', 'yu', or 'yo'.
    // In Japanese, native/Sino-Japanese words do not have 'にゃ', 'にゅ', or 'にょ' after a vowel,
    // whereas words like 今夜 (konya), 深夜 (shinya), 親友 (shinyu), 本屋 (honya), 婚約 (konyaku), 金曜 (kinyou) are ubiquitous.
    if (lowerCh === "n" && (lowerStr.slice(i, i + 3) === "nya" || lowerStr.slice(i, i + 3) === "nyu" || lowerStr.slice(i, i + 3) === "nyo")) {
      const prevCh = i > 0 ? lowerStr[i - 1] : "";
      if (/[aeiou]/i.test(prevCh)) {
        result += "ん";
        i++;
        continue;
      }
    }

    // Try 3-char match
    if (i + 3 <= len) {
      const sub3 = lowerStr.slice(i, i + 3);
      if (ROMAJI_TO_HIRAGANA[sub3]) {
        result += ROMAJI_TO_HIRAGANA[sub3];
        i += 3;
        continue;
      }
    }

    // Try 2-char match
    if (i + 2 <= len) {
      const sub2 = lowerStr.slice(i, i + 2);
      if (ROMAJI_TO_HIRAGANA[sub2]) {
        result += ROMAJI_TO_HIRAGANA[sub2];
        i += 2;
        continue;
      }
    }

    // Syllabic 'n' handling: "n'" or "n" before consonant / end of word
    if (lowerCh === "n") {
      const next = lowerStr[i + 1];
      if (!next || /[^aeiouy]/i.test(next)) {
        result += "ん";
        if (next === "'" || next === "’" || next === "-") i++;
        i++;
        continue;
      }
    }

    // 1-char vowel
    if (ROMAJI_TO_HIRAGANA[lowerCh]) {
      result += ROMAJI_TO_HIRAGANA[lowerCh];
      i++;
      continue;
    }

    // Trailing consonant for sokuon (っ) e.g., "is" in "is-sho", "it" in "it-te", "t" alone
    if (i === len - 1 && /[bcdfghjklmpqrstvwxyz]/i.test(lowerCh) && lowerCh !== "n" && !result.endsWith("っ")) {
      result += "っ";
      i++;
      continue;
    }

    // If no match, step forward
    i++;
  }

  return result;
}

export interface RubySegment {
  text: string;
  ruby?: string;
}

/**
 * Normalizes small Japanese kana (ぁ, ぃ, ぅ, ぇ, ぉ, ゎ, ヵ, ヶ) to standard kana.
 */
export function normalizeSmallKana(ch: string): string {
  switch (ch) {
    case "ぁ":
    case "ァ":
      return "あ";
    case "ぃ":
    case "ィ":
      return "い";
    case "ぅ":
    case "ゥ":
      return "う";
    case "ぇ":
    case "ェ":
      return "え";
    case "ぉ":
    case "ォ":
      return "お";
    case "ゎ":
    case "ヮ":
      return "わ";
    case "ヵ":
      return "か";
    case "ヶ":
      return "け";
    default:
      return ch;
  }
}

/**
 * Checks if two kana characters are phonetically equivalent (especially for particles and small kana).
 * e.g., は (ha) pronounced wa (わ), を (wo) pronounced o (お), へ (he) pronounced e (え),
 * and small kana ぁぃぅぇぉ matched to regular vowels あいうえお.
 */
function areKanaEquivalent(textKana: string, readingKana: string): boolean {
  if (textKana === readingKana) return true;

  const hText = katakanaToHiragana(textKana);
  const hReading = katakanaToHiragana(readingKana);
  if (hText === hReading) return true;

  const normText = normalizeSmallKana(hText);
  const normReading = normalizeSmallKana(hReading);
  if (normText === normReading) return true;

  if (normText === "は" && normReading === "わ") return true;
  if (normText === "わ" && normReading === "は") return true;
  if (normText === "を" && normReading === "お") return true;
  if (normText === "お" && normReading === "を") return true;
  if (normText === "へ" && normReading === "え") return true;
  if (normText === "え" && normReading === "へ") return true;
  // Yotsugana equivalents: づ (dzu) vs ず (zu), ぢ (dji) vs じ (ji)
  if ((normText === "づ" && normReading === "ず") || (normText === "ず" && normReading === "づ")) return true;
  if ((normText === "ぢ" && normReading === "じ") || (normText === "じ" && normReading === "ぢ")) return true;
  // Long vowel mark ー
  if (normText === "ー" || normReading === "ー") return true;
  return false;
}

/**
 * Strips leading/trailing non-phonetic punctuation and whitespace from ruby reading,
 * ensuring any Latin characters are converted to Hiragana.
 */
function cleanRuby(ruby: string): string {
  if (!ruby) return "";
  let kana = ruby;
  if (/[a-zA-Z]/.test(kana)) {
    kana = romajiToHiragana(kana);
  }
  return kana
    .replace(
      /^[^\p{Script=Hiragana}\p{Script=Katakana}\u30FC]+|[^\p{Script=Hiragana}\p{Script=Katakana}\u30FC]+$/gu,
      ""
    )
    .replace(/\s+/g, "")
    .trim();
}

interface KanaAnchor {
  pos: number;
  len: number;
}

/**
 * Normalizes full-width and half-width punctuation marks (e.g. ？ -> ?, ！ -> !).
 */
export function normalizePunctuation(str: string): string {
  return str
    .replace(/？/g, "?")
    .replace(/！/g, "!")
    .replace(/：/g, ":")
    .replace(/；/g, ";")
    .replace(/[，、]/g, ",")
    .replace(/[。]/g, ".")
    .replace(/[〜～]/g, "~")
    .replace(/\u3000/g, " ");
}

/**
 * Finds the index of an anchor needle in a reading haystack, considering exact match,
 * case-insensitive Latin match, and phonetic variations with whitespace skipping.
 */
function findKanaAnchor(
  haystack: string,
  needle: string,
  startIndex = 0,
  expectedNextKana?: string
): KanaAnchor | null {
  if (!needle || !needle.trim()) return null;

  // 0. Pure Latin words (e.g. "Still alive", "I", "say", "overdrive") match directly in haystack
  if (/[a-zA-Z]/.test(needle) && !/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(needle)) {
    const lowerHaystack = haystack.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    const lowerDirectIdx = lowerHaystack.indexOf(lowerNeedle, startIndex);
    if (lowerDirectIdx !== -1) {
      return { pos: lowerDirectIdx, len: needle.length };
    }
  }

  // 1. Phonetic kana match (skipping whitespace in haystack and respecting particle pronunciation).
  // Priority tiers (Feature 1: Boundary-First):
  // Tier 1 (Full Boundary): Match has boundaries both before and after (e.g. " の ")
  // Tier 2 (Leading Boundary): Match has boundary before (e.g. " のま")
  // Tier 3 (Internal): Match inside an unbroken word (e.g. の in ほんのう)
  //
  // Lookahead Guard (Feature 2): If expectedNextKana is specified, the mora immediately following
  // the candidate match in haystack MUST be phonetically equivalent to expectedNextKana; otherwise,
  // the candidate cut a word in half and left an orphaned mora (e.g. ほんの[の] leaving orphan 'う').
  let needleKana = katakanaToHiragana(
    needle.replace(/[^\p{Script=Hiragana}\p{Script=Katakana}\p{Letter}\u30FC]/gu, "")
  );
  if (/[a-zA-Z]/.test(needleKana)) {
    needleKana = romajiToHiragana(needleKana);
  }

  let phoneticAnchor: KanaAnchor | null = null;
  if (needleKana) {
    const needleLen = needleKana.length;
    const hasSpaces = haystack.includes(" ");
    let fullBoundaryAnchor: KanaAnchor | null = null;
    let firstCandidate: KanaAnchor | null = null;

    for (let i = startIndex; i < haystack.length; i++) {
      if (/\s/.test(haystack[i])) continue;

      let match = true;
      let hIdx = i;
      let kIdx = 0;

      while (kIdx < needleLen && hIdx < haystack.length) {
        if (/\s/.test(haystack[hIdx])) {
          hIdx++;
          continue;
        }
        if (!areKanaEquivalent(haystack[hIdx], needleKana[kIdx])) {
          match = false;
          break;
        }
        hIdx++;
        kIdx++;
      }

      if (match && kIdx === needleLen) {
        // Feature 2: Lookahead Guard - check if candidate leaves an orphaned mora
        if (expectedNextKana) {
          let afterIdx = hIdx;
          while (afterIdx < haystack.length && /[\s?!.,~:;？！、。〜：；]/.test(haystack[afterIdx])) {
            afterIdx++;
          }
          if (afterIdx < haystack.length && /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(haystack[afterIdx])) {
            const nextHaystackKana = katakanaToHiragana(haystack[afterIdx]);
            if (!areKanaEquivalent(nextHaystackKana, expectedNextKana)) {
              // The mora immediately following this match does not match expectedNextKana.
              // Candidate cut a word in half and left an orphaned mora.
              continue;
            }
          }
        }

        // Feature 1: Boundary-First Matching
        // A full boundary (standalone particle/word like " の ", " は ") has whitespace/punctuation on BOTH sides.
        const atLeadingBoundary = i === 0 || /[\s?!.,~:;？！、。〜：；]/.test(haystack[i - 1]);
        const atTrailingBoundary = hIdx === haystack.length || /[\s?!.,~:;？！、。〜：；]/.test(haystack[hIdx]);
        const isFullBoundary = atLeadingBoundary && atTrailingBoundary;

        if (isFullBoundary) {
          fullBoundaryAnchor = { pos: i, len: hIdx - i };
          break; // Fully-bounded standalone anchor is optimal, take immediately
        }

        if (!firstCandidate) {
          firstCandidate = { pos: i, len: hIdx - i };
        }

        // If haystack has spaces, scan up to 6 characters ahead for a possible fullBoundaryAnchor
        if (hasSpaces && i > startIndex + 6) {
          break;
        }
      }
    }

    phoneticAnchor = fullBoundaryAnchor || firstCandidate;
  }


  // 2. Direct literal match (brackets, symbols, spaces, or exact substring)
  const directIdx = haystack.indexOf(needle, startIndex);
  if (directIdx !== -1) {
    if (!phoneticAnchor) {
      if (expectedNextKana) {
        let afterIdx = directIdx + needle.length;
        while (afterIdx < haystack.length && /[\s?!.,~:;？！、。〜：；]/.test(haystack[afterIdx])) {
          afterIdx++;
        }
        if (afterIdx < haystack.length && /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(haystack[afterIdx])) {
          const nextHaystackKana = katakanaToHiragana(haystack[afterIdx]);
          if (!areKanaEquivalent(nextHaystackKana, expectedNextKana)) {
            return null;
          }
        }
      }
      return { pos: directIdx, len: needle.length };
    }
    // Only allow direct match to override phonetic anchor if needle contains punctuation/symbols/brackets
    // and matches earlier; for pure kana needles, the boundary-aware phonetic match takes precedence.
    if (/[\p{Punctuation}\p{Symbol}]/u.test(needle) && directIdx <= phoneticAnchor.pos) {
      return { pos: directIdx, len: needle.length };
    }
  }

  // If a phonetic anchor was found earlier than any direct match, return it
  if (phoneticAnchor) {
    return phoneticAnchor;
  }

  // 2b. Punctuation-normalized direct match (handling half-width vs full-width ? ! etc.)
  const normHaystack = normalizePunctuation(haystack);
  const normNeedle = normalizePunctuation(needle);
  if (normHaystack !== haystack || normNeedle !== needle) {
    const normIdx = normHaystack.indexOf(normNeedle, startIndex);
    if (normIdx !== -1) return { pos: normIdx, len: needle.length };
  }

  // 2c. Trimmed punctuation match when whitespace differs (e.g. "? " vs "?")
  const trimmedNeedle = normNeedle.trim();
  if (trimmedNeedle && trimmedNeedle !== normNeedle) {
    const trimmedIdx = normHaystack.indexOf(trimmedNeedle, startIndex);
    if (trimmedIdx !== -1) return { pos: trimmedIdx, len: trimmedNeedle.length };
  }

  // 3. Case-insensitive direct match for Latin words (e.g. "Tell me a story" vs "tell me a story")
  const lowerHaystack = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const lowerDirectIdx = lowerHaystack.indexOf(lowerNeedle, startIndex);
  if (lowerDirectIdx !== -1) return { pos: lowerDirectIdx, len: needle.length };

  return null;
}


/**
 * Looks ahead from a given token and character offset to find the immediate next Hiragana
 * expected in the lyrics text. Used by Lookahead Guard to avoid cutting words in half.
 * Only checks Hiragana because Katakana loanwords can have vowel divergence from romaji (e.g. game -> がめ vs ゲーム).
 */
function getNextExpectedKana(
  tokens: { text: string; isKanji: boolean }[],
  tokenIdx: number,
  offsetInTokenText: number
): string | undefined {
  const getFirstKana = (str: string): string | undefined => {
    const trimmed = str.replace(/^[\s?!.,~:;？！、。〜：；]+/, "");
    if (!trimmed) return undefined;
    if (/^\p{Script=Hiragana}/u.test(trimmed)) {
      return trimmed[0];
    }
    return undefined;
  };

  const local = getFirstKana(tokens[tokenIdx].text.slice(offsetInTokenText));
  if (local) return local;

  // If token has nothing left, look at subsequent non-kanji token
  if (!tokens[tokenIdx].text.slice(offsetInTokenText).trim()) {
    for (let k = tokenIdx + 1; k < tokens.length; k++) {
      if (!tokens[k].isKanji) {
        const next = getFirstKana(tokens[k].text);
        if (next) return next;
        if (tokens[k].text.trim()) break;
      } else {
        break;
      }
    }
  }
  return undefined;
}


const BRACKETED_KANJI_GLOBAL = /([\p{Script=Han}\u3005]+)[（(]([\u3040-\u309F\u30A0-\u30FF\u30FC]+)[）)]/gu;

/**
 * Aligns a line containing Kanji with its Hiragana reading using the Kana Anchor algorithm.
 *
 * @param lineText Original line text (e.g. "私の名前は運命です")
 * @param readingHiragana Full line reading in Hiragana (e.g. "わたしのなまえはさだめです")
 * @returns Array of segments, where Kanji segments have their matching `ruby` string.
 */
export function alignLineByKanaAnchors(lineText: string, readingHiragana: string): RubySegment[] {
  if (!lineText || !containsKanji(lineText) || !readingHiragana) {
    return [{ text: lineText }];
  }

  // Tokenize lineText into alternating runs of Kanji and Non-Kanji,
  // identifying Kanji(kana) bracketed units.
  interface Token {
    text: string;
    isKanji: boolean;
    bracketKana?: string;
  }
  const tokens: Token[] = [];

  const bracketMatches: { text: string; kanji: string; kana: string; start: number; end: number }[] = [];
  let bm: RegExpExecArray | null;
  BRACKETED_KANJI_GLOBAL.lastIndex = 0;
  while ((bm = BRACKETED_KANJI_GLOBAL.exec(lineText)) !== null) {
    bracketMatches.push({
      text: bm[0],
      kanji: bm[1],
      kana: katakanaToHiragana(bm[2]),
      start: bm.index,
      end: bm.index + bm[0].length,
    });
  }

  const tokenizeSlice = (slice: string) => {
    let textIdx = 0;
    let m: RegExpExecArray | null;
    KANJI_BLOCK_GLOBAL.lastIndex = 0;
    while ((m = KANJI_BLOCK_GLOBAL.exec(slice)) !== null) {
      if (m.index > textIdx) {
        tokens.push({ text: slice.slice(textIdx, m.index), isKanji: false });
      }
      tokens.push({ text: m[0], isKanji: true });
      textIdx = m.index + m[0].length;
    }
    if (textIdx < slice.length) {
      tokens.push({ text: slice.slice(textIdx), isKanji: false });
    }
  };

  let textIdx = 0;
  for (const b of bracketMatches) {
    if (b.start > textIdx) {
      tokenizeSlice(lineText.slice(textIdx, b.start));
    }
    tokens.push({
      text: b.text,
      isKanji: true,
      bracketKana: b.kana,
    });
    textIdx = b.end;
  }
  if (textIdx < lineText.length) {
    tokenizeSlice(lineText.slice(textIdx));
  }

  const result: RubySegment[] = [];
  let readingCursor = 0;
  const normalizedReading = katakanaToHiragana(readingHiragana);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Skip any leading whitespace in normalizedReading
    while (readingCursor < normalizedReading.length && /\s/.test(normalizedReading[readingCursor])) {
      readingCursor++;
    }

    // If Kanji(kana) bracketed reading: when reading has no brackets and matches bracketKana,
    // treat as an atomic unit: consume reading, preserve text without ruby or absorption.
    if (token.bracketKana) {
      let anchor: KanaAnchor | null = null;
      if (!/[()（）]/.test(readingHiragana)) {
        anchor = findKanaAnchor(normalizedReading, token.bracketKana, readingCursor);
      }
      if (anchor && anchor.pos >= readingCursor && anchor.pos <= readingCursor + 4) {
        result.push({ text: token.text });
        readingCursor = anchor.pos + anchor.len;
        continue;
      }
    }

    if (!token.isKanji) {
      // Non-kanji token (kana / punctuation / spaces)
      result.push({ text: token.text });
      if (!token.text.trim()) {
        continue;
      }
      const nextKanaAfterToken = getNextExpectedKana(tokens, i, token.text.length);
      // Advance reading cursor if this token matches in normalizedReading
      const fullAnchor = findKanaAnchor(normalizedReading, token.text, readingCursor, nextKanaAfterToken);
      if (fullAnchor) {
        readingCursor = fullAnchor.pos + fullAnchor.len;
      } else {
        const words =
          token.text.match(
            /\p{Script=Hiragana}+|[\p{Script=Katakana}\u30FC]+|[A-Za-z0-9'’\-]+|[?!.,~:;？！、。〜：；]+/gu
          ) || [];
        let wordOffset = 0;
        for (const w of words) {
          const wIdx = token.text.indexOf(w, wordOffset);
          wordOffset = (wIdx !== -1 ? wIdx : wordOffset) + w.length;
          const nextKanaAfterWord = getNextExpectedKana(tokens, i, wordOffset);
          const wAnchor = findKanaAnchor(normalizedReading, w, readingCursor, nextKanaAfterWord);
          if (wAnchor) {
            readingCursor = wAnchor.pos + wAnchor.len;
          }
        }
      }
    } else {
      // Kanji token: look ahead for the next anchor
      const minKanjiMora = countKanji(token.text);
      // Advance minKanjiMora by counting actual non-whitespace characters from readingCursor
      let minLookaheadPos = readingCursor;
      let morasSeen = 0;
      while (minLookaheadPos < normalizedReading.length && morasSeen < minKanjiMora) {
        if (!/\s/.test(normalizedReading[minLookaheadPos])) {
          morasSeen++;
        }
        minLookaheadPos++;
      }

      let nextAnchorPos = -1;
      for (let j = i + 1; j < tokens.length; j++) {
        if (!tokens[j].isKanji) {
          const nextKanaAfterToken = getNextExpectedKana(tokens, j, tokens[j].text.length);
          const fullAnchor = findKanaAnchor(normalizedReading, tokens[j].text, minLookaheadPos, nextKanaAfterToken);
          if (fullAnchor && fullAnchor.pos >= minLookaheadPos) {
            const candidate = cleanRuby(normalizedReading.slice(readingCursor, fullAnchor.pos));
            if (!candidate || isPlausibleRuby(token.text, candidate)) {
              nextAnchorPos = fullAnchor.pos;
              break;
            }
          }
          const words =
            tokens[j].text.match(
              /\p{Script=Hiragana}+|[\p{Script=Katakana}\u30FC]+|[A-Za-z0-9'’\-]+|[?!.,~:;？！、。〜：；]+/gu
            ) || [];

          let wordOffset = 0;
          for (const word of words) {
            const wordIdxInText = tokens[j].text.indexOf(word, wordOffset);
            wordOffset = (wordIdxInText !== -1 ? wordIdxInText : wordOffset) + word.length;
            const nextKanaAfterWord = getNextExpectedKana(tokens, j, wordOffset);
            const firstAnchor = findKanaAnchor(normalizedReading, word, minLookaheadPos, nextKanaAfterWord);
            if (firstAnchor && firstAnchor.pos >= minLookaheadPos) {
              const candidate = cleanRuby(normalizedReading.slice(readingCursor, firstAnchor.pos));
              if (!candidate || isPlausibleRuby(token.text, candidate)) {
                nextAnchorPos = firstAnchor.pos;
                break;
              }
            }
          }
          if (nextAnchorPos >= minLookaheadPos) break;


          // Fallback: If token has punctuation or whitespace, look for the next word boundary (space/punctuation) in reading
          if (/[\s?!.,~:;？！、。〜：；]/.test(tokens[j].text)) {
            const nextBoundary = normalizedReading.slice(readingCursor + 1).search(/[\s?!.,~:;？！、。〜：；]/);
            if (nextBoundary !== -1) {
              const boundaryIdx = readingCursor + 1 + nextBoundary;
              const candidate = cleanRuby(normalizedReading.slice(readingCursor, boundaryIdx));
              if (candidate && isPlausibleRuby(token.text, candidate)) {
                nextAnchorPos = boundaryIdx;
                break;
              }
            }
          }
        } else if (tokens[j].bracketKana) {
          const anchor = findKanaAnchor(normalizedReading, tokens[j].bracketKana!, readingCursor + 1);
          if (anchor && anchor.pos > readingCursor) {
            nextAnchorPos = anchor.pos;
            break;
          }
        }
      }

      if (nextAnchorPos > readingCursor) {
        const matchedReading = cleanRuby(normalizedReading.slice(readingCursor, nextAnchorPos));
        if (matchedReading && isPlausibleRuby(token.text, matchedReading)) {
          const normKey = token.text.normalize("NFKC");
          const dictMapping = COMPOUND_KANJI_MAPPINGS[token.text] || COMPOUND_KANJI_MAPPINGS[normKey];
          if (dictMapping && dictMapping.join("") !== matchedReading) {
            result.push({ text: token.text });
          } else {
            const splitReadings = splitKanjiCompoundBySyllables(token.text, matchedReading);
            if (splitReadings && splitReadings.length === token.text.length) {
              result.push(...Array.from(token.text).map((ch, idx) => ({ text: ch, ruby: splitReadings[idx] })));
            } else {
              result.push({ text: token.text, ruby: matchedReading });
            }
          }
        } else {
          result.push({ text: token.text });
        }
        readingCursor = nextAnchorPos;
      } else {
        // Last kanji token before end: take remainder of reading
        const remainingReading = cleanRuby(normalizedReading.slice(readingCursor));
        if (remainingReading && isPlausibleRuby(token.text, remainingReading)) {
          const normKey = token.text.normalize("NFKC");
          const dictMapping = COMPOUND_KANJI_MAPPINGS[token.text] || COMPOUND_KANJI_MAPPINGS[normKey];
          if (dictMapping && dictMapping.join("") !== remainingReading) {
            result.push({ text: token.text });
          } else {
            const splitReadings = splitKanjiCompoundBySyllables(token.text, remainingReading);
            if (splitReadings && splitReadings.length === token.text.length) {
              result.push(...Array.from(token.text).map((ch, idx) => ({ text: ch, ruby: splitReadings[idx] })));
            } else {
              result.push({ text: token.text, ruby: remainingReading });
            }
          }
          readingCursor = normalizedReading.length;
        } else {
          result.push({ text: token.text });
        }
      }
    }
  }

  return result;
}

/**
 * Aligns a single word token (which might be mixed Kanji + Kana) with its Hiragana reading.
 * For example:
 *   "信じる" with reading "しんじる" -> [{ text: "信", ruby: "しん" }, { text: "じる" }]
 *   "運命" with reading "さだめ" -> [{ text: "運命", ruby: "さだめ" }]
 */
export function alignWordWithReading(word: string, readingRomajiOrKana: string): RubySegment[] {
  if (!word || !containsKanji(word)) {
    return [{ text: word }];
  }

  const readingHiragana = romajiToHiragana(readingRomajiOrKana);
  if (!readingHiragana) {
    return [{ text: word }];
  }

  // Strip leading and trailing punctuation/symbols (e.g. "眼？", "「世界」", "言ってしまうの？")
  const prefixMatch = word.match(
    /^[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3005\p{Letter}\p{Number}]+/u
  );
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const suffixMatch = word.match(
    /[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3005\p{Letter}\p{Number}]+$/u
  );
  const suffix = suffixMatch ? suffixMatch[0] : "";
  const coreWord = word.slice(prefix.length, word.length - suffix.length);

  if (coreWord && containsKanji(coreWord)) {
    let coreSegs: RubySegment[];
    // Pure Kanji or Kanji+Digits with no kana inside (e.g. "100分", "罵倒", "笑顔")
    if (!/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(coreWord)) {
      const splitReadings = splitKanjiCompoundBySyllables(coreWord, readingHiragana);
      if (splitReadings && splitReadings.length === coreWord.length) {
        coreSegs = Array.from(coreWord).map((ch, idx) => ({ text: ch, ruby: splitReadings[idx] }));
      } else {
        coreSegs = [{ text: coreWord, ruby: readingHiragana }];
      }
    } else {
      // Mixed Kanji + Kana (e.g. "言ってしまうの", "惹かれちゃうの")
      coreSegs = alignLineByKanaAnchors(coreWord, readingHiragana);
    }
    const result: RubySegment[] = [];
    if (prefix) result.push({ text: prefix });
    result.push(...coreSegs);
    if (suffix) result.push({ text: suffix });
    return result;
  }

  return [{ text: word }];
}

/**
 * Common compound Kanji words where syllable boundaries in singing or romanization
 * might deviate from individual Kanji morphemes (e.g. 笑顔 -> え + がお).
 */
export const COMPOUND_KANJI_MAPPINGS: Record<string, string[]> = {
  笑顔: ["え", "がお"],
  世界: ["せ", "かい"],
  未来: ["み", "らい"],
  大丈夫: ["だい", "じょう", "ぶ"],
  今夜: ["こん", "や"],
  深夜: ["しん", "や"],
  金曜: ["きん", "よう"],
  金曜日: ["きん", "よう", "び"],
  歯車: ["は", "ぐるま"],
  冒険: ["ぼう", "けん"],
  海越: ["うみ", "こ"],
};

/**
 * Known Jukujikun (熟字訓) words whose readings are idiomatic to the compound as a whole
 * and should not be mechanically split into individual kanji.
 */
export const JUKUJIKUN_WORDS = new Set([
  "今日",
  "昨日",
  "明日",
  "大人",
  "眼鏡",
  "煙草",
  "紅葉",
  "田舎",
  "為替",
  "吹雪",
]);

/**
 * Splits a multi-kanji compound reading across its individual kanji when no timing is available,
 * by binding small kana (拗音), sokuon (促音 っ), hatsuon (撥音 ん), and chōon (ー)
 * to their preceding kana mora.
 *
 * In Japanese phonology, neither っ nor ん can ever begin a kanji reading; they are moraic
 * codas that strictly belong to the preceding syllable.
 *
 * When the number of bound syllable units matches the kanji count, they can be safely aligned 1:1.
 */
export function splitKanjiCompoundBySyllables(kanjiText: string, readingHiragana: string): string[] | null {
  if (!kanjiText || !readingHiragana) return null;
  const kanjiCount = countKanji(kanjiText);
  // Only handle pure multi-kanji compounds (at least 2 kanji, no non-kanji inside)
  if (kanjiCount < 2 || kanjiCount !== kanjiText.length) return null;

  // Explicit dictionary mappings take precedence (supporting NFKC-normalized lookups for Kangxi Radicals)
  const normKey = kanjiText.normalize("NFKC");
  const dictMapping = COMPOUND_KANJI_MAPPINGS[kanjiText] || COMPOUND_KANJI_MAPPINGS[normKey];
  if (dictMapping) {
    return dictMapping.join("") === readingHiragana ? dictMapping : null;
  }

  // Preserve Jukujikun and iteration marks (々) as single compound units
  if (kanjiText.includes("々") || JUKUJIKUN_WORDS.has(kanjiText)) {
    return null;
  }

  // Group reading into syllables by attaching codas (ん, っ, ー) and glides (small kana)
  const syllables: string[] = [];
  const chars = Array.from(katakanaToHiragana(readingHiragana));
  for (const ch of chars) {
    if (/^[んっーぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]/u.test(ch) && syllables.length > 0) {
      syllables[syllables.length - 1] += ch;
    } else {
      syllables.push(ch);
    }
  }

  // Exact 1:1 match between kanji count and syllable chunks
  if (syllables.length === kanjiCount) {
    const allPlausible = syllables.every((syl, idx) => isPlausibleRuby(kanjiText[idx], syl));
    if (allPlausible) {
      return syllables;
    }
  }

  return null;
}

/**
 * Refines assigned ruby for multi-character compound words across consecutive parts.
 */
function refineCompoundKanjiParts(parts: LyricPart[], resultMap: Map<number, RubySegment[]>): void {
  for (let i = 0; i < parts.length; i++) {
    // 1. Explicit COMPOUND_KANJI_MAPPINGS
    for (const [compound, readings] of Object.entries(COMPOUND_KANJI_MAPPINGS)) {
      const compLen = compound.length;
      if (readings.length !== compLen || i + compLen > parts.length) continue;

      let matches = true;
      let combinedRuby = "";
      for (let k = 0; k < compLen; k++) {
        if (parts[i + k].words.normalize("NFKC") !== compound[k].normalize("NFKC")) {
          matches = false;
          break;
        }
        const segs = resultMap.get(i + k);
        const ruby = segs?.map(s => s.ruby ?? "").join("") ?? "";
        combinedRuby += ruby;
      }

      if (matches && combinedRuby === readings.join("")) {
        for (let k = 0; k < compLen; k++) {
          resultMap.set(i + k, [{ text: parts[i + k].words, ruby: readings[k] }]);
        }
      }
    }

    // 2. Dynamic multi-kanji compound splitting by syllable codas across consecutive single-kanji parts
    if (i + 1 < parts.length) {
      const w0 = parts[i].words;
      const w1 = parts[i + 1].words;
      if (w0.length === 1 && w1.length === 1 && containsKanji(w0) && containsKanji(w1)) {
        const compound = w0 + w1;
        const segs0 = resultMap.get(i);
        const segs1 = resultMap.get(i + 1);
        const r0 = segs0?.map(s => s.ruby ?? "").join("") ?? "";
        const r1 = segs1?.map(s => s.ruby ?? "").join("") ?? "";
        const candidateReading = (r0 === r1 ? r0 : (r0 + r1));
        if (candidateReading) {
          const split = splitKanjiCompoundBySyllables(compound, candidateReading);
          if (split && split.length === 2) {
            resultMap.set(i, [{ text: w0, ruby: split[0] }]);
            resultMap.set(i + 1, [{ text: w1, ruby: split[1] }]);
          }
        }
      }
    }
  }
}

/**
 * Checks if a candidate ruby is phonetically plausible for the given text.
 * In Japanese, single Kanji rarely exceed 3-4 mora (e.g. 志 -> こころざし (4)).
 * If a candidate ruby exceeds reasonable mora bounds (e.g. 筈 receiving "やめたはず" (5 mora for 1 kanji)
 * or 将来 receiving "ねえしょうらいしょうらいなに" (13 mora for 2 kanji)), it indicates bleed-over.
 */
export function isPlausibleRuby(text: string, ruby: string): boolean {
  if (!text || !ruby) return false;
  const kanjiCount = countKanji(text);
  if (kanjiCount === 0) return true;

  const rubyKana = katakanaToHiragana(ruby.replace(/[^\p{Script=Hiragana}\p{Script=Katakana}\u30FC]/gu, ""));
  if (rubyKana.length === 0) return false;

  // Japanese Kanji readings never start with ん/っ or small kana (拗音/促音/撥音 cannot start a word)
  if (/^[んっぁぃぅぇぉゃゅょゎ]/u.test(rubyKana)) return false;

  // Minimum mora: each kanji in Japanese has at least 1 mora (e.g. 気->き, 目->め, 手->て)
  if (rubyKana.length < kanjiCount) return false;

  const nonKanjiLen = text.length - kanjiCount;
  const maxMora = (kanjiCount === 1 ? 4 : kanjiCount * 3) + nonKanjiLen * 2;
  return rubyKana.length <= maxMora;
}

/**
 * Normalizes reading for a line while preserving non-Kana delimiters such as spaces
 * and Latin word blocks (e.g. English words) present in the original line.
 */
export function buildLineReading(lineText: string, rawFullReading: string): string {
  if (!rawFullReading) return "";

  // Extract Latin word blocks from lineText (e.g. "Tell me a story", "overdrive", "Ave Mujica")
  const latinSegments: { text: string; start: number; end: number }[] = [];
  const regex = /\b[A-Za-z0-9'’\-]+(?:\s+[A-Za-z0-9'’\-]+)*\b/g;

  let m: RegExpExecArray | null;
  while ((m = regex.exec(lineText)) !== null) {
    if (/[A-Za-z]/.test(m[0])) {
      latinSegments.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
  }

  if (latinSegments.length === 0) {
    return romajiToHiragana(rawFullReading, true);
  }

  const lowerReading = rawFullReading.toLowerCase();
  const foundPositions: { text: string; start: number; end: number }[] = [];
  let searchStart = 0;
  for (const seg of latinSegments) {
    const idx = lowerReading.indexOf(seg.text.toLowerCase(), searchStart);
    if (idx !== -1) {
      foundPositions.push({
        text: rawFullReading.slice(idx, idx + seg.text.length),
        start: idx,
        end: idx + seg.text.length,
      });
      searchStart = idx + seg.text.length;
    }
  }

  if (foundPositions.length === 0) {
    return romajiToHiragana(rawFullReading, true);
  }

  let result = "";
  let cursor = 0;
  for (const pos of foundPositions) {
    if (pos.start > cursor) {
      const romajiPart = rawFullReading.slice(cursor, pos.start);
      if (!result.endsWith(" ") && romajiPart.startsWith(" ")) result += " ";
      result += romajiToHiragana(romajiPart, true);
      if (!result.endsWith(" ") && romajiPart.endsWith(" ")) result += " ";
    }
    if (!result.endsWith(" ") && pos.start > 0 && rawFullReading[pos.start - 1] === " " && result.length > 0) {
      result += " ";
    }
    result += pos.text;
    cursor = pos.end;
  }
  if (cursor < rawFullReading.length) {
    const romajiPart = rawFullReading.slice(cursor);
    if (!result.endsWith(" ") && (romajiPart.startsWith(" ") || result.length > 0)) result += " ";
    result += romajiToHiragana(romajiPart, true);
  }

  return result;
}

/**
 * Attempts to align an array of LyricParts using timed romanization parts or a fallback full-line reading.
 * Implements a 3-tier defense:
 * 1. Global-First Kana Anchor Baseline (策略 1)
 * 2. Monotonic Consumption Cursor across parts (策略 2)
 * 3. Mora Ratio Guard for phonetic plausibility (策略 3)
 *
 * @param parts Original lyric parts for the line
 * @param timedRomanization Optional syllable/word-timed romanization parts
 * @param fullLineRomanization Optional full line romanization string
 * @returns Map of part index to RubySegment[]
 */
export function alignLineParts(
  parts: LyricPart[],
  timedRomanization?: LyricPart[] | null,
  fullLineRomanization?: string | null,
  fullLineText?: string | null
): Map<number, RubySegment[]> {
  const result = new Map<number, RubySegment[]>();
  if (!parts || parts.length === 0) return result;

  // Build full-line reading for Global-First baseline / fallback (策略 1)
  const fullText = fullLineText || parts.map(p => p.words).join("");
  const cleanTimedRom = timedRomanization ? timedRomanization.filter(r => r.words && r.words.trim().length > 0) : [];

  const rawFullReading =
    fullLineRomanization || (cleanTimedRom.length > 0 ? cleanTimedRom.map(r => r.words).join(" ") : null);
  const globalReadingHiragana = rawFullReading ? buildLineReading(fullText, rawFullReading) : null;
  const globalSegments =
    globalReadingHiragana && containsKanji(fullText) ? alignLineByKanaAnchors(fullText, globalReadingHiragana) : null;

  // Helper to extract segments from the global line alignment for a part by character range
  const getGlobalFallbackForPart = (partStartChar: number, partEndChar: number, partWords: string): RubySegment[] => {
    if (!globalSegments || !containsKanji(partWords)) {
      return [{ text: partWords }];
    }

    const matchedSegs: RubySegment[] = [];
    let segStart = 0;

    for (const seg of globalSegments) {
      const segLen = seg.text.length;
      const segEnd = segStart + segLen;

      // Check overlap between [partStartChar, partEndChar] and [segStart, segEnd]
      const overlapStart = Math.max(partStartChar, segStart);
      const overlapEnd = Math.min(partEndChar, segEnd);

      if (overlapStart < overlapEnd) {
        if (overlapStart === segStart && overlapEnd === segEnd) {
          // Exact full segment match
          if (!seg.ruby || isPlausibleRuby(seg.text, seg.ruby)) {
            matchedSegs.push(seg);
          } else {
            matchedSegs.push({ text: seg.text });
          }
        } else {
          // Partial segment slice
          const localStart = overlapStart - segStart;
          const localEnd = overlapEnd - segStart;
          const slicedText = seg.text.slice(localStart, localEnd);

          if (seg.ruby) {
            const splitReadings = splitKanjiCompoundBySyllables(seg.text, seg.ruby);
            if (splitReadings && splitReadings.length === seg.text.length) {
              const slicedRuby = splitReadings.slice(localStart, localEnd).join("");
              if (isPlausibleRuby(slicedText, slicedRuby)) {
                matchedSegs.push({ text: slicedText, ruby: slicedRuby });
              } else {
                matchedSegs.push({ text: slicedText });
              }
            } else if (slicedText === seg.text) {
              if (isPlausibleRuby(slicedText, seg.ruby)) {
                matchedSegs.push({ text: slicedText, ruby: seg.ruby });
              } else {
                matchedSegs.push({ text: slicedText });
              }
            } else {
              const wordSegs = alignWordWithReading(slicedText, seg.ruby);
              const plausible = wordSegs.every(s => !s.ruby || isPlausibleRuby(s.text, s.ruby));
              if (plausible) {
                matchedSegs.push(...wordSegs);
              } else {
                matchedSegs.push({ text: slicedText });
              }
            }
          } else {
            matchedSegs.push({ text: slicedText });
          }
        }
      }

      segStart = segEnd;
    }

    if (matchedSegs.length > 0) {
      // Reconcile punctuation with partWords if they only differ by full/half width punctuation
      const combinedSegText = matchedSegs.map(s => s.text).join("");
      if (combinedSegText !== partWords && normalizePunctuation(combinedSegText) === normalizePunctuation(partWords)) {
        let cursor = 0;
        for (const seg of matchedSegs) {
          const segLen = seg.text.length;
          seg.text = partWords.slice(cursor, cursor + segLen);
          cursor += segLen;
        }
      }
      return matchedSegs;
    }
    return [{ text: partWords }];
  };

  // Case 1: Timed romanization is available -> Monotonic Consumption Cursor (策略 2) + Mora Guard (策略 3)
  if (cleanTimedRom.length > 0) {
    // Automatically compensate for global timing offsets (e.g. iTunes metadata leadingSilence offset)
    let alignedTimedRom = cleanTimedRom;
    if (parts.length > 0 && cleanTimedRom.length > 0) {
      const p0 = parts[0].startTimeMs;
      const r0 = cleanTimedRom[0].startTimeMs;
      const offset = r0 - p0;
      if (Math.abs(offset) > 25 && Math.abs(offset) < 5000) {
        alignedTimedRom = cleanTimedRom.map(r => ({
          ...r,
          startTimeMs: r.startTimeMs - offset,
        }));
      }
    }

    let romCursor = 0;
    let searchIdx = 0;

    parts.forEach((part, partIdx) => {
      let partStartChar = searchIdx;
      let partEndChar = searchIdx + part.words.length;
      if (fullText) {
        let foundIdx = fullText.indexOf(part.words, searchIdx);
        let matchLen = part.words.length;
        if (foundIdx === -1) {
          const normFull = normalizePunctuation(fullText);
          const normPart = normalizePunctuation(part.words);
          const normIdx = normFull.indexOf(normPart, searchIdx);
          if (normIdx !== -1) {
            foundIdx = normIdx;
          }
        }
        if (foundIdx !== -1) {
          partStartChar = foundIdx;
          partEndChar = foundIdx + matchLen;
          searchIdx = partEndChar;
        } else {
          searchIdx += part.words.length;
        }
      }

      const partStart = part.startTimeMs;
      const partDuration = Math.max(part.durationMs, 1);
      const partEnd = partStart + partDuration;

      // Find matching romanization tokens starting from romCursor (策略 2: Monotonic Cursor)
      const matchingRoms: LyricPart[] = [];
      let nextCursor = romCursor;

      for (let rIdx = romCursor; rIdx < alignedTimedRom.length; rIdx++) {
        const r = alignedTimedRom[rIdx];
        const rStart = r.startTimeMs;
        const rDuration = Math.max(r.durationMs, 1);
        const rEnd = rStart + rDuration;

        const overlapStart = Math.max(partStart, rStart);
        const overlapEnd = Math.min(partEnd, rEnd);
        const overlap = overlapEnd - overlapStart;

        const rMid = rStart + rDuration / 2;
        const isMidpointInside = rMid >= partStart && rMid <= partEnd;
        const isSignificantOverlap = overlap >= 20 && (overlap / rDuration >= 0.35 || overlap / partDuration >= 0.35);

        if (isMidpointInside || isSignificantOverlap) {
          matchingRoms.push(r);
          nextCursor = rIdx + 1;
        } else if (matchingRoms.length > 0) {
          if (rStart >= partEnd) {
            break;
          }
        }
      }

      // Non-kanji parts (like kana, particles "nee", "o", "ga") consume their rom token so it's not grabbed by subsequent kanji
      if (matchingRoms.length > 0) {
        romCursor = nextCursor;
      }

      if (!containsKanji(part.words)) {
        result.set(partIdx, [{ text: part.words }]);
        return;
      }

      // If Kanji part: evaluate candidate reading from matchingRoms
      let candidateSegs: RubySegment[] | null = null;
      if (matchingRoms.length > 0) {
        const combinedRomText = matchingRoms.map(r => r.words).join("");
        const segs = alignWordWithReading(part.words, combinedRomText);
        // 策略 3: Mora Ratio Guard
        const isPlausible = segs.every(s => !s.ruby || isPlausibleRuby(s.text, s.ruby));
        if (isPlausible) {
          candidateSegs = segs;
        }
      }

      // If candidate is missing or rejected by Mora Guard, fall back to Global Alignment (策略 1)
      if (!candidateSegs) {
        const globalSegs = getGlobalFallbackForPart(partStartChar, partEndChar, part.words);
        if (globalSegs.some(s => Boolean(s.ruby))) {
          candidateSegs = globalSegs;
        }
      }

      result.set(partIdx, candidateSegs || [{ text: part.words }]);
    });

    refineCompoundKanjiParts(parts, result);
    return result;
  }

  // Case 2: Full-line romanization is available (or derived)
  if (globalSegments) {
    let searchIdx = 0;
    parts.forEach((part, partIdx) => {
      let partStartChar = searchIdx;
      let partEndChar = searchIdx + part.words.length;
      if (fullText) {
        let foundIdx = fullText.indexOf(part.words, searchIdx);
        let matchLen = part.words.length;
        if (foundIdx === -1) {
          const normFull = normalizePunctuation(fullText);
          const normPart = normalizePunctuation(part.words);
          const normIdx = normFull.indexOf(normPart, searchIdx);
          if (normIdx !== -1) {
            foundIdx = normIdx;
          }
        }
        if (foundIdx !== -1) {
          partStartChar = foundIdx;
          partEndChar = foundIdx + matchLen;
          searchIdx = partEndChar;
        } else {
          searchIdx += part.words.length;
        }
      }

      if (!containsKanji(part.words)) {
        result.set(partIdx, [{ text: part.words }]);
        return;
      }

      const segs = getGlobalFallbackForPart(partStartChar, partEndChar, part.words);
      result.set(partIdx, segs);
    });

    refineCompoundKanjiParts(parts, result);
    return result;
  }

  // Case 3: No pronunciation source available -> only show original words
  parts.forEach((part, partIdx) => {
    result.set(partIdx, [{ text: part.words }]);
  });

  return result;
}

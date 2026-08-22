/**
 * Corrects likely speech-recognition mishearings against this app's
 * own navigation vocabulary (page names, actions — "add", "expense",
 * "password", "staff", "partner", etc.) before the transcript is
 * shown or matched — e.g. "expence" said for "expense" gets corrected
 * back before the person ever sees it, rather than the search box
 * showing a garbled word that doesn't look like what they actually
 * said.
 *
 * Same two-pass approach as voiceCarCorrection.ts, since that
 * architecture was already built and tested for exactly this kind of
 * problem — no reason to invent something different here:
 * 1. Edit-distance (Levenshtein) — catches near-miss transcriptions.
 * 2. A simplified phonetic key (consonant skeleton) — catches words
 *    that sound alike but are spelled quite differently.
 */
import { getNavigationVocabulary, Role } from "./navigationRegistry";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** A rough "sounds like" key: first letter + consonant skeleton, collapsing repeats. */
function phoneticKey(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return "";
  const first = w[0];
  const consonants = w.slice(1).replace(/[aeiou]/g, "");
  const collapsed = consonants.replace(/(.)\1+/g, "$1");
  return first + collapsed;
}

/**
 * Corrects one transcribed sentence, word by word, against the
 * navigation vocabulary for the given role. Only replaces a word
 * when there's a genuinely close match (short words need an almost-
 * exact match; longer words allow a bit more distance) — ordinary
 * sentence words like "I", "want", "to" should never get mangled
 * into an unrelated vocabulary word just because they're short.
 */
export function correctNavigationTranscript(transcript: string, role?: Role): string {
  const vocabulary = getNavigationVocabulary(role);
  if (!vocabulary.length) return transcript;

  const words = transcript.split(/\s+/);
  const vocabByPhonetic = new Map<string, string>();
  for (const v of vocabulary) {
    vocabByPhonetic.set(phoneticKey(v), v);
  }
  const vocabLower = new Set(vocabulary.map((v) => v.toLowerCase()));

  const corrected = words.map((word) => {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (clean.length < 4) return word; // too short to safely correct

    const lower = clean.toLowerCase();

    // Already a known word — leave it exactly as-is.
    if (vocabLower.has(lower)) return word;

    // Pass 1: close edit-distance to a known vocabulary word.
    let best: { term: string; dist: number } | null = null;
    for (const v of vocabulary) {
      const dist = levenshtein(lower, v.toLowerCase());
      const maxAllowed = v.length <= 4 ? 1 : v.length <= 7 ? 2 : 3;
      if (dist <= maxAllowed && (!best || dist < best.dist)) {
        best = { term: v, dist };
      }
    }
    if (best) return word.replace(clean, best.term);

    // Pass 2: same phonetic key as a known word.
    const key = phoneticKey(lower);
    const phoneticMatch = vocabByPhonetic.get(key);
    if (phoneticMatch) return word.replace(clean, phoneticMatch);

    return word;
  });

  return corrected.join(" ");
}

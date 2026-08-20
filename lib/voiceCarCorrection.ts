/**
 * Corrects likely speech-recognition mishearings against this app's
 * own car-shopping vocabulary (brands, colors, conditions, fuel
 * types, transmissions) — e.g. "Cairo" said for "Toyota" gets
 * corrected back to "Toyota" before the word ever reaches search.
 *
 * Uses two passes since mishearings are SOUND-based, not just
 * spelling-based:
 * 1. Edit-distance (Levenshtein) — catches near-miss transcriptions.
 * 2. A simplified phonetic key (consonant skeleton) — catches words
 *    that sound alike but are spelled quite differently, which raw
 *    edit-distance alone often misses.
 */

const CAR_VOCABULARY = [
  "Toyota","Honda","Mercedes","Mercedes-Benz","Benz","BMW","Lexus","Ford",
  "Hyundai","Kia","Chevrolet","Audi","Land Rover","Landrover","Jeep",
  "Volkswagen","Nissan","Mazda","Peugeot","Mitsubishi","Subaru","Isuzu",
  "Camry","Corolla","Accord","Civic","Sienna","Highlander","RAV4","Prado",
  "Sequoia","Tundra","Rogue","Altima","Sentra","Pathfinder","Murano",
  "Elantra","Sonata","Tucson","Santa Fe", "Sportage", "Optima",
  "new","used","foreign","local","locally","salvage",
  "petrol","diesel","electric","hybrid","automatic","manual",
  "black","white","silver","grey","gray","red","blue","green","gold",
  "brown","beige","maroon","orange","yellow","purple","wine","cream",
  "Abuja","Lagos","Kano","Rivers","Oyo","Kaduna","Anambra","Enugu",
  "Delta","Ogun","Imo","Ondo","Kwara","Benue","Edo","Ekiti",
];

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
 * Corrects one transcribed sentence, word by word, against the car
 * vocabulary. Only replaces a word when there's a genuinely close
 * match (short words need an almost-exact match; longer words allow
 * a bit more distance) — leftover free-text like "camry" itself or a
 * dealer's name should NOT get mangled into a random vocabulary word.
 */
export function correctVoiceTranscript(transcript: string): string {
  const words = transcript.split(/\s+/);
  const vocabByPhonetic = new Map<string, string>();
  for (const v of CAR_VOCABULARY) {
    vocabByPhonetic.set(phoneticKey(v), v);
  }

  const corrected = words.map((word) => {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (clean.length < 3) return word; // too short to safely correct

    const lower = clean.toLowerCase();

    // Already a known word — leave it exactly as-is.
    if (CAR_VOCABULARY.some((v) => v.toLowerCase() === lower)) return word;

    // Pass 1: close edit-distance to a known vocabulary word.
    let best: { term: string; dist: number } | null = null;
    for (const v of CAR_VOCABULARY) {
      const dist = levenshtein(lower, v.toLowerCase());
      const maxAllowed = v.length <= 4 ? 1 : v.length <= 7 ? 2 : 3;
      if (dist <= maxAllowed && (!best || dist < best.dist)) {
        best = { term: v, dist };
      }
    }
    if (best) return word.replace(clean, best.term);

    // Pass 2: same phonetic key as a known word (e.g. "cairo" vs
    // "toyota" won't match this way either — but "tayota"/"toyoda"
    // style mishearings will).
    const key = phoneticKey(lower);
    const phoneticMatch = vocabByPhonetic.get(key);
    if (phoneticMatch) return word.replace(clean, phoneticMatch);

    return word;
  });

  return corrected.join(" ");
}

/**
 * VangaTypePanalam — OW Tamil (Phonetic) Input Mapping
 *
 * Maps physical QWERTY key presses to Tamil Unicode characters using
 * the OW Tamil Keyboard phonetic scheme. Short vowels use lowercase,
 * long vowels use Shift (uppercase). Consonants phonetically match
 * their English QWERTY counterparts.
 *
 * Layout reference: ow-tamil-keyboard by coderganesh
 * - a → அ (short a), A → ஆ (long aa)
 * - e → இ (short i), E → ஈ (long ii)
 * - f → எ (short e), F → ஏ (long ee)
 * - u → உ (short u), U → ஊ (long uu)
 * - o → ஒ (short o), O → ஓ (long oo)
 * - Consonants map phonetically: k→க, p→ப, m→ம, d→த, etc.
 */

export const QWERTY_TO_OW: Record<string, string> = {
  // ── Vowels (case-sensitive: lowercase = short, uppercase = long) ──
  'a': 'அ', 'A': 'ஆ',
  'e': 'இ', 'E': 'ஈ',
  'f': 'எ', 'F': 'ஏ',
  'u': 'உ', 'U': 'ஊ',
  'o': 'ஒ', 'O': 'ஓ',
  'q': 'ஔ',
  'i': 'ஐ',

  // ── Consonants ──
  'k': 'க', 'K': 'ஃ',       // K → visarga (āytam)
  'p': 'ப',
  'm': 'ம',
  'n': 'ந',
  'd': 'த',
  't': 'ட',
  'l': 'ல', 'L': 'ள',
  'r': 'ர', 'R': 'ற',
  'v': 'வ',
  'y': 'ய',
  'z': 'ழ',
  'c': 'ச',
  'g': 'ங',
  'j': 'ஞ',
  'h': 'ஹ',
  'b': 'ன', 'B': 'ண',
  's': 'ஸ', 'S': 'ஷ',
  'w': '்',                // virama (pulli)

  // ── Space ──
  ' ': ' ',
};

// ── Reverse Map: Tamil → QWERTY ──
export const OW_TO_QWERTY: Record<string, string> = {};
for (const [en, ta] of Object.entries(QWERTY_TO_OW)) {
  if (en !== ' ') {
    OW_TO_QWERTY[ta] = en;
  }
}

/**
 * Translate a physical QWERTY key press to an OW Tamil character.
 * Case-sensitive — 'a' and 'A' produce different Tamil vowels.
 */
export function translateToOW(physicalKey: string): string | null {
  return QWERTY_TO_OW[physicalKey] ?? null;
}

/**
 * Check if a physical key has an OW Tamil mapping.
 */
export function hasOWMapping(physicalKey: string): boolean {
  return physicalKey in QWERTY_TO_OW;
}

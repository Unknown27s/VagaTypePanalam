/**
 * VangaTypePanalam — Tamil99 Input Mapping
 *
 * Maps physical QWERTY key presses to Tamil99 Unicode characters.
 * This allows users to type Tamil without installing an OS-level
 * Tamil99 keyboard driver — the app handles the translation.
 *
 * Layout reference: Tamil99 standard (Government of Tamil Nadu)
 * - Left hand: Vowels (உயிர்)
 * - Right hand: Consonants (மெய்)
 */

// ── QWERTY → Tamil99 Character Map ──
// Physical key (lowercase) → Tamil Unicode character

export const QWERTY_TO_TAMIL99: Record<string, string> = {
  // Home Row (Row 2)
  'a': 'அ',
  's': 'இ',
  'd': 'உ',
  'f': 'எ',
  'g': 'ஒ',
  'h': 'க',
  'j': 'ப',
  'k': 'ம',
  'l': 'த',
  ';': 'ந',
  "'": 'ய',

  // Top Row (Row 1)
  'q': 'ஆ',
  'w': 'ஈ',
  'e': 'ஊ',
  'r': 'ஐ',
  't': 'ஏ',
  'y': 'ள',
  'u': 'ற',
  'i': 'ன',
  'o': 'ட',
  'p': 'ண',
  '[': 'ச',

  // Bottom Row (Row 3)
  'z': 'ஔ',
  'x': 'ஃ',
  'c': 'ழ',
  'v': 'வ',
  'b': 'ங',
  'n': 'ல',
  'm': 'ர',
  '/': 'ஞ',

  // Backtick
  '`': 'ஓ',

  // Space stays as space
  ' ': ' ',
};

// ── Reverse Map: Tamil → QWERTY ──
// Used by the virtual keyboard to show which physical key to press

export const TAMIL99_TO_QWERTY: Record<string, string> = {};
for (const [en, ta] of Object.entries(QWERTY_TO_TAMIL99)) {
  if (en !== ' ') {
    TAMIL99_TO_QWERTY[ta] = en;
  }
}

/**
 * Translate a physical QWERTY key press to a Tamil99 character.
 * Returns the Tamil character, or null if the key has no Tamil mapping.
 */
export function translateToTamil(physicalKey: string): string | null {
  return QWERTY_TO_TAMIL99[physicalKey.toLowerCase()] ?? null;
}

/**
 * Check if a physical key has a Tamil99 mapping.
 */
export function hasTamilMapping(physicalKey: string): boolean {
  return physicalKey.toLowerCase() in QWERTY_TO_TAMIL99;
}

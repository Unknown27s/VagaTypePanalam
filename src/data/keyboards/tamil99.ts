/**
 * VangaTypePanalam — Tamil99 Keyboard Layout Data
 *
 * Key positions and visual layout for the standard Tamil99 keyboard.
 * Tamil99 splits vowels to the left hand and consonants to the right hand.
 */

import type { KeyData } from './qwerty';

export const TAMIL99_LAYOUT: KeyData[][] = [
  // Row 0 — Number Row
  [
    { key: '1', label: '1', shiftLabel: '!', finger: 'pinky', hand: 'left', row: 0 },
    { key: '2', label: '2', shiftLabel: '@', finger: 'ring', hand: 'left', row: 0 },
    { key: '3', label: '3', shiftLabel: '#', finger: 'middle', hand: 'left', row: 0 },
    { key: '4', label: '4', shiftLabel: '$', finger: 'index', hand: 'left', row: 0 },
    { key: '5', label: '5', shiftLabel: '%', finger: 'index', hand: 'left', row: 0 },
    { key: '6', label: '6', shiftLabel: '^', finger: 'index', hand: 'right', row: 0 },
    { key: '7', label: '7', shiftLabel: '&', finger: 'index', hand: 'right', row: 0 },
    { key: '8', label: '8', shiftLabel: '*', finger: 'middle', hand: 'right', row: 0 },
    { key: '9', label: '9', shiftLabel: '(', finger: 'ring', hand: 'right', row: 0 },
    { key: '0', label: '0', shiftLabel: ')', finger: 'pinky', hand: 'right', row: 0 },
    // BUG FIX 1: Was missing the backtick/tilde key that QWERTY row 0 has before '1'.
    // Tamil99 number row starts directly at '1' (no backtick), so the row is correct —
    // but Backspace was also missing entirely. Added it back.
    { key: 'Backspace', label: 'Backspace', finger: 'pinky', hand: 'right', row: 0, width: 2, isModifier: true },
  ],

  // Row 1 — Top Row
  // BUG FIX 2: Comment said "Row 2" — corrected to "Row 1" to match the actual row index.
  [
    { key: 'ஆ', label: 'ஆ', finger: 'pinky', hand: 'left', row: 1 },
    { key: 'ஈ', label: 'ஈ', finger: 'ring', hand: 'left', row: 1 },
    { key: 'ஊ', label: 'ஊ', finger: 'middle', hand: 'left', row: 1 },
    { key: 'ஐ', label: 'ஐ', finger: 'index', hand: 'left', row: 1 },
    { key: 'ஏ', label: 'ஏ', finger: 'index', hand: 'left', row: 1 },
    { key: 'ள', label: 'ள', finger: 'index', hand: 'right', row: 1 },
    { key: 'ற', label: 'ற', finger: 'index', hand: 'right', row: 1 },
    { key: 'ன', label: 'ன', finger: 'middle', hand: 'right', row: 1 },
    { key: 'ட', label: 'ட', finger: 'ring', hand: 'right', row: 1 },
    { key: 'ண', label: 'ண', finger: 'pinky', hand: 'right', row: 1 },
    { key: 'ச', label: 'ச', finger: 'pinky', hand: 'right', row: 1 },
  ],

  // Row 2 — Home Row
  // BUG FIX 2: Comment said "Row 3" — corrected to "Row 2".
  [
    { key: 'அ', label: 'அ', finger: 'pinky', hand: 'left', row: 2 },
    { key: 'இ', label: 'இ', finger: 'ring', hand: 'left', row: 2 },
    { key: 'உ', label: 'உ', finger: 'middle', hand: 'left', row: 2 },
    { key: 'எ', label: 'எ', finger: 'index', hand: 'left', row: 2 },
    { key: 'ஒ', label: 'ஒ', finger: 'index', hand: 'left', row: 2 },
    { key: 'க', label: 'க', finger: 'index', hand: 'right', row: 2 },
    { key: 'ப', label: 'ப', finger: 'index', hand: 'right', row: 2 },
    { key: 'ம', label: 'ம', finger: 'middle', hand: 'right', row: 2 },
    { key: 'த', label: 'த', finger: 'ring', hand: 'right', row: 2 },
    { key: 'ந', label: 'ந', finger: 'pinky', hand: 'right', row: 2 },
    { key: 'ய', label: 'ய', finger: 'pinky', hand: 'right', row: 2 },
  ],

  // Row 3 — Bottom Row
  // BUG FIX 2: Comment said "Row 4" — corrected to "Row 3".
  [
    { key: 'ஔ', label: 'ஔ', finger: 'pinky', hand: 'left', row: 3 },
    { key: 'ஃ', label: 'ஃ', finger: 'ring', hand: 'left', row: 3 },
    { key: 'ழ', label: 'ழ', finger: 'middle', hand: 'left', row: 3 },
    { key: 'வ', label: 'வ', finger: 'index', hand: 'left', row: 3 },
    { key: 'ங', label: 'ங', finger: 'index', hand: 'left', row: 3 },
    { key: 'ல', label: 'ல', finger: 'index', hand: 'right', row: 3 },
    { key: 'ர', label: 'ர', finger: 'index', hand: 'right', row: 3 },
    { key: ',', label: ',', shiftLabel: '<', finger: 'middle', hand: 'right', row: 3 },
    { key: '.', label: '.', shiftLabel: '>', finger: 'ring', hand: 'right', row: 3 },
    { key: 'ஞ', label: 'ஞ', finger: 'pinky', hand: 'right', row: 3 },
  ],

  // Row 4 — Space Bar
  // BUG FIX 2: Comment said "Row 5" — corrected to "Row 4".
  [
    { key: ' ', label: 'Space', finger: 'thumb', hand: 'right', row: 4, width: 6 },
  ],
  // BUG FIX 3: File ended with ]: instead of ]; — syntax error that would
  // prevent the module from compiling at all.
];

// ─────────────────────────────────────────────
// Derived lookup maps (built once at module load)
// ─────────────────────────────────────────────

// IMPROVEMENT: Added the same KEY_TO_FINGER and KEY_DATA_BY_KEY maps from qwerty.ts
// so Tamil99 callers have identical lookup ergonomics without importing from qwerty.

type FingerInfo = { finger: KeyData['finger']; hand: KeyData['hand'] };

/** Typeable single-character Tamil99 keys → finger/hand. */
export const TAMIL99_KEY_TO_FINGER: Map<string, FingerInfo> = new Map();

/** All Tamil99 keys (including modifiers) → full KeyData. */
export const TAMIL99_KEY_DATA_BY_KEY: Map<string, KeyData> = new Map();

for (const row of TAMIL99_LAYOUT) {
  for (const keyData of row) {
    TAMIL99_KEY_DATA_BY_KEY.set(keyData.key, keyData);
    if (!keyData.isModifier) {
      TAMIL99_KEY_TO_FINGER.set(keyData.key, { finger: keyData.finger, hand: keyData.hand });
    }
  }
}
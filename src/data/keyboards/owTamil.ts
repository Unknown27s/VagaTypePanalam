/**
 * VangaTypePanalam — OW Tamil (Phonetic) Keyboard Layout Data
 *
 * Visual layout for the OW Tamil phonetic keyboard.
 * Tamil characters are mapped to QWERTY keys by phonetic similarity:
 * - Vowels: lowercase → short (a→அ), uppercase → long (A→ஆ)
 * - Consonants: k→க, p→ப, m→ம, d→த, etc.
 *
 * Layout reference: ow-tamil-keyboard by coderganesh
 */

import type { KeyData } from './qwerty';

/**
 * Maps each OW Tamil key (the Tamil character) to its corresponding
 * physical QWERTY key name. Used for pressed-key matching.
 */
export const OW_TAMIL_TO_PHYSICAL: Record<string, string> = {
  'அ': 'a', 'ஆ': 'A',
  'இ': 'e', 'ஈ': 'E',
  'எ': 'f', 'ஏ': 'F',
  'உ': 'u', 'ஊ': 'U',
  'ஒ': 'o', 'ஓ': 'O',
  'ஔ': 'q',
  'ஐ': 'i',
  'க': 'k', 'ஃ': 'K',
  'ப': 'p',
  'ம': 'm',
  'ந': 'n',
  'த': 'd',
  'ட': 't',
  'ல': 'l', 'ள': 'L',
  'ர': 'r', 'ற': 'R',
  'வ': 'v',
  'ய': 'y',
  'ழ': 'z',
  'ச': 'c',
  'ங': 'g',
  'ஞ': 'j',
  'ஹ': 'h',
  'ன': 'b', 'ண': 'B',
  'ஸ': 's', 'ஷ': 'S',
  '்': 'w',
};

export const OW_TAMIL_LAYOUT: KeyData[][] = [
  // Row 0 — Number Row (standard QWERTY, unchanged)
  [
    { key: '`', label: '`', shiftLabel: '~', finger: 'pinky', hand: 'left', row: 0 },
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
    { key: '-', label: '-', shiftLabel: '_', finger: 'pinky', hand: 'right', row: 0 },
    { key: '=', label: '=', shiftLabel: '+', finger: 'pinky', hand: 'right', row: 0 },
    { key: 'Backspace', label: 'Backspace', finger: 'pinky', hand: 'right', row: 0, width: 2, isModifier: true },
  ],

  // Row 1 — Top Row (Q-P with OW Tamil labels)
  [
    { key: 'Tab', label: 'Tab', finger: 'pinky', hand: 'left', row: 1, width: 1.5, isModifier: true },
    { key: 'ஔ', label: 'ஔ', finger: 'pinky', hand: 'left', row: 1 },
    { key: '்', label: '்', finger: 'ring', hand: 'left', row: 1 },
    { key: 'இ', label: 'இ', shiftLabel: 'ஈ', finger: 'middle', hand: 'left', row: 1 },
    { key: 'ர', label: 'ர', shiftLabel: 'ற', finger: 'index', hand: 'left', row: 1 },
    { key: 'ட', label: 'ட', finger: 'index', hand: 'left', row: 1 },
    { key: 'ய', label: 'ய', finger: 'index', hand: 'right', row: 1 },
    { key: 'உ', label: 'உ', shiftLabel: 'ஊ', finger: 'index', hand: 'right', row: 1 },
    { key: 'ஐ', label: 'ஐ', finger: 'middle', hand: 'right', row: 1 },
    { key: 'ஒ', label: 'ஒ', shiftLabel: 'ஓ', finger: 'ring', hand: 'right', row: 1 },
    { key: 'ப', label: 'ப', finger: 'pinky', hand: 'right', row: 1 },
    { key: '[', label: '[', shiftLabel: '{', finger: 'pinky', hand: 'right', row: 1 },
    { key: ']', label: ']', shiftLabel: '}', finger: 'pinky', hand: 'right', row: 1 },
    { key: '\\', label: '\\', shiftLabel: '|', finger: 'pinky', hand: 'right', row: 1 },
  ],

  // Row 2 — Home Row (A-; with OW Tamil labels)
  [
    { key: 'CapsLock', label: 'Caps Lock', finger: 'pinky', hand: 'left', row: 2, width: 1.75, isModifier: true },
    { key: 'அ', label: 'அ', shiftLabel: 'ஆ', finger: 'pinky', hand: 'left', row: 2 },
    { key: 'ஸ', label: 'ஸ', shiftLabel: 'ஷ', finger: 'ring', hand: 'left', row: 2 },
    { key: 'த', label: 'த', finger: 'middle', hand: 'left', row: 2 },
    { key: 'எ', label: 'எ', shiftLabel: 'ஏ', finger: 'index', hand: 'left', row: 2 },
    { key: 'ங', label: 'ங', finger: 'index', hand: 'left', row: 2 },
    { key: 'ஹ', label: 'ஹ', finger: 'index', hand: 'right', row: 2 },
    { key: 'ஞ', label: 'ஞ', finger: 'index', hand: 'right', row: 2 },
    { key: 'க', label: 'க', shiftLabel: 'ஃ', finger: 'middle', hand: 'right', row: 2 },
    { key: 'ல', label: 'ல', shiftLabel: 'ள', finger: 'ring', hand: 'right', row: 2 },
    { key: ';', label: ';', shiftLabel: ':', finger: 'pinky', hand: 'right', row: 2 },
    { key: "'", label: "'", shiftLabel: '"', finger: 'pinky', hand: 'right', row: 2 },
    { key: 'Enter', label: 'Enter', finger: 'pinky', hand: 'right', row: 2, width: 2.25, isModifier: true },
  ],

  // Row 3 — Bottom Row (Z-/ with OW Tamil labels)
  [
    { key: 'ShiftLeft', label: 'Shift', finger: 'pinky', hand: 'left', row: 3, width: 2.25, isModifier: true },
    { key: 'ழ', label: 'ழ', finger: 'pinky', hand: 'left', row: 3 },
    { key: 'x', label: 'x', finger: 'ring', hand: 'left', row: 3 },
    { key: 'ச', label: 'ச', finger: 'middle', hand: 'left', row: 3 },
    { key: 'வ', label: 'வ', finger: 'index', hand: 'left', row: 3 },
    { key: 'ன', label: 'ன', shiftLabel: 'ண', finger: 'index', hand: 'left', row: 3 },
    { key: 'ந', label: 'ந', finger: 'index', hand: 'right', row: 3 },
    { key: 'ம', label: 'ம', finger: 'index', hand: 'right', row: 3 },
    { key: ',', label: ',', shiftLabel: '<', finger: 'middle', hand: 'right', row: 3 },
    { key: '.', label: '.', shiftLabel: '>', finger: 'ring', hand: 'right', row: 3 },
    { key: '/', label: '/', shiftLabel: '?', finger: 'pinky', hand: 'right', row: 3 },
    { key: 'ShiftRight', label: 'Shift', finger: 'pinky', hand: 'right', row: 3, width: 2.75, isModifier: true },
  ],

  // Row 4 — Space Bar
  [
    { key: 'CtrlLeft', label: 'Ctrl', finger: 'pinky', hand: 'left', row: 4, width: 1.5, isModifier: true },
    { key: 'AltLeft', label: 'Alt', finger: 'pinky', hand: 'left', row: 4, width: 1.25, isModifier: true },
    { key: ' ', label: 'Space', finger: 'thumb', hand: 'right', row: 4, width: 6.25 },
    { key: 'AltRight', label: 'Alt', finger: 'pinky', hand: 'right', row: 4, width: 1.25, isModifier: true },
    { key: 'CtrlRight', label: 'Ctrl', finger: 'pinky', hand: 'right', row: 4, width: 1.5, isModifier: true },
  ],
];

// ── Derived lookup maps ──

type FingerInfo = { finger: KeyData['finger']; hand: KeyData['hand'] };

/** Typeable single-character OW Tamil keys → finger/hand. */
export const OW_KEY_TO_FINGER: Map<string, FingerInfo> = new Map();

/** All OW Tamil keys (including modifiers) → full KeyData. */
export const OW_KEY_DATA_BY_KEY: Map<string, KeyData> = new Map();

/**
 * Maps shift-variant Tamil characters to their base key character.
 * e.g. 'ஆ'→'அ', 'ஈ'→'இ', 'ஏ'→'எ', 'ள'→'ல', etc.
 * Used in VirtualKeyboard to normalize pressed/expected/flash keys
 * so both short and long vowels match the same base key.
 */
export const OW_SHIFT_VARIANT_TO_BASE: Record<string, string> = {};

for (const row of OW_TAMIL_LAYOUT) {
  for (const keyData of row) {
    OW_KEY_DATA_BY_KEY.set(keyData.key, keyData);
    if (!keyData.isModifier && keyData.key.length === 1) {
      OW_KEY_TO_FINGER.set(keyData.key, { finger: keyData.finger, hand: keyData.hand });
    }
    // Build shift-variant map: if a key has a shiftLabel, the shiftLabel
    // character is a variant of this key's base character
    if (keyData.shiftLabel && keyData.shiftLabel.length === 1 && keyData.key.length === 1) {
      OW_SHIFT_VARIANT_TO_BASE[keyData.shiftLabel] = keyData.key;
    }
  }
}

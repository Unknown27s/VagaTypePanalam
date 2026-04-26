/**
 * VangaTypePanalam — QWERTY Keyboard Layout Data
 *
 * Full US QWERTY keyboard including number row, modifiers,
 * and a per-key finger assignment matching Keybr's color scheme.
 */

export interface KeyData {
  key: string;           // The character this produces (lowercase)
  label: string;         // Main label shown on the key
  shiftLabel?: string;   // Shift label (top-left on key)
  finger: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  hand: 'left' | 'right';
  row: number;
  width?: number;        // Width multiplier (1 = standard key)
  isModifier?: boolean;  // true for non-typeable keys (Tab, Shift, etc.)
}

export const QWERTY_LAYOUT: KeyData[][] = [
  // ── Row 0: Number Row ──
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

  // ── Row 1: Top Row ──
  [
    { key: 'Tab', label: 'Tab', finger: 'pinky', hand: 'left', row: 1, width: 1.5, isModifier: true },
    { key: 'q', label: 'Q', finger: 'pinky', hand: 'left', row: 1 },
    { key: 'w', label: 'W', finger: 'ring', hand: 'left', row: 1 },
    { key: 'e', label: 'E', finger: 'middle', hand: 'left', row: 1 },
    { key: 'r', label: 'R', finger: 'index', hand: 'left', row: 1 },
    { key: 't', label: 'T', finger: 'index', hand: 'left', row: 1 },
    { key: 'y', label: 'Y', finger: 'index', hand: 'right', row: 1 },
    { key: 'u', label: 'U', finger: 'index', hand: 'right', row: 1 },
    { key: 'i', label: 'I', finger: 'middle', hand: 'right', row: 1 },
    { key: 'o', label: 'O', finger: 'ring', hand: 'right', row: 1 },
    { key: 'p', label: 'P', finger: 'pinky', hand: 'right', row: 1 },
    { key: '[', label: '[', shiftLabel: '{', finger: 'pinky', hand: 'right', row: 1 },
    { key: ']', label: ']', shiftLabel: '}', finger: 'pinky', hand: 'right', row: 1 },
    { key: '\\', label: '\\', shiftLabel: '|', finger: 'pinky', hand: 'right', row: 1 },
  ],

  // ── Row 2: Home Row ──
  [
    { key: 'CapsLock', label: 'Caps Lock', finger: 'pinky', hand: 'left', row: 2, width: 1.75, isModifier: true },
    { key: 'a', label: 'A', finger: 'pinky', hand: 'left', row: 2 },
    { key: 's', label: 'S', finger: 'ring', hand: 'left', row: 2 },
    { key: 'd', label: 'D', finger: 'middle', hand: 'left', row: 2 },
    { key: 'f', label: 'F', finger: 'index', hand: 'left', row: 2 },
    { key: 'g', label: 'G', finger: 'index', hand: 'left', row: 2 },
    { key: 'h', label: 'H', finger: 'index', hand: 'right', row: 2 },
    { key: 'j', label: 'J', finger: 'index', hand: 'right', row: 2 },
    { key: 'k', label: 'K', finger: 'middle', hand: 'right', row: 2 },
    { key: 'l', label: 'L', finger: 'ring', hand: 'right', row: 2 },
    { key: ';', label: ';', shiftLabel: ':', finger: 'pinky', hand: 'right', row: 2 },
    { key: "'", label: "'", shiftLabel: '"', finger: 'pinky', hand: 'right', row: 2 },
    { key: 'Enter', label: 'Enter', finger: 'pinky', hand: 'right', row: 2, width: 2.25, isModifier: true },
  ],

  // ── Row 3: Bottom Row ──
  [
    { key: 'ShiftLeft', label: 'Shift', finger: 'pinky', hand: 'left', row: 3, width: 2.25, isModifier: true },
    { key: 'z', label: 'Z', finger: 'pinky', hand: 'left', row: 3 },
    { key: 'x', label: 'X', finger: 'ring', hand: 'left', row: 3 },
    { key: 'c', label: 'C', finger: 'middle', hand: 'left', row: 3 },
    { key: 'v', label: 'V', finger: 'index', hand: 'left', row: 3 },
    { key: 'b', label: 'B', finger: 'index', hand: 'left', row: 3 },
    { key: 'n', label: 'N', finger: 'index', hand: 'right', row: 3 },
    { key: 'm', label: 'M', finger: 'index', hand: 'right', row: 3 },
    { key: ',', label: ',', shiftLabel: '<', finger: 'middle', hand: 'right', row: 3 },
    { key: '.', label: '.', shiftLabel: '>', finger: 'ring', hand: 'right', row: 3 },
    { key: '/', label: '/', shiftLabel: '?', finger: 'pinky', hand: 'right', row: 3 },
    { key: 'ShiftRight', label: 'Shift', finger: 'pinky', hand: 'right', row: 3, width: 2.75, isModifier: true },
  ],

  // ── Row 4: Bottom Modifier Row ──
  [
    { key: 'CtrlLeft', label: 'Ctrl', finger: 'pinky', hand: 'left', row: 4, width: 1.5, isModifier: true },
    { key: 'AltLeft', label: 'Alt', finger: 'pinky', hand: 'left', row: 4, width: 1.25, isModifier: true },
    { key: ' ', label: '', finger: 'thumb', hand: 'right', row: 4, width: 6.25 },
    { key: 'AltRight', label: 'Alt', finger: 'pinky', hand: 'right', row: 4, width: 1.25, isModifier: true },
    { key: 'CtrlRight', label: 'Ctrl', finger: 'pinky', hand: 'right', row: 4, width: 1.5, isModifier: true },
  ],
];

// ─────────────────────────────────────────────
// Derived lookup maps (built once at module load)
// ─────────────────────────────────────────────

// FIX 1: Split into two maps — one for typeable chars, one for modifier keys.
// Previously KEY_TO_FINGER only covered typeable keys with no way to look up
// modifier finger assignments (used by the keyboard highlight logic).
// Callers that just need typeable keys use KEY_TO_FINGER as before;
// callers that need modifier info (e.g. highlight Shift on press) use KEY_DATA_BY_KEY.

type FingerInfo = { finger: KeyData['finger']; hand: KeyData['hand'] };

/**
 * Typeable single-character keys → finger/hand.
 * Identical contract to the original export — existing callers unchanged.
 */
export const KEY_TO_FINGER: Map<string, FingerInfo> = new Map();

/**
 * FIX 1: All keys (including modifiers) → full KeyData.
 * Useful for keyboard highlight components that need to light up Shift, Enter, etc.
 */
export const KEY_DATA_BY_KEY: Map<string, KeyData> = new Map();

for (const row of QWERTY_LAYOUT) {
  for (const keyData of row) {
    // FIX 2: Populate both maps in a single loop pass instead of two separate loops
    KEY_DATA_BY_KEY.set(keyData.key, keyData);
    if (!keyData.isModifier && keyData.key.length === 1) {
      KEY_TO_FINGER.set(keyData.key, { finger: keyData.finger, hand: keyData.hand });
    }
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// FIX 3: Precompute the color map instead of running a switch on every render call.
// getFingerColor is called once per key per render; with 50+ keys this adds up.
const FINGER_COLOR_MAP: Record<KeyData['finger'], string> = {
  index: 'var(--key-finger-index)',
  middle: 'var(--key-finger-middle)',
  ring: 'var(--key-finger-ring)',
  pinky: 'var(--key-finger-pinky)',
  thumb: 'var(--key-finger-thumb)',
};

/**
 * Get the finger color CSS variable for a key.
 */
export function getFingerColor(finger: KeyData['finger']): string {
  // FIX 3: O(1) map lookup instead of a switch — also removes the unreachable default branch
  return FINGER_COLOR_MAP[finger] ?? 'var(--key-text)';
}
/**
 * VaagaTypePanalam — Tamil99 Keyboard Layout Data
 *
 * Key positions and visual layout for the standard Tamil99 keyboard.
 * Tamil99 splits vowels to the left hand and consonants to the right hand.
 */

import type { KeyData } from './qwerty';

export const TAMIL99_LAYOUT: KeyData[][] = [
  // Row 1 — Number Row (contains some vowel signs/aytham in shifted state, but base is numbers)
  // For simplicity MVP we will stick to main 3 rows
  
  // Row 2 — Top row
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
  // Row 3 — Home row
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
  // Row 4 — Bottom row
  [
    { key: 'ஔ', label: 'ஔ', finger: 'pinky', hand: 'left', row: 3 },
    { key: 'ஃ', label: 'ஃ', finger: 'ring', hand: 'left', row: 3 },
    { key: 'ழ', label: 'ழ', finger: 'middle', hand: 'left', row: 3 },
    { key: 'வ', label: 'வ', finger: 'index', hand: 'left', row: 3 },
    { key: 'ங', label: 'ங', finger: 'index', hand: 'left', row: 3 },
    { key: 'ல', label: 'ல', finger: 'index', hand: 'right', row: 3 },
    { key: 'ர', label: 'ர', finger: 'index', hand: 'right', row: 3 },
    { key: ',', label: ',', finger: 'middle', hand: 'right', row: 3 },
    { key: '.', label: '.', finger: 'ring', hand: 'right', row: 3 },
    { key: 'ஞ', label: 'ஞ', finger: 'pinky', hand: 'right', row: 3 },
  ],
  // Row 5 — Space bar
  [
    { key: ' ', label: 'Space', finger: 'thumb', hand: 'right', row: 4, width: 6 },
  ],
];

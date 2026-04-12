/**
 * VaagaTypePanalam — Tamil Lesson Definitions
 *
 * Progressive lessons for Tamil typing using the Tamil99 Layout.
 */

import type { LessonDefinition } from './english';

export const TAMIL_LESSONS: LessonDefinition[] = [
  {
    id: 'tamil-lesson-1',
    level: 1,
    title: 'Basic Vowels & Consonants',
    description: 'Let us start with the home row keys. Left hand vowels: "q" for அ, "w" for இ. Right hand consonants: "h" for க, "[" for ப.',
    keys: ['அ', 'இ', 'க', 'ப'],
    targetWpm: 8,
    targetAccuracy: 0.85,
  },
  {
    id: 'tamil-lesson-2',
    level: 2,
    title: 'Home Row Extended',
    description: 'Add keys from the middle row: "e" for உ, "r" for எ on left. "j" for ம, "k" for த on right.',
    keys: ['அ', 'இ', 'உ', 'எ', 'க', 'ப', 'ம', 'த'],
    targetWpm: 10,
    targetAccuracy: 0.85,
  },
  {
    id: 'tamil-lesson-3',
    level: 3,
    title: 'Full Home Row',
    description: 'Practice the complete Tamil99 home row. Add "t" for ஒ, "l" for ந, and ";" for ய.',
    keys: ['அ', 'இ', 'உ', 'எ', 'ஒ', 'க', 'ப', 'ம', 'த', 'ந', 'ய'],
    targetWpm: 12,
    targetAccuracy: 0.85,
  },
  {
    id: 'tamil-lesson-4',
    level: 4,
    title: 'Top Row: Long Vowels',
    description: 'Learn the long vowels on the top row left: "a" for ஆ, "s" for ஈ, "d" for ஊ.',
    keys: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ'],
    targetWpm: 10,
    targetAccuracy: 0.85,
  },
  {
    id: 'tamil-lesson-5',
    level: 5,
    title: 'Top Row: Consonants',
    description: 'Learn the top row consonants: "u" for ள, "i" for ற, "o" for ன, "p" for ட.',
    keys: ['ள', 'ற', 'ன', 'ட', 'க', 'ப', 'ம', 'த'],
    targetWpm: 12,
    targetAccuracy: 0.85,
  },
  {
    id: 'tamil-lesson-6',
    level: 6,
    title: 'Bottom Row',
    description: 'Learn the bottom row letters: "c" for ழ, "v" for வ, "n" for ல, "m" for ர.',
    keys: ['ழ', 'வ', 'ல', 'ர', 'அ', 'இ', 'க', 'ப'],
    targetWpm: 12,
    targetAccuracy: 0.85,
  },
  {
    id: 'tamil-lesson-7',
    level: 7,
    title: 'All Letters',
    description: 'Practice combining all letters from all rows.',
    keys: [
      'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஔ',
      'க', 'ச', 'ட', 'த', 'ப', 'ற', 'ன', 'ம', 'ங', 'ஞ', 'ண', 'ந', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள'
    ],
    targetWpm: 15,
    targetAccuracy: 0.88,
  },
  {
    id: 'tamil-lesson-8',
    level: 8,
    title: 'Common Words',
    description: 'Type common Tamil words.',
    keys: [
      'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஔ',
      'க', 'ச', 'ட', 'த', 'ப', 'ற', 'ன', 'ம', 'ங', 'ஞ', 'ண', 'ந', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள'
    ],
    targetWpm: 20,
    targetAccuracy: 0.90,
  },
  {
    id: 'tamil-lesson-9',
    level: 9,
    title: 'Speed Challenge: 25 WPM',
    description: 'Try to type 25 words per minute in Tamil.',
    keys: [
      'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஔ',
      'க', 'ச', 'ட', 'த', 'ப', 'ற', 'ன', 'ம', 'ங', 'ஞ', 'ண', 'ந', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள'
    ],
    targetWpm: 25,
    targetAccuracy: 0.92,
  },
  {
    id: 'tamil-lesson-10',
    level: 10,
    title: 'Tamil Master',
    description: 'You are a Tamil typing master!',
    keys: [
      'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஔ',
      'க', 'ச', 'ட', 'த', 'ப', 'ற', 'ன', 'ம', 'ங', 'ஞ', 'ண', 'ந', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள'
    ],
    targetWpm: 35,
    targetAccuracy: 0.95,
  },
];

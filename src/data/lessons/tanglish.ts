/**
 * VangaTypePanalam — Tanglish Lesson Definitions
 *
 * Progressive lessons for typing Tanglish (Tamil in English script).
 */

import type { LessonDefinition } from './english';

export const TANGLISH_LESSONS: LessonDefinition[] = [
  {
    id: 'tanglish-lesson-1',
    level: 1,
    title: 'Basic Words: A & N',
    description: 'Start with simple vowels and consonants used frequently in Tanglish.',
    keys: ['a', 'n', 'm'],
    targetWpm: 12,
    targetAccuracy: 0.85,
  },
  {
    id: 'tanglish-lesson-2',
    level: 2,
    title: 'Adding Vowels: E & I',
    description: 'Add E and I to form words like "alai", "ennai".',
    keys: ['a', 'n', 'm', 'e', 'i'],
    targetWpm: 14,
    targetAccuracy: 0.85,
  },
  {
    id: 'tanglish-lesson-3',
    level: 3,
    title: 'Consonants: K & L',
    description: 'Learn K and L for words like "kal", "malai".',
    keys: ['a', 'n', 'm', 'e', 'i', 'k', 'l'],
    targetWpm: 15,
    targetAccuracy: 0.85,
  },
  {
    id: 'tanglish-lesson-4',
    level: 4,
    title: 'Consonants: R & T',
    description: 'Learn R and T for words like "maram", "thambi".',
    keys: ['a', 'n', 'm', 'e', 'i', 'k', 'l', 'r', 't'],
    targetWpm: 18,
    targetAccuracy: 0.85,
  },
  {
    id: 'tanglish-lesson-5',
    level: 5,
    title: 'Vowels: O & U',
    description: 'Complete the main vowels with O and U.',
    keys: ['a', 'e', 'i', 'o', 'u', 'm', 'n', 'k', 'l', 'r', 't'],
    targetWpm: 20,
    targetAccuracy: 0.88,
  },
  {
    id: 'tanglish-lesson-6',
    level: 6,
    title: 'Labials & Fricatives: P, V, S',
    description: 'Add P, V, and S for words like "paal", "vanakkam".',
    keys: ['a', 'e', 'i', 'o', 'u', 'm', 'n', 'k', 'l', 'r', 't', 'p', 'v', 's'],
    targetWpm: 22,
    targetAccuracy: 0.88,
  },
  {
    id: 'tanglish-lesson-7',
    level: 7,
    title: 'Common Tanglish Words',
    description: 'Practice the most common Tanglish words.',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'y'],
    targetWpm: 25,
    targetAccuracy: 0.90,
  },
  {
    id: 'tanglish-lesson-8',
    level: 8,
    title: 'Speed Challenge: 30 WPM',
    description: 'Push your Tanglish typing speed to 30 words per minute.',
    keys: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    targetWpm: 30,
    targetAccuracy: 0.92,
  },
  {
    id: 'tanglish-lesson-9',
    level: 9,
    title: 'Speed Challenge: 40 WPM',
    description: 'You are getting fast! Aim for 40 WPM.',
    keys: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    targetWpm: 40,
    targetAccuracy: 0.92,
  },
  {
    id: 'tanglish-lesson-10',
    level: 10,
    title: 'Tanglish Master',
    description: 'Type fast and accurately like a native.',
    keys: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    targetWpm: 50,
    targetAccuracy: 0.95,
  },
];

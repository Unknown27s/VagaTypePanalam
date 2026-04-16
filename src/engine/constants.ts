/**
 * VaagaTypePanalam — Typing Engine Constants
 *
 * Tuning parameters for the adaptive typing algorithm.
 */

// ── Circular Buffer Sizes ──
export const RECENT_CORRECT_BUFFER_SIZE = 50;
export const RECENT_LATENCY_BUFFER_SIZE = 20;

// ── Confidence Scoring ──
export const ACCURACY_WEIGHT = 0.6;
export const SPEED_WEIGHT = 0.4;
export const SPEED_BEST_MS = 200; // 1.0 speed score at this latency
export const SPEED_WORST_MS = 1500; // 0.0 speed score at this latency
export const WEAK_KEY_THRESHOLD = 0.6; // confidence below this = weak

// ── Text Generation ──
export const DEFAULT_TEXT_LENGTH = 100; // characters
export const PRACTICE_SEGMENT_LENGTH = 90; // chars per endless practice chunk
export const MAX_TEXT_BUFFER = 500; // sliding window — trim when buffer exceeds this
export const WEAK_KEY_WEIGHT = 3; // Weak keys get 3x selection chance
export const UNPRACTICED_KEY_WEIGHT = 2; // New keys get 2x selection chance
export const MASTERED_KEY_WEIGHT = 1; // Mastered keys get 1x selection chance
export const MAX_WEAK_KEYS_FOCUS = 5; // Focus on top 5 weakest

// ── Session Limits ──
export const IDLE_TIMEOUT_MS = 5000; // Ignore latency > 5s (user was idle)
export const MIN_SESSION_CHARS = 10; // Minimum chars for a valid session

// ── WPM Calculation ──
export const CHARS_PER_WORD = 5; // Standard: 1 word = 5 characters

// ── Rendering Throttle ──
export const WPM_UPDATE_INTERVAL_MS = 250; // Update WPM display every 250ms

// ── Caret ──
export const CARET_SPEED_SLOW = 150;
export const CARET_SPEED_MEDIUM = 100;
export const CARET_SPEED_FAST = 85;
export const CARET_SPEED_DEFAULT = CARET_SPEED_MEDIUM;

// ── IndexedDB Debounce ──
export const IDB_FLUSH_DEBOUNCE_MS = 2000; // Batch writes every 2 seconds

// ── Lesson Unlock Criteria ──
export const UNLOCK_MIN_ACCURACY = 0.9; // 90% accuracy to unlock next level
export const UNLOCK_MIN_WPM = 15; // 15 WPM minimum
export const UNLOCK_MIN_ATTEMPTS = 3; // At least 3 practice sessions

// ── Beginner Progressive Key Order (English/QWERTY) ──
export const ENGLISH_KEY_PROGRESSION: string[][] = [
  ['f', 'j'], // Level 1: Two keys
  ['d', 'k'], // Level 2
  ['s', 'l'], // Level 3
  ['a', ';'], // Level 4
  ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], // Level 5: Home row review
  ['g', 'h'], // Level 6
  ['r', 'u'], // Level 7
  ['e', 'i'], // Level 8
  ['w', 'o'], // Level 9
  ['q', 'p'], // Level 10
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], // Level 11: Top row review
  ['v', 'm'], // Level 12
  ['b', 'n'], // Level 13
  ['c', ','], // Level 14
  ['x', '.'], // Level 15
  ['z', '/'], // Level 16
  // Level 17-30 handled dynamically (all letters → caps → numbers → symbols)
];

// ── Tamil Key Progression (Tamil99) ──
export const TAMIL_KEY_PROGRESSION: string[][] = [
  ['அ', 'ஆ', 'இ', 'ஈ'], // Level 1: Basic vowels
  ['உ', 'ஊ', 'எ', 'ஏ'], // Level 2
  ['ஐ', 'ஒ', 'ஓ', 'ஔ'], // Level 3
  ['க', 'ச', 'ட', 'த'], // Level 4: Basic consonants
  ['ப', 'ற', 'ன', 'ம'], // Level 5
  ['ங', 'ஞ', 'ண', 'ந'], // Level 6
  ['ய', 'ர', 'ல', 'வ'], // Level 7
  ['ழ', 'ள', 'ஷ', 'ஸ'], // Level 8
  // Levels 9-30 handled dynamically
];

/**
 * VaagaTypePanalam — Adaptive Text Generator
 *
 * Generates practice text that emphasizes weak keys while
 * maintaining readability using word banks.
 */

import type { KeyStat, Language } from '@/db/schema';
import { ENGLISH_WORDS_BY_KEY } from '@/data/wordBanks/english';
import { TANGLISH_WORDS_BY_KEY } from '@/data/wordBanks/tanglish';
import { TAMIL_WORDS_BY_KEY } from '@/data/wordBanks/tamil';
import {
  DEFAULT_TEXT_LENGTH,
  WEAK_KEY_WEIGHT,
  UNPRACTICED_KEY_WEIGHT,
  MASTERED_KEY_WEIGHT,
  MAX_WEAK_KEYS_FOCUS,
} from './constants';

interface WeightedKey {
  char: string;
  weight: number;
}

/**
 * Get the word bank for a language.
 */
function getWordBank(language: Language): Map<string, string[]> {
  switch (language) {
    case 'en':
      return ENGLISH_WORDS_BY_KEY;
    case 'ta':
      return TAMIL_WORDS_BY_KEY;
    case 'tanglish':
      return TANGLISH_WORDS_BY_KEY;
    default:
      return ENGLISH_WORDS_BY_KEY;
  }
}

/**
 * Weighted random selection from a pool.
 */
function weightedRandomSelect(pool: WeightedKey[]): string {
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return pool[0]?.char ?? 'a';

  let random = Math.random() * totalWeight;
  for (const entry of pool) {
    random -= entry.weight;
    if (random <= 0) return entry.char;
  }
  return pool[pool.length - 1].char;
}

/**
 * Generate adaptive practice text based on key performance.
 *
 * @param language - Target language
 * @param keyStats - Current per-key stats (from KeyProfiler)
 * @param unlockedKeys - Keys the user has unlocked (for lessons)
 * @param targetLength - Target text length in characters
 * @returns Generated practice text
 */
export function generateAdaptiveText(
  language: Language,
  keyStats: KeyStat[],
  unlockedKeys: string[],
  targetLength: number = DEFAULT_TEXT_LENGTH
): string {
  const wordBank = getWordBank(language);

  // Build a stats map for quick lookup
  const statsMap = new Map<string, KeyStat>();
  for (const stat of keyStats) {
    statsMap.set(stat.char, stat);
  }

  // Build weighted key pool based on performance
  const weightedPool: WeightedKey[] = [];

  for (const key of unlockedKeys) {
    const stat = statsMap.get(key);
    let weight: number;

    if (!stat || stat.totalAttempts === 0) {
      // Unpracticed key — medium priority
      weight = UNPRACTICED_KEY_WEIGHT;
    } else if (stat.isWeak) {
      // Weak key — high priority
      weight = WEAK_KEY_WEIGHT;
    } else {
      // Mastered key — low priority (but still included)
      weight = MASTERED_KEY_WEIGHT;
    }

    weightedPool.push({ char: key, weight });
  }

  // If no keys available, use defaults
  if (weightedPool.length === 0) {
    weightedPool.push({ char: 'f', weight: 1 }, { char: 'j', weight: 1 });
  }

  // Extract weak digraphs for prioritized word selection
  const weakDigraphs = keyStats
    .filter(s => s.char.length > 1 && s.isWeak)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, MAX_WEAK_KEYS_FOCUS)
    .map(s => s.char);

  // Generate words
  const words: string[] = [];
  let charCount = 0;
  let attempts = 0;
  const maxAttempts = targetLength * 3; // Safety valve

  while (charCount < targetLength && attempts < maxAttempts) {
    attempts++;

    // Pick a target key using weighted random selection
    const targetKey = weightedRandomSelect(weightedPool);

    // Get words containing that key
    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;

    // Pick a candidate word. 
    // If we have weak digraphs, prefer words that contain them.
    let selectedWord = '';
    if (weakDigraphs.length > 0) {
      // Sample 10 random candidates and pick the one with most weak digraphs
      let bestScore = -1;
      for (let i = 0; i < 10; i++) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        let score = 0;
        for (const dg of weakDigraphs) {
          if (candidate.includes(dg)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          selectedWord = candidate;
        }
        if (score > 0 && Math.random() > 0.5) break; // Optimization: early exit if we found one
      }
    } else {
      selectedWord = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Avoid repeating the same word consecutively
    if (words.length > 0 && words[words.length - 1] === selectedWord) continue;

    words.push(selectedWord);
    charCount += selectedWord.length + 1; // +1 for space
  }

  return words.join(' ').trim();
}

/**
 * Generate simple text for a specific set of keys (for lessons).
 */
export function generateLessonText(
  language: Language,
  targetKeys: string[],
  targetLength: number = 80
): string {
  const wordBank = getWordBank(language);
  const words: string[] = [];
  let charCount = 0;
  let attempts = 0;

  while (charCount < targetLength && attempts < targetLength * 5) {
    attempts++;

    // Pick a random target key from the lesson keys
    const targetKey = targetKeys[Math.floor(Math.random() * targetKeys.length)];
    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;

    const word = candidates[Math.floor(Math.random() * candidates.length)];
    if (words.length > 0 && words[words.length - 1] === word) continue;

    words.push(word);
    charCount += word.length + 1;
  }

  // Fallback: if no words found, generate key repetitions
  if (words.length === 0) {
    const repeated = targetKeys.join(' ').repeat(
      Math.ceil(targetLength / (targetKeys.join(' ').length + 1))
    );
    return repeated.slice(0, targetLength).trim();
  }

  return words.join(' ').trim();
}

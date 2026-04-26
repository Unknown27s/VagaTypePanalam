/**
 * VangaTypePanalam — Adaptive Text Generator
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
function weightedRandomSelect(pool: WeightedKey[], totalWeight: number): string {
  // FIX 1: Accept precomputed totalWeight to avoid recalculating on every call
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
      weight = UNPRACTICED_KEY_WEIGHT;
    } else if (stat.isWeak) {
      weight = WEAK_KEY_WEIGHT;
    } else {
      weight = MASTERED_KEY_WEIGHT;
    }

    weightedPool.push({ char: key, weight });
  }

  // If no keys available, use defaults
  if (weightedPool.length === 0) {
    weightedPool.push({ char: 'f', weight: 1 }, { char: 'j', weight: 1 });
  }

  // FIX 1: Precompute total weight once instead of recalculating inside every weightedRandomSelect call
  const totalWeight = weightedPool.reduce((sum, p) => sum + p.weight, 0);

  // Extract weak digraphs for prioritized word selection
  const weakDigraphs = keyStats
    .filter(s => s.char.length > 1 && s.isWeak)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, MAX_WEAK_KEYS_FOCUS)
    .map(s => s.char);

  // FIX 2: Build a Set for O(1) digraph lookup instead of O(n) array includes per candidate
  const weakDigraphSet = new Set(weakDigraphs);

  // Generate words
  const words: string[] = [];
  let charCount = 0;
  let attempts = 0;
  const maxAttempts = targetLength * 3;

  // FIX 3: Track last word as a variable instead of indexing words array each iteration
  let lastWord = '';

  while (charCount < targetLength && attempts < maxAttempts) {
    attempts++;

    const targetKey = weightedRandomSelect(weightedPool, totalWeight);

    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;

    let selectedWord = '';

    if (weakDigraphs.length > 0) {
      let bestScore = -1;
      for (let i = 0; i < 10; i++) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        let score = 0;
        // FIX 2: Use Set lookup instead of array includes
        for (const dg of weakDigraphSet) {
          if (candidate.includes(dg)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          selectedWord = candidate;
        }
        if (score > 0 && Math.random() > 0.5) break;
      }
    } else {
      selectedWord = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // FIX 3: Compare against lastWord variable instead of words[words.length - 1]
    if (selectedWord === lastWord) continue;

    words.push(selectedWord);
    lastWord = selectedWord;
    charCount += selectedWord.length + 1;
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

  // FIX 3: Same lastWord pattern here too
  let lastWord = '';

  while (charCount < targetLength && attempts < targetLength * 5) {
    attempts++;

    const targetKey = targetKeys[Math.floor(Math.random() * targetKeys.length)];
    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;

    const word = candidates[Math.floor(Math.random() * candidates.length)];

    // FIX 3: Use lastWord variable
    if (word === lastWord) continue;

    words.push(word);
    lastWord = word;
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
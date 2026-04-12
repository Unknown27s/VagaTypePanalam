/**
 * VaagaTypePanalam — Async Text Generator
 *
 * Same algorithm as textGenerator.ts but uses the lazy-loaded
 * word cache from IndexedDB instead of static imports.
 */

import type { KeyStat, Language } from '@/db/schema';
import { getWordBank } from '@/db/wordCache';
import {
  DEFAULT_TEXT_LENGTH,
  WEAK_KEY_WEIGHT,
  UNPRACTICED_KEY_WEIGHT,
  MASTERED_KEY_WEIGHT,
} from './constants';

interface WeightedKey {
  char: string;
  weight: number;
}

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
 * Async version of generateAdaptiveText — uses the IDB word cache.
 */
export async function generateAdaptiveTextAsync(
  language: Language,
  keyStats: KeyStat[],
  unlockedKeys: string[],
  targetLength: number = DEFAULT_TEXT_LENGTH
): Promise<string> {
  const wordBank = await getWordBank(language);

  const statsMap = new Map<string, KeyStat>();
  for (const stat of keyStats) {
    statsMap.set(stat.char, stat);
  }

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

  if (weightedPool.length === 0) {
    weightedPool.push({ char: 'a', weight: 1 }, { char: 'f', weight: 1 });
  }

  const words: string[] = [];
  let charCount = 0;
  let attempts = 0;
  const maxAttempts = targetLength * 4;

  while (charCount < targetLength && attempts < maxAttempts) {
    attempts++;
    const targetKey = weightedRandomSelect(weightedPool);
    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;

    const word = candidates[Math.floor(Math.random() * candidates.length)];
    if (words.length > 0 && words[words.length - 1] === word) continue;

    words.push(word);
    charCount += word.length + 1;
  }

  return words.join(' ').trim();
}

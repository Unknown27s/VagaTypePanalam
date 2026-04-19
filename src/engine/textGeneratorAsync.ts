/**
 * VangaTypePanalam — Async Text Generator
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface WeightedKey {
  char: string;
  weight: number;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

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
  const statsMap = new Map(keyStats.map((s) => [s.char, s]));  // cleaner construction
  const weightedPool = buildWeightedPool(unlockedKeys, statsMap);

  // Precompute total weight once — weightedPool never changes during generation
  const totalWeight = weightedPool.reduce((sum, p) => sum + p.weight, 0);

  const words: string[] = [];
  const seen = new Set<string>();   // broader duplicate guard (not just consecutive)
  let charCount = 0;
  let attempts = 0;
  const maxAttempts = targetLength * 4;

  while (charCount < targetLength && attempts < maxAttempts) {
    const targetKey = weightedRandomSelect(weightedPool, totalWeight);
    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;  // don't burn an attempt

    attempts++;   // only count real selection attempts

    const word = pickRandom(candidates);
    if (seen.has(word)) continue;   // skip already-used words anywhere in the text

    words.push(word);
    seen.add(word);
    // Accurate space accounting: first word has no leading space
    charCount += word.length + (words.length > 1 ? 1 : 0);
  }

  return words.join(' ');   // .trim() not needed — no leading/trailing spaces added
}

// ─────────────────────────────────────────────
// Private Helpers
// ─────────────────────────────────────────────

function buildWeightedPool(
  unlockedKeys: string[],
  statsMap: Map<string, KeyStat>
): WeightedKey[] {
  if (unlockedKeys.length === 0) {
    return [
      { char: 'a', weight: 1 },
      { char: 'f', weight: 1 },
    ];
  }

  return unlockedKeys.map((key) => {
    const stat = statsMap.get(key);
    let weight: number;

    if (!stat || stat.totalAttempts === 0) {
      weight = UNPRACTICED_KEY_WEIGHT;
    } else if (stat.isWeak) {
      weight = WEAK_KEY_WEIGHT;
    } else {
      weight = MASTERED_KEY_WEIGHT;
    }

    return { char: key, weight };
  });
}

/**
 * Weighted random selection. Accepts a precomputed totalWeight
 * so callers in tight loops don't recompute the sum each time.
 */
function weightedRandomSelect(pool: WeightedKey[], totalWeight: number): string {
  if (totalWeight === 0) return pool[0]?.char ?? 'a';

  let random = Math.random() * totalWeight;
  for (const entry of pool) {
    random -= entry.weight;
    if (random <= 0) return entry.char;
  }
  // Floating-point epsilon fallback — should be unreachable in practice
  return pool[pool.length - 1].char;
}

/** Picks a uniformly random element from a non-empty array. */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
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
  MAX_WEAK_KEYS_FOCUS,
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
  const statsMap = new Map(keyStats.map((s) => [s.char, s]));
  const weightedPool = buildWeightedPool(unlockedKeys, statsMap);

  // Precompute total weight once — weightedPool never changes during generation
  const totalWeight = weightedPool.reduce((sum, p) => sum + p.weight, 0);

  // FIX 1: Bring weak-digraph boosting in from textGenerator.ts — this async
  // version was missing it entirely, causing weaker adaptive quality vs sync version.
  const weakDigraphSet = new Set(
    keyStats
      .filter(s => s.char.length > 1 && s.isWeak)
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, MAX_WEAK_KEYS_FOCUS)
      .map(s => s.char)
  );

  const words: string[] = [];
  const seen = new Set<string>();
  let charCount = 0;
  let attempts = 0;
  const maxAttempts = targetLength * 4;

  while (charCount < targetLength && attempts < maxAttempts) {
    const targetKey = weightedRandomSelect(weightedPool, totalWeight);
    const candidates = wordBank.get(targetKey);
    if (!candidates || candidates.length === 0) continue;
    attempts++;

    // FIX 1: Pick word using digraph scoring when weak digraphs exist,
    // same strategy as the sync generator — keeps both versions consistent.
    const word = weakDigraphSet.size > 0
      ? pickWithDigraphBoost(candidates, weakDigraphSet)
      : pickRandom(candidates);

    if (seen.has(word)) continue;
    words.push(word);
    seen.add(word);
    charCount += word.length + (words.length > 1 ? 1 : 0);
  }

  return words.join(' ');
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
 * FIX 2: Extracted digraph-boost logic into a named helper instead of
 * inlining it — makes the while loop body easier to read and the
 * scoring strategy reusable if needed elsewhere.
 */
function pickWithDigraphBoost(candidates: string[], digraphSet: Set<string>): string {
  let bestWord = pickRandom(candidates);
  let bestScore = 0;

  for (let i = 0; i < 10; i++) {
    const candidate = pickRandom(candidates);
    let score = 0;
    for (const dg of digraphSet) {
      if (candidate.includes(dg)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestWord = candidate;
    }
    if (score > 0 && Math.random() > 0.5) break;
  }

  return bestWord;
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
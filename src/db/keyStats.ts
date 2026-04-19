/**
 * VangaTypePanalam — Key Statistics CRUD Operations
 */

import { getDB } from './index';
import type { KeyStat, Language } from './schema';

/**
 * Get stats for a specific key.
 */
export async function getKeyStat(char: string): Promise<KeyStat | undefined> {
  const db = await getDB();
  return db.get('key-stats', char);
}

/**
 * Get all key stats for a given language.
 */
export async function getKeyStatsByLanguage(
  language: Language
): Promise<KeyStat[]> {
  const db = await getDB();
  return db.getAllFromIndex('key-stats', 'by-language', language);
}

/**
 * Get all weak keys for a language.
 */
export async function getWeakKeys(language: Language): Promise<KeyStat[]> {
  const stats = await getKeyStatsByLanguage(language);
  return stats.filter((s) => s.isWeak);
}

/**
 * Save/update a key stat record.
 */
export async function saveKeyStat(stat: KeyStat): Promise<void> {
  const db = await getDB();
  await db.put('key-stats', stat);
}

/**
 * Batch save key stats (used by debounced flush).
 */
export async function batchSaveKeyStats(stats: KeyStat[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('key-stats', 'readwrite');
  const store = tx.objectStore('key-stats');
  for (const stat of stats) {
    await store.put(stat);
  }
  await tx.done;
}

/**
 * Create a fresh key stat for a character.
 */
export function createDefaultKeyStat(
  char: string,
  language: Language
): KeyStat {
  return {
    char,
    language,
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0,
    avgLatencyMs: 0,
    recentLatencies: [],
    recentCorrect: [],
    lastPracticed: 0,
    isWeak: true,
    confidence: 0,
  };
}

/**
 * Get the top N weakest keys by confidence.
 */
export async function getWeakestKeys(
  language: Language,
  n: number = 5
): Promise<KeyStat[]> {
  const stats = await getKeyStatsByLanguage(language);
  return stats
    .filter((s) => s.totalAttempts > 0)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, n);
}

/**
 * Get keys sorted by confidence (ascending — weakest first).
 */
export async function getKeysByConfidence(
  language: Language
): Promise<KeyStat[]> {
  const stats = await getKeyStatsByLanguage(language);
  return stats.sort((a, b) => a.confidence - b.confidence);
}

/**
 * VaagaTypePanalam — Word Cache (Lazy-load + IDB)
 *
 * Fetches word banks from /public/data/words-{lang}.json on first use,
 * then permanently stores them in IndexedDB so the app works fully offline.
 */

import { getDB } from './index';
import type { Language } from './schema';
import { ENGLISH_WORDS_BY_KEY } from '@/data/wordBanks/english';
import { TAMIL_WORDS_BY_KEY } from '@/data/wordBanks/tamil';
import { TANGLISH_WORDS_BY_KEY } from '@/data/wordBanks/tanglish';

// Cache TTL: 30 days (words don't change often)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// In-memory session cache to avoid repeated IDB lookups
const memoryCache = new Map<Language, Map<string, string[]>>();

/**
 * Get the word bank for a language.
 * Priority: memory → IndexedDB → fetch from /public/data/ → static fallback
 */
export async function getWordBank(language: Language): Promise<Map<string, string[]>> {
  // 1. Check in-memory cache first (fastest)
  if (memoryCache.has(language)) {
    return memoryCache.get(language)!;
  }

  try {
    const db = await getDB();
    const cached = await db.get('word-cache', language);

    // 2. Use IDB cache if fresh
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      const wordMap = recordToMap(cached.words);
      memoryCache.set(language, wordMap);
      return wordMap;
    }

    // 3. Fetch from /public/data/words-{lang}.json
    const langCode = language === 'tanglish' ? 'tanglish' : language;
    const response = await fetch(`/data/words-${langCode}.json`);

    if (response.ok) {
      const words = await response.json() as Record<string, string[]>;
      // Merge with existing static word banks so we never have fewer words
      const merged = mergeWithStatic(language, words);

      // Store in IDB for offline use
      await db.put('word-cache', {
        language,
        words: mapToRecord(merged),
        cachedAt: Date.now(),
      });

      memoryCache.set(language, merged);
      return merged;
    }
  } catch {
    // Network or IDB error — fall through to static fallback
  }

  // 4. Static fallback (always works, even offline on first load)
  const staticMap = getStaticWordBank(language);
  memoryCache.set(language, staticMap);
  return staticMap;
}

/**
 * Clear the word cache (useful for fresh refresh).
 */
export async function clearWordCache(language?: Language): Promise<void> {
  const db = await getDB();
  if (language) {
    await db.delete('word-cache', language);
    memoryCache.delete(language);
  } else {
    await db.clear('word-cache');
    memoryCache.clear();
  }
}

// ── Helpers ──

function getStaticWordBank(language: Language): Map<string, string[]> {
  switch (language) {
    case 'en': return ENGLISH_WORDS_BY_KEY;
    case 'ta': return TAMIL_WORDS_BY_KEY;
    case 'tanglish': return TANGLISH_WORDS_BY_KEY;
    default: return ENGLISH_WORDS_BY_KEY;
  }
}

function mergeWithStatic(
  language: Language,
  fetched: Record<string, string[]>
): Map<string, string[]> {
  const staticMap = getStaticWordBank(language);
  const merged = new Map<string, string[]>(staticMap);

  for (const [key, words] of Object.entries(fetched)) {
    const existing = merged.get(key) ?? [];
    // Deduplicate by converting to a Set
    const combined = [...new Set([...existing, ...words])];
    merged.set(key, combined);
  }

  return merged;
}

function recordToMap(record: Record<string, string[]>): Map<string, string[]> {
  return new Map(Object.entries(record));
}

function mapToRecord(map: Map<string, string[]>): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  for (const [k, v] of map) record[k] = v;
  return record;
}

/**
 * VangaTypePanalam — Sessions CRUD Operations
 */

import { getDB } from './index';
import type { Session, Language } from './schema';

/**
 * Save a completed session.
 */
export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

/**
 * Get a session by ID.
 */
export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

/**
 * Get all sessions (most recent first).
 */
export async function getAllSessions(): Promise<Session[]> {
  const db = await getDB();
  const sessions = await db.getAll('sessions');
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * Get sessions started at or after a given timestamp (most recent first).
 */
export async function getSessionsSince(startedAtMs: number): Promise<Session[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex(
    'sessions',
    'by-date',
    IDBKeyRange.lowerBound(startedAtMs)
  );
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * Get sessions by language (most recent first).
 */
export async function getSessionsByLanguage(
  language: Language
): Promise<Session[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex(
    'sessions',
    'by-language',
    language
  );
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * Get recent N sessions.
 */
export async function getRecentSessions(n: number = 10): Promise<Session[]> {
  const all = await getAllSessions();
  return all.slice(0, n);
}

/**
 * Get unsynced sessions (for background sync).
 */
export async function getUnsyncedSessions(): Promise<Session[]> {
  const db = await getDB();
  // IDB boolean index workaround
  const all = await db.getAll('sessions');
  return all.filter((s) => !s.synced);
}

/**
 * Mark sessions as synced.
 */
export async function markSessionsSynced(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  for (const id of ids) {
    const session = await store.get(id);
    if (session) {
      session.synced = true;
      await store.put(session);
    }
  }
  await tx.done;
}

/**
 * Get typing stats summary from sessions.
 */
export async function getStatsSummary(language?: Language) {
  const sessions = language
    ? await getSessionsByLanguage(language)
    : await getAllSessions();

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalTimeMs: 0,
      avgWpm: 0,
      bestWpm: 0,
      avgAccuracy: 0,
      totalChars: 0,
      recentWpms: [] as number[],
    };
  }

  const totalTimeMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const avgWpm = Math.round(
    sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length
  );
  const bestWpm = Math.max(...sessions.map((s) => s.wpm));
  const avgAccuracy =
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
  const totalChars = sessions.reduce((sum, s) => sum + s.totalChars, 0);
  const recentWpms = sessions.slice(0, 20).map((s) => s.wpm);

  return {
    totalSessions: sessions.length,
    totalTimeMs,
    avgWpm,
    bestWpm,
    avgAccuracy,
    totalChars,
    recentWpms,
  };
}

/**
 * Generate a UUID for session IDs using crypto API.
 * Falls back to crypto.getRandomValues (available in all modern
 * browsers and Node.js 19+) if crypto.randomUUID is missing.
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined') {
    if (crypto.randomUUID) return crypto.randomUUID();
    // Fallback using crypto.getRandomValues (available in all secure contexts)
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  // Last-resort fallback (should never reach here in modern runtimes)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

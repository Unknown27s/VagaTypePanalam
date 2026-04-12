/**
 * VaagaTypePanalam — Sessions CRUD Operations
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
 * Generate a UUID for session IDs.
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

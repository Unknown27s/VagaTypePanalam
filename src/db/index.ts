/**
 * VangaTypePanalam — IndexedDB Initialization
 *
 * Uses the 'idb' library for Promise-based IndexedDB access.
 * Singleton pattern ensures only one DB connection is created.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { VANGADB } from './schema';

const DB_NAME = 'VANGA-typing-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<VANGADB> | null = null;

/**
 * Get the database instance (creates it on first call).
 * Safe to call multiple times — returns the same instance.
 */
export async function getDB(): Promise<IDBPDatabase<VANGADB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<VANGADB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ── Store 1: User Profile ──
      if (!db.objectStoreNames.contains('user-profile')) {
        db.createObjectStore('user-profile', { keyPath: 'id' });
      }

      // ── Store 2: Per-Key Statistics ──
      if (!db.objectStoreNames.contains('key-stats')) {
        const keyStatsStore = db.createObjectStore('key-stats', {
          keyPath: 'char',
        });
        keyStatsStore.createIndex('by-language', 'language', {
          unique: false,
        });
        keyStatsStore.createIndex('by-confidence', 'confidence', {
          unique: false,
        });
        // Boolean index workaround: store as string 'true'/'false'
        keyStatsStore.createIndex('by-weak', 'isWeak', { unique: false });
      }

      // ── Store 3: Session History ──
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', {
          keyPath: 'id',
        });
        sessionsStore.createIndex('by-date', 'startedAt', { unique: false });
        sessionsStore.createIndex('by-synced', 'synced', { unique: false });
        sessionsStore.createIndex('by-language', 'language', { unique: false });
      }

      // ── Store 4: Lesson Progress ──
      if (!db.objectStoreNames.contains('lesson-progress')) {
        const lessonStore = db.createObjectStore('lesson-progress', {
          keyPath: 'lessonId',
        });
        lessonStore.createIndex('by-language', 'language', { unique: false });
        lessonStore.createIndex('by-level', 'level', { unique: false });
      }

      // ── Store 5: Sync Queue ──
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      // ── Store 6: Word Cache (lazy-loaded word banks) ──
      if (!db.objectStoreNames.contains('word-cache')) {
        db.createObjectStore('word-cache', { keyPath: 'language' });
      }
    },
  });

  return dbInstance;
}

/**
 * Close the database connection (for cleanup).
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

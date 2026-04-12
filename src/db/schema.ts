/**
 * VaagaTypePanalam — IndexedDB Schema Definitions
 *
 * Database: 'vaaga-typing-db' (version 2)
 * Stores: user-profile, key-stats, sessions, lesson-progress, sync-queue, word-cache
 */

import type { DBSchema } from 'idb';

// ── Language & Layout Types ──

export type Language = 'en' | 'ta' | 'tanglish';
export type KeyboardLayout = 'qwerty' | 'tamil99' | 'phonetic';
export type Theme = 'dark' | 'light';
export type SessionMode = 'practice' | 'test' | 'lesson';

// ── Store Value Types ──

export interface UserProfile {
  id: string; // 'default' for single user
  displayName: string;
  language: Language;
  keyboardLayout: KeyboardLayout;
  theme: Theme;
  createdAt: number;
  lastSessionAt: number;
  totalSessions: number;
  totalTimeMs: number;
  bestWpm: number;
  currentLevel: number; // Beginner progression level (1-30)
  unlockedKeys: string[]; // Keys unlocked so far
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string; // Stored as YYYY-MM-DD
  dailyActivity: Record<string, number>; // Maps YYYY-MM-DD -> totalTimeMs
}

export interface KeyStat {
  char: string; // The character, e.g. 'a', 'க'
  language: Language;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0-1 (rolling avg, last 50)
  avgLatencyMs: number; // Rolling average response time
  recentLatencies: number[]; // Last 20 latencies (circular buffer serialized)
  recentCorrect: boolean[]; // Last 50 results (circular buffer serialized)
  lastPracticed: number; // Unix timestamp
  isWeak: boolean; // Derived: confidence < 0.6
  confidence: number; // 0-1 score combining accuracy + speed
}

export interface KeystrokeRecord {
  char: string;
  correct: boolean;
  latencyMs: number;
}

export interface Session {
  id: string; // UUID
  language: Language;
  mode: SessionMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  errorChars: number;
  text: string;
  keystrokeLog: KeystrokeRecord[];
  synced: boolean;
  level: number;
}

export interface LessonProgress {
  lessonId: string; // e.g. "en-lesson-3"
  language: Language;
  level: number;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
  lastAttemptAt: number;
}

export interface SyncQueueItem {
  id?: number; // Auto-increment
  type: 'session' | 'profile' | 'key-stats';
  payload: unknown;
  createdAt: number;
  retryCount: number;
}

export interface WordCacheEntry {
  language: Language; // key
  words: Record<string, string[]>; // { 'a': ['and', 'all', ...], ... }
  cachedAt: number; // unix timestamp
}

// ── Database Schema ──

export interface VaagaDB extends DBSchema {
  'user-profile': {
    key: string;
    value: UserProfile;
  };

  'key-stats': {
    key: string;
    value: KeyStat;
    indexes: {
      'by-language': Language;
      'by-confidence': number;
      'by-weak': string;
    };
  };

  sessions: {
    key: string;
    value: Session;
    indexes: {
      'by-date': number;
      'by-synced': string;
      'by-language': Language;
    };
  };

  'lesson-progress': {
    key: string;
    value: LessonProgress;
    indexes: {
      'by-language': Language;
      'by-level': number;
    };
  };

  'sync-queue': {
    key: number;
    value: SyncQueueItem;
  };

  'word-cache': {
    key: Language;
    value: WordCacheEntry;
  };
}

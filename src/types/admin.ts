/**
 * VangaTypePanalam — Admin Dashboard Types
 *
 * Centralized TypeScript interfaces for all admin dashboard
 * data shapes, form states, and API response structures.
 */

import type { PracticeBook, Rank, Badge, Event } from '@prisma/client';

// ── Navigation ──

export type AdminTab = 'overview' | 'books' | 'ranks' | 'badges' | 'events';

// ── Cloud Backup Profile (synced from IndexedDB → Neon) ──

export interface CloudBackupProfile {
  currentLevel: number;
  bestWpm: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalTimeMs: number;
  dailyActivity?: Record<string, number>;
}

export interface CloudBackupSession {
  id: string;
  language: string;
  mode: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  errorChars: number;
}

export interface CloudBackup {
  profile: CloudBackupProfile;
  sessions: CloudBackupSession[];
  updatedAt: string;
}

// ── Admin User (from GET /api/admin/users) ──

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  cloudBackup: CloudBackup | null;
}

// ── System Aggregates ──

export interface SystemAggregates {
  totalSessions: number;
  averageWpm: number;
  totalBooks: number;
}

// ── Form Data Shapes ──

export interface BookFormData {
  id?: string;
  title: string;
  description?: string | null;
  content: string;
  words?: string[];
  isActive: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}

export interface RankFormData {
  id?: string;
  type: string;
  title: string;
  minWpm: number;
  maxWpm: number;
  svgContent?: string | null;
}

export interface BadgeFormData {
  id?: string;
  badgeId: string;
  title: string;
  description: string;
  rarity: string;
  category?: string | null;
  quote?: string | null;
  svgContent?: string | null;
}

export interface EventFormData {
  id?: string;
  title: string;
  description: string;
  targetType: string;
  targetValue: number;
  rewardBadge?: string | null;
  activeFrom?: string | Date | null;
  activeTo?: string | Date | null;
  svgContent?: string | null;
}

/** Union of all possible editing form shapes */
export type EditingItem =
  | BookFormData
  | RankFormData
  | BadgeFormData
  | EventFormData
  | null;

/**
 * VangaTypePanalam — User Profile CRUD Operations
 */

import { getDB } from './index';
import type { UserProfile, Language, KeyboardLayout, Theme } from './schema';
import { getLocalDateString } from '@/engine/statsCalculator';

const DEFAULT_PROFILE_ID = 'default';

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Get the user profile (creates a default one if none exists).
 */
export async function getProfile(): Promise<UserProfile> {
  const db = await getDB();
  const profile = await db.get('user-profile', DEFAULT_PROFILE_ID);
  if (profile) return profile;

  const defaultProfile = createDefaultProfile();
  await db.put('user-profile', defaultProfile);
  return defaultProfile;
}

/**
 * Update the user profile (partial update).
 */
export async function updateProfile(
  updates: Partial<Omit<UserProfile, 'id'>>
): Promise<UserProfile> {
  const current = await getProfile();
  return _applyAndSave(current, updates);
}

/**
 * Record a completed session in the profile stats.
 */
export async function recordSessionInProfile(
  durationMs: number,
  wpm: number
): Promise<void> {
  // Single DB read — reuse the fetched profile directly
  const profile = await getProfile();

  const today = getLocalDateString(new Date());
  const yesterday = getPreviousDay(today);

  const newCurrentStreak =
    profile.lastActiveDay === today
      ? profile.currentStreak                  // already counted today
      : profile.lastActiveDay === yesterday
        ? profile.currentStreak + 1            // extend streak
        : 1;                                   // streak broken

  await _applyAndSave(profile, {
    totalSessions: profile.totalSessions + 1,
    totalTimeMs: profile.totalTimeMs + durationMs,
    lastSessionAt: Date.now(),
    bestWpm: Math.max(profile.bestWpm, wpm),
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(profile.longestStreak, newCurrentStreak),
    lastActiveDay: today,
    // Targeted update — avoids cloning the entire dailyActivity map
    dailyActivity: {
      ...profile.dailyActivity,
      [today]: (profile.dailyActivity[today] ?? 0) + durationMs,
    },
  });
}

/**
 * Unlock new keys for the user (ignores already-unlocked keys).
 */
export async function unlockKeys(keys: string[]): Promise<void> {
  const profile = await getProfile();
  const existingKeys = new Set(profile.unlockedKeys);   // O(1) lookup
  const newKeys = keys.filter((k) => !existingKeys.has(k));

  if (newKeys.length > 0) {
    await _applyAndSave(profile, {
      unlockedKeys: [...profile.unlockedKeys, ...newKeys],
    });
  }
}

/**
 * Advance the user's current level.
 */
export async function advanceLevel(): Promise<number> {
  const profile = await getProfile();
  const newLevel = profile.currentLevel + 1;
  await _applyAndSave(profile, { currentLevel: newLevel });
  return newLevel;
}

/** Update language preference. */
export async function setLanguage(language: Language): Promise<void> {
  await updateProfile({ language });
}

/** Update keyboard layout preference. */
export async function setKeyboardLayout(layout: KeyboardLayout): Promise<void> {
  await updateProfile({ keyboardLayout: layout });
}

/** Update theme preference. */
export async function setTheme(theme: Theme): Promise<void> {
  await updateProfile({ theme });
}

// ─────────────────────────────────────────────
// Private Helpers
// ─────────────────────────────────────────────

/**
 * Merges updates onto an already-fetched profile and persists it.
 * Avoids the double-read that occurred when updateProfile() called getProfile() internally.
 */
async function _applyAndSave(
  current: UserProfile,
  updates: Partial<Omit<UserProfile, 'id'>>
): Promise<UserProfile> {
  const db = await getDB();
  const updated: UserProfile = { ...current, ...updates };
  await db.put('user-profile', updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated }));
  }

  return updated;
}

/**
 * Returns the ISO date string for the day before a given YYYY-MM-DD string.
 * Avoids creating a second `new Date()` in `recordSessionInProfile`.
 */
function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

function createDefaultProfile(): UserProfile {
  return {
    id: DEFAULT_PROFILE_ID,
    displayName: 'Typist',
    language: 'en',
    keyboardLayout: 'qwerty',
    theme: 'dark',
    createdAt: Date.now(),
    lastSessionAt: 0,
    totalSessions: 0,
    totalTimeMs: 0,
    bestWpm: 0,
    currentLevel: 1,
    unlockedKeys: ['f', 'j'],
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: '',
    dailyActivity: {},
  };
}
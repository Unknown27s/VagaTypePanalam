/**
 * VaagaTypePanalam — User Profile CRUD Operations
 */

import { getDB } from './index';
import type { UserProfile, Language, KeyboardLayout, Theme } from './schema';

const DEFAULT_PROFILE_ID = 'default';

/**
 * Get the user profile (creates a default one if none exists).
 */
export async function getProfile(): Promise<UserProfile> {
  const db = await getDB();
  let profile = await db.get('user-profile', DEFAULT_PROFILE_ID);

  if (!profile) {
    profile = createDefaultProfile();
    await db.put('user-profile', profile);
  }

  return profile;
}

/**
 * Update the user profile (partial update).
 */
export async function updateProfile(
  updates: Partial<Omit<UserProfile, 'id'>>
): Promise<UserProfile> {
  const db = await getDB();
  const current = await getProfile();
  const updated = { ...current, ...updates };
  await db.put('user-profile', updated);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated }));
  }
  
  return updated;
}

/**
 * Record a completed session in the profile stats.
 */
export async function recordSessionInProfile(
  durationMs: number,
  wpm: number
): Promise<void> {
  const profile = await getProfile();

  // Calculate streak
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  let newCurrentStreak = profile.currentStreak;
  
  if (profile.lastActiveDay === yesterday) {
    newCurrentStreak += 1;
  } else if (profile.lastActiveDay !== today) {
    newCurrentStreak = 1;
  }
  
  const newLongestStreak = Math.max(profile.longestStreak, newCurrentStreak);

  // Update Daily Activity mapping
  const dailyActivity = { ...profile.dailyActivity };
  dailyActivity[today] = (dailyActivity[today] || 0) + durationMs;

  await updateProfile({
    totalSessions: profile.totalSessions + 1,
    totalTimeMs: profile.totalTimeMs + durationMs,
    lastSessionAt: Date.now(),
    bestWpm: Math.max(profile.bestWpm, wpm),
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActiveDay: today,
    dailyActivity,
  });
}

/**
 * Unlock a new key for the user.
 */
export async function unlockKeys(keys: string[]): Promise<void> {
  const profile = await getProfile();
  const newKeys = keys.filter((k) => !profile.unlockedKeys.includes(k));
  if (newKeys.length > 0) {
    await updateProfile({
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
  await updateProfile({ currentLevel: newLevel });
  return newLevel;
}

/**
 * Update language preference.
 */
export async function setLanguage(language: Language): Promise<void> {
  await updateProfile({ language });
}

/**
 * Update keyboard layout preference.
 */
export async function setKeyboardLayout(
  layout: KeyboardLayout
): Promise<void> {
  await updateProfile({ keyboardLayout: layout });
}

/**
 * Update theme preference.
 */
export async function setTheme(theme: Theme): Promise<void> {
  await updateProfile({ theme });
}

// ── Private ──

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
    unlockedKeys: ['f', 'j'], // Start with home row basics
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: '',
    dailyActivity: {},
  };
}

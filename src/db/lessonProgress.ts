/**
 * VaagaTypePanalam — Lesson Progress CRUD Operations
 */

import { getDB } from './index';
import type { LessonProgress, Language } from './schema';

/**
 * Get progress for a specific lesson.
 */
export async function getLessonProgress(
  lessonId: string
): Promise<LessonProgress | undefined> {
  const db = await getDB();
  return db.get('lesson-progress', lessonId);
}

/**
 * Get all lesson progress for a language.
 */
export async function getLessonProgressByLanguage(
  language: Language
): Promise<LessonProgress[]> {
  const db = await getDB();
  return db.getAllFromIndex('lesson-progress', 'by-language', language);
}

/**
 * Save/update lesson progress.
 */
export async function saveLessonProgress(
  progress: LessonProgress
): Promise<void> {
  const db = await getDB();
  await db.put('lesson-progress', progress);
}

/**
 * Record a lesson attempt (updates best scores and attempt count).
 */
export async function recordLessonAttempt(
  lessonId: string,
  language: Language,
  level: number,
  wpm: number,
  accuracy: number
): Promise<LessonProgress> {
  const existing = await getLessonProgress(lessonId);

  const progress: LessonProgress = existing
    ? {
        ...existing,
        bestWpm: Math.max(existing.bestWpm, wpm),
        bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
        attempts: existing.attempts + 1,
        lastAttemptAt: Date.now(),
        completed: existing.completed || (accuracy >= 0.9 && wpm >= 15),
      }
    : {
        lessonId,
        language,
        level,
        completed: accuracy >= 0.9 && wpm >= 15,
        bestWpm: wpm,
        bestAccuracy: accuracy,
        attempts: 1,
        lastAttemptAt: Date.now(),
      };

  await saveLessonProgress(progress);
  return progress;
}

/**
 * Check if a level can be unlocked.
 * Requires: 90% accuracy, 15+ WPM, at least 3 attempts on current level.
 */
export async function canUnlockNextLevel(
  currentLevel: number,
  language: Language
): Promise<boolean> {
  const allProgress = await getLessonProgressByLanguage(language);
  const levelProgress = allProgress.filter((p) => p.level === currentLevel);

  if (levelProgress.length === 0) return false;

  return levelProgress.every(
    (p) => p.bestAccuracy >= 0.9 && p.bestWpm >= 15 && p.attempts >= 3
  );
}

/**
 * Get the completion percentage for a language.
 */
export async function getCompletionPercentage(
  language: Language,
  totalLessons: number
): Promise<number> {
  const allProgress = await getLessonProgressByLanguage(language);
  const completed = allProgress.filter((p) => p.completed).length;
  return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
}

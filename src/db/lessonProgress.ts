/**
 * VangaTypePanalam — Lesson Progress CRUD Operations
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
  accuracy: number,
  targetWpm: number = 15,
  targetAccuracy: number = 0.9
): Promise<LessonProgress> {
  const existing = await getLessonProgress(lessonId);

  // A lesson is "completed" if it meets the target WPM and accuracy once.
  const isPassedNow = wpm >= targetWpm && accuracy >= targetAccuracy;

  const progress: LessonProgress = existing
    ? {
        ...existing,
        bestWpm: Math.max(existing.bestWpm, wpm),
        bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
        attempts: existing.attempts + 1,
        lastAttemptAt: Date.now(),
        completed: existing.completed || isPassedNow,
      }
    : {
        lessonId,
        language,
        level,
        completed: isPassedNow,
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
 * A level is unlocked if the previous level's lessons are completed.
 */
export async function canUnlockNextLevel(
  currentLevel: number,
  language: Language
): Promise<boolean> {
  if (currentLevel <= 0) return true;
  
  const allProgress = await getLessonProgressByLanguage(language);
  const levelProgress = allProgress.filter((p) => p.level === currentLevel);

  if (levelProgress.length === 0) return false;

  // Level is passed if EVERY lesson in that level has been completed at least once.
  return levelProgress.every((p) => p.completed);
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

'use client';

/**
 * VangaTypePanalam — Lessons Page
 *
 * Progressive lesson list with level progression.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/store/uiStore';
import { ENGLISH_LESSONS, type LessonDefinition } from '@/data/lessons/english';
import { TAMIL_LESSONS } from '@/data/lessons/tamil';
import { TANGLISH_LESSONS } from '@/data/lessons/tanglish';
import { getLessonProgressByLanguage } from '@/db/lessonProgress';
import type { LessonProgress, Language } from '@/db/schema';

const TA_TO_EN_MAP: Record<string, string> = {
  'அ': 'a', 'இ': 's', 'உ': 'd', 'எ': 'f', 'ஒ': 'g', 'க': 'h', 'ப': 'j', 'ம': 'k', 'த': 'l', 'ந': ';', 'ய': "'",
  'ஆ': 'q', 'ஈ': 'w', 'ஊ': 'e', 'ஐ': 'r', 'ஏ': 't', 'ள': 'y', 'ற': 'u', 'ன': 'i', 'ட': 'o', 'ண': 'p', 'ச': '[',
  'ஔ': 'z', 'ஃ': 'x', 'ழ': 'c', 'வ': 'v', 'ங': 'b', 'ல': 'n', 'ர': 'm', 'ஞ': '/'
};

export default function LessonsPage() {
  const { language } = useUIStore();
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const lessons = getLessonsForLanguage(language);

  useEffect(() => {
    loadProgress();
  }, [language]);

  async function loadProgress() {
    try {
      const allProgress = await getLessonProgressByLanguage(language);
      const map = new Map<string, LessonProgress>();
      for (const p of allProgress) {
        map.set(p.lessonId, p);
      }
      setProgress(map);
    } catch {
      // IndexedDB may not be available during SSR
    } finally {
      setLoading(false);
    }
  }

  function isLevelUnlocked(level: number): boolean {
    if (level <= 1) return true;
    const prevLesson = lessons.find((l) => l.level === level - 1);
    if (!prevLesson) return true;
    const prevProgress = progress.get(prevLesson.id);
    return prevProgress?.completed ?? false;
  }

  function getStarRating(prog: LessonProgress | undefined, lesson: LessonDefinition): number {
    if (!prog || prog.attempts === 0) return 0;
    if (prog.bestWpm >= lesson.targetWpm * 1.2 && prog.bestAccuracy >= 0.95) return 3;
    if (prog.bestWpm >= lesson.targetWpm) return 2;
    return 1;
  }

  function StarBadge({ count, total = 3 }: { count: number; total?: number }) {
    return (
      <span className="star-badge" aria-label={`${count} of ${total} stars`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < count ? 'star filled' : 'star empty'}>★</span>
        ))}
      </span>
    );
  }

  return (
    <>
      <main className="lessons-page">
        <div className="container">
          <div className="lessons-header">
            <h1 className="lessons-title">Typing Lessons</h1>
            <p className="lessons-subtitle">
              Progressive lessons from two keys to full-speed typing.
              Complete each level to unlock the next.
            </p>
          </div>

          {loading ? (
            <div className="loading-state">Loading lessons...</div>
          ) : (
            <div className="lessons-grid">
              {lessons.map((lesson) => {
                const prog = progress.get(lesson.id);
                const unlocked = isLevelUnlocked(lesson.level);
                const completed = prog?.completed ?? false;

                return (
                  <div
                    key={lesson.id}
                    className={`lesson-card card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
                  >
                    <div className="lesson-level">
                      <span className="level-number">{lesson.level}</span>
                      {!unlocked && <span className="level-lock">🔒</span>}
                      {unlocked && <StarBadge count={getStarRating(prog, lesson)} />}
                    </div>
                    <h3 className="lesson-name">{lesson.title}</h3>
                    <p className="lesson-desc">{lesson.description}</p>
                    <div className="lesson-keys">
                      {lesson.keys.slice(0, 8).map((k) => {
                        const enHint = language === 'ta' && TA_TO_EN_MAP[k] ? TA_TO_EN_MAP[k] : null;
                        return (
                          <span key={k} className={`key-badge ${enHint ? 'has-hint' : ''}`}>
                            <span className="key-char">{k === ' ' ? '␣' : k.toUpperCase()}</span>
                            {enHint && <span className="key-hint">{enHint}</span>}
                          </span>
                        );
                      })}
                      {lesson.keys.length > 8 && (
                        <span className="key-badge more">+{lesson.keys.length - 8}</span>
                      )}
                    </div>
                    <div className="lesson-targets">
                      <span className="target">🎯 {lesson.targetWpm} WPM</span>
                      <span className="target">
                        ✅ {(lesson.targetAccuracy * 100).toFixed(0)}%
                      </span>
                    </div>
                    {prog && (
                      <div className="lesson-stats">
                        <span>Best: {prog.bestWpm} WPM</span>
                        <span>Tries: {prog.attempts}</span>
                      </div>
                    )}
                    {unlocked ? (
                      <Link
                        href={`/lessons/${lesson.id}`}
                        className="btn btn-primary lesson-btn"
                        id={`lesson-${lesson.id}`}
                      >
                        {completed ? 'Practice Again' : prog ? 'Continue' : 'Start'}
                      </Link>
                    ) : (
                      <button
                        className="btn btn-secondary lesson-btn"
                        disabled
                      >
                        Locked
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style jsx>{`
          .lessons-page {
            min-height: 100dvh;
            padding: var(--space-2xl) 0;
          }

          .lessons-header {
            text-align: center;
            margin-bottom: var(--space-2xl);
          }

          .lessons-title {
            font-size: var(--text-3xl);
            font-weight: 800;
            margin-bottom: var(--space-sm);
          }

          .lessons-subtitle {
            color: var(--text-secondary);
            max-width: 500px;
            margin: 0 auto;
          }

          .loading-state {
            text-align: center;
            color: var(--text-muted);
            padding: var(--space-3xl);
          }

          .lessons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: var(--space-lg);
          }

          .lesson-card {
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
            transition: all var(--transition-base);
          }

          .lesson-card.locked {
            opacity: 0.5;
            filter: grayscale(0.5);
          }

          .lesson-card.completed {
            border-color: rgba(34, 197, 94, 0.3);
          }

          .lesson-level {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
          }

          .level-number {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-overlay);
            border-radius: var(--radius-full);
            font-weight: 700;
            font-size: var(--text-sm);
            color: var(--color-primary-light);
          }

          .level-check {
            color: var(--color-success);
            font-size: var(--text-lg);
          }

          .lesson-name {
            font-size: var(--text-lg);
            font-weight: 700;
          }

          .lesson-desc {
            font-size: var(--text-sm);
            color: var(--text-secondary);
            line-height: var(--leading-relaxed);
          }

          .lesson-keys {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .key-badge {
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
            padding: 0 6px;
            background: var(--bg-overlay);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-sm);
            font-family: var(--font-mono);
            font-size: var(--text-xs);
            font-weight: 600;
            color: var(--text-secondary);
          }

          .key-badge.has-hint {
            height: 36px;
            padding-bottom: 8px;
          }

          .key-hint {
            position: absolute;
            bottom: 2px;
            font-size: 8px;
            line-height: 1;
            color: var(--text-muted);
            text-transform: lowercase;
            font-family: var(--font-sans);
          }

          .key-badge.more {
            background: transparent;
            border: none;
            color: var(--text-muted);
          }

          .lesson-targets {
            display: flex;
            gap: var(--space-md);
            font-size: var(--text-xs);
            color: var(--text-muted);
          }

          .lesson-stats {
            display: flex;
            gap: var(--space-md);
            font-size: var(--text-xs);
            color: var(--color-primary-light);
            font-family: var(--font-mono);
          }

          .lesson-btn {
            margin-top: auto;
            width: 100%;
          }

          @media (max-width: 768px) {
            .lessons-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}

function getLessonsForLanguage(language: Language): LessonDefinition[] {
  switch (language) {
    case 'en':
      return ENGLISH_LESSONS;
    case 'tanglish':
      return TANGLISH_LESSONS;
    case 'ta':
      return TAMIL_LESSONS;
    default:
      return ENGLISH_LESSONS;
  }
}

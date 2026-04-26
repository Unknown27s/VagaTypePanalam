'use client';

/**
 * VangaTypePanalam — Individual Lesson Page
 */

import { useParams, useRouter } from 'next/navigation';
import TypingArea from '@/components/typing/TypingArea';
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard';
import { useUIStore } from '@/store/uiStore';
import { ENGLISH_LESSONS, type LessonDefinition } from '@/data/lessons/english';
import { TAMIL_LESSONS } from '@/data/lessons/tamil';
import { TANGLISH_LESSONS } from '@/data/lessons/tanglish';
import { recordLessonAttempt } from '@/db/lessonProgress';
import type { Session } from '@/db/schema';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { language, showKeyboard } = useUIStore();

  const lessonId = params?.id as string;
  let lesson: LessonDefinition | undefined = ENGLISH_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) lesson = TAMIL_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) lesson = TANGLISH_LESSONS.find((l) => l.id === lessonId);
  
  const currentLessons = lessonId.startsWith('tamil-') ? TAMIL_LESSONS : (lessonId.startsWith('tanglish-') ? TANGLISH_LESSONS : ENGLISH_LESSONS);
  const nextLesson = currentLessons.find(l => l.level === (lesson?.level ?? 0) + 1);

  if (!lesson) {
    return (
      <>
        <main className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h1>Lesson not found</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            The lesson &ldquo;{lessonId}&rdquo; does not exist.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => router.push('/lessons')}
          >
            Back to Lessons
          </button>
        </main>
      </>
    );
  }

  const handleComplete = async (session: Session) => {
    // Record lesson attempt
    await recordLessonAttempt(
      lesson.id,
      language,
      lesson.level,
      session.wpm,
      session.accuracy,
      lesson.targetWpm,
      lesson.targetAccuracy
    );
    // Notify lessons list to refresh progress
    window.dispatchEvent(new Event('lesson-progress-updated'));
  };

  const isTamilLesson = lesson.id.startsWith('tamil-') || language === 'ta';

  return (
    <>
      <main className="lesson-page">
        <div className="container">
          <div className="lesson-header">
            <button
              className="btn btn-ghost back-btn"
              onClick={() => router.push('/lessons')}
            >
              ← Back to Lessons
            </button>
            <div className="lesson-info">
              <span className="lesson-badge badge badge-primary">
                Level {lesson.level}
              </span>
              <h1 className="lesson-title">{lesson.title}</h1>
              <p className="lesson-description">{lesson.description}</p>
              <div className="lesson-goals">
                <span className="goal">
                  🎯 Target: {lesson.targetWpm} WPM
                </span>
                <span className="goal">
                  ✅ Accuracy: {(lesson.targetAccuracy * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <TypingArea
            language={language}
            targetKeys={lesson.keys}
            onComplete={handleComplete}
            mode="lesson"
            nextLessonId={nextLesson?.id}
            targetWpm={lesson.targetWpm}
            targetAccuracy={lesson.targetAccuracy}
          />

          {showKeyboard && (language === 'en' || language === 'tanglish' || language === 'ta') && (
            <div className="lesson-keyboard-wrap">
              {isTamilLesson && <p className="keyboard-note">Tamil99 overlay: highlighted keys are this lesson focus keys.</p>}
              <VirtualKeyboard
                showFingerColors={true}
                unlockedKeys={lesson.keys}
                language={language}
              />
            </div>
          )}
        </div>

        <style jsx>{`
          .lesson-page {
            min-height: 100dvh;
            padding: var(--space-2xl) 0;
          }

          .lesson-header {
            margin-bottom: var(--space-2xl);
          }

          .back-btn {
            margin-bottom: var(--space-md);
          }

          .lesson-info {
            text-align: center;
          }

          .lesson-badge {
            margin-bottom: var(--space-sm);
          }

          .lesson-title {
            font-size: var(--text-2xl);
            font-weight: 800;
            margin-bottom: var(--space-sm);
          }

          .lesson-description {
            color: var(--text-secondary);
            margin-bottom: var(--space-md);
          }

          .lesson-goals {
            display: flex;
            gap: var(--space-lg);
            justify-content: center;
            font-size: var(--text-sm);
            color: var(--text-muted);
          }

          .lesson-keyboard-wrap {
            margin-top: var(--space-xl);
            display: flex;
            justify-content: center;
            flex-direction: column;
            gap: var(--space-sm);
          }

          .keyboard-note {
            text-align: center;
            font-size: var(--text-xs);
            color: var(--text-muted);
          }
        `}</style>
      </main>
    </>
  );
}

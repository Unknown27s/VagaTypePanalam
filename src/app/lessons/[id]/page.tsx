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
import { TAMIL99_LAYOUT } from '@/data/keyboards/tamil99';
import { recordLessonAttempt } from '@/db/lessonProgress';
import type { Session } from '@/db/schema';

const TA_TO_EN_MAP: Record<string, string> = {
  'அ': 'a', 'இ': 's', 'உ': 'd', 'எ': 'f', 'ஒ': 'g', 'க': 'h', 'ப': 'j', 'ம': 'k', 'த': 'l', 'ந': ';', 'ய': "'",
  'ஆ': 'q', 'ஈ': 'w', 'ஊ': 'e', 'ஐ': 'r', 'ஏ': 't', 'ள': 'y', 'ற': 'u', 'ன': 'i', 'ட': 'o', 'ண': 'p', 'ச': '[',
  'ஔ': 'z', 'ஃ': 'x', 'ழ': 'c', 'வ': 'v', 'ங': 'b', 'ல': 'n', 'ர': 'm', 'ஞ': '/', 'ஓ': '`'
};

type Finger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

const TAMIL_KEY_TO_FINGER = new Map<string, Finger>();
for (const row of TAMIL99_LAYOUT) {
  for (const key of row) {
    if (!key.isModifier) {
      TAMIL_KEY_TO_FINGER.set(key.key, key.finger);
    }
  }
}

function getTamilFingerFocus(keys: string[]): Set<Finger> {
  const active = new Set<Finger>();
  for (const key of keys) {
    const finger = TAMIL_KEY_TO_FINGER.get(key);
    if (finger) active.add(finger);
  }
  return active;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { language, showKeyboard } = useUIStore();

  const lessonId = params?.id as string;
  let lesson: LessonDefinition | undefined = ENGLISH_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) lesson = TAMIL_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) lesson = TANGLISH_LESSONS.find((l) => l.id === lessonId);
  
  const currentLessons = lessonId.startsWith('ta-') ? TAMIL_LESSONS : (lessonId.startsWith('tang-') ? TANGLISH_LESSONS : ENGLISH_LESSONS);
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
  };

  const isTamilLesson = lesson.id.startsWith('tamil-') || language === 'ta';
  const tamilFingerFocus = getTamilFingerFocus(lesson.keys);
  const tamilKeyHints = lesson.keys
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .map((k) => ({ tamil: k, key: TA_TO_EN_MAP[k] }))
    .filter((v) => Boolean(v.key))
    .slice(0, 12);

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

          {isTamilLesson && (
            <section className="tamil-visuals" aria-label="Tamil typing guides">
              <div className="guide-card">
                <h3 className="guide-title">Finger Position Guide</h3>
                <svg className="finger-guide" viewBox="0 0 360 140" role="img" aria-label="Active fingers for this lesson">
                  <rect x="18" y="70" width="134" height="50" rx="20" className="palm" />
                  <rect x="208" y="70" width="134" height="50" rx="20" className="palm" />

                  <circle cx="42" cy="56" r="14" className={tamilFingerFocus.has('pinky') ? 'finger active' : 'finger'} />
                  <circle cx="70" cy="46" r="14" className={tamilFingerFocus.has('ring') ? 'finger active' : 'finger'} />
                  <circle cx="98" cy="40" r="14" className={tamilFingerFocus.has('middle') ? 'finger active' : 'finger'} />
                  <circle cx="128" cy="46" r="14" className={tamilFingerFocus.has('index') ? 'finger active' : 'finger'} />

                  <circle cx="232" cy="46" r="14" className={tamilFingerFocus.has('index') ? 'finger active' : 'finger'} />
                  <circle cx="262" cy="40" r="14" className={tamilFingerFocus.has('middle') ? 'finger active' : 'finger'} />
                  <circle cx="290" cy="46" r="14" className={tamilFingerFocus.has('ring') ? 'finger active' : 'finger'} />
                  <circle cx="318" cy="56" r="14" className={tamilFingerFocus.has('pinky') ? 'finger active' : 'finger'} />

                  <rect x="150" y="106" width="60" height="14" rx="7" className={tamilFingerFocus.has('thumb') ? 'thumb active' : 'thumb'} />
                </svg>
                <p className="guide-note">Highlighted circles show the fingers used most in this lesson.</p>
              </div>

              <div className="guide-card">
                <h3 className="guide-title">Tamil99 Key Hints</h3>
                <div className="hint-grid">
                  {tamilKeyHints.length === 0 ? (
                    <span className="hint-empty">No key hints for this lesson.</span>
                  ) : (
                    tamilKeyHints.map((item) => (
                      <span key={`${item.tamil}-${item.key}`} className="hint-chip">
                        <strong>{item.tamil}</strong>
                        <em>{item.key}</em>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="guide-card chart-card">
                <h3 className="guide-title">Uyirmei Combination Visual</h3>
                <div className="combination-chart" role="img" aria-label="Uyirmei examples">
                  <span>அ + க் + ா = கா</span>
                  <span>இ + க் + ி = கி</span>
                  <span>உ + த் + ு = து</span>
                  <span>எ + ப் + ெ = பெ</span>
                </div>
              </div>
            </section>
          )}

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

          .tamil-visuals {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-md);
            margin-bottom: var(--space-xl);
          }

          .guide-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-md);
            padding: var(--space-md);
          }

          .guide-title {
            font-size: var(--text-sm);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-secondary);
            margin-bottom: var(--space-sm);
          }

          .finger-guide {
            width: 100%;
            height: 120px;
          }

          .palm {
            fill: var(--bg-overlay);
            stroke: var(--border-default);
          }

          .finger {
            fill: var(--bg-hover);
            stroke: var(--border-default);
          }

          .finger.active {
            fill: var(--color-primary-light);
            stroke: var(--color-primary-dark);
          }

          .thumb {
            fill: var(--bg-hover);
          }

          .thumb.active {
            fill: var(--color-accent-light);
          }

          .guide-note {
            font-size: var(--text-xs);
            color: var(--text-muted);
            margin-top: var(--space-xs);
          }

          .hint-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .hint-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--bg-overlay);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-sm);
            padding: 4px 7px;
            font-size: var(--text-xs);
          }

          .hint-chip em {
            font-family: var(--font-mono);
            color: var(--color-primary-light);
            font-style: normal;
          }

          .hint-empty {
            font-size: var(--text-xs);
            color: var(--text-muted);
          }

          .combination-chart {
            display: grid;
            gap: 6px;
            font-size: var(--text-sm);
            color: var(--text-secondary);
            font-family: var(--font-mono);
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

          @media (max-width: 1000px) {
            .tamil-visuals {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}

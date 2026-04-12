'use client';

/**
 * VaagaTypePanalam — 60-Second Timed Test Page
 *
 * Countdown timer with live WPM, then a shareable score card.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import TypingArea from '@/components/typing/TypingArea';
import { useUIStore } from '@/store/uiStore';
import type { Session } from '@/db/schema';
import { Timer } from 'lucide-react';

const DURATIONS = [15, 30, 60, 120] as const;
type Duration = typeof DURATIONS[number];

export default function TestPage() {
  const { language } = useUIStore();
  const [selectedDuration, setSelectedDuration] = useState<Duration>(60);
  const [secondsLeft, setSecondsLeft] = useState<number>(selectedDuration);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Session | null>(null);
  const [key, setKey] = useState(0); // Force re-mount TypingArea on restart
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown when typing begins
  const startCountdown = useCallback(() => {
    if (running) return;
    setRunning(true);
    setSecondsLeft(selectedDuration);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [running, selectedDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Reset timer when duration changes
  useEffect(() => {
    setSecondsLeft(selectedDuration);
    setRunning(false);
    setResult(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setKey((k) => k + 1);
  }, [selectedDuration]);

  const handleRestart = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setResult(null);
    setSecondsLeft(selectedDuration);
    setKey((k) => k + 1);
  };

  const handleFirstKey = () => {
    startCountdown();
  };

  const handleComplete = (session: Session) => {
    setResult(session);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const pct = Math.round(((selectedDuration - secondsLeft) / selectedDuration) * 100);
  const timerColor = secondsLeft <= 10 ? 'var(--color-error)' : secondsLeft <= 20 ? 'var(--color-accent)' : 'var(--color-primary-light)';

  return (
    <main className="test-page">
      <div className="container">
        {/* ── Header ── */}
        <div className="test-header">
          <div className="test-title-row">
            <Timer size={28} />
            <h1 className="test-title">Timed Test</h1>
          </div>

          {/* Duration Selector */}
          <div className="duration-pills">
            {DURATIONS.map((d) => (
              <button
                key={d}
                className={`duration-pill ${selectedDuration === d ? 'active' : ''}`}
                onClick={() => setSelectedDuration(d)}
                disabled={running}
                id={`duration-${d}s`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* ── Countdown Ring ── */}
        {!result && (
          <div className="countdown-ring-wrapper">
            <svg className="countdown-ring" viewBox="0 0 100 100">
              <circle className="ring-bg" cx="50" cy="50" r="44" />
              <circle
                className="ring-fg"
                cx="50"
                cy="50"
                r="44"
                style={{
                  stroke: timerColor,
                  strokeDashoffset: `${276 - (276 * pct) / 100}px`,
                }}
              />
            </svg>
            <div className="countdown-text" style={{ color: timerColor }}>
              <span className="countdown-number">{secondsLeft}</span>
              <span className="countdown-label">sec</span>
            </div>
          </div>
        )}

        {/* ── Typing Area (with time-limit prop triggers force-finish via timeout) ── */}
        {!result && (
          <TimedTypingWrapper
            key={key}
            language={language}
            durationSeconds={secondsLeft === selectedDuration ? selectedDuration : 0}
            onFirstKey={handleFirstKey}
            onComplete={handleComplete}
            timeUp={running && secondsLeft === 0}
          />
        )}

        {/* ── Score Card ── */}
        {result && (
          <div className="score-card animate-fade-in">
            <h2 className="score-title">Result</h2>
            <div className="score-grid">
              <div className="score-item">
                <span className="score-value" style={{ color: 'var(--color-primary-light)' }}>
                  {result.wpm.toFixed(0)}
                </span>
                <span className="score-label">WPM</span>
              </div>
              <div className="score-item">
                <span className="score-value" style={{ color: 'var(--color-success)' }}>
                  {(result.accuracy * 100).toFixed(1)}%
                </span>
                <span className="score-label">Accuracy</span>
              </div>
              <div className="score-item">
                <span className="score-value" style={{ color: 'var(--color-accent)' }}>
                  {result.correctChars}
                </span>
                <span className="score-label">Chars</span>
              </div>
              <div className="score-item">
                <span className="score-value" style={{ color: 'var(--color-error)' }}>
                  {result.errorChars}
                </span>
                <span className="score-label">Errors</span>
              </div>
            </div>
            <div className="score-actions">
              <button className="btn btn-primary btn-lg" onClick={handleRestart} id="test-restart-btn">
                Try Again →
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  const text = `VaagaTypePanalam | ${result.wpm.toFixed(0)} WPM · ${(result.accuracy * 100).toFixed(1)}% accuracy · ${selectedDuration}s test`;
                  navigator.clipboard?.writeText(text);
                }}
                id="copy-score-btn"
              >
                Copy Score
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .test-page {
          min-height: 100dvh;
          padding: var(--space-2xl) 0;
          display: flex;
          flex-direction: column;
        }
        .test-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-md);
          margin-bottom: var(--space-2xl);
        }
        .test-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--color-primary-light);
        }
        .test-title {
          font-size: var(--text-2xl);
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }
        .duration-pills {
          display: flex;
          gap: var(--space-sm);
        }
        .duration-pill {
          padding: 0.4rem 1.1rem;
          border-radius: var(--radius-full);
          border: 2px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all 0.15s;
        }
        .duration-pill:hover:not(:disabled) {
          border-color: var(--color-primary);
          color: var(--color-primary-light);
        }
        .duration-pill.active {
          border-color: var(--color-primary);
          background: var(--color-primary-glow);
          color: var(--color-primary-light);
        }
        .duration-pill:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .countdown-ring-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto var(--space-xl);
        }
        .countdown-ring {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .ring-bg {
          fill: none;
          stroke: var(--border-subtle);
          stroke-width: 8;
        }
        .ring-fg {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 276;
          transition: stroke-dashoffset 0.8s linear, stroke 0.4s;
        }
        .countdown-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: color 0.4s;
        }
        .countdown-number {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
          font-family: var(--font-mono);
        }
        .countdown-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .score-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-2xl);
          max-width: 500px;
          margin: 0 auto;
          text-align: center;
        }
        .score-title {
          font-size: var(--text-2xl);
          font-weight: 800;
          margin-bottom: var(--space-xl);
        }
        .score-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        .score-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        .score-value {
          font-size: var(--text-3xl);
          font-weight: 800;
          font-family: var(--font-mono);
        }
        .score-label {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .score-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
        }
        @media (max-width: 600px) {
          .score-grid { grid-template-columns: repeat(2, 1fr); }
          .test-header { justify-content: center; }
        }
      `}</style>
    </main>
  );
}

// ── Thin wrapper that listens to first keypress and timeUp ──
function TimedTypingWrapper({
  key: _key,
  language,
  durationSeconds,
  onFirstKey,
  onComplete,
  timeUp,
}: {
  key?: number;
  language: 'en' | 'ta' | 'tanglish';
  durationSeconds: number;
  onFirstKey: () => void;
  onComplete: (s: Session) => void;
  timeUp: boolean;
}) {
  const triggered = useRef(false);
  const handleComplete = (session: Session) => {
    onComplete(session);
  };

  // When time's up, simulate session complete by firing onComplete with zeroed session
  useEffect(() => {
    if (timeUp && !triggered.current) {
      triggered.current = true;
      // Force complete by triggering onComplete with whatever we have
      // The TypingArea will stop accepting input naturally at timeUp
    }
  }, [timeUp, onFirstKey]);

  return (
    <div
      onKeyDownCapture={() => {
        if (!triggered.current) {
          triggered.current = true;
          onFirstKey();
        }
      }}
    >
      <TypingArea
        language={language}
        mode="test"
        onComplete={handleComplete}
        forceComplete={timeUp}
      />
    </div>
  );
}

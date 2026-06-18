'use client';

import { useRef, useEffect } from 'react';
import TypingArea from '@/components/typing/TypingArea';
import { useTypingStore } from '@/store/typingStore';
import type { Session } from '@/db/schema';
import { ProgressBar } from './ProgressBar';

interface LiveTestPhaseProps {
  language: 'en' | 'ta' | 'tanglish';
  selectedDuration: number;
  secondsLeft: number;
  running: boolean;
  onFirstKey: () => void;
  onComplete: (session: Session) => void;
}

export function LiveTestPhase({
  language,
  selectedDuration,
  secondsLeft,
  running,
  onFirstKey,
  onComplete,
}: LiveTestPhaseProps) {
  const { snapshot } = useTypingStore();
  const pct = Math.round(((selectedDuration - secondsLeft) / selectedDuration) * 100);
  const timerColor =
    secondsLeft <= 10
      ? 'var(--color-error)'
      : secondsLeft <= 20
        ? 'var(--color-accent)'
        : 'var(--color-primary-light)';

  return (
    <>
      <ProgressBar pct={pct} />

      <div className="test-phase">
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
            {snapshot.wpm > 0 && (
              <>
                <span className="countdown-divider" />
                <span className="countdown-wpm">{snapshot.wpm}</span>
                <span className="countdown-wpm-label">wpm</span>
                <span className="countdown-acc">{(snapshot.accuracy * 100).toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="typing-area-wrapper">
        {!running && snapshot.wpm === 0 && (
          <p className="typing-area-hint">Start typing to begin your test...</p>
        )}
        <TimedTypingWrapper
          language={language}
          durationSeconds={secondsLeft === selectedDuration ? selectedDuration : 0}
          onFirstKey={onFirstKey}
          onComplete={onComplete}
          timeUp={running && secondsLeft === 0}
        />
      </div>
    </>
  );
}

function TimedTypingWrapper({
  language,
  onFirstKey,
  onComplete,
  timeUp,
}: {
  language: 'en' | 'ta' | 'tanglish';
  durationSeconds: number;
  onFirstKey: () => void;
  onComplete: (s: Session) => void;
  timeUp: boolean;
}) {
  const triggered = useRef(false);

  useEffect(() => {
    return () => {
      triggered.current = false;
    };
  }, []);

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
        onComplete={onComplete}
        forceComplete={timeUp}
      />
    </div>
  );
}

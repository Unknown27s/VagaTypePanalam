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
        <div className="timer" style={{ color: timerColor }}>
          {secondsLeft}s
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

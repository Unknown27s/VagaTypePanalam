'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { Session } from '@/db/schema';
import { TestHeader, type Duration } from '@/components/test/TestHeader';
import { LiveTestPhase } from '@/components/test/LiveTestPhase';
import { TestResults } from '@/components/test/TestResults';
import '@/styles/test.css';

export default function TestPage({ showTitle = true }: { showTitle?: boolean }) {
  const { language } = useUIStore();
  const [selectedDuration, setSelectedDuration] = useState<Duration>(60);
  const [secondsLeft, setSecondsLeft] = useState<number>(selectedDuration);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Session | null>(null);
  const [key, setKey] = useState(0);
  const [phaseVisible, setPhaseVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Fade the phase out briefly before swapping content, instead of an instant hard cut.
  const swapPhase = (mutate: () => void) => {
    setPhaseVisible(false);
    setTimeout(() => {
      mutate();
      setPhaseVisible(true);
    }, 140);
  };

  const handleRestart = () => {
    swapPhase(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setResult(null);
      setSecondsLeft(selectedDuration);
      setKey((k) => k + 1);
    });
  };

  const changeDuration = (d: Duration) => {
    swapPhase(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSelectedDuration(d);
      setSecondsLeft(d);
      setRunning(false);
      setResult(null);
      setKey((k) => k + 1);
    });
  };

  const handleFirstKey = () => {
    startCountdown();
  };

  const handleComplete = (session: Session) => {
    swapPhase(() => {
      setResult(session);
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });
  };

  return (
    <main className="test-page">
      <div className="container">
        <TestHeader
          selectedDuration={selectedDuration}
          running={running}
          onChangeDuration={changeDuration}
          hideTitle={!showTitle}
        />

        <div className={`test-phase-slot ${phaseVisible ? 'visible' : ''}`}>
          {!result && (
            <LiveTestPhase
              key={key}
              language={language}
              selectedDuration={selectedDuration}
              secondsLeft={secondsLeft}
              running={running}
              onFirstKey={handleFirstKey}
              onComplete={handleComplete}
            />
          )}

          {result && (
            <TestResults
              result={result}
              selectedDuration={selectedDuration}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .test-phase-slot {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.16s ease, transform 0.16s ease;
        }
        .test-phase-slot.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
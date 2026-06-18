'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { Session } from '@/db/schema';
import { TestHeader, type Duration } from '@/components/test/TestHeader';
import { LiveTestPhase } from '@/components/test/LiveTestPhase';
import { TestResults } from '@/components/test/TestResults';
import '@/styles/test.css';

export default function TestPage() {
  const { language } = useUIStore();
  const [selectedDuration, setSelectedDuration] = useState<Duration>(60);
  const [secondsLeft, setSecondsLeft] = useState<number>(selectedDuration);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Session | null>(null);
  const [key, setKey] = useState(0);
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

  const handleRestart = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setResult(null);
    setSecondsLeft(selectedDuration);
    setKey((k) => k + 1);
  };

  const changeDuration = (d: Duration) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelectedDuration(d);
    setSecondsLeft(d);
    setRunning(false);
    setResult(null);
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

  return (
    <main className="test-page">
      <div className="container">
        <TestHeader
          selectedDuration={selectedDuration}
          running={running}
          onChangeDuration={changeDuration}
        />

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
    </main>
  );
}

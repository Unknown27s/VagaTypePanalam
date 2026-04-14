'use client';

/**
 * VaagaTypePanalam — TypingArea Component
 *
 * Core typing interface with Keybr-style metrics panel:
 * - Structured metrics block (Speed, Accuracy, Score)
 * - All keys row with per-key badges
 * - Current key indicator
 * - Accuracy streak display
 * - Daily goal progress bar
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SessionTracker } from '@/engine/sessionTracker';
import type { SessionSnapshot } from '@/engine/sessionTracker';
import type { Language, Session } from '@/db/schema';
import { useTypingStore } from '@/store/typingStore';
import { useUIStore } from '@/store/uiStore';
import { formatAccuracy, formatDuration } from '@/engine/statsCalculator';
import { KEY_TO_FINGER, getFingerColor } from '@/data/keyboards/qwerty';
import { soundEngine } from '@/engine/soundEngine';
import '@/styles/typing.css';

interface TypingAreaProps {
  language: Language;
  targetKeys?: string[];
  customText?: string;
  onComplete?: (session: Session) => void;
  mode?: 'practice' | 'test' | 'lesson';
  forceComplete?: boolean;
}

export default function TypingArea({
  language,
  targetKeys,
  customText,
  onComplete,
  mode = 'practice',
  forceComplete = false,
}: TypingAreaProps) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>({
    state: 'idle',
    text: '',
    cursorPosition: 0,
    correctChars: 0,
    errorChars: 0,
    totalKeystrokes: 0,
    wpm: 0,
    rawWpm: 0,
    accuracy: 1,
    elapsedMs: 0,
    isComplete: false,
    segmentsCompleted: 0,
    totalWordsTyped: 0,
  });

  const [isFocused, setIsFocused] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [caretStyle, setCaretStyle] = useState({ transform: 'translate(0, 0)', opacity: 0 });
  const [isIdle, setIsIdle] = useState(true);
  const [idleStats, setIdleStats] = useState({ wpm: 0, accuracy: 1, todayTimeMs: 0 });
  const [segmentFlash, setSegmentFlash] = useState(false);

  const trackerRef = useRef<SessionTracker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number>(0);
  const lastWpmUpdate = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const updateStore = useTypingStore((s) => s.updateSnapshot);
  const soundEnabled = useUIStore((s) => s.soundEnabled);

  // Keep latest onComplete in a ref to avoid re-init cycle if parent passes a new function
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Initialize session
  const initSession = useCallback(async () => {
    if (trackerRef.current) {
      await trackerRef.current.destroy();
    }

    const tracker = new SessionTracker(language, mode);
    tracker.setCallbacks({
      onStateChange: (snap) => {
        setSnapshot(snap);
        updateStore(snap);
      },
      onComplete: (session) => {
        onCompleteRef.current?.(session);
      },
      onSegmentComplete: () => {
        // Flash a brief green indicator
        setSegmentFlash(true);
        setTimeout(() => setSegmentFlash(false), 600);
      },
    });

    await tracker.init(targetKeys, customText);
    trackerRef.current = tracker;
  }, [language, targetKeys, customText, mode, updateStore]);

  // Load historical stats for Idle state display
  useEffect(() => {
    async function loadIdleStats() {
      const { getAllSessions } = await import('@/db/sessions');
      const sessions = await getAllSessions();
      if (sessions.length === 0) return;
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayMs = startOfDay.getTime();
      
      const todaySessions = sessions.filter(s => s.startedAt >= todayMs);
      const todayTimeMs = todaySessions.reduce((sum, s) => sum + s.durationMs, 0);
      
      let avgWpm = sessions[0].wpm; // baseline fallback
      let avgAccuracy = sessions[0].accuracy;
      
      if (todaySessions.length > 0) {
        avgWpm = Math.round(todaySessions.reduce((sum, s) => sum + s.wpm, 0) / todaySessions.length);
        avgAccuracy = todaySessions.reduce((sum, s) => sum + s.accuracy, 0) / todaySessions.length;
      } else {
        avgWpm = Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length);
        avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
      }
      
      setIdleStats({ wpm: avgWpm, accuracy: avgAccuracy, todayTimeMs });
    }
    loadIdleStats();
  }, [snapshot.isComplete, snapshot.segmentsCompleted]);

  useEffect(() => {
    initSession();
    return () => {
      trackerRef.current?.destroy();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initSession]);

  // Handle forcing finish from parent (used for timers)
  useEffect(() => {
    if (forceComplete && trackerRef.current?.state === 'typing') {
      trackerRef.current.forceFinish();
    }
  }, [forceComplete]);

  // Live WPM update loop
  useEffect(() => {
    if (snapshot.state !== 'typing') return;

    const updateLoop = (timestamp: number) => {
      if (timestamp - lastWpmUpdate.current > 250) {
        const tracker = trackerRef.current;
        if (tracker) {
          setLiveWpm(tracker.getCurrentWPM());
        }
        lastWpmUpdate.current = timestamp;
      }
      rafRef.current = requestAnimationFrame(updateLoop);
    };

    rafRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [snapshot.state]);

  // Caret coordinate tracking + Idle detection
  useEffect(() => {
    const updateCaret = () => {
      const currentSpan = containerRef.current?.querySelector('.char.current');
      if (currentSpan) {
        const x = (currentSpan as HTMLElement).offsetLeft;
        const y = (currentSpan as HTMLElement).offsetTop;
        setCaretStyle({ transform: `translate(${x}px, ${y}px)`, opacity: 1 });
      }
    };

    updateCaret();
    
    // Reset idle timer
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 1200);

    // Re-check after a brief moment for layout shifts
    const timeout = setTimeout(updateCaret, 50);
    return () => clearTimeout(timeout);
  }, [snapshot.cursorPosition, snapshot.text, isFocused]);

  // Handle keydown events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tracker = trackerRef.current;
      if (!tracker || isProcessingRef.current) return;

      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        if (snapshot.isComplete) {
          initSession();
        } else {
          tracker.reset();
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Control') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        tracker.backspace();
        return;
      }

      if (e.key.length !== 1) return;

      e.preventDefault();
      
      isProcessingRef.current = true;
      try {
        const correct = tracker.processKeystroke(e.key);

        if (!correct) {
          setErrorChars((prev) => new Set(prev).add(snapshot.cursorPosition));
          if (soundEnabled) {
            soundEngine.playError();
          }
        } else {
          if (soundEnabled) {
            soundEngine.playKeystroke();
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [snapshot.isComplete, snapshot.cursorPosition, initSession, soundEnabled]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    inputRef.current?.focus();
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const tracker = trackerRef.current;
      if (!tracker || isProcessingRef.current) return;

      const input = e.currentTarget;
      const typed = input.value;
      input.value = '';

      isProcessingRef.current = true;
      try {
        for (const char of typed) {
          tracker.processKeystroke(char);
          if (soundEnabled) {
            soundEngine.playKeystroke();
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [soundEnabled]
  );

  // Render character spans
  const renderText = () => {
    if (!snapshot.text) return null;

    return snapshot.text.split('').map((char, index) => {
      let className = 'char';
      const isError = snapshot.errorIndices?.includes(index);

      if (index < snapshot.cursorPosition) {
        className += isError ? ' error' : ' correct';
      } else if (index === snapshot.cursorPosition) {
        className += isError ? ' current-error' : ' current';
      } else {
        className += ' upcoming';
      }

      return (
        <span key={index} className={className}>
          {char === ' ' ? (index === snapshot.cursorPosition ? '␣' : '\u00A0') : char}
        </span>
      );
    });
  };

  const displayWpm = snapshot.state === 'idle' ? idleStats.wpm : (snapshot.state === 'typing' ? liveWpm : snapshot.wpm);
  const displayAccuracy = snapshot.state === 'idle' ? idleStats.accuracy : snapshot.accuracy;
  const displayElapsedMs = snapshot.state === 'idle' ? idleStats.todayTimeMs : snapshot.elapsedMs + idleStats.todayTimeMs;

  const globalAvgWpm = idleStats.wpm;
  const globalAvgAcc = idleStats.accuracy;
  const score = Math.round(displayWpm * displayAccuracy);
  const globalScore = Math.round(globalAvgWpm * globalAvgAcc);

  // Current expected key
  const currentKey = snapshot.text && snapshot.cursorPosition < snapshot.text.length
    ? snapshot.text[snapshot.cursorPosition]
    : null;

  // Build the "all keys" list — unique keys that appear in the text
  const allKeysInText = (() => {
    if (!snapshot.text) return [];
    const unique = [...new Set(snapshot.text.toLowerCase().split(''))].filter(c => c !== ' ').sort();
    return unique;
  })();

  return (
    <div className="typing-container">
      {/* ── Keybr-style Metrics Panel ── */}
      <div className="metrics-panel">
        <div className="metrics-row">
          <span className="metrics-label">Metrics:</span>
          <span className="metrics-value">
            Speed: <strong className="metric-speed">{displayWpm.toFixed(1)} ({globalAvgWpm.toFixed(0)})</strong> wpm
            {' '}Accuracy: <strong className="metric-accuracy">{(displayAccuracy * 100).toFixed(1)}% ({(globalAvgAcc * 100).toFixed(0)}%)</strong>
            {' '}Errors: <strong className="metric-error" style={{ color: snapshot.errorChars > 0 ? 'var(--color-error)' : 'inherit' }}>{snapshot.errorChars}</strong>
            {' '}Score: <strong className="metric-score">{score} ({globalScore})</strong>
          </span>
        </div>

        <div className="metrics-row">
          <span className="metrics-label">All keys:</span>
          <span className="metrics-keys">
            {allKeysInText.map((char) => {
              const fingerData = KEY_TO_FINGER.get(char);
              const bgColor = fingerData ? getFingerColor(fingerData.finger) : 'var(--key-bg)';
              const isCurrentKey = currentKey?.toLowerCase() === char;
              return (
                <span
                  key={char}
                  className={`key-badge ${isCurrentKey ? 'key-badge-active' : ''}`}
                  style={{ background: bgColor }}
                >
                  {char.toUpperCase()}
                </span>
              );
            })}
          </span>
        </div>

        <div className="metrics-row">
          <span className="metrics-label">Current key:</span>
          <span className="metrics-value">
            {currentKey ? (
              <>
                <span
                  className="key-badge key-badge-active"
                  style={{
                    background: KEY_TO_FINGER.get(currentKey.toLowerCase())
                      ? getFingerColor(KEY_TO_FINGER.get(currentKey.toLowerCase())!.finger)
                      : 'var(--key-bg)',
                  }}
                >
                  {currentKey === ' ' ? '␣' : currentKey.toUpperCase()}
                </span>
                {' '}
                <span className="metric-detail">
                  {snapshot.isCalibrated 
                    ? `Calibrated (Confidence: ${Math.round(trackerRef.current?.getKeyProfiler().getConfidence(currentKey) || 0 * 100)}%)`
                    : `Calibrating... (${snapshot.samplesCollected}/10 samples)`}
                </span>
              </>
            ) : (
              <span className="metric-detail">—</span>
            )}
          </span>
        </div>

        <div className="metrics-row">
          <span className="metrics-label">Accuracy:</span>
          <span className="metrics-value">
            <span className="metric-detail">
              {snapshot.errorChars === 0 && snapshot.totalKeystrokes > 0
                ? `${snapshot.correctChars} correct streak!`
                : snapshot.totalKeystrokes === 0
                  ? 'No accuracy streaks.'
                  : `${snapshot.errorChars} errors so far.`}
            </span>
          </span>
        </div>

        <div className="metrics-row">
          <span className="metrics-label">Daily goal:</span>
          <span className="metrics-value metrics-goal">
            <span className="metric-detail">{formatDuration(displayElapsedMs)}/30 minutes</span>
            <div className="goal-bar">
              <div
                className="goal-bar-fill"
                style={{ width: `${Math.min((displayElapsedMs / (30 * 60 * 1000)) * 100, 100)}%` }}
              />
            </div>
          </span>
        </div>
      </div>

      {/* ── Text Display ── */}
      <div
        ref={containerRef}
        className={`text-display ${isFocused ? 'focused' : ''}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleFocus}
        role="textbox"
        aria-label="Typing practice area"
      >
        <input
          ref={inputRef}
          className="hidden-input"
          type="text"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onInput={handleInput}
          aria-hidden="true"
          tabIndex={-1}
        />

        {!isFocused && snapshot.state !== 'finished' && (
          <div className="interaction-overlay" onClick={handleFocus}>
            <div className="focus-prompt">
              <span className="focus-icon">➔</span>
              <span>Click here or press any key to focus</span>
            </div>
          </div>
        )}

        <div className="text-content">
          <div 
            className={`caret ${isIdle ? 'blinking' : ''}`} 
            style={caretStyle}
          />
          {renderText()}
        </div>
      </div>


      {/* ── Results (lesson / test only) ── */}
      {snapshot.isComplete && mode !== 'practice' && (
        <div className="results-overlay animate-fade-in">
          <div className="results-card">
            <h2 className="results-title">Session Complete!</h2>
            <div className="results-grid">
              <div className="result-item">
                <span className="result-value" style={{ color: 'var(--color-primary-light)' }}>
                  {snapshot.wpm}
                </span>
                <span className="result-label">WPM</span>
              </div>
              <div className="result-item">
                <span className="result-value" style={{ color: 'var(--color-success)' }}>
                  {formatAccuracy(snapshot.correctChars, snapshot.totalKeystrokes)}
                </span>
                <span className="result-label">Accuracy</span>
              </div>
              <div className="result-item">
                <span className="result-value" style={{ color: 'var(--color-accent)' }}>
                  {formatDuration(snapshot.elapsedMs)}
                </span>
                <span className="result-label">Time</span>
              </div>
              <div className="result-item">
                <span className="result-value" style={{ color: 'var(--color-error)' }}>
                  {snapshot.errorChars}
                </span>
                <span className="result-label">Errors</span>
              </div>
            </div>
            <div className="results-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => initSession()}
                id="next-practice-btn"
              >
                Next Practice →
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => trackerRef.current?.reset()}
                id="retry-btn"
              >
                Retry Same Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restart hint ── */}
      {snapshot.state !== 'idle' && !snapshot.isComplete && (
        <div className="restart-hint">
          Press <kbd>Tab</kbd> to restart · <kbd>Esc</kbd> to reset
        </div>
      )}

      <style jsx>{`
        .session-bar {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: 0.6rem 1rem;
          margin-top: var(--space-md);
          border-radius: var(--radius-md);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .session-bar.segment-flash {
          border-color: var(--color-success);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.15);
        }
        .session-stat strong {
          color: var(--text-primary);
          font-weight: 700;
        }
        .session-divider {
          color: var(--border-default);
        }
        .segment-milestone {
          margin-left: auto;
          color: var(--color-success);
          font-weight: 600;
          font-size: var(--text-xs);
          animation: fadeInRight 0.3s ease;
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

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
import { CARET_SPEED_SLOW, CARET_SPEED_MEDIUM, CARET_SPEED_FAST } from '@/engine/constants';
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
    isCalibrated: true,
    samplesCollected: 0,
    errorIndices: [],
    typedChars: {},
    words: [],
    activeWordIndex: 0,
    currentWordInput: '',
    wordInputHistory: [],
    wordCorrectness: {},
    burstHistory: [],
    consistency: 1,
    slowestDigraphs: [],
  });

  const [isFocused, setIsFocused] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [caretPositionStyle, setCaretPositionStyle] = useState({ transform: 'translate(0, 0)', opacity: 0 });
  const [contentTranslateY, setContentTranslateY] = useState(0);
  const [isIdle, setIsIdle] = useState(true);
  const [idleStats, setIdleStats] = useState({ wpm: 0, accuracy: 1, todayTimeMs: 0 });
  const [segmentFlash, setSegmentFlash] = useState(false);

  const isComposingRef = useRef(false);

  const trackerRef = useRef<SessionTracker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number>(0);
  const lastWpmUpdate = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const segmentFlashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const globalIdleStatsRef = useRef({ wpm: 0, accuracy: 1 });
  const isProcessingRef = useRef<boolean>(false);
  const updateStore = useTypingStore((s) => s.updateSnapshot);
  const { soundEnabled, errorMode, caretSpeed, caretStyle } = useUIStore();

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
        if (segmentFlashTimerRef.current) clearTimeout(segmentFlashTimerRef.current);
        segmentFlashTimerRef.current = setTimeout(() => setSegmentFlash(false), 600);
      },
    });

    await tracker.init(targetKeys, customText);
    trackerRef.current = tracker;
  }, [language, targetKeys, customText, mode, updateStore]);

  // Load historical stats for Idle state display
  useEffect(() => {
    async function loadIdleStats() {
      const { getAllSessions, getSessionsSince } = await import('@/db/sessions');

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayMs = startOfDay.getTime();

      // Refresh global averages on first load and when a session is completed.
      if (globalIdleStatsRef.current.wpm === 0 || snapshot.isComplete) {
        const sessions = await getAllSessions();
        if (sessions.length > 0) {
          globalIdleStatsRef.current = {
            wpm: Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length),
            accuracy: sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length,
          };
        }
      }

      const todaySessions = await getSessionsSince(todayMs);
      const todayTimeMs = todaySessions.reduce((sum, s) => sum + s.durationMs, 0);

      let avgWpm = globalIdleStatsRef.current.wpm;
      let avgAccuracy = globalIdleStatsRef.current.accuracy;

      if (todaySessions.length > 0) {
        avgWpm = Math.round(todaySessions.reduce((sum, s) => sum + s.wpm, 0) / todaySessions.length);
        avgAccuracy = todaySessions.reduce((sum, s) => sum + s.accuracy, 0) / todaySessions.length;
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
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (segmentFlashTimerRef.current) clearTimeout(segmentFlashTimerRef.current);
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

  // Caret coordinate tracking + Smooth line scrolling
  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;

      // 1. Caret Positioning
      const activeWord = containerRef.current.querySelector('.word.word-active') as HTMLElement;

      if (activeWord) {
        // Find letters within the active word
        const letters = activeWord.querySelectorAll('.letter');
        const typedLen = snapshot.currentWordInput.length;

        let caretX = activeWord.offsetLeft;
        let caretY = activeWord.offsetTop;

        // If we have a letter at the current input index, place caret at its LEFT
        if (typedLen < letters.length) {
          const letterEl = letters[typedLen] as HTMLElement;
          caretX += letterEl.offsetLeft;
          caretY += letterEl.offsetTop;
        } else {
          // If we are past the last character (word finished or extra chars),
          // place caret at the RIGHT of the last rendered letter
          const lastLetter = letters[letters.length - 1] as HTMLElement;
          if (lastLetter) {
            caretX += lastLetter.offsetLeft + lastLetter.offsetWidth;
            caretY += lastLetter.offsetTop;
          }
        }

        setCaretPositionStyle({ transform: `translate(${caretX}px, ${caretY}px)`, opacity: 1 });
      }

      // 2. Smooth Line Scrolling (keep active word on the 2nd line if possible)
      if (activeWord) {
        const wordOffsetTop = (activeWord as HTMLElement).offsetTop;
        const lineHeight = 48; // Matches 1.5rem * 2 in CSS

        // If we've passed the first line, shift up so the active line stays in place
        if (wordOffsetTop > lineHeight) {
          setContentTranslateY(-(wordOffsetTop - lineHeight));
        } else {
          setContentTranslateY(0);
        }
      }
    };

    updateLayout();

    // Reset idle timer
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 1200);

    // Re-check after a brief moment for layout shifts
    const timeout = setTimeout(updateLayout, 50);
    return () => {
      clearTimeout(timeout);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [snapshot.currentWordInput, snapshot.activeWordIndex, snapshot.text, isFocused]);

  // Handle keydown events
  const isValidKeystroke = useCallback((key: string) => {
    const currentWord = snapshot.words[snapshot.activeWordIndex] ?? '';

    if (errorMode === 'stopOnWord' && key === ' ') {
      if (snapshot.currentWordInput !== currentWord) return false;
    }

    if (errorMode === 'stopOnLetter') {
      if (key === ' ') {
        if (snapshot.currentWordInput !== currentWord) return false;
      } else {
        const expectedChar = currentWord[snapshot.currentWordInput.length];
        if (!expectedChar || key !== expectedChar) return false;
      }
    }

    return true;
  }, [snapshot.words, snapshot.activeWordIndex, snapshot.currentWordInput, errorMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tracker = trackerRef.current;
      if (!tracker || isProcessingRef.current) return;
      if (isComposingRef.current) return; // Let IME handle it

      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        if (snapshot.isComplete) {
          initSession();
        } else {
          tracker.reset();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          tracker.backspaceWord();
        } else {
          tracker.backspace();
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Control') return;

      if (e.key.length !== 1) return;

      // Unified Error Mode Intercepts
      if (!isValidKeystroke(e.key)) {
        e.preventDefault();
        if (soundEnabled) soundEngine.playError();
        return;
      }

      e.preventDefault();

      isProcessingRef.current = true;
      try {
        const correct = tracker.processKeystroke(e.key);

        if (!correct) {
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

      // If backspace was pressed on mobile/IME, handle input deletion
      // (This is a simplified web approximation for android backspace)
      if (e.nativeEvent && (e.nativeEvent as InputEvent).inputType === 'deleteContentBackward') {
        tracker.backspace();
        return;
      }

      isProcessingRef.current = true;
      try {
        for (const char of typed) {
          if (!isValidKeystroke(char)) {
            if (soundEnabled) soundEngine.playError();
            continue;
          }

          const correct = tracker.processKeystroke(char);
          if (soundEnabled) {
            if (correct) soundEngine.playKeystroke();
            else soundEngine.playError();
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [soundEnabled]
  );

  // Render word-based DOM hierarchy
  const renderWords = () => {
    if (!snapshot.words || snapshot.words.length === 0) return null;

    return snapshot.words.map((word, wordIdx) => {
      const isActive = wordIdx === snapshot.activeWordIndex;
      const isPast = wordIdx < snapshot.activeWordIndex;

      let wordClass = 'word';
      if (isActive) wordClass += ' word-active';
      if (isPast && snapshot.wordCorrectness[wordIdx] === false) wordClass += ' word-error';

      // Reconstruct the expected letters and extra typed letters
      const expectedChars = word.split('');
      const typedInput = isActive ? snapshot.currentWordInput : (snapshot.wordInputHistory[wordIdx] ?? '');

      const letters = [];
      const maxLen = Math.max(expectedChars.length, typedInput.length);

      for (let i = 0; i < maxLen; i++) {
        const expected = expectedChars[i];
        const typed = typedInput[i];

        let letterClass = 'letter';
        let displayChar = expected;

        if (i >= expectedChars.length) {
          // Extra character
          letterClass += ' extra';
          displayChar = typed;
        } else if (typed !== undefined) {
          // Typed character
          if (typed === expected) {
            letterClass += ' correct';
          } else {
            letterClass += ' error';
          }
        } else if (isActive && i === typedInput.length) {
          // Current cursor position
          letterClass += ' current';
        } else {
          // Upcoming character
          letterClass += ' upcoming';
        }

        letters.push(
          <span key={i} className={letterClass}>
            {displayChar}
          </span>
        );
      }

      return (
        <div key={wordIdx} className={wordClass} data-word-index={wordIdx}>
          {letters}
        </div>
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

  const caretSpeedMs = caretSpeed === 'slow' ? CARET_SPEED_SLOW : caretSpeed === 'fast' ? CARET_SPEED_FAST : CARET_SPEED_MEDIUM;

  return (
    <div className="typing-container">
      {/* ── Keybr-style Metrics Panel ── */}
      <div className={`metrics-panel ${segmentFlash ? 'segment-flash' : ''}`}>
        <div className="metrics-row">
          <span className="metrics-label">Metrics:</span>
          <span className="metrics-value">
            Speed: <strong className="metric-speed">{displayWpm.toFixed(1)} ({globalAvgWpm.toFixed(0)})</strong> wpm
            {' '}Accuracy: <strong className="metric-accuracy">{(displayAccuracy * 100).toFixed(1)}% ({(globalAvgAcc * 100).toFixed(0)}%)</strong>
            {' '}Consistency: <strong className="metric-consistency">{Math.round(snapshot.consistency * 100)}%</strong>
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
                    ? `Calibrated (Confidence: ${Math.round((trackerRef.current?.getKeyProfiler().getConfidence(currentKey) ?? 0) * 100)}%)`
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
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            // Some IMEs wait until end to fire input
            if (e.data) {
              const syntheticEvent = {
                currentTarget: { value: e.data },
                nativeEvent: { inputType: 'insertText' }
              } as unknown as React.FormEvent<HTMLInputElement>;
              handleInput(syntheticEvent);
            }
          }}
          aria-hidden="true"
          tabIndex={-1}
        />

        {!isFocused && snapshot.state !== 'finished' && (
          <div className="interaction-overlay" onClick={handleFocus}>
            <div className="focus-prompt">
              <span className="focus-icon">➔</span>
              <span>Click here to focus</span>
            </div>
          </div>
        )}

        <div className="text-viewport">
          <div
            className="text-content"
            style={{
              transform: `translateY(${contentTranslateY}px)`,
              '--caret-speed': `${caretSpeedMs}ms`
            } as React.CSSProperties}
          >
            <div
              className={`caret caret-${caretStyle} ${isIdle ? 'blinking' : ''}`}
              style={caretPositionStyle}
            />
            {renderWords()}
          </div>
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
              <div className="result-item">
                <span className="result-value" style={{ color: 'var(--color-info)' }}>
                  {Math.round(snapshot.consistency * 100)}%
                </span>
                <span className="result-label">Consistency</span>
              </div>
              <div className="result-item">
                <span className="result-value" style={{ color: 'var(--text-muted)' }}>
                  {snapshot.rawWpm}
                </span>
                <span className="result-label">Raw WPM</span>
              </div>
            </div>

            {snapshot.slowestDigraphs && snapshot.slowestDigraphs.length > 0 && (
              <div className="slowest-digraphs-section">
                <h3 className="section-title">Slowest Multi-Keys</h3>
                <div className="digraph-list">
                  {snapshot.slowestDigraphs.map((dg) => (
                    <div key={dg.char} className="digraph-badge">
                      <span className="dg-chars">{dg.char}</span>
                      <span className="dg-latency">{dg.latency}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        .metrics-panel.segment-flash {
          border-color: var(--color-success);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.15);
        }
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

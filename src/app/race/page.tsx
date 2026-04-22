'use client';

/**
 * VangaTypePanalam — Ghost Racing Mode
 *
 * Compete offline against simulated bots with fixed WPMs to build competitive speed.
 */

import { useState, useEffect, useCallback } from 'react';
import TypingArea from '@/components/typing/TypingArea';
import { useUIStore } from '@/store/uiStore';
import { useTypingStore } from '@/store/typingStore';
import { Swords, Car, Flag } from 'lucide-react';
import type { Session } from '@/db/schema';

// Race text — this could be fetched from a DB, but static for now.
const RACE_TEXTS = [
  "The quick brown fox jumps over the lazy dog perfectly.",
  "Type racing is the most fun way to build your raw keyboard speed.",
  "Never underestimate the power of daily practice and muscle memory.",
];

// Hook to simulate a bot typing
function useBotRacer(wpm: number, totalChars: number, startRace: boolean) {
  const [charsTyped, setCharsTyped] = useState(0);

  useEffect(() => {
    if (!startRace || charsTyped >= totalChars) return;

    // Standard metric: 5 chars = 1 word
    const charsPerMinute = wpm * 5;
    const charsPerSecond = charsPerMinute / 60;
    const msPerChar = 1000 / charsPerSecond;

    // We add slight randomness to make the bot look human
    const jitterMs = msPerChar * 0.4;
    
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setCharsTyped(c => Math.min(c + 1, totalChars));
    }, msPerChar + (Math.random() * jitterMs * 2 - jitterMs));

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [charsTyped, wpm, totalChars, startRace]);

  return charsTyped;
}

export default function RacePage() {
  const { language } = useUIStore();
  const snapshot = useTypingStore(s => s.snapshot);
  
  const [raceText, setRaceText] = useState(RACE_TEXTS[0]);
  
  useEffect(() => {
    const randomText = RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
    setRaceText(randomText);
  }, []);

  const totalChars = raceText.length;
  
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<Session | null>(null);
  
  // Start race immediately on the first keystroke
  useEffect(() => {
    if (snapshot.state === 'typing' && !hasStarted) {
      setHasStarted(true);
    }
  }, [snapshot.state, hasStarted]);

  // Player progress
  const playerPct = Math.min((snapshot.cursorPosition / totalChars) * 100, 100);

  // Bots
  const bot1Chars = useBotRacer(30, totalChars, hasStarted); // 30 WPM bot
  const bot2Chars = useBotRacer(60, totalChars, hasStarted); // 60 WPM bot

  const bot1Pct = Math.min((bot1Chars / totalChars) * 100, 100);
  const bot2Pct = Math.min((bot2Chars / totalChars) * 100, 100);

  const handleComplete = useCallback((session: Session) => {
    setResult(session);
    setIsFinished(true);
  }, []);

  return (
    <main className="race-page">
      <div className="container animate-fade-in">
        
        {/* Header */}
        <div className="race-header">
          <div className="title-row">
            <Swords size={28} className="icon-pulse" />
            <h1 className="title">Ghost Racing</h1>
          </div>
          <p className="subtitle">Race against offline bots! Start typing to begin the race.</p>
        </div>

        {/* Tracks */}
        <div className="race-track-board">
          
          {/* Lane 1: Player */}
          <div className="lane player-lane">
            <div className="lane-info">
              <span className="name">You</span>
              <span className="speed">{snapshot.state === 'typing' ? snapshot.wpm.toFixed(0) : 0} WPM</span>
            </div>
            <div className="track">
              <div className="finish-line"><Flag size={16}/></div>
              <div 
                className="car-wrapper"
                style={{ transform: `translateX(calc(${playerPct}% - 24px))` }}
              >
                <div className="car player-car"><Car size={24}/></div>
              </div>
            </div>
          </div>

          {/* Lane 2: Bot 1 */}
          <div className="lane">
            <div className="lane-info">
              <span className="name">Beginner Bot</span>
              <span className="speed">30 WPM</span>
            </div>
            <div className="track">
              <div className="finish-line"><Flag size={16}/></div>
              <div 
                className="car-wrapper"
                style={{ transform: `translateX(calc(${bot1Pct}% - 24px))` }}
              >
                <div className="car bot-car"><Car size={24}/></div>
              </div>
            </div>
          </div>

          {/* Lane 3: Bot 2 */}
          <div className="lane">
            <div className="lane-info">
              <span className="name">Expert Bot</span>
              <span className="speed">60 WPM</span>
            </div>
            <div className="track">
              <div className="finish-line"><Flag size={16}/></div>
              <div 
                className="car-wrapper"
                style={{ transform: `translateX(calc(${bot2Pct}% - 24px))` }}
              >
                <div className="car bot-fast-car"><Car size={24}/></div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Area */}
        <div className="race-typing-area">
          {!isFinished ? (
            <TypingArea 
              language={language}
              mode="lesson" 
              customText={raceText}
              onComplete={handleComplete}
            />
          ) : (
            <div className="results-card animate-fade-in">
              <h2>Race Complete!</h2>
              <div className="score">
                <span className="val">{result?.wpm.toFixed(0)}</span> WPM
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Race Again
              </button>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .race-page {
          min-height: 100dvh;
          padding: var(--space-2xl) 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-2xl);
        }
        .race-header {
          text-align: center;
        }
        .title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          color: var(--color-primary);
          margin-bottom: var(--space-xs);
        }
        .icon-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .title {
          font-size: var(--text-2xl);
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }
        .subtitle {
          color: var(--text-secondary);
        }
        
        .race-track-board {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        
        .lane {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .player-lane {
          background: var(--color-primary-glow);
          margin: -10px;
          padding: 10px;
          border-radius: var(--radius-md);
        }
        .lane-info {
          width: 120px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .name {
          font-weight: 700;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }
        .speed {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
        
        .track {
          flex: 1;
          height: 36px;
          background: var(--bg-overlay);
          border: 1px dashed var(--border-subtle);
          border-radius: var(--radius-full);
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 4px;
        }
        .finish-line {
          position: absolute;
          right: -8px;
          color: var(--text-muted);
        }
        
        .car-wrapper {
          position: absolute;
          left: 0;
          transition: transform 0.1s linear;
          z-index: 2;
        }
        .car {
          background: var(--bg-surface);
          border-radius: 50%;
          padding: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          color: var(--text-secondary);
        }
        .player-car {
          color: var(--color-primary);
          border: 2px solid var(--color-primary);
        }
        .bot-car {
          color: var(--color-accent);
        }
        .bot-fast-car {
          color: var(--color-error);
        }

        .race-typing-area {
          min-height: 200px;
        }
        .results-card {
          text-align: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-2xl);
        }
        .score {
          font-family: var(--font-mono);
          font-size: var(--text-xl);
          color: var(--text-muted);
          margin-bottom: var(--space-lg);
        }
        .val {
          font-size: 3rem;
          font-weight: 800;
          color: var(--color-primary-light);
        }
      `}</style>
    </main>
  );
}

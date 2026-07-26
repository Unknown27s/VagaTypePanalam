'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import TypingArea from '@/components/typing/TypingArea';
import { useUIStore } from '@/store/uiStore';
import { useTypingStore } from '@/store/typingStore';
import { Swords, Car, Flag, Trophy, Medal, ChevronUp } from 'lucide-react';
import type { Session } from '@/db/schema';
import { getProfile } from '@/db/profile';

interface DifficultyConfig {
  label: string;
  botWpmRange: [number, number];
  speedLabel: string;
  color: string;
}

const DIFFICULTIES: DifficultyConfig[] = [
  { label: 'Beginner', botWpmRange: [15, 25], speedLabel: '15-25 WPM', color: '#34d399' },
  { label: 'Easy', botWpmRange: [25, 35], speedLabel: '25-35 WPM', color: '#22d3ee' },
  { label: 'Medium', botWpmRange: [35, 50], speedLabel: '35-50 WPM', color: '#818cf8' },
  { label: 'Hard', botWpmRange: [50, 65], speedLabel: '50-65 WPM', color: '#f59e0b' },
  { label: 'Pro', botWpmRange: [65, 85], speedLabel: '65-85 WPM', color: '#f97316' },
  { label: 'Expert', botWpmRange: [85, 105], speedLabel: '85-105 WPM', color: '#ef4444' },
  { label: 'Insane', botWpmRange: [105, 140], speedLabel: '105-140 WPM', color: '#dc2626' },
];

const RACE_TEXTS_BY_LEVEL: Record<string, string[]> = {
  beginner: [
    "The quick brown fox jumps over the lazy dog perfectly.",
    "A fast brown dog jumps over the lazy fox in the park.",
    "She sells sea shells by the sea shore every single day.",
    "Typing is fun when you practice every single day with joy.",
    "The cat sat on the mat and looked at the big red ball.",
  ],
  easy: [
    "Practice makes perfect and typing every day builds muscle memory fast.",
    "Race against the clock to improve your typing speed and accuracy.",
    "Keep your fingers on the home row and type without looking down.",
    "The best way to learn is to practice a little bit every single day.",
    "Speed comes naturally when you focus on accuracy first and foremost.",
  ],
  medium: [
    "Type racing is the most fun way to build your raw keyboard speed and accuracy under pressure.",
    "Never underestimate the power of daily practice and muscle memory when learning to type faster.",
    "A smooth steady rhythm beats frantic bursts every time in a long typing session or race.",
    "Focus on the text ahead and trust your fingers to find the right keys without looking down.",
    "Consistent daily practice for just fifteen minutes can transform your typing speed over time.",
  ],
  hard: [
    "Maintaining accuracy at high speed requires years of deliberate practice and proper finger placement on the home row without exception.",
    "The best typists read several words ahead while their fingers automatically execute the keystrokes with minimal conscious effort.",
    "Competitive typing demands both raw speed and unwavering accuracy because every single mistake costs valuable time and momentum.",
    "Building true typing fluency means training your brain to map thoughts directly to keystrokes without the intermediate step of letter recognition.",
    "Professional transcriptionists maintain speeds above eighty words per minute for extended periods through disciplined technique and ergonomic positioning.",
  ],
  pro: [
    "Achieving mastery in typing requires deliberate practice focusing on weak keys and problem finger combinations until they become second nature and automatic.",
    "The difference between a good typist and a great one is not raw speed but consistency maintaining high accuracy across diverse vocabulary and complex sentence structures.",
    "Elite competitive typists utilize advanced techniques like anticipation typing and error prevention to maintain peak performance during high-stakes races.",
    "Neuromuscular adaptation through spaced repetition and targeted drills gradually eliminates error patterns and builds reliable muscle memory for every key on the board.",
    "Professional typing assessments measure net speed after deducting errors because accuracy under time pressure is the true indicator of functional typing ability.",
  ],
  expert: [
    "Typing proficiency at the expert level approaches subconscious execution where keystroke sequences are processed as complete motor patterns rather than individual character selections requiring conscious deliberation and verification.",
    "The cognitive architecture of high-speed typing involves parallel processing of visual input, linguistic prediction, and fine motor coordination operating below the threshold of conscious awareness during peak performance states.",
    "Advanced typists develop personalized rhythmic signatures characterized by consistent inter-keystroke intervals that maximize throughput while minimizing error probability across diverse orthographic structures.",
    "Biomechanical efficiency in expert typists is achieved through optimized finger travel paths, minimal lateral hand movement, and precisely timed key actuation that reduces cumulative strain while maximizing sustained output.",
    "The plateau phenomenon in typing development occurs when suboptimal technique patterns become deeply encoded requiring systematic retraining of specific motor sequences to overcome barriers and access higher performance tiers.",
  ],
  insane: [
    "At the highest echelons of typing performance practitioners achieve sustained rates exceeding one hundred thirty words per minute through meticulously optimized biomechanics, predictive text processing, and error recovery strategies executed within sub-two-hundred-millisecond windows without disrupting flow state continuity.",
    "The psychophysiological demands of elite competitive typing necessitate exceptional hand-eye coordination, working memory capacity for lookahead text buffering, and autonomous execution of complex bigram and trigram sequences approaching two standard deviations above population mean performance baselines.",
    "Neurological efficiency in expert typists manifests as reduced prefrontal cortex activation during keystroke execution indicating that complex motor sequences are processed as unified action schemas rather than discrete character selections enabling substantially higher throughput with diminished cognitive load.",
    "Professional typing championships require sustained performance across multiple rounds with incremental difficulty progression testing both anaerobic speed capacity and aerobic endurance over extended competitive periods exceeding thirty minutes of continuous maximal output.",
    "Cutting-edge typing pedagogy incorporates real-time biometric feedback, machine learning error pattern analysis, and personalized adaptive difficulty progression to optimize neuroplastic adaptation and accelerate skill acquisition beyond traditional practice methodologies.",
  ],
};

function getTextsForDifficulty(difficulty: DifficultyConfig): string[] {
  const index = DIFFICULTIES.indexOf(difficulty);
  const keys = Object.keys(RACE_TEXTS_BY_LEVEL);
  const texts: string[] = [];
  for (let i = 0; i <= Math.min(index, keys.length - 1); i++) {
    texts.push(...(RACE_TEXTS_BY_LEVEL[keys[i]] || []));
  }
  return texts;
}

// FIX: added `resetSignal` so bot progress reliably resets to 0 on every new race,
// instead of carrying over stale charsTyped from the previous race.
function useBotRacer(
  avgWpm: number,
  variance: number,
  totalChars: number,
  startRace: boolean,
  resetSignal: number
) {
  const [charsTyped, setCharsTyped] = useState(0);

  useEffect(() => {
    setCharsTyped(0);
  }, [resetSignal]);

  useEffect(() => {
    if (!startRace || charsTyped >= totalChars) return;

    const actualWpm = avgWpm + (Math.random() * variance * 2 - variance);
    const charsPerMinute = Math.max(actualWpm, 5) * 5;
    const charsPerSecond = charsPerMinute / 60;
    const msPerChar = 1000 / charsPerSecond;
    const jitterMs = msPerChar * 0.3;

    let active = true;
    const timeout = setTimeout(() => {
      if (active) setCharsTyped(c => Math.min(c + 1, totalChars));
    }, msPerChar + (Math.random() * jitterMs * 2 - jitterMs));

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [charsTyped, avgWpm, variance, totalChars, startRace]);

  return charsTyped;
}

export default function RacePage() {
  const { language } = useUIStore();
  const snapshot = useTypingStore(s => s.snapshot);

  const [difficultyIndex, setDifficultyIndex] = useState(1);
  const difficulty = DIFFICULTIES[difficultyIndex];

  const [raceText, setRaceText] = useState('');
  const [raceKey, setRaceKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<Session | null>(null);
  const [playerWpm, setPlayerWpm] = useState(0);
  const [profileLevel, setProfileLevel] = useState(1);
  const [showSetup, setShowSetup] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    getProfile().then(p => {
      setProfileLevel(p.currentLevel || 1);
    });
  }, []);

  const pickRandomText = useCallback(() => {
    const texts = getTextsForDifficulty(difficulty);
    const t = texts[Math.floor(Math.random() * texts.length)];
    setRaceText(t);
  }, [difficulty]);

  useEffect(() => {
    pickRandomText();
    setRaceKey(k => k + 1);
  }, [difficultyIndex, pickRandomText]);

  const totalChars = raceText.length;

  // FIX: recompute bot speeds every new race (was: useState lazy init, only ran once ever).
  const bot1Wpm = useMemo(() => {
    const [min, max] = difficulty.botWpmRange;
    return min + Math.random() * (max - min) * 0.4;
  }, [raceKey, difficulty]);
  const bot2Wpm = useMemo(() => {
    const [min, max] = difficulty.botWpmRange;
    return min + Math.random() * (max - min) * 0.6;
  }, [raceKey, difficulty]);
  const bot3Wpm = useMemo(() => {
    const [min, max] = difficulty.botWpmRange;
    return min + Math.random() * (max - min) * 0.8;
  }, [raceKey, difficulty]);

  useEffect(() => {
    if (snapshot.state === 'typing' && !hasStarted) {
      setHasStarted(true);
      setShowSetup(false);
    }
  }, [snapshot.state, hasStarted]);

  useEffect(() => {
    if (snapshot.state === 'typing') {
      setPlayerWpm(snapshot.wpm);
    }
  }, [snapshot.wpm, snapshot.state]);

  const bot1Chars = useBotRacer(bot1Wpm, 3, totalChars, hasStarted, raceKey);
  const bot2Chars = useBotRacer(bot2Wpm, 4, totalChars, hasStarted, raceKey);
  const bot3Chars = useBotRacer(bot3Wpm, 5, totalChars, hasStarted, raceKey);

  const playerPct = totalChars > 0 ? Math.min((snapshot.cursorPosition / totalChars) * 100, 100) : 0;
  const bot1Pct = totalChars > 0 ? Math.min((bot1Chars / totalChars) * 100, 100) : 0;
  const bot2Pct = totalChars > 0 ? Math.min((bot2Chars / totalChars) * 100, 100) : 0;
  const bot3Pct = totalChars > 0 ? Math.min((bot3Chars / totalChars) * 100, 100) : 0;

  const handleComplete = useCallback((session: Session) => {
    setResult(session);
    setIsFinished(true);
  }, []);

  const playerFinished = snapshot.isComplete;

  const placements = [
    { id: 'player', pct: playerPct, finished: playerFinished },
    { id: 'bot3', pct: bot3Pct, finished: bot3Chars >= totalChars },
    { id: 'bot2', pct: bot2Pct, finished: bot2Chars >= totalChars },
    { id: 'bot1', pct: bot1Pct, finished: bot1Chars >= totalChars },
  ].sort((a, b) => b.pct - a.pct);

  const playerPosition = placements.findIndex(p => p.id === 'player') + 1;

  const startNewRace = () => {
    setHasStarted(false);
    setIsFinished(false);
    setResult(null);
    setPlayerWpm(0);
    setShowSetup(true);
    pickRandomText();
    setRaceKey(k => k + 1);
  };

  // FIX: race no longer snaps straight into typing — runs a 3-2-1-GO countdown first.
  const handleStartRace = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setShowSetup(false);
      const t = setTimeout(() => {
        const el = containerRef.current?.querySelector('.text-display') as HTMLElement;
        el?.click();
      }, 50);
      const clear = setTimeout(() => setCountdown(null), 500);
      return () => { clearTimeout(t); clearTimeout(clear); };
    }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 700);
    return () => clearTimeout(t);
  }, [countdown]);

  // FIX: prevent changing difficulty mid-race, which used to silently swap
  // the underlying race parameters while typing was in progress.
  const raceLocked = hasStarted && !isFinished;
  const diffUp = () => !raceLocked && setDifficultyIndex(i => Math.min(i + 1, DIFFICULTIES.length - 1));
  const diffDown = () => !raceLocked && setDifficultyIndex(i => Math.max(i - 1, 0));

  const medalColor = playerPosition === 1 ? '#facc15' : playerPosition === 2 ? '#cbd5e1' : playerPosition === 3 ? '#d97706' : 'var(--text-muted)';
  function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
  return (
    <main className="race-page">
      <div className="container" key={raceKey}>

        {/* Difficulty selector + Profile level */}
        <div className="race-controls">
          <div className="difficulty-selector">
            <button className="ctrl-arrow" onClick={diffDown} disabled={difficultyIndex <= 0 || raceLocked} aria-label="Lower difficulty">
              <ChevronUp size={16} style={{ transform: 'rotate(-90deg)' }} />
            </button>
            <div className="difficulty-display" style={{ borderColor: difficulty.color }}>
              <span className="diff-label" style={{ color: difficulty.color }}>{difficulty.label}</span>
              <span className="diff-speed">{difficulty.speedLabel}</span>
            </div>
            <button className="ctrl-arrow" onClick={diffUp} disabled={difficultyIndex >= DIFFICULTIES.length - 1 || raceLocked} aria-label="Higher difficulty">
              <ChevronUp size={16} style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>
          <div className="level-display">
            <Trophy size={14} />
            <span>Lv.{profileLevel}</span>
          </div>
        </div>

        {/* Live position indicator — reserves its own row so it never overlaps the track board */}
        <div className="live-position-slot">
          {hasStarted && !isFinished && (
            <div className="live-position animate-fade-in">
              <Medal size={14} style={{ color: medalColor }} />
              <span>You're in <strong style={{ color: medalColor }}>{ordinal(playerPosition)}</strong> place</span>
            </div>
          )}
        </div>

        {/* Tracks */}
        <div className="race-track-board">
          <div className="lane player-lane">
            <div className="lane-info">
              <span className="name">You</span>
              <span className="speed">{hasStarted ? playerWpm.toFixed(0) : '—'} <em>wpm</em></span>
            </div>
            <div className="track">
              <div className="track-lane-dashes" />
              <div className="finish-line" aria-hidden="true" />
              <div className="car-wrapper" style={{ left: `${playerPct}%` }}>
                <div className="car player-car"><Car size={20}/></div>
              </div>
            </div>
          </div>

          {[
            { pct: bot1Pct, name: 'Rookie', wpm: bot1Wpm, cls: 'bot-car' },
            { pct: bot2Pct, name: 'Racer', wpm: bot2Wpm, cls: 'bot-fast-car' },
            { pct: bot3Pct, name: 'Champion', wpm: bot3Wpm, cls: 'bot-pro-car' },
          ].map((bot, i) => (
            <div className="lane" key={i}>
              <div className="lane-info">
                <span className="name">{bot.name}</span>
                <span className="speed">{bot.wpm.toFixed(0)} <em>wpm</em></span>
              </div>
              <div className="track">
                <div className="track-lane-dashes" />
                <div className="finish-line" aria-hidden="true" />
                <div className="car-wrapper" style={{ left: `${bot.pct}%` }}>
                  <div className={`car ${bot.cls}`}><Car size={20}/></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Race area — TypingArea always mounted underneath; overlays sit on a fully opaque scrim so nothing bleeds through */}
        <div className="race-typing-area" ref={containerRef}>
          {showSetup && !hasStarted && countdown === null && (
            <div className="race-overlay animate-fade-in">
              <div className="setup-card">
                <div className="setup-icon"><Swords size={28} /></div>
                <h2>{difficulty.label} Race</h2>
                <p>Race against 3 bots. Fastest typist wins.</p>
                <div className="bot-preview">
                  {[
                    { wpm: bot1Wpm, name: 'Rookie' },
                    { wpm: bot2Wpm, name: 'Racer' },
                    { wpm: bot3Wpm, name: 'Champion' },
                  ].map((b, i) => (
                    <span key={i} className="bot-pill" style={{ borderColor: difficulty.color }}>
                      {b.name} <em>~{b.wpm.toFixed(0)} wpm</em>
                    </span>
                  ))}
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleStartRace}>
                  Start Race
                </button>
              </div>
            </div>
          )}

          {countdown !== null && (
            <div className="race-overlay" aria-live="assertive">
              <div className="start-lights">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={`light ${countdown > 0 && (3 - countdown) > i ? 'lit' : ''} ${countdown === 0 ? 'go' : ''}`}
                  />
                ))}
              </div>
              {countdown === 0 && <div className="go-label">GO</div>}
            </div>
          )}

          {isFinished && (
            <div className="race-overlay animate-fade-in">
              <div className="results-card">
                <div className={`result-badge ${playerPosition === 1 ? 'win' : 'lose'}`}>
                  <Medal size={16} style={{ color: medalColor }} />
                  {ordinal(playerPosition)} Place
                </div>
                <div className="score">
                  <span className="val">{result?.wpm.toFixed(0)}</span>
                  <span className="unit">wpm</span>
                </div>
                <div className="score-detail">
                  {result?.accuracy ? `${(result.accuracy * 100).toFixed(0)}% accuracy` : ''}
                </div>
                <button className="btn btn-primary btn-lg" onClick={startNewRace}>
                  Race Again
                </button>
              </div>
            </div>
          )}

          <TypingArea
            key={raceKey}
            language={language}
            mode="lesson"
            customText={raceText}
            onComplete={handleComplete}
          />
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
          gap: var(--space-md);
        }

        /* --- Controls --- */
        .race-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-lg);
          flex-wrap: wrap;
        }
        .difficulty-selector {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        .ctrl-arrow {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s, opacity 0.15s;
        }
        .ctrl-arrow:hover:not(:disabled) {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .ctrl-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .difficulty-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 22px;
          border: 2px solid;
          border-radius: var(--radius-lg);
          background: var(--bg-surface);
          min-width: 148px;
        }
        .diff-label {
          font-weight: 700;
          font-size: var(--text-sm);
          letter-spacing: 0.02em;
        }
        .diff-speed {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .level-display {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-accent);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 6px 12px;
        }

        /* --- Live position: fixed-height slot so its appearance never shifts layout below it --- */
        .live-position-slot {
          min-height: 30px;
          display: flex;
          justify-content: center;
        }
        .live-position {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          padding: 5px 14px;
          width: fit-content;
        }

        /* --- Track board --- */
        .race-track-board {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg) var(--space-lg) var(--space-lg) var(--space-md);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lane {
          display: grid;
          grid-template-columns: 92px 1fr;
          align-items: center;
          gap: var(--space-md);
        }
        .player-lane {
          background: var(--color-primary-glow);
          margin: -8px -8px 0 -8px;
          padding: 8px;
          border-radius: var(--radius-md);
        }
        .lane-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .name {
          font-weight: 700;
          font-size: var(--text-sm);
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .speed {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .speed em {
          font-style: normal;
          opacity: 0.65;
          margin-left: 2px;
        }

        /* Track: fixed side padding equal to half the car's footprint (16px) on each end,
           so the car (centered on its % position via transform) can never render outside
           the rounded track or collide with the finish marker. */
        .track {
          position: relative;
          height: 34px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 0 16px;
        }
        .track-lane-dashes {
          position: absolute;
          left: 16px;
          right: 28px;
          top: 50%;
          height: 0;
          border-top: 1px dashed var(--border-subtle);
          transform: translateY(-50%);
          pointer-events: none;
        }
        .finish-line {
          position: absolute;
          top: 3px;
          bottom: 3px;
          right: 10px;
          width: 4px;
          border-radius: 2px;
          background: repeating-linear-gradient(
            45deg,
            var(--text-muted) 0 3px,
            transparent 3px 6px
          );
          opacity: 0.5;
        }

        .car-wrapper {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.12s linear;
          z-index: 2;
        }
        .car {
          display: flex;
          background: var(--bg-surface);
          border-radius: 50%;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          color: var(--text-secondary);
        }
        .player-car {
          color: var(--color-primary);
          border: 2px solid var(--color-primary);
          box-shadow: 0 0 0 4px var(--color-primary-glow), 0 2px 8px rgba(0,0,0,0.2);
        }
        .bot-car { color: var(--color-accent); }
        .bot-fast-car { color: var(--color-warning); }
        .bot-pro-car { color: var(--color-error); }

        /* --- Race area / overlays --- */
        .race-typing-area {
          position: relative;
          min-height: 200px;
        }

        .race-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
        }

        /* Signature moment: F1-style start lights instead of a plain countdown number */
        .start-lights {
          display: flex;
          gap: 14px;
        }
        .light {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--bg-overlay);
          border: 2px solid var(--border-default);
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .light.lit {
          background: var(--color-error);
          border-color: var(--color-error);
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
        }
        .light.go {
          background: var(--color-success);
          border-color: var(--color-success);
          box-shadow: 0 0 16px rgba(52, 211, 153, 0.65);
        }
        .go-label {
          font-size: var(--text-lg);
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--color-success);
        }

        .setup-card, .results-card {
          text-align: center;
          padding: var(--space-xl) var(--space-2xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          max-width: 340px;
        }
        .setup-icon { color: var(--color-primary); }
        .setup-card h2 {
          font-size: var(--text-xl);
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }
        .setup-card p {
          margin: 0 0 var(--space-xs);
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }
        .bot-preview {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .bot-pill {
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 4px 10px;
          border: 1px solid;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          background: var(--bg-overlay);
          white-space: nowrap;
        }
        .bot-pill em { font-style: normal; opacity: 0.7; }

        .result-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-md);
          font-weight: 800;
          padding: 4px 16px;
          border-radius: var(--radius-full);
        }
        .result-badge.win {
          background: rgba(52, 211, 153, 0.15);
          color: var(--color-success);
        }
        .result-badge.lose {
          background: rgba(248, 113, 113, 0.15);
          color: var(--color-error);
        }
        .score {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-family: var(--font-mono);
        }
        .val {
          font-size: 2.75rem;
          font-weight: 800;
          color: var(--color-primary-light);
          font-variant-numeric: tabular-nums;
        }
        .unit {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .score-detail {
          font-size: var(--text-sm);
          color: var(--text-muted);
          min-height: 1.2em;
        }

        @media (max-width: 480px) {
          .lane { grid-template-columns: 72px 1fr; gap: var(--space-sm); }
        }
      `}</style>
    </main>
  );
}
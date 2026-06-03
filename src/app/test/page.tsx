'use client';

/**
 * VangaTypePanalam — 60-Second Timed Test Page
 *
 * Countdown timer with live WPM, then a shareable score card.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import TypingArea from '@/components/typing/TypingArea';
import { useUIStore } from '@/store/uiStore';
import type { Session, KeystrokeRecord } from '@/db/schema';
import { calculateKogasa } from '@/engine/statsCalculator';
import { Timer } from 'lucide-react';

const DURATIONS = [15, 30, 60, 120, 300] as const;
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

  // Reset timer when duration changes is now handled in changeDuration

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

  const pct = Math.round(((selectedDuration - secondsLeft) / selectedDuration) * 100);
  const timerColor = secondsLeft <= 10 ? 'var(--color-error)' : secondsLeft <= 20 ? 'var(--color-accent)' : 'var(--color-primary-light)';

  // Calculate session-end analytics
  const { weakKeys, slowKeys } = result ? getKeyAnalytics(result.keystrokeLog || []) : { weakKeys: [], slowKeys: [] };
  const chartData = result ? generateChartData(result.keystrokeLog || [], selectedDuration) : [];
  const peakWpm = chartData.length > 0 ? Math.max(...chartData.map(d => d.wpm)) : 0;
  const avgLatency = result && result.keystrokeLog && result.keystrokeLog.length > 0
    ? Math.round(result.keystrokeLog.reduce((sum, k) => sum + k.latencyMs, 0) / result.keystrokeLog.length)
    : 0;

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
                onClick={() => changeDuration(d)}
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
          <div className="results-dashboard animate-fade-in">
            <div className="results-meta">
              <span className="meta-tag">timed test</span>
              <span className="meta-tag">{selectedDuration}s</span>
              <span className="meta-tag">{language}</span>
            </div>

            <div className="results-main">
              {/* Left Column: Hero Stats */}
              <div className="stats-col">
                <div className="stat-hero">
                  <div className="hero-item wpm">
                    <span className="hero-value">{result.wpm.toFixed(0)}</span>
                    <span className="hero-label">wpm</span>
                  </div>
                  <div className="hero-item acc">
                    <span className="hero-value">{(result.accuracy * 100).toFixed(1)}%</span>
                    <span className="hero-label">accuracy</span>
                  </div>
                </div>

                <div className="stats-detailed-grid">
                  <div className="detailed-item">
                    <span className="detailed-label">raw speed</span>
                    <span className="detailed-value">{result.rawWpm.toFixed(0)} wpm</span>
                  </div>
                  <div className="detailed-item">
                    <span className="detailed-label">consistency</span>
                    <span className="detailed-value">
                      {Math.round(calculateKogasa((result.keystrokeLog || []).map(k => k.latencyMs)) * 100)}%
                    </span>
                  </div>
                  <div className="detailed-item">
                    <span className="detailed-label">avg latency</span>
                    <span className="detailed-value">{avgLatency} ms</span>
                  </div>
                  <div className="detailed-item">
                    <span className="detailed-label">peak speed</span>
                    <span className="detailed-value">{peakWpm} wpm</span>
                  </div>
                  <div className="detailed-item">
                    <span className="detailed-label">characters</span>
                    <span className="detailed-value">
                      {result.correctChars} / <span className="error-text">{result.errorChars}</span>
                    </span>
                  </div>
                  <div className="detailed-item">
                    <span className="detailed-label">time spent</span>
                    <span className="detailed-value">{selectedDuration}s</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Performance Graph */}
              <div className="chart-col">
                <PerformanceChart keystrokeLog={result.keystrokeLog || []} durationSeconds={selectedDuration} />
              </div>
            </div>

            {/* Key Analytics section */}
            {(weakKeys.length > 0 || slowKeys.length > 0) && (
              <div className="results-analytics">
                {weakKeys.length > 0 && (
                  <div className="analytics-box weak-box">
                    <h4 className="analytics-subtitle">Weakest Keys</h4>
                    <div className="keycaps-row">
                      {weakKeys.map(k => (
                        <div key={k.char} className="keycap-item weak-key">
                          <span className="keycap-letter">{k.char}</span>
                          <span className="keycap-info">{(k.accuracy * 100).toFixed(0)}% acc</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slowKeys.length > 0 && (
                  <div className="analytics-box slow-box">
                    <h4 className="analytics-subtitle">Slowest Keys</h4>
                    <div className="keycaps-row">
                      {slowKeys.map(k => (
                        <div key={k.char} className="keycap-item slow-key">
                          <span className="keycap-letter">{k.char}</span>
                          <span className="keycap-info">{Math.round(k.avgLatency)}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="dashboard-actions">
              <button className="dashboard-btn restart-btn" onClick={handleRestart} id="test-restart-btn">
                Try Again →
              </button>
              <button
                className="dashboard-btn share-btn"
                onClick={() => {
                  const text = `VangaTypePanalam | ${result.wpm.toFixed(0)} WPM · ${(result.accuracy * 100).toFixed(1)}% accuracy · ${selectedDuration}s test`;
                  navigator.clipboard?.writeText(text);
                }}
                id="copy-score-btn"
              >
                Copy Scorecard
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
        /* ── Results Dashboard ── */
        .results-dashboard {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          box-shadow: var(--shadow-lg);
        }

        .results-meta {
          display: flex;
          gap: var(--space-xs);
          margin-bottom: var(--space-lg);
        }

        .meta-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: var(--bg-overlay);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          padding: 3px 10px;
          border-radius: 6px;
          font-family: var(--font-mono);
        }

        .results-main {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: var(--space-xl);
          align-items: center;
          margin-bottom: var(--space-xl);
        }

        .stats-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .stat-hero {
          display: flex;
          gap: var(--space-xl);
        }

        .hero-item {
          display: flex;
          flex-direction: column;
        }

        .hero-value {
          font-size: 4.5rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-family: var(--font-mono);
        }

        .wpm .hero-value {
          color: var(--color-primary-light);
          text-shadow: 0 0 24px rgba(129, 140, 248, 0.15);
        }

        .acc .hero-value {
          color: var(--color-success);
        }

        .hero-label {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .stats-detailed-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md) var(--space-lg);
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-md);
        }

        .detailed-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detailed-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }

        .detailed-value {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .error-text {
          color: var(--color-error);
        }

        .chart-col {
          border-left: 1px solid var(--border-subtle);
          padding-left: var(--space-xl);
          width: 100%;
          min-height: 240px;
        }

        .chart-wrapper {
          width: 100%;
          position: relative;
        }

        .performance-svg {
          overflow: visible;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: var(--space-lg);
          margin-top: var(--space-md);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .wpm-dot {
          background: var(--color-primary);
          box-shadow: 0 0 8px var(--color-primary-glow);
        }

        .raw-dot {
          background: var(--text-muted);
          border: 1px dashed rgba(255, 255, 255, 0.4);
        }

        .error-dot {
          background: var(--color-error);
        }

        .legend-text {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* ── Key Analytics ── */
        .results-analytics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-xl);
          margin-top: var(--space-xl);
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-xl);
        }

        .analytics-box {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .analytics-subtitle {
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .keycaps-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .keycap-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 6px 12px;
          font-family: var(--font-mono);
          box-shadow: var(--shadow-sm);
          transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .keycap-item:hover {
          transform: translateY(-2px);
          border-color: var(--border-focus);
        }

        .keycap-letter {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.05);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border-bottom: 2px solid var(--border-default);
        }

        .keycap-info {
          font-size: 11px;
          font-weight: 600;
        }

        .weak-key .keycap-info {
          color: var(--color-error-light);
        }

        .slow-key .keycap-info {
          color: var(--color-accent-light);
        }

        .dashboard-actions {
          display: flex;
          gap: var(--space-md);
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-lg);
          justify-content: flex-start;
          margin-top: var(--space-xl);
        }

        .dashboard-btn {
          padding: 11px 22px;
          font-size: var(--text-sm);
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
        }

        .restart-btn {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
        }

        .restart-btn:hover {
          background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .share-btn {
          background: var(--bg-overlay);
          color: var(--text-secondary);
          border: 1px solid var(--border-default);
        }

        .share-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .results-main {
            grid-template-columns: 1fr;
          }
          .chart-col {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid var(--border-subtle);
            padding-top: var(--space-xl);
          }
          .results-analytics {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }
          .dashboard-actions {
            justify-content: center;
          }
          .test-header {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}

// ── Chart Data generator and SVG Component ──

interface ChartDataPoint {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

function generateChartData(keystrokeLog: KeystrokeRecord[], durationSeconds: number): ChartDataPoint[] {
  const dataPoints: ChartDataPoint[] = [];
  if (!keystrokeLog || keystrokeLog.length === 0) return [];

  let cumulativeMs = 0;
  const keystrokeTimes = keystrokeLog.map((k) => {
    cumulativeMs += k.latencyMs;
    return {
      timeMs: cumulativeMs,
      correct: k.correct,
    };
  });

  const totalDurationSeconds = durationSeconds > 0 ? durationSeconds : Math.ceil(cumulativeMs / 1000);

  for (let sec = 1; sec <= totalDurationSeconds; sec++) {
    const timeLimitMs = sec * 1000;
    
    const totalUpToSec = keystrokeTimes.filter(k => k.timeMs <= timeLimitMs).length;
    const correctUpToSec = keystrokeTimes.filter(k => k.timeMs <= timeLimitMs && k.correct).length;
    
    const errorsInSec = keystrokeTimes.filter(
      k => k.timeMs > (sec - 1) * 1000 && k.timeMs <= timeLimitMs && !k.correct
    ).length;

    const wpm = sec > 0 ? Math.round((correctUpToSec * 12) / sec) : 0;
    const rawWpm = sec > 0 ? Math.round((totalUpToSec * 12) / sec) : 0;

    dataPoints.push({
      second: sec,
      wpm,
      rawWpm,
      errors: errorsInSec,
    });
  }

  return dataPoints;
}

function PerformanceChart({ keystrokeLog = [], durationSeconds }: { keystrokeLog?: KeystrokeRecord[], durationSeconds: number }) {
  const data = generateChartData(keystrokeLog, durationSeconds);
  if (data.length === 0) return null;

  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxWpmVal = Math.max(...data.map(d => Math.max(d.wpm, d.rawWpm)));
  const maxWpm = Math.max(60, Math.ceil(maxWpmVal / 20) * 20);

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (value: number) => {
    return paddingTop + plotHeight - (value / maxWpm) * plotHeight;
  };

  let wpmPath = '';
  let rawWpmPath = '';
  let areaPath = '';

  data.forEach((d, i) => {
    const x = getX(i);
    const yWpm = getY(d.wpm);
    const yRaw = getY(d.rawWpm);

    if (i === 0) {
      wpmPath = `M ${x} ${yWpm}`;
      rawWpmPath = `M ${x} ${yRaw}`;
      areaPath = `M ${x} ${paddingTop + plotHeight} L ${x} ${yWpm}`;
    } else {
      wpmPath += ` L ${x} ${yWpm}`;
      rawWpmPath += ` L ${x} ${yRaw}`;
      areaPath += ` L ${x} ${yWpm}`;
    }

    if (i === data.length - 1) {
      areaPath += ` L ${x} ${paddingTop + plotHeight} Z`;
    }
  });

  const gridLinesY: number[] = [];
  for (let val = 20; val <= maxWpm; val += 20) {
    gridLinesY.push(val);
  }

  const tickStep = Math.max(1, Math.ceil(data.length / 6));
  const ticksX = data.filter((_, i) => i % tickStep === 0 || i === data.length - 1);

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="performance-svg" width="100%" height="100%">
        <defs>
          <linearGradient id="wpmAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {gridLinesY.map((val) => {
          const y = getY(val);
          return (
            <g key={val} className="grid-line-group">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                {val}
              </text>
            </g>
          );
        })}

        <line
          x1={paddingLeft}
          y1={paddingTop + plotHeight}
          x2={width - paddingRight}
          y2={paddingTop + plotHeight}
          stroke="var(--border-default)"
          strokeWidth="1"
        />

        {ticksX.map((d, i) => {
          const dataIndex = data.findIndex(pt => pt.second === d.second);
          const x = getX(dataIndex);
          return (
            <text
              key={d.second}
              x={x}
              y={paddingTop + plotHeight + 15}
              fill="var(--text-muted)"
              fontSize="9"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
            >
              {d.second}s
            </text>
          );
        })}

        {areaPath && (
          <path d={areaPath} fill="url(#wpmAreaGrad)" />
        )}

        {rawWpmPath && (
          <path
            d={rawWpmPath}
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        )}

        {wpmPath && (
          <path
            d={wpmPath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {data.map((d, i) => {
          if (d.errors === 0) return null;
          const x = getX(i);
          const y = paddingTop + plotHeight - 4;
          const radius = Math.min(5, 2 + d.errors * 0.8);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={radius}
              fill="var(--color-error)"
              opacity="0.8"
            />
          );
        })}
      </svg>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color-dot wpm-dot" />
          <span className="legend-text">WPM</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot raw-dot" />
          <span className="legend-text">Raw Speed</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot error-dot" />
          <span className="legend-text">Errors</span>
        </div>
      </div>
    </div>
  );
}

function getKeyAnalytics(keystrokeLog: KeystrokeRecord[]) {
  const statsMap: Record<string, { total: number; correct: number; latencySum: number }> = {};
  
  (keystrokeLog || []).forEach(k => {
    const char = k.char.toLowerCase();
    if (char === ' ' || char === 'enter' || char === 'backspace' || char.length !== 1) return;
    
    if (!statsMap[char]) {
      statsMap[char] = { total: 0, correct: 0, latencySum: 0 };
    }
    statsMap[char].total++;
    if (k.correct) statsMap[char].correct++;
    statsMap[char].latencySum += k.latencyMs;
  });

  const keyStats = Object.entries(statsMap).map(([char, s]) => {
    const accuracy = s.total > 0 ? s.correct / s.total : 1;
    const avgLatency = s.total > 0 ? s.latencySum / s.total : 0;
    return { char, accuracy, avgLatency, errors: s.total - s.correct };
  });

  const weakKeys = keyStats
    .filter(k => k.accuracy < 0.9 && k.errors > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  const slowKeys = keyStats
    .filter(k => k.avgLatency > 50)
    .sort((a, b) => b.avgLatency - a.avgLatency)
    .slice(0, 5);

  return { weakKeys, slowKeys };
}

// ── Thin wrapper that listens to first keypress and timeUp ──
function TimedTypingWrapper({
  language,
  durationSeconds,
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

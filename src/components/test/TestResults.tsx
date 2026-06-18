'use client';

import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { Session } from '@/db/schema';
import { calculateKogasa } from '@/engine/statsCalculator';
import { SessionAreaChart } from '@/components/test/SessionAreaChart';
import { SessionRadarChart } from '@/components/test/SessionRadarChart';
import { SessionComposedChart } from '@/components/test/SessionComposedChart';
import { generateChartData, getKeyAnalytics, getGradeColor } from './chartUtils';
import { TestGrade } from './TestGrade';
import { MetricCard } from './MetricCard';

interface TestResultsProps {
  result: Session;
  selectedDuration: number;
  onRestart: () => void;
}

function AnimatedWpm({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 600;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <>{display}</>;
}

export function TestResults({ result, selectedDuration, onRestart }: TestResultsProps) {
  const { language } = useUIStore();
  const [copied, setCopied] = useState(false);

  const { weakKeys, slowKeys } = getKeyAnalytics(result.keystrokeLog || []);
  const chartData = generateChartData(result.keystrokeLog || [], selectedDuration);
  const peakWpm = chartData.length > 0 ? Math.max(...chartData.map(d => d.wpm)) : 0;
  const avgLatency =
    result && result.keystrokeLog && result.keystrokeLog.length > 0
      ? Math.round(
          result.keystrokeLog.reduce((sum, k) => sum + k.latencyMs, 0) / result.keystrokeLog.length
        )
      : 0;

  const sparklineData = chartData.map(d => ({ value: d.wpm }));
  const rawSparkline = chartData.map(d => ({ value: d.rawWpm }));
  const latencySparkline = (result.keystrokeLog || []).map(k => ({ value: k.latencyMs }));

  const handleCopy = () => {
    const text = `VangaTypePanalam | ${result.wpm.toFixed(0)} WPM · ${(result.accuracy * 100).toFixed(1)}% accuracy · ${selectedDuration}s test`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRestart();
    }
  };

  return (
    <div className="results-content animate-slide-up" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="results-meta">
        <span className="meta-tag">timed test</span>
        <span className="meta-tag">{selectedDuration}s</span>
        <span className="meta-tag">{language}</span>
        <TestGrade wpm={result.wpm} />
      </div>

      <div className="results-hero-row">
        <div className="hero-wpm-section">
          <div className="hero-wpm-value" style={{ color: getGradeColor(result.wpm) }}>
            <span className="hero-wpm-number">
              <AnimatedWpm target={Math.round(result.wpm)} />
            </span>
            <span className="hero-wpm-unit">wpm</span>
          </div>
          <div className="hero-accuracy">
            <svg className="acc-ring" viewBox="0 0 36 36" width="48" height="48">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 15.9}`}
                strokeDashoffset={`${2 * Math.PI * 15.9 * (1 - result.accuracy)}`}
                transform="rotate(-90 18 18)"
                strokeLinecap="round"
              />
            </svg>
            <span className="hero-acc-text">{(result.accuracy * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="metric-cards-grid">
        <MetricCard
          label="Raw Speed"
          value={`${result.rawWpm.toFixed(0)} wpm`}
          data={rawSparkline}
          color="var(--color-accent)"
        />
        <MetricCard
          label="Consistency"
          value={`${Math.round(calculateKogasa((result.keystrokeLog || []).map(k => k.latencyMs)) * 100)}%`}
          data={sparklineData}
          color="var(--color-primary-light)"
        />
        <MetricCard
          label="Avg Latency"
          value={`${avgLatency} ms`}
          data={latencySparkline}
          color="var(--color-warning)"
        />
        <MetricCard
          label="Peak Speed"
          value={`${peakWpm} wpm`}
          data={sparklineData}
          color="var(--color-success)"
        />
        <MetricCard
          label="Characters"
          value={`${result.correctChars} / ${result.errorChars}`}
          color="var(--color-primary)"
        />
        <MetricCard
          label="Time Spent"
          value={`${selectedDuration}s`}
          color="var(--text-muted)"
        />
      </div>

      <div className="results-charts-section">
        <SessionAreaChart data={chartData} />
      </div>

      <div className="results-charts-row">
        <div className="composed-chart-col">
          <SessionComposedChart data={chartData} />
        </div>
        <div className="radar-chart-col">
          <SessionRadarChart
            wpm={result.wpm}
            accuracy={result.accuracy}
            rawWpm={result.rawWpm}
            keystrokeLog={result.keystrokeLog || []}
            correctChars={result.correctChars}
            errorChars={result.errorChars}
            totalChars={result.totalChars}
          />
        </div>
      </div>

      {(weakKeys.length > 0 || slowKeys.length > 0) && (
        <div className="key-analytics-row">
          {weakKeys.length > 0 && (
            <div className="analytics-box weak-box">
              <h4 className="analytics-subtitle">Weakest Keys</h4>
              <div className="keycaps-row">
                {weakKeys.map((k, i) => {
                  const intensity = 1 - (i / weakKeys.length) * 0.5;
                  return (
                    <div
                      key={k.char}
                      className="keycap-item weak-key"
                      style={{ opacity: intensity }}
                    >
                      <span className="keycap-letter">{k.char}</span>
                      <span className="keycap-info">{(k.accuracy * 100).toFixed(0)}% acc</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {slowKeys.length > 0 && (
            <div className="analytics-box slow-box">
              <h4 className="analytics-subtitle">Slowest Keys</h4>
              <div className="keycaps-row">
                {slowKeys.map((k, i) => {
                  const intensity = 1 - (i / slowKeys.length) * 0.5;
                  return (
                    <div
                      key={k.char}
                      className="keycap-item slow-key"
                      style={{ opacity: intensity }}
                    >
                      <span className="keycap-letter">{k.char}</span>
                      <span className="keycap-info">{Math.round(k.avgLatency)}ms</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-actions">
        <button className="dashboard-btn restart-btn" onClick={onRestart} id="test-restart-btn">
          Try Again <span className="shortcut-hint">↵</span>
        </button>
        <button
          className="dashboard-btn share-btn"
          onClick={handleCopy}
          id="copy-score-btn"
        >
          {copied ? 'Copied!' : 'Copy Scorecard'}
        </button>
      </div>
    </div>
  );
}

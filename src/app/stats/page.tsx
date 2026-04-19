'use client';

/**
 * VangaTypePanalam — Profile & Statistics Page
 *
 * Designed to mimic Keybr's minimalist layout.
 * Features: All Time vs Today Stats, Key Mastery Scatter Chart, and Keyboard Heatmap.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/store/uiStore';
import { getAllSessions } from '@/db/sessions';
import { getKeyStatsByLanguage } from '@/db/keyStats';
import { getProfile } from '@/db/profile';
import { formatDuration, getLocalDateString } from '@/engine/statsCalculator';
import type { Session, KeyStat, UserProfile } from '@/db/schema';
import '@/styles/keyboard.css';
import { QWERTY_LAYOUT } from '@/data/keyboards/qwerty';
import { TAMIL99_LAYOUT } from '@/data/keyboards/tamil99';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface StatBuckets {
  allTime: { timeMs: number; sessions: number; topSpeed: number; avgSpeed: number };
  today: { timeMs: number; sessions: number; topSpeed: number; avgSpeed: number };
}

// ─────────────────────────────────────────────
// ProfilePage
// ─────────────────────────────────────────────

export default function ProfilePage() {
  const { language } = useUIStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [keyStats, setKeyStats] = useState<KeyStat[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'speed' | 'heatmap'>('speed');

  // useCallback so the function reference is stable for the effect dep array
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [_sessions, _keyStats, _profile] = await Promise.all([
        getAllSessions(),
        getKeyStatsByLanguage(language),
        getProfile(),
      ]);
      setSessions(_sessions.filter((s) => s.language === language));
      setKeyStats(_keyStats);
      setProfile(_profile);
    } catch {
      // Silently ignore IDB / SSR errors
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const stats = useMemo<StatBuckets>(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const result: StatBuckets = {
      allTime: { timeMs: 0, sessions: 0, topSpeed: 0, avgSpeed: 0 },
      today: { timeMs: 0, sessions: 0, topSpeed: 0, avgSpeed: 0 },
    };

    let allTimeSpeedSum = 0;
    let todaySpeedSum = 0;

    for (const s of sessions) {
      result.allTime.sessions++;
      result.allTime.timeMs += s.durationMs;
      if (s.wpm > result.allTime.topSpeed) result.allTime.topSpeed = s.wpm;
      allTimeSpeedSum += s.wpm;

      if (s.startedAt >= startOfTodayMs) {
        result.today.sessions++;
        result.today.timeMs += s.durationMs;
        if (s.wpm > result.today.topSpeed) result.today.topSpeed = s.wpm;
        todaySpeedSum += s.wpm;
      }
    }

    if (result.allTime.sessions > 0)
      result.allTime.avgSpeed = Math.round(allTimeSpeedSum / result.allTime.sessions);
    if (result.today.sessions > 0)
      result.today.avgSpeed = Math.round(todaySpeedSum / result.today.sessions);

    return result;
  }, [sessions]);

  // ── Heatmap colour map ───────────────────────────────────────────────────
  const heatmapColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const ks of keyStats) {
      const hue = ks.confidence * 120; // 0 (red) → 120 (green) in HSL
      map.set(ks.char, `hsl(${hue}, 70%, 50%)`);
    }
    return map;
  }, [keyStats]);

  // ── Sorted keys for charts ───────────────────────────────────────────────
  const sortedKeys = useMemo(
    () => [...keyStats].sort((a, b) => b.confidence - a.confidence),
    [keyStats],
  );

  if (loading) {
    return <div className="layout-loading">Loading Profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-title">Typist Profile</h1>
        <p className="profile-subtitle">Track your typing mastery</p>
      </div>

      {/* ── Overview Statistics Row ── */}
      <div className="stats-row">
        <StatCard title="All Time Statistics" bucket={stats.allTime} />
        <StatCard title="Statistics for Today" bucket={stats.today} />
      </div>

      {/* ── Daily Activity Heatmap ── */}
      <div className="activity-section">
        <h2 className="card-title">Daily Practice Activity</h2>
        <ActivityHeatmap activity={profile?.dailyActivity ?? {}} />
      </div>

      {/* ── Detailed Analytics ── */}
      <div className="analytics-section">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'speed' ? 'active' : ''}`}
            onClick={() => setActiveTab('speed')}
          >
            Key Mastery Chart
          </button>
          <button
            className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            Key Frequency Heatmap
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'speed' && (
            <div className="scatter-chart-container">
              {sortedKeys.length === 0 ? (
                <div className="empty-state">No typing data recorded yet.</div>
              ) : (
                <KeyScatterPlot keyStats={sortedKeys} />
              )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="heatmap-container">
              <p className="heatmap-desc">
                Keys are colored based on your mastery (Red = Slow/Errors, Green = Fast/Accurate).
              </p>
              <div className="heatmap-keyboard-wrapper">
                <HeatmapKeyboard language={language} colors={heatmapColors} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scoped CSS */}
      <style jsx>{`
        .profile-container {
          padding: var(--space-xl) 0;
          font-family: var(--font-sans);
          color: var(--text-primary);
          max-width: 900px;
          margin: 0 auto;
        }
        .profile-header {
          margin-bottom: var(--space-2xl);
        }
        .profile-title {
          font-size: var(--text-3xl);
          font-weight: 800;
          margin-bottom: 0;
        }
        .profile-subtitle {
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .layout-loading {
          text-align: center;
          padding: var(--space-3xl);
          color: var(--text-muted);
        }
        .stats-row {
          display: flex;
          gap: var(--space-xl);
          margin-bottom: var(--space-2xl);
        }
        .card-title {
          font-size: var(--text-lg);
          font-weight: 700;
          border-bottom: 2px solid var(--border-default);
          padding-bottom: var(--space-xs);
          margin-bottom: var(--space-md);
        }
        .tabs-container {
          display: flex;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border-default);
        }
        .tab-btn {
          background: none;
          border: none;
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-base);
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-weight: 600;
        }
        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }
        .tab-content { padding: var(--space-md) 0; }
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--text-muted);
        }
        .heatmap-container { text-align: center; }
        .heatmap-desc {
          color: var(--text-muted);
          font-size: var(--text-sm);
          margin-bottom: var(--space-xl);
        }
        @media (max-width: 768px) {
          .stats-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// StatCard — extracted to remove JSX repetition
// ─────────────────────────────────────────────

function StatCard({
  title,
  bucket,
}: {
  title: string;
  bucket: StatBuckets['allTime'];
}) {
  return (
    <div className="stats-card">
      <h2 className="card-title">{title}</h2>
      <div className="stat-grid">
        {(
          [
            ['Time spent', formatDuration(bucket.timeMs)],
            ['Sessions count', bucket.sessions],
            ['Top speed', `${bucket.topSpeed} wpm`],
            ['Average speed', `${bucket.avgSpeed} wpm`],
          ] as [string, string | number][]
        ).map(([label, value]) => (
          <div key={label} className="stat-item">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .stats-card { flex: 1; }
        .card-title {
          font-size: var(--text-lg);
          font-weight: 700;
          border-bottom: 2px solid var(--border-default);
          padding-bottom: var(--space-xs);
          margin-bottom: var(--space-md);
        }
        .stat-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-label {
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .stat-value {
          font-family: var(--font-mono);
          font-size: var(--text-base);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// KeyScatterPlot
// X-axis: total attempts  |  Y-axis: confidence
// Quadrant shading tells the full story at a glance.
// ─────────────────────────────────────────────

function KeyScatterPlot({ keyStats }: { keyStats: KeyStat[] }) {
  const [hovered, setHovered] = useState<KeyStat | null>(null);

  const W = 600;
  const H = 340;
  const PAD = { top: 20, right: 20, bottom: 48, left: 48 } as const;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Precompute max once — never changes while component is mounted with same keyStats
  const maxAttempts = useMemo(
    () => Math.max(...keyStats.map((k) => k.totalAttempts), 1),
    [keyStats],
  );

  const toX = (attempts: number) => (attempts / maxAttempts) * plotW;
  const toY = (conf: number) => plotH - conf * plotH; // flip: high confidence = top

  const midX = plotW / 2;
  const midY = plotH / 2;

  const quadrantLabel = (ks: KeyStat): string => {
    const x = toX(ks.totalAttempts);
    const y = toY(ks.confidence);
    if (x >= midX && y <= midY) return '✅ Mastered';
    if (x < midX && y <= midY) return '🌱 Emerging';
    if (x >= midX && y > midY) return '⚠️ Needs Work';
    return '🔒 Unpracticed';
  };

  const GRID_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

  return (
    <div className="scatter-wrap">
      {/* Y-axis label */}
      <div className="axis-label axis-y">Confidence →</div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="scatter-svg"
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
      >
        <g transform={`translate(${PAD.left}, ${PAD.top})`}>

          {/* ── Quadrant shading ── */}
          <rect x={0} y={0} width={midX} height={midY} fill="hsl(200,40%,50%)" opacity={0.05} />
          <rect x={midX} y={0} width={midX} height={midY} fill="hsl(120,60%,40%)" opacity={0.06} />
          <rect x={0} y={midY} width={midX} height={midY} fill="hsl(0,0%,50%)" opacity={0.04} />
          <rect x={midX} y={midY} width={midX} height={midY} fill="hsl(0,70%,50%)" opacity={0.05} />

          {/* ── Quadrant labels ── */}
          <text x={midX + 8} y={12} fontSize={9} fill="hsl(120,50%,45%)" opacity={0.7}>Mastered</text>
          <text x={8} y={12} fontSize={9} fill="hsl(200,50%,55%)" opacity={0.7}>Emerging</text>
          <text x={midX + 8} y={midY + 14} fontSize={9} fill="hsl(0,60%,55%)" opacity={0.7}>Needs Work</text>
          <text x={8} y={midY + 14} fontSize={9} fill="hsl(0,0%,55%)" opacity={0.6}>Unpracticed</text>

          {/* ── Grid lines + tick labels ── */}
          {GRID_TICKS.map((t) => {
            const y = toY(t);
            const x = t * plotW;
            return (
              <g key={t}>
                {/* Horizontal */}
                <line x1={0} x2={plotW} y1={y} y2={y}
                  stroke="var(--border-default)" strokeWidth={0.5} strokeDasharray="3,3" />
                <text x={-6} y={y + 4} fontSize={9} fill="var(--text-muted)" textAnchor="end">
                  {(t * 100).toFixed(0)}
                </text>
                {/* Vertical */}
                <line x1={x} x2={x} y1={0} y2={plotH}
                  stroke="var(--border-default)" strokeWidth={0.5} strokeDasharray="3,3" />
                <text x={x} y={plotH + 14} fontSize={9} fill="var(--text-muted)" textAnchor="middle">
                  {Math.round(t * maxAttempts)}
                </text>
              </g>
            );
          })}

          {/* ── Axes ── */}
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="var(--border-default)" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={plotH} stroke="var(--border-default)" strokeWidth={1} />

          {/* ── Data points ── */}
          {keyStats.map((ks) => {
            const cx = toX(ks.totalAttempts);
            const cy = toY(ks.confidence);
            const hue = ks.confidence * 120;
            const isHovered = ks === hovered;
            const r = isHovered ? 10 : 7;

            return (
              <g
                key={ks.char}
                transform={`translate(${cx}, ${cy})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(ks)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow ring on hover */}
                {isHovered && (
                  <circle r={14} fill={`hsl(${hue},70%,55%)`} opacity={0.2} />
                )}
                <circle
                  r={r}
                  fill={`hsl(${hue},70%,50%)`}
                  stroke={isHovered ? 'white' : `hsl(${hue},70%,35%)`}
                  strokeWidth={isHovered ? 1.5 : 1}
                  style={{ transition: 'r 0.15s ease' }}
                />
                <text
                  y={1}
                  fontSize={isHovered ? 8 : 7}
                  fontWeight="700"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {ks.char.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* X-axis label */}
      <div className="axis-label axis-x">Total Attempts →</div>

      {/* Hover tooltip card (inline, top-right corner) */}
      {hovered && (
        <div className="scatter-tooltip">
          <span className="tt-key">{hovered.char.toUpperCase()}</span>
          <span className="tt-stat">Confidence: <strong>{(hovered.confidence * 100).toFixed(1)}%</strong></span>
          <span className="tt-stat">Attempts: <strong>{hovered.totalAttempts}</strong></span>
          <span className="tt-quad">{quadrantLabel(hovered)}</span>
        </div>
      )}

      <style jsx>{`
        .scatter-wrap {
          position: relative;
          padding-left: 20px;
        }
        .scatter-svg {
          display: block;
          overflow: visible;
        }
        .axis-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .axis-y {
          writing-mode: vertical-rl;
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) rotate(180deg);
        }
        .axis-x {
          text-align: center;
          margin-top: 4px;
        }
        .scatter-tooltip {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          min-width: 150px;
          pointer-events: none;
        }
        .tt-key {
          font-family: var(--font-mono);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
        .tt-stat {
          font-size: 12px;
          color: var(--text-muted);
        }
        .tt-stat strong { color: var(--text-primary); }
        .tt-quad {
          font-size: 11px;
          margin-top: 2px;
          font-weight: 600;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// HeatmapKeyboard
// Static, game-logic-free keyboard for the colour overlay.
// ─────────────────────────────────────────────

function HeatmapKeyboard({
  language,
  colors,
}: {
  language: string;
  colors: Map<string, string>;
}) {
  const layout = language === 'ta' ? TAMIL99_LAYOUT : QWERTY_LAYOUT;

  return (
    <div className="vk-heatmap">
      {layout.map((row, rIdx) => (
        <div key={rIdx} className="vk-row">
          {row.map((keyData, kIdx) => {
            if (keyData.isModifier || keyData.key === ' ') {
              return (
                <div
                  key={kIdx}
                  className="vk-key modifier"
                  style={{ width: keyData.width ? `${keyData.width * 42}px` : '42px' }}
                >
                  {keyData.label}
                </div>
              );
            }

            const char = keyData.key.toLowerCase();
            const bgColor = colors.get(char) ?? 'var(--key-bg)';

            return (
              <div
                key={kIdx}
                className="vk-key active"
                style={{
                  backgroundColor: bgColor,
                  color: colors.has(char) ? 'white' : 'var(--text-muted)',
                }}
              >
                <span className="vk-label">{keyData.label}</span>
              </div>
            );
          })}
        </div>
      ))}

      <style jsx>{`
        .vk-heatmap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
          padding: 20px;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
        }
        .vk-row { display: flex; gap: 2px; }
        .vk-key {
          height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .modifier {
          background: var(--bg-overlay);
          color: var(--text-muted);
          font-size: 0.7rem;
        }
        .active {
          position: relative;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// ActivityHeatmap — GitHub-style 52-week grid
// ─────────────────────────────────────────────

function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const [hoverInfo, setHoverInfo] = useState<{
    x: number; y: number; text: string; date: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 52 }, (_, wOffset) => {
      const w = 51 - wOffset;
      return Array.from({ length: 7 }, (_, dOffset) => {
        const d = 6 - dOffset;
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + d));
        const dayStr = getLocalDateString(date);
        return { date: dayStr, dateObj: date, durationMs: activity[dayStr] ?? 0 };
      });
    });
  }, [activity]);

  // Stable colour helper — no new function per render
  const getColor = (ms: number): string => {
    const mins = ms / 60_000;
    if (mins === 0) return 'var(--bg-overlay)';
    if (mins < 15) return '#c6e48b';
    if (mins < 30) return '#7bc96f';
    if (mins < 40) return '#239a3b';
    return '#ffd700';
  };

  const handleMouseEnter = (e: React.MouseEvent, date: string, ms: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const formatted = ms > 0 ? `${formatDuration(ms)} practiced` : 'No practice';
    setHoverInfo({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text: formatted,
      date,
    });
  };

  const handleMouseLeave = () => setHoverInfo(null);

  return (
    <div className="heatmap-card animate-fade-in">
      <div className="heatmap-scroll-container">

        {/* Day-of-week labels (Y-axis) */}
        <div className="day-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        <div className="heatmap-matrix">
          {/* Month labels (X-axis) */}
          <div className="month-labels">
            {weeks.map((week, idx) => {
              const firstDay = week[0].dateObj;
              if (firstDay.getDate() <= 7 && idx > 0) {
                return (
                  <span
                    key={idx}
                    className="month-label"
                    style={{ left: `${idx * 16}px` }}
                  >
                    {firstDay.toLocaleString('default', { month: 'short' })}
                  </span>
                );
              }
              return null;
            })}
          </div>

          <div className="weeks-container">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="week-col">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(day.durationMs) }}
                    onMouseEnter={(e) => handleMouseEnter(e, day.date, day.durationMs)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: legend */}
      <div className="heatmap-footer">
        <a href="#" className="heatmap-link">Learn how our goals work</a>
        <div className="heatmap-legend">
          <span className="legend-text">Less</span>
          {(['var(--bg-overlay)', '#c6e48b', '#7bc96f', '#239a3b', '#ffd700'] as const).map(
            (color) => (
              <div key={color} className="legend-cell" style={{ backgroundColor: color }} />
            ),
          )}
          <span className="legend-text" style={{ color: '#d97706', fontWeight: 'bold' }}>
            Mastery
          </span>
        </div>
      </div>

      {/* Portal tooltip */}
      {mounted && hoverInfo &&
        createPortal(
          <div
            className="custom-tooltip"
            style={{ top: hoverInfo.y, left: hoverInfo.x }}
          >
            <strong>{hoverInfo.text}</strong>
            <span className="tooltip-date">on {hoverInfo.date}</span>
          </div>,
          document.body,
        )}

      <style jsx>{`
        .heatmap-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          padding-bottom: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        .heatmap-scroll-container {
          display: flex;
          overflow-x: auto;
          padding-bottom: var(--space-md);
        }
        .heatmap-scroll-container::-webkit-scrollbar { height: 6px; }
        .heatmap-scroll-container::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 10px;
        }
        .day-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-top: 24px;
          padding-right: 8px;
          color: var(--text-muted);
          font-size: 10px;
          height: 105px;
        }
        .day-labels span:nth-child(1) { margin-top: 14px; }
        .day-labels span:nth-child(2) { margin-top: 20px; }
        .day-labels span:nth-child(3) { margin-top: 20px; }
        .heatmap-matrix {
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .month-labels {
          position: relative;
          height: 20px;
          font-size: 10px;
          color: var(--text-muted);
        }
        .month-label { position: absolute; top: 0; }
        .weeks-container { display: flex; gap: 4px; }
        .week-col { display: flex; flex-direction: column; gap: 4px; }
        .heatmap-cell {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          cursor: crosshair;
          transition: transform 0.1s;
        }
        .heatmap-cell:hover {
          transform: scale(1.3);
          z-index: 2;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .heatmap-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-md);
        }
        .heatmap-link {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-decoration: none;
        }
        .heatmap-link:hover { color: var(--color-primary); }
        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .legend-text { font-size: var(--text-xs); color: var(--text-muted); }
        .legend-cell { width: 12px; height: 12px; border-radius: 3px; }
      `}</style>

      <style jsx global>{`
        .custom-tooltip {
          position: fixed;
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          pointer-events: none;
          transform: translate(-50%, -100%);
          z-index: 1000;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .tooltip-date {
          color: var(--text-muted);
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}
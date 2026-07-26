'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/store/uiStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { getAllSessions } from '@/db/sessions';
import { getKeyStatsByLanguage } from '@/db/keyStats';
import { getProfile } from '@/db/profile';
import { formatDuration, getLocalDateString } from '@/engine/statsCalculator';
import {
  calculateGamificationStats,
  calculateBadgeProgress,
  getBadgesByCategory,
  getCurrentSeasonChallenge,
  BADGES,
  type GamificationStats,
  type BadgeCategory,
} from '@/engine/gamification';
import type { Session, KeyStat, UserProfile } from '@/db/schema';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { MasteryDonut } from '@/components/profile/MasteryDonut';
import { SeasonChallenge } from '@/components/profile/SeasonChallenge';
import { BadgeFilter } from '@/components/profile/BadgeFilter';
import { BadgeCard } from '@/components/profile/BadgeCard';

import { WpmAreaChart } from '@/components/profile/WpmAreaChart';
import { SkillRadarChart } from '@/components/profile/SkillRadarChart';
import { PersonalBests } from '@/components/profile/PersonalBests';

import '@/styles/keyboard.css';
import { QWERTY_LAYOUT, type KeyData } from '@/data/keyboards/qwerty';
import { TAMIL99_LAYOUT } from '@/data/keyboards/tamil99';
import { OW_TAMIL_LAYOUT, OW_TAMIL_TO_PHYSICAL } from '@/data/keyboards/owTamil';

export default function StatsPage() {
  const { language } = useUIStore();
  const { fetchGamification } = useGamificationStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [keyStats, setKeyStats] = useState<KeyStat[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'speed' | 'heatmap'>('speed');
  const [badgeCategory, setBadgeCategory] = useState<BadgeCategory>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchGamification();
      const [_sessions, _keyStats, _profile] = await Promise.all([
        getAllSessions(),
        getKeyStatsByLanguage(language),
        getProfile(),
      ]);
      setSessions(_sessions.filter((s) => s.language === language));
      setKeyStats(_keyStats);
      setProfile(_profile);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [language, fetchGamification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const gamStats = useMemo<GamificationStats | null>(() => {
    if (sessions.length === 0) return null;
    return calculateGamificationStats(sessions, profile);
  }, [sessions, profile]);

  const seasonProgress = useMemo(() => {
    return getCurrentSeasonChallenge(sessions, profile);
  }, [sessions, profile]);

  const heatmapColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const ks of keyStats) {
      const hue = ks.confidence * 120;
      map.set(ks.char, `hsl(${hue}, 70%, 50%)`);
    }
    return map;
  }, [keyStats]);

  const sortedKeys = useMemo(
    () => [...keyStats].sort((a, b) => b.confidence - a.confidence),
    [keyStats],
  );

  const filteredBadgeIds = useMemo(() => {
    return getBadgesByCategory(badgeCategory);
  }, [badgeCategory]);

  const badgeProgressMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const badgeId of Object.keys(BADGES)) {
      map.set(badgeId, calculateBadgeProgress(badgeId as any, sessions, profile));
    }
    return map;
  }, [sessions, profile]);

  return (
    <div className="profile-page">
      {(loading || !gamStats) ? (
        <div className="layout-loading">
          {loading ? 'Loading Profile...' : 'Complete a session to see your profile'}
        </div>
      ) : (
        <div className="profile-layout">
          <ProfileCard stats={gamStats} profile={profile} />

          <div className="right-content">
            <div className="top-row">
              <MasteryDonut keyStats={keyStats} />
              <SkillRadarChart sessions={sessions} keyStats={keyStats} />
            </div>

            <section className="personal-bests-section">
              <PersonalBests
                sessions={sessions}
                profile={profile}
                currentStreak={gamStats.currentStreak}
              />
            </section>
            <section className="chart-section">
              <WpmAreaChart sessions={sessions} />
            </section>

            <section className="season-section">
              <h3 className="section-title-small">Season Challenge</h3>
              <SeasonChallenge progress={seasonProgress} />
            </section>

            <section className="achievements-section">
              <div className="section-header">
                <h2 className="section-title">Achievements</h2>
                <span className="badge-count">
                  {gamStats.badges.length}/{Object.keys(BADGES).length}
                </span>
              </div>
              <BadgeFilter onCategoryChange={setBadgeCategory} initialCategory="all" />
              <div className="badges-grid">
                {filteredBadgeIds.map((badgeId) => {
                  const badge = BADGES[badgeId];
                  const earned = gamStats.badges.includes(badgeId);
                  const progress = badgeProgressMap.get(badgeId);
                  return (
                    <BadgeCard
                      key={badgeId}
                      badge={badge}
                      earned={earned}
                      progress={progress}
                    />
                  );
                })}
              </div>
            </section>

            <section className="activity-section">
              <div className="section-header">
                <h2 className="section-title">Practice Activity</h2>
              </div>
              <ActivityHeatmap activity={profile?.dailyActivity ?? {}} />
            </section>

            <section className="analytics-section">
              <div className="tabs-container">
                <button
                  className={`tab-btn ${activeTab === 'speed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('speed')}
                >
                  Key Mastery
                </button>
                <button
                  className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
                  onClick={() => setActiveTab('heatmap')}
                >
                  Keyboard Heatmap
                </button>
              </div>
              <div className="tab-content">
                {activeTab === 'speed' && (
                  <div className="chart-container">
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
                      Keys colored by mastery — Red = Weak, Green = Strong
                    </p>
                    <div className="heatmap-keyboard-wrapper">
                      <HeatmapKeyboard language={language} colors={heatmapColors} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: var(--font-sans);
        }

        .profile-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: var(--space-xl);
          padding: var(--space-xl) var(--space-2xl);
          max-width: 1400px;
          margin: 0 auto;
        }

        .right-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .top-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-md);
        }

        .section-title {
          font-size: var(--text-base);
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .section-title-small {
          font-size: var(--text-sm);
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-count {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--color-primary);
          background: var(--color-primary-glow);
          padding: 2px 10px;
          border-radius: var(--radius-full);
        }

        .achievements-section {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: var(--space-sm);
        }

        .activity-section {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .season-section {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .analytics-section {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .tabs-container {
          display: flex;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
          border-bottom: 1px solid var(--border-default);
        }

        .tab-btn {
          background: none;
          border: none;
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .tab-btn:hover { color: var(--text-primary); }

        .tab-btn.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .tab-content { padding: var(--space-sm) 0; }

        .chart-container, .heatmap-container { min-height: 300px; }

        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--text-muted);
        }

        .heatmap-desc {
          color: var(--text-muted);
          font-size: var(--text-xs);
          margin-bottom: var(--space-md);
        }

        .heatmap-keyboard-wrapper {
          display: flex;
          justify-content: center;
        }

        .layout-loading {
          text-align: center;
          padding: var(--space-3xl);
          color: var(--text-muted);
          min-height: 100vh;
        }

        @media (max-width: 1024px) {
          .profile-layout {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
            padding: var(--space-lg);
          }

          .top-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .profile-layout { padding: var(--space-md); }
          .badges-grid { grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); }
        }
      `}</style>
    </div>
  );
}

function KeyScatterPlot({ keyStats }: { keyStats: KeyStat[] }) {
  const [hovered, setHovered] = useState<{ ks: KeyStat; x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const W = 600;
  const H = 300;
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 } as const;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const data = useMemo(() => {
    const valid = keyStats.filter((ks) => ks.totalAttempts > 0);
    if (valid.length === 0) return [];
    const minLat = Math.min(...valid.map((ks) => ks.avgLatencyMs));
    const maxLat = Math.max(...valid.map((ks) => ks.avgLatencyMs));
    const range = maxLat - minLat || 1;
    return valid.map((ks) => {
      const accuracy = ks.correctAttempts / ks.totalAttempts;
      const x = PAD.left + accuracy * plotW;
      const normalizedLat = (ks.avgLatencyMs - minLat) / range;
      const y = PAD.top + (1 - normalizedLat) * plotH;
      return { ks, x, y };
    });
  }, [keyStats, plotW, plotH]);

  if (!mounted) return <div style={{ height: H }} />;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: W, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const x = PAD.left + (i / 4) * plotW;
          const y = PAD.top + (i / 4) * plotH;
          return (
            <g key={i}>
              <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom} stroke="var(--border-subtle)" strokeDasharray="2 2" />
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="2 2" />
            </g>
          );
        })}

        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="var(--border-default)" strokeWidth={1.5} />
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="var(--border-default)" strokeWidth={1.5} />

        <text x={W / 2} y={H - 5} fill="var(--text-muted)" fontSize={10} textAnchor="middle" fontWeight={600}>Accuracy (%)</text>
        <text x={10} y={H / 2} fill="var(--text-muted)" fontSize={10} textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`} fontWeight={600}>Speed (Latency Ms)</text>

        <text x={PAD.left} y={H - PAD.bottom + 14} fill="var(--text-muted)" fontSize={9} textAnchor="middle">0%</text>
        <text x={PAD.left + plotW / 2} y={H - PAD.bottom + 14} fill="var(--text-muted)" fontSize={9} textAnchor="middle">50%</text>
        <text x={W - PAD.right} y={H - PAD.bottom + 14} fill="var(--text-muted)" fontSize={9} textAnchor="middle">100%</text>

        <text x={PAD.left - 6} y={PAD.top + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end">Fast</text>
        <text x={PAD.left - 6} y={H - PAD.bottom + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end">Slow</text>

        {data.map((pt, i) => {
          const size = Math.min(12, Math.max(5, 5 + pt.ks.totalAttempts / 50));
          const hue = pt.ks.confidence * 120;
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={size}
              fill={`hsl(${hue}, 80%, 50%)`}
              fillOpacity={0.65}
              stroke={`hsl(${hue}, 80%, 40%)`}
              strokeWidth={1}
              style={{ cursor: 'pointer', transition: 'all 0.1s' }}
              onMouseEnter={() => setHovered(pt)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {hovered && createPortal(
        <div className="floating-tooltip" style={{ top: hovered.y + 40, left: hovered.x + 80 }}>
          <div className="ft-header">
            <span className="ft-key">{hovered.ks.char}</span>
          </div>
          <div className="ft-stats">
            <div className="ft-stat">
              <span className="ft-label">Accuracy:</span>
              <span className="ft-value">{Math.round((hovered.ks.correctAttempts / hovered.ks.totalAttempts) * 100)}%</span>
            </div>
            <div className="ft-stat">
              <span className="ft-label">Latency:</span>
              <span className="ft-value">{Math.round(hovered.ks.avgLatencyMs)}ms</span>
            </div>
            <div className="ft-stat">
              <span className="ft-label">Confidence:</span>
              <span className="ft-value">{Math.round(hovered.ks.confidence * 100)}%</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function HeatmapKeyboard({ language, colors }: { language: string; colors: Map<string, string> }) {
  const isTamil = language === 'ta' || language === 'tamil';
  const { keyboardLayout } = useUIStore();
  const layout = isTamil
    ? (keyboardLayout === 'phonetic' ? OW_TAMIL_LAYOUT : TAMIL99_LAYOUT)
    : QWERTY_LAYOUT;
  const getKeyClassName = (keyData: KeyData): string => {
    const classes = ['key'];
    if (keyData.width && keyData.width !== 1) classes.push('key-wide');
    if (keyData.isModifier) classes.push('key-modifier');
    if (keyData.key === ' ') classes.push('space-key');
    return classes.join(' ');
  };
  const getKeyStyle = (keyData: KeyData): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (keyData.width && keyData.width !== 1) {
      const baseWidth = 44;
      const gap = 2;
      style.width = `${keyData.width * baseWidth + (keyData.width - 1) * gap}px`;
    }
    const char = keyData.key.toLowerCase();
    style.borderBottom = `3px solid ${colors.get(char) || 'var(--bg-overlay)'}`;
    return style;
  };
  return (
    <div className="virtual-keyboard">
      {layout.map((row, rIdx) => (
        <div key={rIdx} className="keyboard-row">
          {row.map((keyData, kIdx) => (
            <div
              key={`${keyData.key}-${kIdx}`}
              className={getKeyClassName(keyData)}
              style={getKeyStyle(keyData)}
            >
              {keyData.shiftLabel && (
                <span className="key-shift-label">{keyData.shiftLabel}</span>
              )}
              <span className={keyData.shiftLabel ? 'key-main-label' : 'key-label-only'}>
                {keyData.label}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string; date: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeksList = Array.from({ length: 52 }, (_, wOffset) => {
      const w = 51 - wOffset;
      return Array.from({ length: 7 }, (_, dOffset) => {
        const d = 6 - dOffset;
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + d));
        const dayStr = getLocalDateString(date);
        return { date: dayStr, durationMs: activity[dayStr] ?? 0, rawDate: date };
      });
    });

    const labels: { index: number; label: string }[] = [];
    let lastMonth = -1;
    let lastIndex = -1;

    weeksList.forEach((week, wIdx) => {
      const date = week[0].rawDate;
      const currentMonth = date.getMonth();
      if (currentMonth !== lastMonth && (wIdx - lastIndex >= 4)) {
        labels.push({ index: wIdx, label: MONTH_NAMES[currentMonth] });
        lastMonth = currentMonth;
        lastIndex = wIdx;
      }
    });

    return { weeks: weeksList, monthLabels: labels };
  }, [activity]);

  if (!mounted) {
    return <div className="heatmap-loading-placeholder">Loading Activity Heatmap...</div>;
  }

  const getColor = (ms: number): string => {
    const mins = ms / 60_000;
    if (mins === 0) return 'var(--bg-overlay)';
    if (mins < 15) return '#1a4731';
    if (mins < 30) return '#166534';
    if (mins < 45) return '#22c55e';
    return '#4ade80';
  };

  const handleMouseEnter = (e: React.MouseEvent, date: string, ms: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const formatted = ms > 0 ? `${formatDuration(ms)} practiced` : 'No practice';
    setHoverInfo({ x: rect.left + rect.width / 2, y: rect.top - 8, text: formatted, date });
  };

  return (
    <div className="heatmap-outer-container">
      <div className="heatmap-grid-layout">
        <div className="day-labels">
          <span className="day-label">Mon</span>
          <span className="day-label">Wed</span>
          <span className="day-label">Fri</span>
        </div>

        <div className="heatmap-scroll">
          <div className="months-row">
            {monthLabels.map((ml, idx) => (
              <span key={idx} className="month-label" style={{ left: `${ml.index * 14}px` }}>
                {ml.label}
              </span>
            ))}
          </div>

          <div className="weeks-container">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="week-col">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="cell"
                    style={{ backgroundColor: getColor(day.durationMs) }}
                    onMouseEnter={(e) => handleMouseEnter(e, day.date, day.durationMs)}
                    onMouseLeave={() => setHoverInfo(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-footer">
        <div className="heatmap-legend">
          <span className="legend-text">Less</span>
          <span className="legend-cell" style={{ backgroundColor: 'var(--bg-overlay)' }} />
          <span className="legend-cell" style={{ backgroundColor: '#1a4731' }} />
          <span className="legend-cell" style={{ backgroundColor: '#166534' }} />
          <span className="legend-cell" style={{ backgroundColor: '#22c55e' }} />
          <span className="legend-cell" style={{ backgroundColor: '#4ade80' }} />
          <span className="legend-text">More</span>
        </div>
      </div>

      {mounted && hoverInfo && createPortal(
        <div className="custom-tooltip" style={{ top: hoverInfo.y, left: hoverInfo.x }}>
          <strong>{hoverInfo.text}</strong>
          <span className="tooltip-date">{hoverInfo.date}</span>
        </div>,
        document.body,
      )}

      <style jsx>{`
        .heatmap-outer-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          width: 100%;
        }

        .heatmap-loading-placeholder {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-muted);
        }

        .heatmap-grid-layout {
          display: flex;
          gap: var(--space-sm);
          align-items: flex-end;
          width: 100%;
        }

        .day-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 95px;
          padding-bottom: 2px;
          margin-right: 4px;
        }

        .day-label {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
          line-height: 1;
        }

        .heatmap-scroll {
          overflow-x: auto;
          padding-bottom: var(--space-sm);
          position: relative;
          flex: 1;
        }

        .months-row {
          position: relative;
          height: 18px;
          width: 100%;
          margin-bottom: 4px;
        }

        .month-label {
          position: absolute;
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 700;
          white-space: nowrap;
        }

        .weeks-container {
          display: flex;
          gap: 3px;
        }

        .week-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cell {
          width: 11px;
          height: 11px;
          border-radius: 2px;
          cursor: crosshair;
          transition: transform 0.1s;
        }

        .cell:hover {
          transform: scale(1.4);
          z-index: 10;
        }

        .heatmap-footer {
          display: flex;
          justify-content: flex-end;
          width: 100%;
          margin-top: var(--space-xs);
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-text {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .legend-cell {
          width: 11px;
          height: 11px;
          border-radius: 2px;
        }
      `}</style>

      <style jsx global>{`
        .custom-tooltip {
          position: fixed;
          background: rgba(20, 20, 20, 0.92);
          backdrop-filter: blur(8px);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          pointer-events: none;
          transform: translate(-50%, -100%);
          z-index: 1000;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
        }
        .tooltip-date { color: var(--text-muted); font-size: 10px; }
        .floating-tooltip {
          position: fixed;
          transform: translate(-50%, -100%);
          background: rgba(20, 20, 20, 0.88);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          pointer-events: none;
          min-width: 120px;
          color: white;
        }
        .ft-header { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 6px; }
        .ft-key { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; }
        .ft-stats { display: flex; flex-direction: column; gap: 3px; }
        .ft-stat { display: flex; justify-content: space-between; font-size: 0.7rem; }
        .ft-label { color: rgba(255,255,255,0.6); }
        .ft-value { font-weight: 700; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}

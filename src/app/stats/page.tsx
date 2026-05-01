'use client';

/**
 * VangaTypePanalam — LeetCode-Style Profile & Statistics Page
 *
 * 2-column layout:
 * Left: Profile card (avatar, rank, XP, stats, streak)
 * Right: Mastery donut + Season challenge, Compact badges, Activity heatmap, Key analytics
 */

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
  getRarityColor,
  type GamificationStats,
  type BadgeCategory,
} from '@/engine/gamification';
import type { Session, KeyStat, UserProfile } from '@/db/schema';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { MasteryDonut } from '@/components/profile/MasteryDonut';
import { SeasonChallenge } from '@/components/profile/SeasonChallenge';
import { BadgeFilter } from '@/components/profile/BadgeFilter';
import { BadgeCard } from '@/components/profile/BadgeCard';
import '@/styles/keyboard.css';
import { QWERTY_LAYOUT } from '@/data/keyboards/qwerty';
import { TAMIL99_LAYOUT } from '@/data/keyboards/tamil99';

// ─────────────────────────────────────────────
// ProfilePage
// ─────────────────────────────────────────────

export default function ProfilePage() {
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
      // Silently ignore IDB / SSR errors
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Gamification stats
  const gamStats = useMemo<GamificationStats | null>(() => {
    if (sessions.length === 0) return null;
    return calculateGamificationStats(sessions, profile);
  }, [sessions, profile]);

  // ── Season challenge
  const seasonProgress = useMemo(() => {
    return getCurrentSeasonChallenge(sessions, profile);
  }, [sessions, profile]);

  // ── Heatmap colour map
  const heatmapColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const ks of keyStats) {
      const hue = ks.confidence * 120;
      map.set(ks.char, `hsl(${hue}, 70%, 50%)`);
    }
    return map;
  }, [keyStats]);

  // ── Sorted keys for charts
  const sortedKeys = useMemo(
    () => [...keyStats].sort((a, b) => b.confidence - a.confidence),
    [keyStats],
  );

  // ── Filter badges by category
  const filteredBadgeIds = useMemo(() => {
    return getBadgesByCategory(badgeCategory);
  }, [badgeCategory]);

  // ── Badge progress data
  const badgeProgressMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const badgeId of Object.keys(BADGES)) {
      map.set(badgeId, calculateBadgeProgress(badgeId as any, sessions, profile));
    }
    return map;
  }, [sessions, profile]);

  if (loading) {
    return <div className="layout-loading">Loading Profile...</div>;
  }

  if (!gamStats) {
    return <div className="layout-loading">Complete a session to see your profile</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-layout">
        {/* ── Left: Profile Card ── */}
        <ProfileCard stats={gamStats} profile={profile} />

        {/* ── Right: Main Content ── */}
        <div className="right-content">
          {/* Top Row: Mastery Donut + Season Challenge */}
          <div className="top-row">
            <MasteryDonut keyStats={keyStats} />
            <SeasonChallenge progress={seasonProgress} />
          </div>

          {/* Achievements Section */}
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

          {/* Activity Heatmap */}
          <section className="activity-section">
            <div className="section-header">
              <h2 className="section-title">Practice Activity</h2>
            </div>
            <div className="streak-stats-bar">
              <div className="streak-stat">
                <span className="ss-value">{profile?.longestStreak ?? gamStats.currentStreak}</span>
                <span className="ss-label">Longest Streak</span>
              </div>
              <div className="streak-stat">
                <span className="ss-value">{gamStats.currentStreak}</span>
                <span className="ss-label">Current Streak</span>
              </div>
              <div className="streak-stat">
                <span className="ss-value">{Object.keys(profile?.dailyActivity ?? {}).length}</span>
                <span className="ss-label">Active Days</span>
              </div>
            </div>
            <ActivityHeatmap activity={profile?.dailyActivity ?? {}} />
          </section>

          {/* Key Analytics */}
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

      {/* Page Styles */}
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

        .streak-stats-bar {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-overlay);
          border-radius: var(--radius-md);
        }

        .streak-stat {
          display: flex;
          align-items: baseline;
          gap: var(--space-xs);
        }

        .ss-value {
          font-family: var(--font-mono);
          font-size: var(--text-base);
          font-weight: 800;
          color: var(--text-primary);
        }

        .ss-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
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
          .streak-stats-bar { flex-direction: column; gap: var(--space-sm); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// KeyScatterPlot (kept from original)
// ─────────────────────────────────────────────

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

  const maxAttempts = useMemo(
    () => Math.max(...keyStats.map((k) => k.totalAttempts), 1),
    [keyStats],
  );

  const maxLog = Math.log10(maxAttempts + 1);
  const toX = (attempts: number) => (Math.log10(attempts + 1) / maxLog) * plotW;
  const toY = (conf: number) => plotH - conf * plotH;

  return (
    <div className="scatter-wrap">
      <div className="axis-label axis-y">Confidence →</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="scatter-svg" style={{ width: '100%', maxWidth: W, height: 'auto' }}>
        <g transform={`translate(${PAD.left}, ${PAD.top})`}>
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="var(--border-default)" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={plotH} stroke="var(--border-default)" strokeWidth={1} />
          {keyStats.map((ks) => {
            const cx = toX(ks.totalAttempts);
            const cy = toY(ks.confidence);
            const hue = ks.confidence * 120;
            const isHovered = hovered?.ks === ks;
            const r = isHovered ? 12 : 8;
            return (
              <g
                key={ks.char}
                transform={`translate(${cx}, ${cy})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGGElement).getBoundingClientRect();
                  setHovered({ ks, x: rect.left + rect.width / 2, y: rect.top });
                }}
                onMouseLeave={() => setHovered(null)}
              >
                <circle r={r} fill={`hsl(${hue},70%,50%)`} stroke={isHovered ? 'white' : `hsl(${hue},70%,25%)`} strokeWidth={isHovered ? 2 : 1.2} />
                <text y={1} fontSize={isHovered ? 10 : 8} fontWeight="800" fill="white" textAnchor="middle" dominantBaseline="middle">
                  {ks.char.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="axis-label axis-x">Total Attempts (Log Scale) →</div>

      {hovered && mounted && createPortal(
        <div className="floating-tooltip" style={{ top: hovered.y - 12, left: hovered.x }}>
          <div className="ft-header"><span className="ft-key">{hovered.ks.char.toUpperCase()}</span></div>
          <div className="ft-stats">
            <div className="ft-stat">
              <span className="ft-label">Confidence</span>
              <span className="ft-value">{(hovered.ks.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        .scatter-wrap { position: relative; padding-left: 20px; }
        .scatter-svg { display: block; overflow: visible; }
        .axis-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
        .axis-y { writing-mode: vertical-rl; position: absolute; left: 0; top: 50%; transform: translateY(-50%) rotate(180deg); }
        .axis-x { text-align: center; margin-top: 8px; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// HeatmapKeyboard (kept from original)
// ─────────────────────────────────────────────

function HeatmapKeyboard({ language, colors }: { language: string; colors: Map<string, string> }) {
  const layout = language === 'ta' ? TAMIL99_LAYOUT : QWERTY_LAYOUT;
  return (
    <div className="vk-heatmap">
      {layout.map((row, rIdx) => (
        <div key={rIdx} className="vk-row">
          {row.map((keyData, kIdx) => {
            if (keyData.isModifier || keyData.key === ' ') {
              return (
                <div key={kIdx} className="vk-key modifier" style={{ width: keyData.width ? `${keyData.width * 42}px` : '42px' }}>
                  {keyData.label}
                </div>
              );
            }
            const char = keyData.key.toLowerCase();
            const bgColor = colors.get(char) ?? 'var(--key-bg)';
            return (
              <div key={kIdx} className="vk-key active" style={{ backgroundColor: bgColor, color: colors.has(char) ? 'white' : 'var(--text-muted)' }}>
                <span className="vk-label">{keyData.label}</span>
              </div>
            );
          })}
        </div>
      ))}
      <style jsx>{`
        .vk-heatmap { display: flex; flex-direction: column; gap: 2px; align-items: center; padding: 16px; background: var(--bg-surface); border-radius: var(--radius-md); }
        .vk-row { display: flex; gap: 2px; }
        .vk-key { height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border-radius: 3px; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; }
        .modifier { background: var(--bg-overlay); color: var(--text-muted); font-size: 0.65rem; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// ActivityHeatmap (redesigned)
// ─────────────────────────────────────────────

function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string; date: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

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
        return { date: dayStr, durationMs: activity[dayStr] ?? 0 };
      });
    });
  }, [activity]);

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
    <div className="heatmap-wrap">
      <div className="heatmap-scroll">
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

      {mounted && hoverInfo && createPortal(
        <div className="custom-tooltip" style={{ top: hoverInfo.y, left: hoverInfo.x }}>
          <strong>{hoverInfo.text}</strong>
          <span className="tooltip-date">{hoverInfo.date}</span>
        </div>,
        document.body,
      )}

      <style jsx>{`
        .heatmap-wrap { overflow-x: auto; padding-bottom: var(--space-sm); }
        .weeks-container { display: flex; gap: 3px; }
        .week-col { display: flex; flex-direction: column; gap: 3px; }
        .cell { width: 11px; height: 11px; border-radius: 2px; cursor: crosshair; transition: transform 0.1s; }
        .cell:hover { transform: scale(1.4); }
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

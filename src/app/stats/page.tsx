'use client';

/**
 * VaagaTypePanalam — Profile & Statistics Page
 *
 * Designed to mimic Keybr's minimalist layout.
 * Features: All Time vs Today Stats, Key Speed Bar Charts, and Keyboard Heatmap.
 */

import { useEffect, useState, useMemo } from 'react';
import { useUIStore } from '@/store/uiStore';
import { getAllSessions } from '@/db/sessions';
import { getKeyStatsByLanguage } from '@/db/keyStats';
import { getProfile } from '@/db/profile';
import { formatDuration } from '@/engine/statsCalculator';
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard';
import type { Session, KeyStat, UserProfile } from '@/db/schema';
import '@/styles/keyboard.css';

interface StatBuckets {
  allTime: {
    timeMs: number;
    sessions: number;
    topSpeed: number;
    avgSpeed: number;
  };
  today: {
    timeMs: number;
    sessions: number;
    topSpeed: number;
    avgSpeed: number;
  };
}

export default function ProfilePage() {
  const { language } = useUIStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [keyStats, setKeyStats] = useState<KeyStat[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'speed' | 'heatmap'>('speed');

  useEffect(() => {
    loadData();
  }, [language]);

  async function loadData() {
    setLoading(true);
    try {
      const [_sessions, _keyStats, _profile] = await Promise.all([
        getAllSessions(), // Filtered client-side since dataset is small for MVP
        getKeyStatsByLanguage(language),
        getProfile(),
      ]);
      setSessions(_sessions.filter(s => s.language === language));
      setKeyStats(_keyStats);
      setProfile(_profile);
    } catch {
      // Ignore IDB SSR errors
    } finally {
      setLoading(false);
    }
  }

  // Lightweight mathematically bucketing
  const stats = useMemo<StatBuckets>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const result = {
      allTime: { timeMs: 0, sessions: 0, topSpeed: 0, avgSpeed: 0 },
      today: { timeMs: 0, sessions: 0, topSpeed: 0, avgSpeed: 0 },
    };

    let allTimeSpeedSum = 0;
    let todaySpeedSum = 0;

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];

      // All Time
      result.allTime.sessions++;
      result.allTime.timeMs += s.durationMs;
      if (s.wpm > result.allTime.topSpeed) result.allTime.topSpeed = s.wpm;
      allTimeSpeedSum += s.wpm;

      // Today
      if (s.startedAt >= startOfToday) {
        result.today.sessions++;
        result.today.timeMs += s.durationMs;
        if (s.wpm > result.today.topSpeed) result.today.topSpeed = s.wpm;
        todaySpeedSum += s.wpm;
      }
    }

    if (result.allTime.sessions > 0) {
      result.allTime.avgSpeed = Math.round(allTimeSpeedSum / result.allTime.sessions);
    }
    if (result.today.sessions > 0) {
      result.today.avgSpeed = Math.round(todaySpeedSum / result.today.sessions);
    }

    return result;
  }, [sessions]);

  // Derived heatmap data
  // Green mapping to ~1.0 confidence, Red to ~0.0
  const heatmapColors = useMemo(() => {
    const map = new Map<string, string>();
    keyStats.forEach((ks) => {
      // Confidence is 0 to 1
      // 0 = Red (e.g. #e74c3c), 0.5 = Yellow, 1 = Green (e.g. #2ecc71)
      const hue = ks.confidence * 120; // 0 to 120 (Red to Green in HSL)
      map.set(ks.char, `hsl(${hue}, 70%, 50%)`);
    });
    return map;
  }, [keyStats]);

  const sortedKeys = useMemo(() => {
    return [...keyStats].sort((a, b) => b.confidence - a.confidence);
  }, [keyStats]);

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
        {/* All Time */}
        <div className="stats-card">
          <h2 className="card-title">All Time Statistics</h2>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Time spent</span>
              <span className="stat-value">{formatDuration(stats.allTime.timeMs)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sessions count</span>
              <span className="stat-value">{stats.allTime.sessions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Top speed</span>
              <span className="stat-value">{stats.allTime.topSpeed} wpm</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average speed</span>
              <span className="stat-value">{stats.allTime.avgSpeed} wpm</span>
            </div>
          </div>
        </div>

        {/* Today */}
        <div className="stats-card">
          <h2 className="card-title">Statistics for Today</h2>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Time spent</span>
              <span className="stat-value">{formatDuration(stats.today.timeMs)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sessions count</span>
              <span className="stat-value">{stats.today.sessions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Top speed</span>
              <span className="stat-value">{stats.today.topSpeed} wpm</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average speed</span>
              <span className="stat-value">{stats.today.avgSpeed} wpm</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily Activity Heatmap ── */}
      <div className="activity-section">
        <h2 className="card-title">Daily Practice Activity</h2>
        <ActivityHeatmap activity={profile?.dailyActivity || {}} />
      </div>

      {/* ── Detailed Analytics ── */}
      <div className="analytics-section">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'speed' ? 'active' : ''}`}
            onClick={() => setActiveTab('speed')}
          >
            Key Typing Speed (Bar Chart)
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
            <div className="bar-chart-container">
              {sortedKeys.length === 0 ? (
                <div className="empty-state">No typing data recorded yet.</div>
              ) : (
                <div className="bar-chart">
                  {sortedKeys.map((ks) => {
                    const widthPct = Math.max(5, ks.confidence * 100);
                    return (
                      <div key={ks.char} className="bar-row">
                        <div className="bar-label">{ks.char.toUpperCase()}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: `hsl(${ks.confidence * 120}, 70%, 50%)`,
                            }}
                          >
                            <span className="bar-value">{(ks.confidence * 100).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="heatmap-container">
              <p className="heatmap-desc">Keys are colored based on your mastery (Red = Slow/Errors, Green = Fast/Accurate).</p>
              <div 
                className="heatmap-keyboard-wrapper" 
                style={{ 
                  '--key-finger-pinky': 'var(--key-bg)',
                  '--key-finger-ring': 'var(--key-bg)',
                  '--key-finger-middle': 'var(--key-bg)',
                  '--key-finger-index': 'var(--key-bg)',
                  '--key-finger-thumb': 'var(--key-bg)',
                } as React.CSSProperties}
              >
                {/* We render standard keyboard but override specific key backgrounds with inline styles via a trick or we need a custom heatmap prop.
                    For this MVP, we will inject a global style tag dynamically to target individual keys based on char data attribute.
                    Wait, VirtualKeyboard does not expose data-char. Let's make a custom static keyboard here, or just list them.
                    Actually, we can parse the Virtual Keyboard classes, but simpler is rendering our own flex rows.
                */}
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

        .stats-card {
          flex: 1;
        }

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

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .tab-content {
          padding: var(--space-md) 0;
        }

        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--text-muted);
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bar-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .bar-label {
          width: 30px;
          text-align: right;
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--text-secondary);
        }

        .bar-track {
          flex: 1;
          height: 20px;
          background: var(--bg-hover);
          border-radius: 2px;
        }

        .bar-fill {
          height: 100%;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 6px;
          transition: width 0.5s ease;
        }

        .bar-value {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: white;
          font-weight: 700;
        }

        .heatmap-container {
          text-align: center;
        }

        .heatmap-desc {
          color: var(--text-muted);
          font-size: var(--text-sm);
          margin-bottom: var(--space-xl);
        }

        @media (max-width: 768px) {
          .stats-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * A lightweight, static version of the keyboard used specifically
 * for displaying the heatmap matrix, completely decoupled from
 * typing game logic to save rendering overhead.
 */
import { QWERTY_LAYOUT } from '@/data/keyboards/qwerty';
import { TAMIL99_LAYOUT } from '@/data/keyboards/tamil99';

function HeatmapKeyboard({ language, colors }: { language: string, colors: Map<string, string> }) {
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
            const bgColor = colors.get(char) || 'var(--key-bg)';
            
            return (
              <div 
                key={kIdx} 
                className="vk-key active"
                style={{ 
                  backgroundColor: bgColor,
                  color: colors.has(char) ? 'white' : 'var(--text-muted)'
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
        .vk-row {
          display: flex;
          gap: 2px;
        }
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
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

/**
 * Activity Heatmap (Premium GitHub Style)
 * Renders 52 weeks with Month and Day-of-week labels.
 */
function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string; date: string } | null>(null);

  const weeks = useMemo(() => {
    const wks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build 52 weeks spanning exactly back from today or end of week
    // GitHub aligns to days of week. We will align exactly 52 weeks.
    for (let w = 51; w >= 0; w--) {
      const weekDays = [];
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + d));
        const dayStr = date.toISOString().split('T')[0];
        weekDays.push({
          date: dayStr,
          dateObj: date,
          durationMs: activity[dayStr] || 0,
        });
      }
      wks.push(weekDays);
    }
    return wks;
  }, [activity]);

  const getColor = (ms: number) => {
    const mins = ms / 60000;
    if (mins === 0) return 'var(--bg-overlay)';
    if (mins < 15) return '#c6e48b'; // Light green
    if (mins < 30) return '#7bc96f'; // Medium green
    if (mins < 40) return '#239a3b'; // Full green
    return '#ffd700'; // Gold (40+ mins)
  };

  const handleMouseEnter = (e: React.MouseEvent, date: string, ms: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const formatted = ms > 0 ? `${formatDuration(ms)} practiced` : 'No practice';
    
    // We adjust the X/Y to center above the block
    setHoverInfo({
      x: rect.left + rect.width / 2,
      y: rect.top - 8, // 8px above the cell
      text: formatted,
      date,
    });
  };

  const handleMouseLeave = () => setHoverInfo(null);

  return (
    <div className="heatmap-card animate-fade-in">
      <div className="heatmap-scroll-container">
        
        {/* Day Labels (Left Y-Axis) */}
        <div className="day-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        <div className="heatmap-matrix">
          {/* Months Labels (Top X-Axis) */}
          <div className="month-labels">
            {weeks.map((week, idx) => {
              // Try to place a label if it's the start of a month in this week
              const firstDay = week[0].dateObj;
              if (firstDay.getDate() <= 7 && idx > 0) {
                return (
                  <span key={idx} className="month-label" style={{ left: `${idx * 16}px` }}>
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

      <div className="heatmap-footer">
        <a href="#" className="heatmap-link">Learn how our goals work</a>
        <div className="heatmap-legend">
          <span className="legend-text">Less</span>
          <div className="legend-cell" style={{ backgroundColor: 'var(--bg-overlay)' }} />
          <div className="legend-cell" style={{ backgroundColor: '#c6e48b' }} />
          <div className="legend-cell" style={{ backgroundColor: '#7bc96f' }} />
          <div className="legend-cell" style={{ backgroundColor: '#239a3b' }} />
          <div className="legend-cell" style={{ backgroundColor: '#ffd700' }} />
          <span className="legend-text" style={{ color: '#d97706', fontWeight: 'bold' }}>Mastery</span>
        </div>
      </div>

      {hoverInfo && (
        <div 
          className="custom-tooltip"
          style={{ top: hoverInfo.y, left: hoverInfo.x }}
        >
          <strong>{hoverInfo.text}</strong>
          <span className="tooltip-date">on {hoverInfo.date}</span>
        </div>
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
        .heatmap-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .heatmap-scroll-container::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 10px;
        }

        .day-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-top: 24px; /* offset for month labels */
          padding-right: 8px;
          color: var(--text-muted);
          font-size: 10px;
          height: 105px; /* approx 7 * 15px */
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
        .month-label {
          position: absolute;
          top: 0;
        }

        .weeks-container {
          display: flex;
          gap: 4px;
        }
        .week-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
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
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
        .heatmap-link:hover {
          color: var(--color-primary);
        }
        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .legend-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
        .legend-cell {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        /* Float Custom Tooltip outside normal flow */
      `}</style>
      <style jsx global>{`
        .custom-tooltip {
          position: fixed;
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
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

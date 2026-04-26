'use client';

/**
 * VangaTypePanalam — Left Sidebar (Practice Page)
 *
 * Displays:
 * - Daily progress (word count, progress bar)
 * - Current streak & peak speed
 * - Critical keys (lowest accuracy keys)
 */

import { useEffect, useState } from 'react';
import { getSessionsSince, getAllSessions } from '@/db/sessions';
import { getKeyStatsByLanguage } from '@/db/keyStats';
import { getProfile } from '@/db/profile';
import { useTypingStore } from '@/store/typingStore';
import type { Language, KeyStat } from '@/db/schema';
import { Flame, Zap } from 'lucide-react';

interface LeftSidebarProps {
  language: Language;
}

export default function LeftSidebar({ language }: LeftSidebarProps) {
  const [todayWords, setTodayWords] = useState(0);
  const [streak, setStreak] = useState(0);
  const [peakSpeed, setPeakSpeed] = useState(0);
  const [criticalKeys, setCriticalKeys] = useState<KeyStat[]>([]);
  const snapshot = useTypingStore((s) => s.snapshot);

  async function loadStats() {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [todaySessions, allSessions, keyStats, profile] = await Promise.all([
        getSessionsSince(startOfDay.getTime()),
        getAllSessions(),
        getKeyStatsByLanguage(language),
        getProfile(),
      ]);

      // Today's word count
      const words = Math.round(todaySessions.reduce((sum, s) => sum + (s.totalChars / 5), 0));
      setTodayWords(words);

      // Streak
      setStreak(profile.currentStreak);

      // Peak speed (all time for current language)
      const langSessions = allSessions.filter((s) => s.language === language);
      const peak = langSessions.reduce((max, s) => Math.max(max, s.wpm), 0);
      setPeakSpeed(peak);

      // Critical keys — lowest confidence, min 3 samples
      const weak = keyStats
        .filter((k) => k.totalAttempts >= 3)
        .sort((a, b) => a.confidence - b.confidence)
        .slice(0, 3);
      setCriticalKeys(weak);
    } catch {
      // Ignore IDB SSR errors
    }
  }

  useEffect(() => {
    loadStats();
  }, [language, snapshot?.segmentsCompleted]);

  const targetWords = 2000;
  const progressPct = Math.min((todayWords / targetWords) * 100, 100);

  return (
    <aside className="left-sidebar">
      {/* ── Daily Progress ── */}
      <div className="sidebar-card">
        <h3 className="card-label">Daily Progress</h3>
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-target">Target: {targetWords.toLocaleString()} words</span>
            <span className="progress-value">{todayWords.toLocaleString()}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="stat-pair">
          <div className="mini-stat">
            <span className="mini-label">Current Streak</span>
            <span className="mini-value">
              <Flame size={16} className="flame-icon" />
              {streak} Days
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Peak Speed</span>
            <span className="mini-value">
              <Zap size={16} />
              {peakSpeed} <small>wpm</small>
            </span>
          </div>
        </div>
      </div>

      {/* ── Critical Keys ── */}
      <div className="sidebar-card">
        <h3 className="card-label">Critical Keys</h3>
        <div className="critical-keys">
          {criticalKeys.length === 0 ? (
            <p className="empty-hint">Start typing to see weak keys</p>
          ) : (
            criticalKeys.map((ks) => {
              const accPct = Math.round(ks.confidence * 100);
              const isLow = accPct < 70;
              return (
                <div key={ks.char} className="key-row">
                  <div className={`key-badge-box ${isLow ? 'low' : ''}`}>
                    {ks.char.toUpperCase()}
                  </div>
                  <div className="key-info">
                    <div className="key-info-header">
                      <span>ACCURACY</span>
                      <span>{accPct}%</span>
                    </div>
                    <div className="key-bar-track">
                      <div
                        className={`key-bar-fill ${isLow ? 'low' : ''}`}
                        style={{ width: `${accPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .left-sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .sidebar-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .card-label {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-muted);
          font-weight: 700;
          margin-bottom: var(--space-lg);
        }

        .progress-section {
          margin-bottom: var(--space-lg);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: var(--space-sm);
        }

        .progress-target {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .progress-value {
          font-family: var(--font-mono);
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-primary-light);
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: var(--bg-hover);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-full);
          box-shadow: 0 0 12px var(--color-primary-glow);
          transition: width 0.5s ease;
        }

        .stat-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid var(--border-subtle);
        }

        .mini-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mini-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .mini-value {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-lg);
          font-weight: 800;
          color: var(--text-primary);
        }

        .mini-value small {
          font-size: var(--text-xs);
          font-weight: 400;
          color: var(--text-muted);
        }

        .flame-icon {
          color: var(--color-accent);
        }

        /* ── Critical Keys ── */
        .critical-keys {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-hint {
          font-size: var(--text-sm);
          color: var(--text-muted);
          text-align: center;
          padding: var(--space-md) 0;
        }

        .key-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .key-badge-box {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--bg-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .key-badge-box.low {
          background: rgba(248, 113, 113, 0.15);
          color: var(--color-error);
          border: 1px solid rgba(248, 113, 113, 0.2);
        }

        .key-info {
          flex: 1;
        }

        .key-info-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.625rem;
          color: var(--text-muted);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .key-bar-track {
          width: 100%;
          height: 4px;
          background: var(--bg-hover);
          border-radius: 2px;
          overflow: hidden;
        }

        .key-bar-fill {
          height: 100%;
          background: var(--text-muted);
          border-radius: 2px;
          transition: width 0.3s;
        }

        .key-bar-fill.low {
          background: var(--color-error);
        }
      `}</style>
    </aside>
  );
}

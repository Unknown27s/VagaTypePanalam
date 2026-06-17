'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Session, UserProfile } from '@/db/schema';
import { AnimatedCounter } from './AnimatedCounter';

interface PersonalBestsProps {
  sessions: Session[];
  profile: UserProfile | null;
  currentStreak: number;
}

export function PersonalBests({ sessions, profile, currentStreak }: PersonalBestsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate active days count
  const activeDays = useMemo(() => {
    if (profile?.dailyActivity) {
      return Object.keys(profile.dailyActivity).length;
    }
    // Fallback if profile dailyActivity is not populated
    return new Set(sessions.map((s) => new Date(s.startedAt).toLocaleDateString())).size;
  }, [profile, sessions]);
  
  const contributionRangeStr = useMemo(() => {
    if (sessions.length === 0) return 'No practice data';
    const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
    const start = new Date(sorted[0].startedAt);
    const end = new Date(sorted[sorted.length - 1].startedAt);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - Present`;
  }, [sessions]);

  const currentStreakDateStr = useMemo(() => {
    if (currentStreak === 0) return 'Start typing today!';
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - currentStreak + 1);
    
    const options = { month: 'short', day: 'numeric' } as const;
    return `${start.toLocaleDateString(undefined, options)} - ${today.toLocaleDateString(undefined, options)}`;
  }, [currentStreak]);

  const longestStreak = profile?.longestStreak ?? currentStreak;
  const longestStreakDateStr = useMemo(() => {
    if (longestStreak === currentStreak && currentStreak > 0) {
      return currentStreakDateStr;
    }
    const end = new Date();
    if (profile?.lastSessionAt) {
      end.setTime(profile.lastSessionAt);
    }
    const start = new Date(end);
    start.setDate(end.getDate() - longestStreak + 1);
    const options = { month: 'short', day: 'numeric' } as const;
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  }, [longestStreak, currentStreak, currentStreakDateStr, profile]);

  if (!mounted) {
    return <div className="personal-bests-loading-placeholder">Loading Streaks...</div>;
  }

  // Orange circle calculations
  const R = 32;
  const C = 2 * Math.PI * R;
  const streakTarget = Math.max(10, currentStreak);
  const fillArc = streakTarget > 0 ? (currentStreak / streakTarget) * C : 0;

  return (
    <div className="personal-bests-container">
      {/* ── Streak Dashboard Widget (GitHub/LeetCode style) ── */}
      <div className="streak-dashboard">
        {/* Left: Active Days */}
        <div className="dashboard-col">
          <span className="db-value">
            <AnimatedCounter value={activeDays} />
          </span>
          <span className="db-label">Active Days</span>
          <span className="db-sublabel">{contributionRangeStr}</span>
        </div>

        {/* Center: Current Streak Circle Progress */}
        <div className="dashboard-col center-col">
          <div className="streak-circle-container">
            <svg viewBox="0 0 80 80" className="streak-circle-svg">
              <circle cx="40" cy="40" r={R} fill="none" stroke="var(--border-default)" strokeWidth="4" />
              <circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                stroke="#f97316" /* Deep orange */
                strokeWidth="4"
                strokeDasharray={`${fillArc} ${C - fillArc}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                className="streak-circle-fill"
              />
            </svg>
            <div className="streak-fire-icon">🔥</div>
            <div className="streak-number">
              <AnimatedCounter value={currentStreak} />
            </div>
          </div>
          <span className="db-label orange-text">Current Streak</span>
          <span className="db-sublabel">{currentStreakDateStr}</span>
        </div>

        {/* Right: Longest Streak */}
        <div className="dashboard-col">
          <span className="db-value">
            <AnimatedCounter value={longestStreak} />
          </span>
          <span className="db-label">Longest Streak</span>
          <span className="db-sublabel">{longestStreakDateStr}</span>
        </div>
      </div>

      <style jsx>{`
        .personal-bests-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          width: 100%;
        }

        .personal-bests-loading-placeholder {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-muted);
        }

        /* Streak Dashboard */
        .streak-dashboard {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg) 0;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .dashboard-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .dashboard-col:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 15%;
          height: 70%;
          width: 1px;
          background: var(--border-default);
        }

        .db-value {
          font-size: var(--text-3xl);
          font-weight: 800;
          color: var(--text-primary);
          font-family: var(--font-mono);
          line-height: 1.2;
        }

        .db-label {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .db-sublabel {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Circle Progress */
        .streak-circle-container {
          position: relative;
          width: 72px;
          height: 72px;
          margin-bottom: 4px;
        }

        .streak-circle-svg {
          width: 100%;
          height: 100%;
        }

        .streak-circle-fill {
          transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .streak-fire-icon {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.1rem;
          animation: flamePulse 1.5s ease-in-out infinite alternate;
        }

        .streak-number {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xl);
          font-weight: 800;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        .orange-text {
          color: #f97316 !important;
        }

        @keyframes flamePulse {
          0% { transform: translateX(-50%) scale(0.95); filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.4)); }
          100% { transform: translateX(-50%) scale(1.1); filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.8)); }
        }

        @media (max-width: 640px) {
          .streak-dashboard {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
            padding: var(--space-lg) 0;
          }

          .dashboard-col:not(:last-child)::after {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

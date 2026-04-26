/**
 * ProfileHeader — LeetCode-style profile header
 * Displays rank, XP count, and key stat pills
 */

import type { GamificationStats } from '@/engine/gamification';
import { formatDuration } from '@/engine/statsCalculator';

interface ProfileHeaderProps {
    stats: GamificationStats;
    isBeta?: boolean;
}

export function ProfileHeader({ stats, isBeta = false }: ProfileHeaderProps) {
    const statPills = [
        {
            label: 'Sessions',
            value: stats.badges.length > 0 ? '1+' : '0',
            color: 'hsl(210, 70%, 55%)',
        },
        {
            label: 'Best WPM',
            value: `${stats.bestWpm}`,
            color: 'hsl(120, 70%, 55%)',
        },
        {
            label: 'Accuracy',
            value: `${Math.round(stats.avgAccuracy * 100)}%`,
            color: 'hsl(40, 90%, 55%)',
        },
        {
            label: 'Days Active',
            value: `${stats.currentStreak}`,
            color: 'hsl(0, 100%, 60%)',
        },
    ];

    return (
        <div className="profile-header">
            {/* Left: Rank */}
            <div className="header-left">
                <div className="rank-icon-large">{stats.rank.icon}</div>
                <div className="rank-info">
                    <h1 className="rank-title-large">{stats.rank.title}</h1>
                    <p className="rank-subtitle">{stats.xp.toLocaleString()} XP</p>
                </div>
            </div>

            {/* Middle: Stat Pills */}
            <div className="header-stats">
                {statPills.map((pill, idx) => (
                    <div key={idx} className="stat-pill">
                        <span className="pill-label">{pill.label}</span>
                        <span className="pill-value" style={{ color: pill.color }}>
                            {pill.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Right: Beta Badge */}
            {isBeta && (
                <div className="header-beta-badge">
                    <span className="beta-label">🚀 Beta</span>
                </div>
            )}

            <style jsx>{`
        .profile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-default);
          padding: var(--space-lg) var(--space-xl);
          margin-bottom: var(--space-lg);
          animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .rank-icon-large {
          font-size: 2.5rem;
          line-height: 1;
        }

        .rank-info {
          display: flex;
          flex-direction: column;
        }

        .rank-title-large {
          font-size: var(--text-lg);
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }

        .rank-subtitle {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }

        .header-stats {
          display: flex;
          gap: var(--space-md);
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          min-width: 80px;
        }

        .pill-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 2px;
        }

        .pill-value {
          font-family: var(--font-mono);
          font-size: var(--text-base);
          font-weight: 800;
        }

        .header-beta-badge {
          background: linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(238, 194, 36, 0.1) 100%);
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
        }

        .beta-label {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            gap: var(--space-md);
            align-items: flex-start;
          }

          .header-stats {
            width: 100%;
            flex-wrap: wrap;
          }

          .stat-pill {
            flex: 1 1 calc(50% - var(--space-sm) / 2);
          }

          .header-beta-badge {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
        </div>
    );
}

/**
 * ProfileSidebar — LeetCode-style sticky left sidebar
 * Displays user rank, XP progress, and mini stats
 */

import type { GamificationStats } from '@/engine/gamification';

interface ProfileSidebarProps {
    stats: GamificationStats;
}

export function ProfileSidebar({ stats }: ProfileSidebarProps) {
    const progressPercent = Math.min(100, (stats.xp / (stats.xpToNextRank || 1)) * 100);

    const miniStats = [
        { label: 'Words', value: stats.totalWords.toLocaleString() },
        { label: 'Time', value: `${Math.round(stats.totalTime / 60000)} min` },
        { label: 'Streak', value: `${stats.currentStreak} days` },
        { label: 'Lessons', value: `${stats.lessonsCompleted}` },
    ];

    return (
        <div className="profile-sidebar">
            <div className="sidebar-card">
                {/* Rank Section */}
                <div className="sidebar-rank">
                    <div className="rank-badge">{stats.rank.icon}</div>
                    <h2 className="rank-name">{stats.rank.title}</h2>
                    <p className="rank-level">Level {stats.xp}</p>
                </div>

                {/* XP Progress */}
                <div className="xp-section">
                    <div className="xp-header">
                        <span className="xp-label">XP Progress</span>
                        <span className="xp-next">
                            {stats.xpToNextRank > 0 ? `${stats.xpToNextRank} to next` : 'Max'}
                        </span>
                    </div>
                    <div className="xp-bar">
                        <div className="xp-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="xp-count">{stats.xp.toLocaleString()} / {(stats.xp + stats.xpToNextRank).toLocaleString()}</p>
                </div>

                {/* Mini Stats Grid */}
                <div className="mini-stats-grid">
                    {miniStats.map((stat, idx) => (
                        <div key={idx} className="mini-stat">
                            <span className="mini-label">{stat.label}</span>
                            <span className="mini-value">{stat.value}</span>
                        </div>
                    ))}
                </div>

                {/* Edit Profile Button */}
                <button className="edit-profile-btn">
                    ⚙️ Customize Profile
                </button>
            </div>

            <style jsx>{`
        .profile-sidebar {
          position: sticky;
          top: var(--space-lg);
          width: 100%;
          max-width: 280px;
          height: fit-content;
          animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .sidebar-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .sidebar-rank {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border-default);
        }

        .rank-badge {
          font-size: 3rem;
          line-height: 1;
          margin-bottom: var(--space-sm);
        }

        .rank-name {
          font-size: var(--text-lg);
          font-weight: 800;
          margin: 0 0 var(--space-xs) 0;
          color: var(--color-primary);
        }

        .rank-level {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0;
        }

        .xp-section {
          margin-bottom: var(--space-lg);
        }

        .xp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .xp-label {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-muted);
        }

        .xp-next {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .xp-bar {
          height: 8px;
          background: var(--bg-overlay);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--space-xs);
        }

        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
          border-radius: var(--radius-full);
          transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .xp-count {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-align: center;
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
          padding: var(--space-md);
          background: var(--bg-overlay);
          border-radius: var(--radius-md);
        }

        .mini-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .mini-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 2px;
        }

        .mini-value {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          font-weight: 800;
          color: var(--color-primary);
        }

        .edit-profile-btn {
          width: 100%;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-profile-btn:hover {
          border-color: var(--color-primary);
          background: var(--bg-hover);
          color: var(--color-primary);
        }

        @media (max-width: 1024px) {
          .profile-sidebar {
            max-width: 100%;
            position: static;
            top: auto;
          }
        }
      `}</style>
        </div>
    );
}

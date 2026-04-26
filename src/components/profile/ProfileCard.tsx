/**
 * ProfileCard — Left column sticky profile card
 * Displays avatar, user info, rank, XP, and key stats
 */

import { useSession } from 'next-auth/react';
import type { GamificationStats } from '@/engine/gamification';
import type { UserProfile } from '@/db/schema';

interface ProfileCardProps {
  stats: GamificationStats;
  profile: UserProfile | null;
}

export function ProfileCard({ stats, profile }: ProfileCardProps) {
  const { data: session } = useSession();

  const displayName = session?.user?.name ?? profile?.displayName ?? 'Typist';
  const avatarUrl = session?.user?.image ?? null;
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'New User';

  const quickStats = [
    { label: 'Best WPM', value: `${stats.bestWpm}` },
    { label: 'Accuracy', value: `${Math.round(stats.avgAccuracy * 100)}%` },
    { label: 'Sessions', value: `${profile?.totalSessions ?? 0}` },
    { label: 'Words', value: stats.totalWords.toLocaleString() },
    { label: 'Time', value: `${Math.round(stats.totalTime / 60000)}m` },
    { label: 'Lessons', value: `${stats.lessonsCompleted}` },
  ];

  const xpPercent = stats.xpToNextRank > 0
    ? Math.min(100, (stats.xp / (stats.xp + stats.xpToNextRank)) * 100)
    : 100;

  return (
    <aside className="profile-card">
      {/* Avatar */}
      <div className="avatar-section">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="user-name">{displayName}</h2>
        <p className="user-joined">Joined {joinDate}</p>
      </div>

      {/* Rank & XP */}
      <div className="rank-section">
        <div className="rank-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/badges/${stats.rank.type === 'beginner' ? 'first-steps' : stats.rank.type === 'master' ? 'perfectionist' : 'speed-demon'}.svg`} alt="" width={28} height={28} className="rank-svg" />
          <div>
            <span className="rank-title">{stats.rank.title}</span>
            <span className="rank-xp">{stats.xp.toLocaleString()} XP</span>
          </div>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <p className="xp-label">
          {stats.xpToNextRank > 0 ? `${stats.xpToNextRank} XP to next rank` : 'Max rank reached'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {quickStats.map((s, i) => (
          <div key={i} className="stat-cell">
            <span className="stat-val">{s.value}</span>
            <span className="stat-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="streak-section">
        <div className="streak-row current">
          <span className="streak-icon">🔥</span>
          <div className="streak-info">
            <span className="streak-val">{stats.currentStreak}</span>
            <span className="streak-lbl">Current Streak</span>
          </div>
        </div>
        <div className="streak-row longest">
          <span className="streak-icon">🏅</span>
          <div className="streak-info">
            <span className="streak-val">{profile?.longestStreak ?? stats.currentStreak}</span>
            <span className="streak-lbl">Longest Ever</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-card {
          position: sticky;
          top: calc(var(--header-height) + var(--space-lg));
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          animation: cardSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          height: fit-content;
        }

        @keyframes cardSlide {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Avatar */
        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border-default);
        }

        .avatar-img {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid var(--color-primary);
          object-fit: cover;
          margin-bottom: var(--space-sm);
        }

        .avatar-placeholder {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-2xl);
          font-weight: 800;
          color: white;
          margin-bottom: var(--space-sm);
        }

        .user-name {
          font-size: var(--text-lg);
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }

        .user-joined {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 4px 0 0 0;
        }

        /* Rank */
        .rank-section {
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border-default);
        }

        .rank-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .rank-svg {
          border-radius: 50%;
          flex-shrink: 0;
        }

        .rank-title {
          display: block;
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--color-primary);
        }

        .rank-xp {
          display: block;
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .xp-bar {
          height: 6px;
          background: var(--bg-overlay);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 4px;
        }

        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
        }

        .xp-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-align: center;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: var(--space-sm);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border-default);
        }

        .stat-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--space-xs);
          background: var(--bg-overlay);
          border-radius: var(--radius-sm);
        }

        .stat-val {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          font-weight: 800;
          color: var(--text-primary);
        }

        .stat-lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 1px;
        }

        /* Streak */
        .streak-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .streak-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          background: var(--bg-overlay);
          border-radius: var(--radius-md);
        }

        .streak-row.longest {
          background: linear-gradient(135deg, rgba(238, 194, 36, 0.08), transparent);
          border: 1px solid rgba(238, 194, 36, 0.15);
        }

        .streak-icon {
          font-size: 1.2rem;
        }

        .streak-info {
          display: flex;
          flex-direction: column;
        }

        .streak-val {
          font-family: var(--font-mono);
          font-size: var(--text-base);
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }

        .streak-lbl {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .profile-card {
            position: static;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-start;
          }

          .avatar-section {
            border-bottom: none;
            padding-bottom: 0;
            border-right: 1px solid var(--border-default);
            padding-right: var(--space-lg);
          }

          .stats-grid {
            grid-template-columns: repeat(6, 1fr);
            border-bottom: none;
            padding-bottom: 0;
          }

          .streak-section {
            flex-direction: row;
          }
        }
      `}</style>
    </aside>
  );
}

/**
 * SeasonChallenge — LeetCode-style "Locked Badge" / monthly challenge
 * Shows current season challenge with SVG progress ring
 */

import type { SeasonChallengeProgress } from '@/engine/gamification';

interface SeasonChallengeProps {
  progress: SeasonChallengeProgress;
}

export function SeasonChallenge({ progress }: SeasonChallengeProps) {
  const { challenge, current, target, percentage, completed, monthLabel } = progress;

  const R = 38;
  const C = 2 * Math.PI * R;
  const fillArc = (percentage / 100) * C;

  return (
    <div className={`season-challenge ${completed ? 'completed' : ''}`}>
      <div className="season-header">
        <span className="season-label">Season Challenge</span>
        <span className="season-month">{monthLabel}</span>
      </div>

      <div className="season-body">
        {/* Progress Ring */}
        <div className="ring-container">
          <svg viewBox="0 0 96 96" className="ring-svg">
            <circle cx="48" cy="48" r={R} fill="none" stroke="var(--bg-overlay)" strokeWidth="6" />
            <circle
              cx="48"
              cy="48"
              r={R}
              fill="none"
              stroke={completed ? '#34d399' : percentage > 80 ? '#eec224' : '#818cf8'}
              strokeWidth="6"
              strokeDasharray={`${fillArc} ${C - fillArc}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              className="ring-fill"
            />
          </svg>
          <div className="ring-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={challenge.icon}
              alt={challenge.title}
              width={36}
              height={36}
              className={`badge-svg ${completed ? '' : 'locked'}`}
            />
          </div>
        </div>

        {/* Info */}
        <div className="season-info">
          <h3 className="season-title">{challenge.title}</h3>
          <p className="season-desc">{challenge.description}</p>
          <div className="season-progress">
            <span className="progress-current">{current}</span>
            <span className="progress-sep">/</span>
            <span className="progress-target">{target}</span>
            {completed && <span className="progress-check">✓</span>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .season-challenge {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          transition: all 0.3s ease;
        }

        .season-challenge.completed {
          border-color: rgba(52, 211, 153, 0.3);
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.05), transparent);
        }

        .season-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .season-label {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .season-month {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-primary);
          background: var(--color-primary-glow);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .season-body {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .ring-container {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .ring-svg {
          width: 100%;
          height: 100%;
        }

        .ring-fill {
          transition: stroke-dasharray 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ring-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .badge-svg {
          border-radius: 50%;
        }

        .badge-svg.locked {
          opacity: 0.4;
          filter: grayscale(0.6);
        }

        .season-info {
          flex: 1;
          min-width: 0;
        }

        .season-title {
          font-size: var(--text-base);
          font-weight: 700;
          margin: 0 0 4px 0;
          color: var(--text-primary);
        }

        .season-desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0 0 var(--space-sm) 0;
        }

        .season-progress {
          display: flex;
          align-items: baseline;
          gap: 2px;
          font-family: var(--font-mono);
        }

        .progress-current {
          font-size: var(--text-lg);
          font-weight: 800;
          color: var(--color-primary);
        }

        .progress-sep {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .progress-target {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: 600;
        }

        .progress-check {
          font-size: var(--text-base);
          color: var(--color-success);
          font-weight: 800;
          margin-left: var(--space-xs);
        }

        .season-challenge.completed .ring-container {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(52, 211, 153, 0.3)); }
          50% { filter: drop-shadow(0 0 12px rgba(52, 211, 153, 0.5)); }
        }
      `}</style>
    </div>
  );
}

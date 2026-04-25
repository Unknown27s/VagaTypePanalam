/**
 * BadgeCard — Compact achievement badge card with SVG icon
 * Shows icon + title when earned, icon + progress bar when locked
 * Full details on hover tooltip
 */

import type { Badge, BadgeProgress } from '@/engine/gamification';
import { getRarityColor } from '@/engine/gamification';
import { useState } from 'react';

interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
  progress?: BadgeProgress;
  earnedDate?: number;
}

export function BadgeCard({
  badge,
  earned,
  progress,
  earnedDate,
}: BadgeCardProps) {
  const rarityColor = getRarityColor(badge.rarity);
  const progressPercent = progress ? progress.percentage : 0;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`badge-card ${earned ? 'earned' : 'locked'}`}
      style={{
        borderColor: earned ? rarityColor : 'rgba(255, 255, 255, 0.06)',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* SVG Icon */}
      <div className="badge-icon-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badge.icon}
          alt={badge.title}
          width={36}
          height={36}
          className={`badge-svg ${earned ? '' : 'locked-svg'}`}
        />
      </div>

      {/* Title */}
      <span className="badge-name">{badge.title}</span>

      {/* Progress bar for locked badges */}
      {!earned && progress && (
        <div className="mini-progress">
          <div
            className="mini-fill"
            style={{ width: `${progressPercent}%`, background: rarityColor }}
          />
        </div>
      )}

      {/* Earned checkmark */}
      {earned && <span className="earned-check">✓</span>}

      {/* Hover Tooltip */}
      {showTooltip && (
        <div className="badge-tooltip">
          <p className="tooltip-desc">{badge.description}</p>
          <div className="tooltip-meta">
            <span className="tooltip-rarity" style={{ color: rarityColor }}>{badge.rarity}</span>
            {earned && earnedDate && (
              <span className="tooltip-date">
                {new Date(earnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {!earned && progress && (
              <span className="tooltip-progress">{progress.current}/{progress.target}</span>
            )}
          </div>
          {!earned && progress?.hint && (
            <p className="tooltip-hint">{progress.hint}</p>
          )}
        </div>
      )}

      <style jsx>{`
        .badge-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: var(--bg-overlay);
          border: 1.5px solid;
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-xs);
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
          gap: 4px;
        }

        .badge-card.earned {
          background: linear-gradient(135deg, rgba(255,255,255,0.03), transparent);
        }

        .badge-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          border-color: var(--color-primary) !important;
        }

        .badge-icon-wrap {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }

        .badge-svg {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .locked-svg {
          opacity: 0.35;
          filter: grayscale(0.7);
        }

        .badge-card:hover .locked-svg {
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        .badge-name {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .badge-card.locked .badge-name {
          color: var(--text-muted);
        }

        .mini-progress {
          width: 100%;
          height: 3px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .mini-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .earned-check {
          font-size: 0.6rem;
          color: var(--color-success);
          font-weight: 800;
        }

        /* Tooltip */
        .badge-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20, 20, 20, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          min-width: 160px;
          z-index: 100;
          pointer-events: none;
          animation: tooltipFade 0.15s ease;
        }

        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .tooltip-desc {
          font-size: var(--text-xs);
          color: var(--text-primary);
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .tooltip-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tooltip-rarity {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .tooltip-date, .tooltip-progress {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-weight: 600;
        }

        .tooltip-hint {
          font-size: 0.6rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 4px 0 0 0;
        }
      `}</style>
    </div>
  );
}

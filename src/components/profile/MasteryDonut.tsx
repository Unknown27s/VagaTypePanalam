/**
 * MasteryDonut — SVG donut chart showing key confidence distribution
 * Inspired by LeetCode's "Solved" donut chart
 */

import type { KeyStat } from '@/db/schema';

interface MasteryDonutProps {
  keyStats: KeyStat[];
}

export function MasteryDonut({ keyStats }: MasteryDonutProps) {
  const total = keyStats.length;
  const mastered = keyStats.filter((k) => k.confidence >= 0.8).length;
  const learning = keyStats.filter((k) => k.confidence >= 0.4 && k.confidence < 0.8).length;
  const weak = keyStats.filter((k) => k.confidence < 0.4).length;

  // SVG donut math
  const R = 54;
  const C = 2 * Math.PI * R;
  const masteredArc = total > 0 ? (mastered / total) * C : 0;
  const learningArc = total > 0 ? (learning / total) * C : 0;
  const weakArc = total > 0 ? (weak / total) * C : 0;

  const masteredOffset = 0;
  const learningOffset = -(masteredArc);
  const weakOffset = -(masteredArc + learningArc);

  const segments = [
    { arc: masteredArc, offset: masteredOffset, color: '#34d399', label: 'Mastered', count: mastered },
    { arc: learningArc, offset: learningOffset, color: '#eec224', label: 'Learning', count: learning },
    { arc: weakArc, offset: weakOffset, color: '#f87171', label: 'Weak', count: weak },
  ];

  return (
    <div className="mastery-donut">
      <div className="donut-chart">
        <svg viewBox="0 0 128 128" className="donut-svg">
          {/* Background ring */}
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--bg-overlay)" strokeWidth="12" />
          {/* Segments */}
          {total > 0 && segments.map((seg, i) => (
            seg.arc > 0 && (
              <circle
                key={i}
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${seg.arc} ${C - seg.arc}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                className="donut-segment"
                style={{ animationDelay: `${i * 0.15}s` }}
                transform="rotate(-90 64 64)"
              />
            )
          ))}
        </svg>
        <div className="donut-center">
          <span className="donut-total">{total}</span>
          <span className="donut-label">Keys</span>
        </div>
      </div>

      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="legend-row">
            <span className="legend-dot" style={{ background: seg.color }} />
            <span className="legend-label">{seg.label}</span>
            <span className="legend-count">{seg.count}/{total}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .mastery-donut {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .donut-chart {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
        }

        .donut-segment {
          animation: donutDraw 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes donutDraw {
          from { stroke-dasharray: 0 ${C}; }
        }

        .donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-total {
          font-size: var(--text-2xl);
          font-weight: 800;
          color: var(--text-primary);
          font-family: var(--font-mono);
          line-height: 1;
        }

        .donut-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 2px;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .legend-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: 600;
          min-width: 70px;
        }

        .legend-count {
          font-size: var(--text-sm);
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--text-primary);
        }

        @media (max-width: 480px) {
          .mastery-donut {
            flex-direction: column;
            align-items: center;
          }

          .donut-legend {
            flex-direction: row;
            gap: var(--space-md);
          }
        }
      `}</style>
    </div>
  );
}

'use client';

/**
 * VangaTypePanalam — Right Sidebar (Practice Page)
 *
 * Displays live analytics from the current typing session:
 * - Consistency with mini bar chart (burst history)
 * - Key Latency, Error Rate, Burst Speed
 * - Next Milestone gamification card
 */

import { useTypingStore } from '@/store/typingStore';
import { Trophy, Activity } from 'lucide-react';

export default function RightSidebar() {
  const snapshot = useTypingStore((s) => s.snapshot);

  const consistency = snapshot ? Math.round(snapshot.consistency * 100) : 0;
  const burstHistory = snapshot?.burstHistory ?? [];
  const errorRate = snapshot && snapshot.totalKeystrokes > 0
    ? ((snapshot.errorChars / snapshot.totalKeystrokes) * 100).toFixed(2)
    : '0.00';
  const burstSpeed = burstHistory.length > 0
    ? Math.max(...burstHistory)
    : 0;

  // Simulated key latency from snapshot (average based on elapsed and keystrokes)
  const avgLatency = snapshot && snapshot.totalKeystrokes > 0 && snapshot.elapsedMs > 0
    ? Math.round(snapshot.elapsedMs / snapshot.totalKeystrokes)
    : 0;

  // Milestone logic
  const currentWpm = snapshot?.wpm ?? 0;
  const milestoneTarget = Math.ceil(currentWpm / 10) * 10 + 10;

  // Build burst chart bars (last 10 entries)
  const chartBars = burstHistory.slice(-10);
  const maxBurst = Math.max(...chartBars, 1);

  return (
    <aside className="right-sidebar">
      {/* ── Live Analytics ── */}
      <div className="sidebar-card">
        <h3 className="card-label">Live Analytics</h3>

        {/* Consistency + Chart */}
        <div className="analytics-block">
          <div className="analytics-header">
            <span>CONSISTENCY</span>
            <span className="analytics-value">{consistency}%</span>
          </div>
          <div className="burst-chart">
            {chartBars.length > 0 ? (
              chartBars.map((val, i) => {
                const heightPct = Math.max((val / maxBurst) * 100, 8);
                const opacity = 0.2 + (i / chartBars.length) * 0.8;
                return (
                  <div
                    key={i}
                    className="burst-bar"
                    style={{
                      height: `${heightPct}%`,
                      opacity,
                    }}
                  />
                );
              })
            ) : (
              Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="burst-bar empty"
                  style={{ height: `${20 + i * 8}%`, opacity: 0.08 }}
                />
              ))
            )}
          </div>
        </div>

        {/* Stat Rows */}
        <div className="stat-rows">
          <div className="stat-row">
            <span className="stat-label">Key Latency</span>
            <span className="stat-value-mono">{avgLatency}ms</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Error Rate</span>
            <span className="stat-value-mono">{errorRate}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Burst Speed</span>
            <span className="stat-value-mono accent">{burstSpeed}wpm</span>
          </div>
        </div>
      </div>

      {/* ── Next Milestone ── */}
      <div className="milestone-card">
        <div className="milestone-inner">
          <Trophy size={28} className="milestone-icon" />
          <div className="milestone-text">
            <p className="milestone-title">Next Milestone</p>
            <p className="milestone-desc">
              Reach {milestoneTarget} WPM consistently for 5 sessions to unlock the next tier.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .right-sidebar {
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

        /* ── Analytics Block ── */
        .analytics-block {
          margin-bottom: var(--space-lg);
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: var(--space-sm);
        }

        .analytics-value {
          color: var(--text-primary);
          font-weight: 600;
        }

        .burst-chart {
          height: 64px;
          display: flex;
          align-items: flex-end;
          gap: 3px;
          padding: 0 2px;
        }

        .burst-bar {
          flex: 1;
          background: var(--color-primary);
          border-radius: 2px 2px 0 0;
          min-height: 4px;
          transition: height 0.3s ease;
        }

        .burst-bar.empty {
          background: var(--color-primary);
        }

        /* ── Stat Rows ── */
        .stat-rows {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid var(--border-subtle);
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .stat-value-mono {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-primary);
          font-weight: 600;
        }

        .stat-value-mono.accent {
          color: var(--color-primary-light);
        }

        /* ── Milestone Card ── */
        .milestone-card {
          background: var(--color-primary-glow);
          border: 1px solid rgba(129, 140, 248, 0.1);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .milestone-inner {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
        }

        .milestone-icon {
          color: var(--color-accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .milestone-title {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .milestone-desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          line-height: var(--leading-relaxed);
        }
      `}</style>
    </aside>
  );
}

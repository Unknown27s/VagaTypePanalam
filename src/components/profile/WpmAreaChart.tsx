'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Session } from '@/db/schema';

interface WpmAreaChartProps {
  sessions: Session[];
}

export function WpmAreaChart({ sessions }: WpmAreaChartProps) {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter and format session data for Recharts
  const chartData = useMemo(() => {
    if (sessions.length === 0) return [];

    // Sort chronologically (oldest to newest) for line charts
    const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt);

    // Apply date range filters
    const now = Date.now();
    const filtered = sorted.filter((s) => {
      if (filter === '7d') return now - s.startedAt <= 7 * 24 * 60 * 60 * 1000;
      if (filter === '30d') return now - s.startedAt <= 30 * 24 * 60 * 60 * 1000;
      return true; // 'all'
    });

    return filtered.map((s, idx) => {
      const date = new Date(s.startedAt);
      return {
        index: idx + 1,
        dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        wpm: s.wpm,
        rawWpm: s.rawWpm || s.wpm, // Fallback if rawWpm is missing
        accuracy: Math.round(s.accuracy * 100),
      };
    });
  }, [sessions, filter]);

  if (!mounted) {
    return <div className="chart-loading-placeholder">Loading Speed Chart...</div>;
  }

  if (chartData.length === 0) {
    return (
      <div className="wpm-area-chart-container empty">
        <div className="filter-bar">
          <h3 className="chart-title">WPM Progress</h3>
          <div className="filter-buttons">
            {(['7d', '30d', 'all'] as const).map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="empty-chart-state">
          No practice data recorded in this period. Complete a session to see your progress!
        </div>
      </div>
    );
  }

  return (
    <div className="wpm-area-chart-container">
      <div className="filter-bar">
        <h3 className="chart-title">WPM Progress</h3>
        <div className="filter-buttons">
          {(['7d', '30d', 'all'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRawWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-chart-tooltip">
                      <p className="tooltip-date">{data.dateStr}</p>
                      <div className="tooltip-stats">
                        <div className="tooltip-stat">
                          <span className="dot primary" />
                          <span className="label">WPM:</span>
                          <span className="value">{data.wpm}</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot accent" />
                          <span className="label">Raw WPM:</span>
                          <span className="value">{data.rawWpm}</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot green" />
                          <span className="label">Accuracy:</span>
                          <span className="value">{data.accuracy}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="wpm"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWpm)"
              name="WPM"
            />
            <Area
              type="monotone"
              dataKey="rawWpm"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorRawWpm)"
              name="Raw WPM"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .wpm-area-chart-container {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          width: 100%;
        }

        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .chart-title {
          font-size: var(--text-base);
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .filter-buttons {
          display: flex;
          background: var(--bg-overlay);
          padding: 2px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
        }

        .filter-btn {
          background: none;
          border: none;
          padding: 4px 12px;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          color: var(--text-primary);
        }

        .filter-btn.active {
          background: var(--bg-surface);
          color: var(--color-primary-light);
          box-shadow: var(--shadow-sm);
        }

        .chart-wrapper {
          width: 100%;
          min-height: 300px;
        }

        .chart-loading-placeholder {
          height: 350px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-muted);
        }

        .empty-chart-state {
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: var(--text-sm);
          text-align: center;
          padding: 0 var(--space-xl);
        }

        :global(.custom-chart-tooltip) {
          background: rgba(19, 19, 19, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border-default);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
        }

        :global(.tooltip-date) {
          margin: 0 0 6px 0;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
        }

        :global(.tooltip-stats) {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        :global(.tooltip-stat) {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        :global(.tooltip-stat .dot) {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        :global(.tooltip-stat .dot.primary) {
          background: var(--color-primary);
        }

        :global(.tooltip-stat .dot.accent) {
          background: var(--color-accent);
        }

        :global(.tooltip-stat .dot.green) {
          background: var(--color-success);
        }

        :global(.tooltip-stat .label) {
          color: var(--text-secondary);
        }

        :global(.tooltip-stat .value) {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--text-primary);
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}

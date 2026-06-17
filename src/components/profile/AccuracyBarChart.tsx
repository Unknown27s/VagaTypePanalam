'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { Session } from '@/db/schema';

interface AccuracyBarChartProps {
  sessions: Session[];
}

export function AccuracyBarChart({ sessions }: AccuracyBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (sessions.length === 0) return [];

    // Sort chronologically (oldest to newest)
    const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt);

    // Take the last 20 sessions
    const recent = sorted.slice(-20);

    return recent.map((s, idx) => {
      const date = new Date(s.startedAt);
      const acc = Math.round(s.accuracy * 100);
      return {
        index: idx + 1,
        dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        accuracy: acc,
        wpm: s.wpm,
      };
    });
  }, [sessions]);

  if (!mounted) {
    return <div className="chart-loading-placeholder">Loading Accuracy Chart...</div>;
  }

  if (chartData.length === 0) {
    return null; // Parent handles empty states or hides it
  }

  return (
    <div className="accuracy-bar-chart-container">
      <h3 className="chart-title">Accuracy Profile (Last 20 Sessions)</h3>
      <p className="chart-subtitle">Aim for a consistency target of 95% or higher</p>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
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
              domain={[60, 100]} // Zoom into the 60%-100% range for better resolution
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
                          <span 
                            className="dot" 
                            style={{ 
                              background: data.accuracy >= 95 
                                ? 'var(--color-success)' 
                                : data.accuracy >= 85 
                                  ? 'var(--color-accent)' 
                                  : 'var(--color-error)' 
                            }} 
                          />
                          <span className="label">Accuracy:</span>
                          <span className="value">{data.accuracy}%</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot primary" />
                          <span className="label">WPM:</span>
                          <span className="value">{data.wpm}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={95}
              stroke="rgba(52, 211, 153, 0.4)"
              strokeDasharray="3 3"
              label={{
                value: 'Target 95%',
                position: 'top',
                fill: 'var(--color-success)',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} maxBarSize={30}>
              {chartData.map((entry, index) => {
                let color = 'var(--color-error)'; // < 85%
                if (entry.accuracy >= 95) {
                  color = 'var(--color-success)';
                } else if (entry.accuracy >= 85) {
                  color = 'var(--color-accent)';
                }
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .accuracy-bar-chart-container {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          width: 100%;
        }

        .chart-title {
          font-size: var(--text-base);
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .chart-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 4px 0 var(--space-lg) 0;
        }

        .chart-wrapper {
          width: 100%;
          min-height: 260px;
        }

        .chart-loading-placeholder {
          height: 310px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

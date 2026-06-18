'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
  accuracy: number;
}

interface SessionAreaChartProps {
  data: ChartDataPoint[];
}

export function SessionAreaChart({ data }: SessionAreaChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="chart-loading-placeholder">Loading Chart...</div>;
  }

  if (data.length === 0) return null;

  return (
    <div className="session-area-chart">
      <h4 className="chart-heading">Speed Over Time</h4>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="areaWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="areaRawWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="second"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={8}
              tickFormatter={(v) => `${v}s`}
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
                  const d = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="custom-chart-tooltip">
                      <p className="tooltip-date">{d.second}s</p>
                      <div className="tooltip-stats">
                        <div className="tooltip-stat">
                          <span className="dot primary" />
                          <span className="label">WPM:</span>
                          <span className="value">{d.wpm}</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot accent" />
                          <span className="label">Raw WPM:</span>
                          <span className="value">{d.rawWpm}</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot error" />
                          <span className="label">Errors:</span>
                          <span className="value">{d.errors}</span>
                        </div>
                        <div className="tooltip-stat">
                          <span className="dot green" />
                          <span className="label">Accuracy:</span>
                          <span className="value">{d.accuracy}%</span>
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
              fill="url(#areaWpm)"
              name="WPM"
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="rawWpm"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#areaRawWpm)"
              name="Raw WPM"
              animationDuration={800}
              animationBegin={150}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot wpm-dot" />
          <span className="legend-text">WPM</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot raw-dot" />
          <span className="legend-text">Raw Speed</span>
        </div>
      </div>

      <style jsx>{`
        .session-area-chart {
          width: 100%;
        }
        .chart-heading {
          font-size: var(--text-sm);
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .chart-wrapper {
          width: 100%;
          min-height: 240px;
        }
        .chart-loading-placeholder {
          height: 290px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: var(--space-lg);
          margin-top: var(--space-sm);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .wpm-dot {
          background: var(--color-primary);
        }
        .raw-dot {
          background: var(--color-accent);
          border: 1px dashed rgba(255,255,255,0.4);
        }
        .legend-text {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

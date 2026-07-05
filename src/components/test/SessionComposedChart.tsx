'use client';

import { useMounted } from '@/hooks/useMounted';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
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

interface SessionComposedChartProps {
  data: ChartDataPoint[];
}

export function SessionComposedChart({ data }: SessionComposedChartProps) {
  const mounted = useMounted();

  if (!mounted) {
    return <div className="chart-loading-placeholder">Loading Chart...</div>;
  }

  if (data.length === 0) return null;

  return (
    <div className="session-composed-chart">
      <h4 className="chart-heading">Combined Performance</h4>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="composedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
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
              yAxisId="left"
              stroke="var(--color-primary)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-5}
              label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10, dy: 40 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--color-error)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={5}
              label={{ value: 'Errors', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 10, dy: -40 }}
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
              yAxisId="left"
              type="monotone"
              dataKey="wpm"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#composedArea)"
              name="WPM"
              animationDuration={800}
            />
            <Bar
              yAxisId="right"
              dataKey="errors"
              fill="var(--color-error)"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
              maxBarSize={8}
              name="Errors"
              animationDuration={800}
              animationBegin={200}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="accuracy"
              stroke="var(--color-success)"
              strokeWidth={2}
              dot={false}
              name="Accuracy"
              animationDuration={800}
              animationBegin={400}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot wpm-dot" />
          <span className="legend-text">WPM</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot err-dot" />
          <span className="legend-text">Errors</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot acc-dot" />
          <span className="legend-text">Accuracy</span>
        </div>
      </div>

      <style jsx>{`
        .session-composed-chart {
          width: 100%;
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-lg);
          margin-top: var(--space-lg);
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
          min-height: 220px;
        }
        .chart-loading-placeholder {
          height: 270px;
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
        .err-dot {
          background: var(--color-error);
        }
        .acc-dot {
          background: var(--color-success);
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

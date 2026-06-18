'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  label: string;
  value: string;
  data?: { value: number }[];
  color?: string;
}

export function MetricCard({ label, value, data, color }: MetricCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="metric-card">
      <span className="metric-card-label">{label}</span>
      <span className="metric-card-value">{value}</span>
      {mounted && data && data.length > 1 && (
        <div className="metric-card-sparkline">
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color || 'var(--color-primary)'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

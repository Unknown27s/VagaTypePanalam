'use client';

import { useMemo } from 'react';
import { useMounted } from '@/hooks/useMounted';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { KeystrokeRecord } from '@/db/schema';
import { calculateKogasa } from '@/engine/statsCalculator';

interface SessionRadarChartProps {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  keystrokeLog: KeystrokeRecord[];
  correctChars: number;
  errorChars: number;
  totalChars: number;
}

export function SessionRadarChart({
  wpm,
  accuracy,
  keystrokeLog,
  correctChars,
  errorChars,
}: SessionRadarChartProps) {
  const mounted = useMounted();

  const radarData = useMemo(() => {
    const speedScore = Math.min(100, Math.round((wpm / 150) * 100));
    const accuracyScore = Math.round(accuracy * 100);

    const allLatencies = (keystrokeLog || []).map((k) => k.latencyMs);
    const consistencyScore =
      allLatencies.length > 0
        ? Math.round(calculateKogasa(allLatencies) * 100)
        : 50;

    const totalAttempted = correctChars + errorChars;
    const errorRate = totalAttempted > 0 ? errorChars / totalAttempted : 0;
    const controlScore = Math.round(Math.max(0, 100 - errorRate * 200));

    const avgLatency =
      allLatencies.length > 0
        ? allLatencies.reduce((s, v) => s + v, 0) / allLatencies.length
        : 300;
    const flowScore = Math.round(Math.max(0, 100 - (avgLatency / 300) * 100));

    return [
      { subject: 'Speed', value: speedScore, fullMark: 100 },
      { subject: 'Accuracy', value: accuracyScore, fullMark: 100 },
      { subject: 'Consistency', value: consistencyScore, fullMark: 100 },
      { subject: 'Control', value: controlScore, fullMark: 100 },
      { subject: 'Flow', value: flowScore, fullMark: 100 },
    ];
  }, [wpm, accuracy, keystrokeLog, correctChars, errorChars]);

  if (!mounted) {
    return <div className="radar-loading-placeholder">Loading Skills...</div>;
  }

  return (
    <div className="session-radar-chart">
      <h4 className="radar-title">Session Skills</h4>
      <div className="radar-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
            <PolarGrid stroke="var(--border-subtle)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Session"
              dataKey="value"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.25}
              animationDuration={1000}
              animationBegin={200}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .session-radar-chart {
          width: 100%;
        }
        .radar-title {
          font-size: var(--text-sm);
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .radar-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 220px;
        }
        .radar-loading-placeholder {
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

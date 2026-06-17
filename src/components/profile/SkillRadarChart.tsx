'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { Session, KeyStat } from '@/db/schema';
import { calculateKogasa } from '@/engine/statsCalculator';

interface SkillRadarChartProps {
  sessions: Session[];
  keyStats: KeyStat[];
}

export function SkillRadarChart({ sessions, keyStats }: SkillRadarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radarData = useMemo(() => {
    if (sessions.length === 0) {
      return [
        { subject: 'Speed', A: 0, fullMark: 100 },
        { subject: 'Accuracy', A: 0, fullMark: 100 },
        { subject: 'Consistency', A: 0, fullMark: 100 },
        { subject: 'Endurance', A: 0, fullMark: 100 },
        { subject: 'Mastery', A: 0, fullMark: 100 },
      ];
    }

    // 1. Speed (based on best net WPM relative to a target of 100 WPM)
    const bestWpm = Math.max(...sessions.map((s) => s.wpm));
    const speedScore = Math.min(100, Math.round((bestWpm / 100) * 100));

    // 2. Accuracy (based on average accuracy)
    const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
    const accuracyScore = Math.round(avgAccuracy * 100);

    // 3. Consistency (Kogasa score calculated from recent session latencies)
    const recentSessions = sessions.slice(0, 5);
    const allLatencies = recentSessions.flatMap((s) => 
      s.keystrokeLog ? s.keystrokeLog.map((k) => k.latencyMs) : []
    );
    const consistencyScore = allLatencies.length > 0 
      ? Math.round(calculateKogasa(allLatencies) * 100)
      : 50; // default/neutral value

    // 4. Endurance (based on total practice time, target of 60 mins total)
    const totalTimeMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
    const totalTimeMins = totalTimeMs / 60000;
    const enduranceScore = Math.min(100, Math.round((totalTimeMins / 60) * 100));

    // 5. Mastery (percentage of keys that are Mastered - confidence >= 0.8)
    const totalKeys = keyStats.length;
    const masteredKeys = keyStats.filter((k) => k.confidence >= 0.8).length;
    const masteryScore = totalKeys > 0
      ? Math.round((masteredKeys / totalKeys) * 100)
      : 0;

    return [
      { subject: 'Speed', A: speedScore, fullMark: 100 },
      { subject: 'Accuracy', A: accuracyScore, fullMark: 100 },
      { subject: 'Consistency', A: consistencyScore, fullMark: 100 },
      { subject: 'Endurance', A: enduranceScore, fullMark: 100 },
      { subject: 'Mastery', A: masteryScore, fullMark: 100 },
    ];
  }, [sessions, keyStats]);

  if (!mounted) {
    return <div className="radar-loading-placeholder">Loading Skills...</div>;
  }

  return (
    <div className="skill-radar-chart">
      <h3 className="radar-title">Skill Profile</h3>
      <div className="radar-wrapper">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
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
              name="Skills"
              dataKey="A"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .skill-radar-chart {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .radar-title {
          font-size: var(--text-base);
          font-weight: 700;
          margin: 0 0 var(--space-md) 0;
          align-self: flex-start;
          color: var(--text-primary);
        }

        .radar-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .radar-loading-placeholder {
          height: 290px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-muted);
          width: 100%;
        }
      `}</style>
    </div>
  );
}

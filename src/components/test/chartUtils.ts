import type { KeystrokeRecord } from '@/db/schema';

export interface ChartDataPoint {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
  accuracy: number;
}

export function generateChartData(keystrokeLog: KeystrokeRecord[], durationSeconds: number): ChartDataPoint[] {
  const dataPoints: ChartDataPoint[] = [];
  if (!keystrokeLog || keystrokeLog.length === 0) return [];

  let cumulativeMs = 0;
  const keystrokeTimes = keystrokeLog.map((k) => {
    cumulativeMs += k.latencyMs;
    return {
      timeMs: cumulativeMs,
      correct: k.correct,
    };
  });

  const totalDurationSeconds = durationSeconds > 0 ? durationSeconds : Math.ceil(cumulativeMs / 1000);

  for (let sec = 1; sec <= totalDurationSeconds; sec++) {
    const timeLimitMs = sec * 1000;

    const totalUpToSec = keystrokeTimes.filter(k => k.timeMs <= timeLimitMs).length;
    const correctUpToSec = keystrokeTimes.filter(k => k.timeMs <= timeLimitMs && k.correct).length;

    const errorsInSec = keystrokeTimes.filter(
      k => k.timeMs > (sec - 1) * 1000 && k.timeMs <= timeLimitMs && !k.correct
    ).length;

    const wpm = sec > 0 ? Math.round((correctUpToSec * 12) / sec) : 0;
    const rawWpm = sec > 0 ? Math.round((totalUpToSec * 12) / sec) : 0;

    const accuracy = totalUpToSec > 0 ? Math.round((correctUpToSec / totalUpToSec) * 100) : 100;

    dataPoints.push({
      second: sec,
      wpm,
      rawWpm,
      errors: errorsInSec,
      accuracy,
    });
  }

  return dataPoints;
}

export function getKeyAnalytics(keystrokeLog: KeystrokeRecord[]) {
  const statsMap: Record<string, { total: number; correct: number; latencySum: number }> = {};

  (keystrokeLog || []).forEach(k => {
    const char = k.char.toLowerCase();
    if (char === ' ' || char === 'enter' || char === 'backspace' || char.length !== 1) return;

    if (!statsMap[char]) {
      statsMap[char] = { total: 0, correct: 0, latencySum: 0 };
    }
    statsMap[char].total++;
    if (k.correct) statsMap[char].correct++;
    statsMap[char].latencySum += k.latencyMs;
  });

  const keyStats = Object.entries(statsMap).map(([char, s]) => {
    const accuracy = s.total > 0 ? s.correct / s.total : 1;
    const avgLatency = s.total > 0 ? s.latencySum / s.total : 0;
    return { char, accuracy, avgLatency, errors: s.total - s.correct };
  });

  const weakKeys = keyStats
    .filter(k => k.accuracy < 0.9 && k.errors > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  const slowKeys = keyStats
    .filter(k => k.avgLatency > 50)
    .sort((a, b) => b.avgLatency - a.avgLatency)
    .slice(0, 5);

  return { weakKeys, slowKeys };
}

export function getGradeColor(wpm: number): string {
  if (wpm >= 100) return 'var(--color-accent)';
  if (wpm >= 80) return 'var(--color-success)';
  if (wpm >= 65) return 'var(--color-primary-light)';
  if (wpm >= 50) return 'var(--color-warning)';
  if (wpm >= 35) return '#fb923c';
  return 'var(--color-error)';
}

'use client';

const DURATIONS = [15, 30, 60, 120, 300] as const;
export type Duration = typeof DURATIONS[number];

interface TestHeaderProps {
  selectedDuration: Duration;
  running: boolean;
  onChangeDuration: (d: Duration) => void;
}

export function TestHeader({ selectedDuration, running, onChangeDuration }: TestHeaderProps) {
  return (
    <div className="test-header">
      <h1 className="test-title gradient-text">Timed Test</h1>
      <div className="duration-segmented">
        {DURATIONS.map((d) => (
          <button
            key={d}
            className={`duration-seg-pill ${selectedDuration === d ? 'active' : ''}`}
            onClick={() => onChangeDuration(d)}
            disabled={running}
            id={`duration-${d}s`}
          >
            {d}s
          </button>
        ))}
      </div>
    </div>
  );
}

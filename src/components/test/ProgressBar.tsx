'use client';

interface ProgressBarProps {
  pct: number;
}

export function ProgressBar({ pct }: ProgressBarProps) {
  const color =
    pct >= 90
      ? 'var(--color-error)'
      : pct >= 70
        ? 'var(--color-accent)'
        : 'var(--color-success)';

  return (
    <div className="test-progress-bar">
      <div
        className="test-progress-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

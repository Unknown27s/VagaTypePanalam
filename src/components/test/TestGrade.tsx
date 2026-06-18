'use client';

interface TestGradeProps {
  wpm: number;
}

const grades = [
  { label: 'S', min: 100, color: 'var(--color-accent)', glow: 'rgba(238, 194, 36, 0.3)' },
  { label: 'A', min: 80, color: 'var(--color-success)', glow: 'rgba(52, 211, 153, 0.3)' },
  { label: 'B', min: 65, color: 'var(--color-primary-light)', glow: 'rgba(129, 140, 248, 0.3)' },
  { label: 'C', min: 50, color: 'var(--color-warning)', glow: 'rgba(251, 191, 36, 0.3)' },
  { label: 'D', min: 35, color: '#fb923c', glow: 'rgba(251, 146, 60, 0.3)' },
  { label: 'F', min: 0, color: 'var(--color-error)', glow: 'rgba(248, 113, 113, 0.3)' },
];

export function getGrade(wpm: number) {
  return grades.find((g) => wpm >= g.min) || grades[grades.length - 1];
}

export function TestGrade({ wpm }: TestGradeProps) {
  const grade = getGrade(wpm);

  return (
    <span
      className="test-grade-badge"
      style={{
        color: grade.color,
        boxShadow: `0 0 16px ${grade.glow}`,
        borderColor: grade.color,
      }}
    >
      {grade.label}
    </span>
  );
}

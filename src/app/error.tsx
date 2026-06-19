'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: "1.5rem",
        padding: "2rem",
        background: "var(--bg-base, #0e0e0e)",
        color: "var(--text-primary, #f1f5f9)",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          fontWeight: 800,
          color: "var(--color-accent, #f43f5e)",
          lineHeight: 1,
        }}
      >
        Oops!
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
        Something went wrong
      </h1>
      <p
        style={{
          color: "var(--text-secondary, #94a3b8)",
          maxWidth: 400,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "9999px",
          background: "var(--color-primary, #6366f1)",
          color: "white",
          fontWeight: 600,
          fontSize: "0.875rem",
          border: "none",
          cursor: "pointer",
          transition: "opacity 0.2s",
        }}
      >
        Try Again
      </button>
    </main>
  );
}

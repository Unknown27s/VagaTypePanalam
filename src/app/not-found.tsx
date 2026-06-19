import Link from "next/link";

export default function NotFound() {
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
          fontSize: "5rem",
          fontWeight: 800,
          color: "var(--color-primary, #6366f1)",
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
        Page Not Found
      </h1>
      <p
        style={{
          color: "var(--text-secondary, #94a3b8)",
          maxWidth: 400,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        The page you are looking for does not exist or has been moved.
        Let&apos;s get you back to typing practice.
      </p>
      <Link
        href="/"
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
          textDecoration: "none",
          transition: "opacity 0.2s",
        }}
      >
        Back to Practice
      </Link>
    </main>
  );
}

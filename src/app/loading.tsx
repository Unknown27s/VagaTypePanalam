export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: "1rem",
        background: "var(--bg-base, #0e0e0e)",
        color: "var(--text-muted, #94a3b8)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "2px solid var(--border-subtle, #1e293b)",
          borderTopColor: "var(--color-primary, #6366f1)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: "0.875rem" }}>Loading VangaTypePanalam...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

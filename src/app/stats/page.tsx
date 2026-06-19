import type { Metadata } from "next";
import StatsPage from "@/components/pages/StatsPage";

export const metadata: Metadata = {
  title: "Typing Stats & Profile — Track Your Progress",
  description:
    "Track your typing progress, view detailed analytics, achievements, WPM trends, key mastery heatmaps, and activity streaks.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io/stats",
  },
  openGraph: {
    title: "Typing Stats & Profile — Track Your Progress",
    description:
      "Track your typing progress, view detailed analytics, achievements, WPM trends, and key mastery heatmaps.",
    url: "/stats",
  },
};

export default function Page() {
  return (
    <>
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1rem 0",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-2xl, 1.5rem)",
            fontWeight: 800,
            margin: "0 0 0.25rem",
            color: "var(--text-primary, #f1f5f9)",
          }}
        >
          Typing Stats &amp; Profile
        </h1>
      </div>
      <StatsPage />
    </>
  );
}

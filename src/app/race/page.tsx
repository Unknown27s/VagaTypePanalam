import type { Metadata } from "next";
import RacePage from "@/components/pages/RacePage";

export const metadata: Metadata = {
  title: "Ghost Racing Mode — Compete & Improve Typing Speed",
  description:
    "Race against AI-powered bots to build competitive typing speed. Compete offline against simulated opponents with fixed WPM targets.",
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io/race",
  },
  openGraph: {
    type: "website",
    siteName: "VangaTypePanalam",
    title: "Ghost Racing Mode — Compete & Improve Typing Speed",
    description:
      "Race against AI-powered bots to build competitive typing speed. Compete offline against simulated opponents.",
    url: "https://vangatypepanalam.qzz.io/race",
  },
};

export default function Page() {
  return (
    <>
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1rem 0",
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
          Ghost Racing
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
          }}
        >
          Race against offline bots! Start typing to begin the race.
        </p>
      </div>
      <RacePage />
    </>
  );
}

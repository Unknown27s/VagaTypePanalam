import type { Metadata } from "next";
import TestPage from "@/components/pages/TestPage";

export const metadata: Metadata = {
  title: "Free WPM Typing Speed Test — Timed & Accurate",
  description:
    "Take a timed typing test to measure your WPM speed and accuracy. Choose from 15s, 30s, 60s, or 120s durations.",
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io/test",
  },
  openGraph: {
    type: "website",
    siteName: "VangaTypePanalam",
    title: "Free WPM Typing Speed Test — Timed & Accurate",
    description:
      "Take a timed typing test to measure your WPM speed and accuracy. Choose from 15s, 30s, 60s, or 120s durations.",
    url: "https://vangatypepanalam.qzz.io/test",
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
            fontSize: "var(--text-3xl, 1.875rem)",
            fontWeight: 800,
            margin: "0 0 0.5rem",
            color: "var(--text-primary, #f1f5f9)",
          }}
        >
          Timed Test
        </h1>
      </div>
      <TestPage showTitle={false} />
    </>
  );
}

import type { Metadata } from "next";
import HomePage from "@/components/pages/HomePage";

export const metadata: Metadata = {
  title: "Free Adaptive Typing Practice — English, Tamil & Tanglish",
  description:
    "Practice typing in English, Tamil & Tanglish with adaptive lessons, real-time feedback, and per-key tracking. Free, offline-capable, and personalized.",
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io",
  },
  openGraph: {
    title: "Free Adaptive Typing Practice — English, Tamil & Tanglish",
    description:
      "Practice typing in English, Tamil & Tanglish with adaptive lessons, real-time feedback, and per-key tracking.",
    url: "/",
  },
};

export default function Page() {
  return (
    <>
      <div
        style={{
          textAlign: "center",
          padding: "2.5rem 1rem 0",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-3xl, 1.875rem)",
            fontWeight: 800,
            marginBottom: "0.5rem",
            color: "var(--text-primary, #f1f5f9)",
          }}
        >
          Adaptive Typing Practice
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          Practice typing in English, Tamil &amp; Tanglish with real-time feedback and adaptive lessons
        </p>
      </div>
      <HomePage />
    </>
  );
}

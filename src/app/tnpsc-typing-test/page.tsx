import type { Metadata } from "next";
import TestPage from "@/components/pages/TestPage";

export const metadata: Metadata = {
  title: "TNPSC Tamil Typing Test — Free Online Practice 2026",
  description:
    "Prepare for TNPSC Group 4, VAO, TN Police typing exams with our free Tamil typing test. Practice Tamil99 & InScript layouts with real exam conditions. Target 30 WPM.",
  keywords: [
    "TNPSC typing test",
    "TNPSC Tamil typing test",
    "TNPSC typing test online",
    "TNPSC Group 4 typing test",
    "TNPSC VAO typing test",
    "TN Police typing test",
    "Tamil typing test for government exam",
    "TNPSC typing practice",
    "Tamil typing exam online",
    "TNPSC typing test 2026",
  ],
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io/tnpsc-typing-test",
  },
  openGraph: {
    type: "website",
    siteName: "VangaTypePanalam",
    title: "TNPSC Tamil Typing Test — Free Online Practice 2026",
    description:
      "Prepare for TNPSC Group 4, VAO, TN Police typing exams with our free Tamil typing test. Practice Tamil99 & InScript layouts.",
    url: "https://vangatypepanalam.qzz.io/tnpsc-typing-test",
  },
};

export default function TnpscTypingTestPage() {
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
            margin: "0 0 0.5rem",
            color: "var(--text-primary, #f1f5f9)",
          }}
        >
          TNPSC Tamil Typing Test — Free Practice
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            maxWidth: 600,
            margin: "0 auto 0.75rem",
            fontSize: "0.875rem",
          }}
        >
          Practice Tamil99 &amp; InScript layouts. Aim for 30 WPM net speed with backspace disabled.
          Select a duration below to start your TNPSC typing practice.
        </p>
      </div>
      <TestPage />
    </>
  );
}

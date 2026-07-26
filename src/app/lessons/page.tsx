import type { Metadata } from "next";
import LessonsPage from "@/components/pages/LessonsPage";

export const metadata: Metadata = {
  title: "Progressive Typing Lessons — Learn Touch Typing Free",
  description:
    "Learn touch typing from scratch with 30 progressive levels. Each lesson builds on the last, from home row to full-speed typing.",
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io/lessons",
  },
  openGraph: {
    type: "website",
    siteName: "VangaTypePanalam",
    title: "Progressive Typing Lessons — Learn Touch Typing Free",
    description:
      "Learn touch typing from scratch with 30 progressive levels. Each lesson builds on the last.",
    url: "https://vangatypepanalam.qzz.io/lessons",
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
            fontSize: "var(--text-3xl, 1.875rem)",
            fontWeight: 800,
            marginBottom: "0.5rem",
            color: "var(--text-primary, #f1f5f9)",
          }}
        >
          Typing Lessons
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          Progressive lessons from two keys to full-speed typing.
          Complete each level to unlock the next.
        </p>
      </div>
      <LessonsPage />
    </>
  );
}

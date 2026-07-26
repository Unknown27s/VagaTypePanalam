import type { Metadata } from "next";
import TestPage from "@/components/pages/TestPage";

export const metadata: Metadata = {
  title: "Tamil Typing Test 30 WPM — Free Online Speed Practice",
  description:
    "Check if you can type 30 WPM in Tamil. Free online Tamil typing speed test with Tamil99 keyboard. Practice for government exams, track accuracy and net WPM.",
  keywords: [
    "Tamil typing test 30 WPM",
    "30 WPM Tamil typing",
    "Tamil typing speed test",
    "Tamil typing test online free",
    "Tamil typing WPM test",
    "Tamil typing speed checker",
    "Tamil typing test 10 minutes",
    "Tamil typing exam 30 WPM",
    "Tamil typing practice online",
    "தமிழ் தட்டச்சு வேக சோதனை",
  ],
  alternates: {
    canonical: "https://vangatypepanalam.qzz.io/tamil-typing-test-30-wpm",
  },
  openGraph: {
    type: "website",
    siteName: "VangaTypePanalam",
    title: "Tamil Typing Test 30 WPM — Free Online Speed Practice",
    description:
      "Check if you can type 30 WPM in Tamil. Free online Tamil typing speed test with Tamil99 keyboard for government exam preparation.",
    url: "https://vangatypepanalam.qzz.io/tamil-typing-test-30-wpm",
  },
};

export default function TamilTyping30WpmPage() {
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
          Tamil Typing Test — Target 30 WPM
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            maxWidth: 600,
            margin: "0 auto 0.75rem",
            fontSize: "0.875rem",
          }}
        >
          The standard speed required for Tamil Nadu government typing exams is 30 WPM net.
          Practice with our Tamil99 keyboard, track your accuracy, and hit your target.
        </p>
      </div>
      <TestPage />
    </>
  );
}

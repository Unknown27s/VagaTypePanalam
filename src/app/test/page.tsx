import type { Metadata } from "next";
import TestPage from "@/components/pages/TestPage";

export const metadata: Metadata = {
  title: "WPM Typing Speed Test",
  description:
    "Take a timed typing test to measure your WPM speed and accuracy. Choose from 15s, 30s, 60s, or 120s durations.",
  openGraph: {
    title: "WPM Typing Speed Test — VangaTypePanalam",
    description:
      "Take a timed typing test to measure your WPM speed and accuracy. Choose from 15s, 30s, 60s, or 120s durations.",
    url: "/test",
  },
};

export default function Page() {
  return <TestPage />;
}

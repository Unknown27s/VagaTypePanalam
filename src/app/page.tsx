import type { Metadata } from "next";
import HomePage from "@/components/pages/HomePage";

export const metadata: Metadata = {
  title: "Free Adaptive Typing Practice",
  description:
    "Practice typing in English, Tamil & Tanglish with adaptive lessons, real-time feedback, and per-key tracking. Free, offline-capable, and personalized.",
  openGraph: {
    title: "Free Adaptive Typing Practice — VangaTypePanalam",
    description:
      "Practice typing in English, Tamil & Tanglish with adaptive lessons, real-time feedback, and per-key tracking.",
    url: "/",
  },
};

export default function Page() {
  return <HomePage />;
}

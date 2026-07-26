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
    type: "website",
    siteName: "VangaTypePanalam",
    title: "Free Adaptive Typing Practice — English, Tamil & Tanglish",
    description:
      "Practice typing in English, Tamil & Tanglish with adaptive lessons, real-time feedback, and per-key tracking.",
    url: "https://vangatypepanalam.qzz.io",
  },
};

export default function Page() {
  return (
    <>
      
      <HomePage />
    </>
  );
}

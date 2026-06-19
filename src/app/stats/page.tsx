import type { Metadata } from "next";
import StatsPage from "@/components/pages/StatsPage";

export const metadata: Metadata = {
  title: "Typing Stats & Profile",
  description:
    "Track your typing progress, view detailed analytics, achievements, WPM trends, key mastery heatmaps, and activity streaks.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Typing Stats & Profile — VangaTypePanalam",
    description:
      "Track your typing progress, view detailed analytics, achievements, WPM trends, and key mastery heatmaps.",
    url: "/stats",
  },
};

export default function Page() {
  return <StatsPage />;
}

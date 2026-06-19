import type { Metadata } from "next";
import RacePage from "@/components/pages/RacePage";

export const metadata: Metadata = {
  title: "Ghost Racing Mode",
  description:
    "Race against AI-powered bots to build competitive typing speed. Compete offline against simulated opponents with fixed WPM targets.",
  openGraph: {
    title: "Ghost Racing Mode — VangaTypePanalam",
    description:
      "Race against AI-powered bots to build competitive typing speed. Compete offline against simulated opponents.",
    url: "/race",
  },
};

export default function Page() {
  return <RacePage />;
}

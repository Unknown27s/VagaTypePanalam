import type { Metadata } from "next";
import LessonsPage from "@/components/pages/LessonsPage";

export const metadata: Metadata = {
  title: "Progressive Typing Lessons",
  description:
    "Learn touch typing from scratch with 30 progressive levels. Each lesson builds on the last, from home row to full-speed typing.",
  openGraph: {
    title: "Progressive Typing Lessons — VangaTypePanalam",
    description:
      "Learn touch typing from scratch with 30 progressive levels. Each lesson builds on the last.",
    url: "/lessons",
  },
};

export default function Page() {
  return <LessonsPage />;
}

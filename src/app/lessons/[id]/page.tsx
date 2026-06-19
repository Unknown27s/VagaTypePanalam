import type { Metadata } from "next";
import LessonDetailPage from "@/components/pages/LessonDetailPage";
import { ENGLISH_LESSONS } from "@/data/lessons/english";
import { TAMIL_LESSONS } from "@/data/lessons/tamil";
import { TANGLISH_LESSONS } from "@/data/lessons/tanglish";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const lesson =
    ENGLISH_LESSONS.find((l) => l.id === id) ||
    TAMIL_LESSONS.find((l) => l.id === id) ||
    TANGLISH_LESSONS.find((l) => l.id === id);

  if (!lesson) {
    return { title: "Lesson Not Found" };
  }

  return {
    title: `Lesson ${lesson.level}: ${lesson.title}`,
    description: lesson.description,
    alternates: {
      canonical: `https://vangatypepanalam.qzz.io/lessons/${id}`,
    },
    openGraph: {
      title: `Lesson ${lesson.level}: ${lesson.title} — VangaTypePanalam`,
      description: lesson.description,
      url: `/lessons/${id}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  const lesson =
    ENGLISH_LESSONS.find((l) => l.id === id) ||
    TAMIL_LESSONS.find((l) => l.id === id) ||
    TANGLISH_LESSONS.find((l) => l.id === id);

  if (!lesson) {
    return <LessonDetailPage lessonTitle={null} />;
  }

  return (
    <>
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1rem 0",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "0.25rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            borderRadius: "9999px",
            background: "rgba(99,102,241,0.15)",
            color: "var(--color-primary-light, #a5b4fc)",
            marginBottom: "0.75rem",
          }}
        >
          Level {lesson.level}
        </span>
        <h1
          style={{
            fontSize: "var(--text-2xl, 1.5rem)",
            fontWeight: 800,
            margin: "0 0 0.5rem",
            color: "var(--text-primary, #f1f5f9)",
          }}
        >
          {lesson.title}
        </h1>
        <p
          style={{
            color: "var(--text-secondary, #94a3b8)",
            maxWidth: 500,
            margin: "0 auto 0.75rem",
          }}
        >
          {lesson.description}
        </p>
      </div>
      <LessonDetailPage lessonTitle={lesson.title} />
    </>
  );
}

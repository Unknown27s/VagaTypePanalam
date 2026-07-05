import { MetadataRoute } from "next";
import { ENGLISH_LESSONS } from "@/data/lessons/english";
import { TAMIL_LESSONS } from "@/data/lessons/tamil";
import { TANGLISH_LESSONS } from "@/data/lessons/tanglish";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://vangatypepanalam.qzz.io";

  const staticPages = [
    {
      url: baseUrl,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/test`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lessons`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/race`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/practice`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  const allLessons = [
    ...ENGLISH_LESSONS,
    ...TAMIL_LESSONS,
    ...TANGLISH_LESSONS,
  ];

  const lessonPages = allLessons.map((lesson) => ({
    url: `${baseUrl}/lessons/${lesson.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...lessonPages];
}

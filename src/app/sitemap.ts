import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://vangatypepanalam.qzz.io";

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/test`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lessons`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/race`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  const lessonIds = [
    "en-lesson-1", "en-lesson-2", "en-lesson-3", "en-lesson-4",
    "en-lesson-5", "en-lesson-6", "en-lesson-7", "en-lesson-8",
    "en-lesson-9", "en-lesson-10", "en-lesson-11", "en-lesson-12",
    "en-lesson-13", "en-lesson-14", "en-lesson-15", "en-lesson-16",
    "en-lesson-17", "en-lesson-18", "en-lesson-19", "en-lesson-20",
  ];

  const lessonPages = lessonIds.map((id) => ({
    url: `${baseUrl}/lessons/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...lessonPages];
}

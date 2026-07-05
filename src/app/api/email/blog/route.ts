import { NextResponse } from "next/server";

/**
 * Blog email endpoint — reserved for future use.
 *
 * When the blog feature is implemented, wire this route to a cron job
 * (e.g. every Monday) that fetches recent blog posts from the database
 * and calls sendBlogUpdate() for subscribed users.
 *
 * Example usage:
 *   POST /api/email/blog
 *   Authorization: Bearer ${CRON_SECRET}
 *   Body: { posts: [{ title, excerpt, url }] }
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { message: "Blog email endpoint — not yet implemented" },
    { status: 501 }
  );
}

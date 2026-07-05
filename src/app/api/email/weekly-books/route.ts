import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWeeklyBookUpdate } from "@/lib/email/send";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const books = await prisma.practiceBook.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (books.length === 0) {
      return NextResponse.json({ message: "No active books to send" });
    }

    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        AND: [{ email: { not: "" } }],
      },
      select: { email: true, name: true, id: true },
    });

    const bookEntries = books.map((b) => ({
      title: b.title,
      description: b.description?.slice(0, 150) ?? "Practice this book to improve your typing skills.",
      url: `https://vangatypepanalam.qzz.io/practice?book=${b.id}`,
    }));

    let sent = 0;
    for (const user of users) {
      await sendWeeklyBookUpdate({
        to: user.email!,
        name: user.name ?? "there",
        books: bookEntries,
        unsubscribeToken: user.id,
      });
      sent++;
    }

    return NextResponse.json({ message: "Weekly books sent", sent });
  } catch (error) {
    console.error("[WeeklyBooks] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

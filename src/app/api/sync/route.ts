import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { stats, sessions, profile } = body;

    const backup = await prisma.cloudBackup.upsert({
      where: { userId: session.user.id },
      update: {
        stats,
        sessions,
        profile,
      },
      create: {
        userId: session.user.id,
        stats,
        sessions,
        profile,
      },
    });

    return NextResponse.json({ success: true, updatedAt: backup.updatedAt });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backup = await prisma.cloudBackup.findUnique({
      where: { userId: session.user.id },
    });

    if (!backup) {
      return NextResponse.json({ error: "No backup found" }, { status: 404 });
    }

    return NextResponse.json({
      stats: backup.stats,
      sessions: backup.sessions,
      profile: backup.profile,
      updatedAt: backup.updatedAt,
    });
  } catch (error) {
    console.error("Fetch backup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

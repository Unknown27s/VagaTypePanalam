import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [ranks, badges, events] = await Promise.all([
      prisma.rank.findMany({ orderBy: { minWpm: 'asc' } }),
      prisma.badge.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.event.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({ ranks, badges, events });
  } catch (error) {
    console.error('Gamification fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 });
  }
}

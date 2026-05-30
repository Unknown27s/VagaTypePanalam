import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get user's reading position for a specific book
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: 'bookId required' }, { status: 400 });
    }

    // Check if reading progress exists
    let progress = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    });

    // If not found, return default (position 0)
    if (!progress) {
      return NextResponse.json({
        userId: session.user.id,
        bookId,
        position: 0,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      userId: progress.userId,
      bookId: progress.bookId,
      position: progress.position,
      updatedAt: progress.updatedAt,
    });
  } catch (error: any) {
    console.error('❌ Error fetching reading position:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position' },
      { status: 500 }
    );
  }
}

// Save/update user's reading position
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, position } = await req.json();

    if (!bookId || position === undefined) {
      return NextResponse.json(
        { error: 'bookId and position required' },
        { status: 400 }
      );
    }

    console.log(`💾 Saving reading position - Book: ${bookId}, Position: ${position}, User: ${session.user.id}`);

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
      update: {
        position,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        bookId,
        position,
      },
    });

    console.log(`   ✅ Position saved successfully`);

    return NextResponse.json({
      userId: progress.userId,
      bookId: progress.bookId,
      position: progress.position,
      updatedAt: progress.updatedAt,
    });
  } catch (error: any) {
    console.error('❌ Error saving reading position:', error);
    return NextResponse.json(
      { error: 'Failed to save position' },
      { status: 500 }
    );
  }
}

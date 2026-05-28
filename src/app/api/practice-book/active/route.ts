import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Find the currently active book
    let activeBook = await prisma.practiceBook.findFirst({
      where: { isActive: true },
    });

    // Fallback: If no book is explicitly marked active, grab the most recently created one
    if (!activeBook) {
      activeBook = await prisma.practiceBook.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!activeBook) {
      return NextResponse.json({ error: 'No practice book found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      book: {
        id: activeBook.id,
        title: activeBook.title,
        description: activeBook.description,
        content: activeBook.content,
        words: activeBook.words,
        updatedAt: activeBook.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Fetch active book error:', error);
    return NextResponse.json({ error: 'Failed to fetch active weekly book' }, { status: 500 });
  }
}

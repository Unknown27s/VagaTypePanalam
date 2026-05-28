import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return false;
  }
  return true;
}

// Tokenize and clean raw book text into an array of clean words
function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Remove punctuation, special characters, keeping Tamil letters (\u0B80-\u0BFF) and alphanumeric
  const cleaned = text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”-•]/g, ' ')
    .replace(/\s+/g, ' ');
  
  const tokens = cleaned.toLowerCase().split(' ');
  
  // Deduplicate and filter out single characters or purely numbers
  const uniqueWords = Array.from(new Set(tokens))
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !/^\d+$/.test(w));
    
  return uniqueWords;
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const books = await prisma.practiceBook.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(books);
  } catch (error: any) {
    console.error('Fetch books error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description, content, startDate, endDate, isActive } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const words = tokenizeWords(content);

    // If making this active, deactivate all others
    if (isActive) {
      await prisma.practiceBook.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const book = await prisma.practiceBook.create({
      data: {
        title,
        description,
        content,
        words,
        isActive: !!isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(book);
  } catch (error: any) {
    console.error('Create book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, title, description, content, startDate, endDate, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) {
      updateData.content = content;
      updateData.words = tokenizeWords(content);
    }
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    // If marking as active, deactivate all others
    if (isActive) {
      await prisma.practiceBook.updateMany({
        where: {
          isActive: true,
          NOT: { id },
        },
        data: { isActive: false },
      });
    }

    const book = await prisma.practiceBook.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(book);
  } catch (error: any) {
    console.error('Update book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    await prisma.practiceBook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

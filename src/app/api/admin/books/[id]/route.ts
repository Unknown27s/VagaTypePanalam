import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decompressContent } from '@/lib/compression';
import { requireAdminAuth, createErrorResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const book = await prisma.practiceBook.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        compressedContent: true,
        contentHash: true,
        originalSize: true,
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    console.log(`📖 Downloading book: ${book.title} (ID: ${id})`);

    let content = '';
    const isCompressed = !!book.compressedContent && !book.content;

    try {
      if (isCompressed && book.compressedContent) {
        console.log(`   Decompressing content...`);
        console.log(`   Original size: ${book.originalSize} bytes`);
        console.log(`   Compressed size: ${Buffer.byteLength(book.compressedContent, 'utf-8')} bytes`);

        content = await decompressContent(book.compressedContent);

        console.log(`   ✅ Decompressed size: ${Buffer.byteLength(content, 'utf-8')} bytes`);
        console.log(`   Content length: ${content.length} characters`);

        // Verify integrity
        if (content.length === 0) {
          throw new Error('Decompressed content is empty');
        }
      } else if (book.content) {
        console.log(`   Using uncompressed content`);
        content = book.content;
        console.log(`   Content length: ${content.length} characters`);
      } else {
        throw new Error('Book has no content or compressed content');
      }

      return NextResponse.json({
        title: book.title,
        content,
        contentHash: book.contentHash,
        isCompressed,
        contentLength: content.length,
      });
    } catch (decompressError: any) {
      console.error(`   ❌ Decompression failed: ${decompressError.message}`);
      return createErrorResponse(
        'Failed to decompress book content',
        500,
        decompressError.message
      );
    }
  } catch (error: any) {
    console.error('❌ Download book error:', error);
    return createErrorResponse('Failed to download book', 500, error.message);
  }
}

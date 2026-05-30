import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { compressContent, decompressContent } from '@/lib/compression';
import { requireAdminAuth, createErrorResponse } from '@/lib/adminAuth';
import { validateTextInput, validateFileSize } from '@/lib/validation';

export const dynamic = 'force-dynamic';

function tokenizeWords(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .replace(/[.,!?;:—–]/g, ' ')  // Basic punctuation only
    .replace(/["""'']/g, ' ')      // Quotes
    .replace(/[\n\r]/g, ' ')       // Newlines
    .replace(/\s+/g, ' ');         // Multiple spaces to single

  const tokens = cleaned.toLowerCase().split(' ');

  const uniqueWords = Array.from(new Set(tokens))
    .map(w => w.trim())
    .filter(w => w.length >= 1);   // Keep all non-empty words

  return uniqueWords;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const books = await prisma.practiceBook.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(books);
  } catch (error: any) {
    return createErrorResponse('Failed to fetch books', 500, error.message);
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { title, description, content, startDate, endDate, isActive } = await req.json();

    // Validate inputs
    const titleValidation = validateTextInput(title, { minLength: 1, maxLength: 500 });
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    const contentValidation = validateTextInput(content, { minLength: 10 });
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    const fileSizeValidation = validateFileSize(Buffer.byteLength(content, 'utf-8'));
    if (!fileSizeValidation.valid) {
      return NextResponse.json({ error: fileSizeValidation.error }, { status: 400 });
    }

    // Extract words for searching
    const words = tokenizeWords(content);

    // Compress content
    console.log(`📚 Uploading book: "${title}"`);
    console.log(`   Content preview: ${content.substring(0, 100)}...`);
    console.log(`   Original size: ${Buffer.byteLength(content, 'utf-8')} bytes`);
    console.log(`   Total words (unique): ${words.length}`);

    const compressionResult = await compressContent(content);
    console.log(`   Compression ratio: ${(compressionResult.compressionRatio * 100).toFixed(2)}%`);
    console.log(`   Content hash: ${compressionResult.contentHash}`);

    // Decompression test - verify compression works
    let decompressedContent = '';
    if (compressionResult.compressed) {
      try {
        decompressedContent = await decompressContent(compressionResult.compressed);
        const isValid = decompressedContent === content;
        console.log(`   ✅ Decompression test: ${isValid ? 'PASSED' : 'FAILED'}`);

        if (!isValid) {
          console.error('   ❌ Decompressed content does not match original!');
          return NextResponse.json({
            error: 'Compression/Decompression test failed. Content may be corrupted.'
          }, { status: 500 });
        }
      } catch (decompressErr: any) {
        console.error('   ❌ Decompression error:', decompressErr.message);
        return NextResponse.json({
          error: `Decompression failed: ${decompressErr.message}`
        }, { status: 500 });
      }
    }

    // Deactivate other books if this one is being set as active
    if (isActive) {
      await prisma.practiceBook.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Prepare book data - always set one field to null
    const bookData: any = {
      title,
      description: description || null,
      words,
      isActive: !!isActive,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      originalSize: compressionResult.originalSize,
      compressionRatio: compressionResult.compressionRatio,
      contentHash: compressionResult.contentHash,
    };

    if (compressionResult.compressed) {
      bookData.compressedContent = compressionResult.compressed;
      bookData.content = null; // Explicitly set to null when compressed
    } else {
      bookData.content = content;
      bookData.compressedContent = null; // Explicitly set to null when not compressed
    }

    // Create the book
    const book = await prisma.practiceBook.create({ data: bookData });

    console.log(`   ✅ Book created: ${book.id}`);
    return NextResponse.json(book);

  } catch (error: any) {
    console.error('❌ Book upload error:', error);
    return createErrorResponse('Failed to create book', 500, error.message);
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id, title, description, content, startDate, endDate, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const updateData: any = {};

    if (title !== undefined) {
      const validation = validateTextInput(title, { minLength: 1, maxLength: 500 });
      if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
      updateData.title = title;
    }

    if (description !== undefined) updateData.description = description;

    if (content !== undefined) {
      const validation = validateTextInput(content, { minLength: 10 });
      if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

      const fileSizeValidation = validateFileSize(Buffer.byteLength(content, 'utf-8'));
      if (!fileSizeValidation.valid) return NextResponse.json({ error: fileSizeValidation.error }, { status: 400 });

      console.log(`📚 Updating book: ${id}`);
      console.log(`   New content size: ${Buffer.byteLength(content, 'utf-8')} bytes`);

      updateData.words = tokenizeWords(content);
      const compressionResult = await compressContent(content);

      console.log(`   Compression ratio: ${(compressionResult.compressionRatio * 100).toFixed(2)}%`);
      console.log(`   Content hash: ${compressionResult.contentHash}`);

      // Decompression test
      if (compressionResult.compressed) {
        try {
          const decompressedContent = await decompressContent(compressionResult.compressed);
          const isValid = decompressedContent === content;
          console.log(`   ✅ Decompression test: ${isValid ? 'PASSED' : 'FAILED'}`);

          if (!isValid) {
            return NextResponse.json({
              error: 'Compression/Decompression test failed. Content may be corrupted.'
            }, { status: 500 });
          }
        } catch (decompressErr: any) {
          console.error('   ❌ Decompression error:', decompressErr.message);
          return NextResponse.json({
            error: `Decompression failed: ${decompressErr.message}`
          }, { status: 500 });
        }
      }

      updateData.originalSize = compressionResult.originalSize;
      updateData.compressionRatio = compressionResult.compressionRatio;
      updateData.contentHash = compressionResult.contentHash;

      if (compressionResult.compressed) {
        updateData.compressedContent = compressionResult.compressed;
        updateData.content = null; // Explicitly set to null
      } else {
        updateData.content = content;
        updateData.compressedContent = null; // Explicitly set to null
      }
    }

    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    if (isActive !== undefined) {
      updateData.isActive = !!isActive;

      if (isActive) {
        await prisma.practiceBook.updateMany({
          where: {
            isActive: true,
            NOT: { id },
          },
          data: { isActive: false },
        });
      }
    }

    const book = await prisma.practiceBook.update({
      where: { id },
      data: updateData,
    });

    console.log(`   ✅ Book updated: ${id}`);
    return NextResponse.json(book);

  } catch (error: any) {
    console.error('❌ Book update error:', error);
    return createErrorResponse('Failed to update book', 500, error.message);
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    console.log(`🗑️  Deleting book: ${id}`);

    await prisma.practiceBook.delete({
      where: { id },
    });

    console.log(`   ✅ Book deleted: ${id}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Book delete error:', error);
    return createErrorResponse('Failed to delete book', 500, error.message);
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decompressContent } from '@/lib/compression';

export const dynamic = 'force-dynamic';

// Extract words in order from content (preserving sequence, not deduplicating)
function extractWordsInOrder(content: string): string[] {
  if (!content) {
    console.warn('⚠️  Content is empty!');
    return [];
  }

  console.log(`📖 Extracting words from content (${content.length} chars)`);

  // LESS aggressive cleaning - preserve more content
  let cleaned = content
    // Only remove common punctuation at word boundaries, not in the middle
    .replace(/[.,!?;:—–]/g, ' ')  // Basic punctuation to spaces
    .replace(/["""'']/g, ' ')      // Quotes to spaces
    .replace(/[\n\r]/g, ' ')       // Newlines to spaces
    .replace(/\s+/g, ' ')          // Multiple spaces to single space
    .trim();

  console.log(`✅ Cleaned text (${cleaned.length} chars)`);

  const words = cleaned
    .toLowerCase()
    .split(' ')
    .map(w => w.trim())
    .filter(w => w.length >= 1);  // Keep all words, including short ones

  console.log(`✅ Extracted ${words.length} words`);
  console.log(`   First 10 words: ${words.slice(0, 10).join(', ')}`);
  console.log(`   Last 10 words: ${words.slice(-10).join(', ')}`);

  if (words.length === 0) {
    console.error('❌ NO WORDS EXTRACTED! Check content cleaning.');
  }

  return words;
}

export async function GET() {
  try {
    console.log('📚 Fetching active practice book...');

    // Find the currently active book
    let activeBook = await prisma.practiceBook.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        compressedContent: true,
        originalSize: true,
        compressionRatio: true,
        contentHash: true,
        updatedAt: true,
      },
    });

    // Fallback: If no book is explicitly marked active, grab the most recently created one
    if (!activeBook) {
      console.log('   No active book found, using most recent');
      activeBook = await prisma.practiceBook.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          content: true,
          compressedContent: true,
          originalSize: true,
          compressionRatio: true,
          contentHash: true,
          updatedAt: true,
        },
      });
    }

    if (!activeBook) {
      console.log('   ❌ No practice books available');
      return NextResponse.json({ error: 'No practice book found' }, { status: 404 });
    }

    console.log(`   Found: "${activeBook.title}" (ID: ${activeBook.id})`);

    // Decompress content if needed
    let content = activeBook.content;
    const isCompressed = !!activeBook.compressedContent && !activeBook.content;

    try {
      if (isCompressed) {
        console.log(`   Decompressing content...`);
        console.log(`   Original size: ${activeBook.originalSize} bytes`);
        console.log(`   Compressed size: ${Buffer.byteLength(activeBook.compressedContent || '', 'utf-8')} bytes`);

        content = await decompressContent(activeBook.compressedContent || '');

        console.log(`   ✅ Decompressed size: ${Buffer.byteLength(content, 'utf-8')} bytes`);
        console.log(`   Content length: ${content.length} characters`);

        if (!content || content.length === 0) {
          throw new Error('Decompressed content is empty');
        }
      } else if (content) {
        console.log(`   Using uncompressed content`);
        console.log(`   Content size: ${Buffer.byteLength(content, 'utf-8')} bytes`);
        console.log(`   Content length: ${content.length} characters`);
      }

      if (!content) {
        throw new Error('No content available (both content and compressedContent are empty)');
      }
    } catch (decompressError: any) {
      console.error(`   ❌ Error during decompression: ${decompressError.message}`);
      return NextResponse.json(
        { error: `Failed to decompress book: ${decompressError.message}` },
        { status: 500 }
      );
    }

    // Extract words in order from content for sequential reading
    const words = extractWordsInOrder(content);
    console.log(`   Extracted ${words.length} words for sequential reading`);

    console.log(`   ✅ Book ready to practice`);

    return NextResponse.json({
      success: true,
      book: {
        id: activeBook.id,
        title: activeBook.title,
        description: activeBook.description,
        content: content,
        words: words,
        updatedAt: activeBook.updatedAt,
        metadata: {
          isCompressed,
          originalSize: activeBook.originalSize,
          compressionRatio: activeBook.compressionRatio,
          contentHash: activeBook.contentHash,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Fetch active book error:', error);
    return NextResponse.json(
      { error: `Failed to fetch active weekly book: ${error.message}` },
      { status: 500 }
    );
  }
}




import crypto from 'crypto';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  contentHash: string;
}

export interface CompressionConfig {
  minSizeToCompress: number;
  compressionLevel: number;
}

const DEFAULT_CONFIG: CompressionConfig = {
  minSizeToCompress: 102_400,
  compressionLevel: 6,
};

export async function compressContent(
  text: string,
  config: Partial<CompressionConfig> = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const originalSize = Buffer.byteLength(text, 'utf-8');

  const contentHash = crypto.createHash('sha256').update(text).digest('hex');

  if (originalSize < opts.minSizeToCompress) {
    return {
      compressed: '',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      contentHash,
    };
  }

  const buffer = Buffer.from(text, 'utf-8');
  const compressed = await gzipAsync(buffer, { level: opts.compressionLevel });
  const base64 = compressed.toString('base64');
  const compressedSize = Buffer.byteLength(base64, 'utf-8');

  return {
    compressed: base64,
    originalSize,
    compressedSize,
    compressionRatio: compressedSize / originalSize,
    contentHash,
  };
}

export async function decompressContent(base64: string): Promise<string> {
  if (!base64) throw new Error('No compressed content provided');

  const buffer = Buffer.from(base64, 'base64');
  const decompressed = await gunzipAsync(buffer);
  return decompressed.toString('utf-8');
}

export function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

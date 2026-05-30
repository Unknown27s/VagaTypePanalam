export function validateTextInput(
  text: string | undefined,
  { minLength = 1, maxLength = 1_000_000 } = {}
): { valid: boolean; error?: string } {
  if (!text) {
    return { valid: false, error: 'Text is required' };
  }

  if (typeof text !== 'string') {
    return { valid: false, error: 'Text must be a string' };
  }

  if (text.trim().length < minLength) {
    return { valid: false, error: `Text must be at least ${minLength} characters` };
  }

  if (text.length > maxLength) {
    return { valid: false, error: `Text must be under ${maxLength} characters` };
  }

  return { valid: true };
}

export function validateFileSize(
  sizeBytes: number,
  maxSizeBytes: number = 50_000_000
): { valid: boolean; error?: string } {
  if (sizeBytes > maxSizeBytes) {
    const maxMB = (maxSizeBytes / 1_000_000).toFixed(1);
    return {
      valid: false,
      error: `File exceeds maximum size of ${maxMB}MB`,
    };
  }
  return { valid: true };
}

export function sanitizeSVG(svgContent: string): string {
  let sanitized = svgContent;

  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

  return sanitized;
}

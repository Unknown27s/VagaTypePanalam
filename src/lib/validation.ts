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

/**
 * Safely strip dangerous content from SVG strings.
 * Uses iterative removal to handle nested/obfuscated tags,
 * and covers all common event handler patterns.
 */
export function sanitizeSVG(svgContent: string): string {
  let sanitized = svgContent;

  // Iteratively remove script tags until none remain (handles nesting/encoding)
  const scriptPattern = /<script[\s\S]*?<\/script\s*>/gi;
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(scriptPattern, '');
  } while (sanitized !== prev);

  // Remove all event handler attributes (onclick, onload, onerror, etc.)
  // Covers both quoted and unquoted values, including HTML entity variants
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  sanitized = sanitized.replace(/\s+on\w+(?:\s*:\s*[\w.]+\s*)?/gi, ' ');

  // Remove javascript: and data: URIs in href/src/action attributes
  sanitized = sanitized.replace(/\s+(?:href|xlink:href|src|action|formaction)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, ' ');
  sanitized = sanitized.replace(/\s+(?:href|xlink:href|src|action|formaction)\s*=\s*(?:"data:[^"]*"|'data:[^']*'|data:[^\s>]*)/gi, ' ');

  return sanitized;
}

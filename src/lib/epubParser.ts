import JSZip from 'jszip';

export interface EpubChapter {
  id: string;
  title: string;
  filePath: string;
  content: string;
  characterCount: number;
  isPreChecked: boolean;
}

export interface EpubParsedData {
  title: string;
  chapters: EpubChapter[];
}

/**
 * Extracts raw, clean text from an XHTML/HTML chapter document.
 */
function extractCleanText(htmlContent: string): string {
  let text = htmlContent;

  // Iteratively remove dangerous tag blocks (handles nesting/encoding)
  const blockPatterns = [
    /<head[\s\S]*?<\/head\s*>/gi,
    /<style[\s\S]*?<\/style\s*>/gi,
    /<script[\s\S]*?<\/script\s*>/gi,
  ];
  for (const pattern of blockPatterns) {
    let prev: string;
    do {
      prev = text;
      text = text.replace(pattern, '');
    } while (text !== prev);
  }

  // Decode &amp; first using a placeholder to prevent double-unescaping
  // (e.g. &amp;quot; → should stay as &quot; text, not become ")
  text = text.replace(/&amp;/g, '\x00AMP\x00');

  // Decode all other HTML entities
  text = text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&bull;/g, '*')
    .replace(/&#\d+;/g, ' ');

  // Restore &amp; from placeholder
  text = text.replace(/\x00AMP\x00/g, '&');

  // Add structural line breaks for elements to preserve spacing
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');

  // Strip remaining HTML tags — use DOM parser approach for safety
  // First pass: remove standard HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // Remove CDATA sections
  text = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  // Strip all remaining tags
  text = text.replace(/<[^>]*>/g, '');

  // Clean up excess white space (but preserve some paragraph structure)
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  // Final cleanup: remove leading/trailing whitespace
  text = text.trim();

  return text;
}

/**
 * Parses an EPUB file client-side and extracts sorted, readable text chapters.
 */
export async function parseEpub(file: File): Promise<EpubParsedData> {
  const zip = await JSZip.loadAsync(file);

  // 1. Locate container.xml to locate the main package (.opf) file
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  let opfPath = '';
  if (containerXml) {
    const match = containerXml.match(/full-path="([^"]+)"/);
    if (match) opfPath = match[1];
  }

  let title = file.name.replace(/\.[^/.]+$/, ''); // Fallback to filename
  const chapters: EpubChapter[] = [];

  // Helper patterns to automatically skip noisy pages
  const noisePattern = /cover|copyright|titlepage|title_page|toc|table_of_contents|tableofcontents|dedication|preface|index|colophon|acknowledg|advertis|sidebar|about/i;

  if (opfPath) {
    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/')) + '/' : '';
    const opfContent = await zip.file(opfPath)?.async('string');

    if (opfContent) {
      // Extract Metadata Title
      const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      // Parse manifest items to map resource IDs to exact internal file paths
      const manifestMatches = [...opfContent.matchAll(/<item\s+[^>]*id="([^"]+)"\s+[^>]*href="([^"]+)"/gi)];
      const manifestMap: Record<string, string> = {};
      manifestMatches.forEach(m => {
        manifestMap[m[1]] = m[2];
      });

      // Parse spine items which dictate the exact reading sequence of the book
      const spineMatches = [...opfContent.matchAll(/<itemref\s+[^>]*idref="([^"]+)"/gi)];

      let count = 1;
      for (const spine of spineMatches) {
        const idref = spine[1];
        const relativeHref = manifestMap[idref];
        if (relativeHref) {
          // Resolve standard URI paths (strip hash anchors)
          const resolvedHref = decodeURIComponent(opfDir + relativeHref).split('#')[0];
          const fileEntry = zip.file(resolvedHref);

          if (fileEntry) {
            const htmlContent = await fileEntry.async('string');
            const contentText = extractCleanText(htmlContent);

            if (contentText.length > 0) {
              // Attempt to scrape a suitable chapter heading from inside the chapter document
              let chapterTitle = '';
              const h1Match = htmlContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
              const h2Match = htmlContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);

              if (h1Match) {
                chapterTitle = extractCleanText(h1Match[1]);
              } else if (h2Match) {
                chapterTitle = extractCleanText(h2Match[1]);
              } else {
                chapterTitle = `Section ${count}`;
              }

              // Strip title text of HTML/XML tag artifacts
              chapterTitle = chapterTitle.replace(/<[^>]+>/g, '').trim();
              if (chapterTitle.length > 50) {
                chapterTitle = chapterTitle.substring(0, 50) + '...';
              }

              const isNoise = noisePattern.test(resolvedHref) || noisePattern.test(chapterTitle);
              // Smart heuristic: Only pre-check if it's not noise AND has substantial reading length
              const isPreChecked = !isNoise && contentText.length > 200;

              chapters.push({
                id: idref || `sec-${count}`,
                title: chapterTitle || `Section ${count}`,
                filePath: resolvedHref,
                content: contentText,
                characterCount: contentText.length,
                isPreChecked
              });
              count++;
            }
          }
        }
      }
    }
  }

  // Fallback: If opf manifest reading failed completely, fall back to extracting and sorting all HTML files
  if (chapters.length === 0) {
    const htmlFileNames = Object.keys(zip.files).filter(
      name => name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.xml')
    );
    htmlFileNames.sort();

    let count = 1;
    for (const name of htmlFileNames) {
      const fileEntry = zip.files[name];
      const htmlContent = await fileEntry.async('string');
      const contentText = extractCleanText(htmlContent);

      if (contentText.length > 10) {
        const isNoise = noisePattern.test(name);
        const isPreChecked = !isNoise && contentText.length > 200;

        chapters.push({
          id: `fallback-${count}`,
          title: `Section ${count} (${name.substring(name.lastIndexOf('/') + 1)})`,
          filePath: name,
          content: contentText,
          characterCount: contentText.length,
          isPreChecked
        });
        count++;
      }
    }
  }

  return { title, chapters };
}

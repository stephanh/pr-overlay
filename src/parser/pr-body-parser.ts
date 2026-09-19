import { ParsedBlock, ParsedPRContent, ParsedSection, OverlayTabType } from '../types';

/**
 * Extracts a section defined by explicit comments, e.g.:
 * <!-- pr-overlay:architecture:start -->
 * ...
 * <!-- pr-overlay:architecture:end -->
 */
export function extractCommentSection(body: string, sectionKey: OverlayTabType): string | null {
  const startMarker = new RegExp(`<!--\\s*pr-overlay:${sectionKey}:start\\s*-->`, 'i');
  const endMarker = new RegExp(`<!--\\s*pr-overlay:${sectionKey}:end\\s*-->`, 'i');

  const startMatch = startMarker.exec(body);
  if (!startMatch) return null;

  const startIndex = startMatch.index + startMatch[0].length;
  const subContent = body.slice(startIndex);
  const endMatch = endMarker.exec(subContent);

  if (endMatch) {
    return subContent.slice(0, endMatch.index).trim();
  }
  return subContent.trim();
}

/**
 * Fallback: extracts a section starting at markdown header "## Architecture" or "## Verification"
 * up until the next header of equal or higher level.
 */
export function extractHeaderSection(body: string, headerPattern: RegExp): string | null {
  const match = headerPattern.exec(body);
  if (!match) return null;

  const startIndex = match.index;
  const headingLevel = match[1].length; // e.g. '##' -> 2
  const rest = body.slice(startIndex + match[0].length);

  // Look for next heading of same or higher level, e.g. "^#{1,2} "
  const nextHeadingRegex = new RegExp(`(^|\\n)#{1,${headingLevel}}\\s+`, 'm');
  const nextMatch = nextHeadingRegex.exec(rest);

  if (nextMatch) {
    return (match[0] + rest.slice(0, nextMatch.index)).trim();
  }
  return (match[0] + rest).trim();
}

/**
 * Parses attributes out of code fences, for example:
 * ```log [title="Unit Tests" command="npm test" exitCode="0"]
 */
export function parseCodeFenceMeta(metaStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!metaStr) return result;

  // Match key="value" or key='value' or key=value
  const attrRegex = /([a-zA-Z0-9_-]+)=["']?([^"'\]\s]+)["']?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(metaStr)) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

/**
 * Generates a URL-friendly slug from title
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

/**
 * Parses a markdown string into high-level blocks with stable anchor IDs.
 */
export function parseSectionBlocks(rawMarkdown: string, tab: OverlayTabType): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = rawMarkdown.split(/\r?\n/);
  
  let currentTextLines: string[] = [];
  let inCodeBlock = false;
  let codeFenceLang = '';
  let codeFenceMeta = '';
  let codeLines: string[] = [];
  let blockIndex = 0;

  const flushTextBlock = () => {
    if (currentTextLines.length > 0) {
      const text = currentTextLines.join('\n').trim();
      if (text) {
        // Look for heading in text to derive anchor title
        const firstHeadingMatch = text.match(/^#{1,6}\s+(.+)$/m);
        const title = firstHeadingMatch ? firstHeadingMatch[1].trim() : undefined;
        const id = title ? `${tab}-${slugify(title)}` : `${tab}-section-${blockIndex++}`;

        blocks.push({
          id,
          type: 'text',
          title,
          content: text,
        });
      }
      currentTextLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^```([a-zA-Z0-9_-]+)?(?:\s+(.*))?$/);

    if (fenceMatch) {
      if (!inCodeBlock) {
        // Start of code block
        flushTextBlock();
        inCodeBlock = true;
        codeFenceLang = (fenceMatch[1] || '').toLowerCase();
        codeFenceMeta = fenceMatch[2] || '';
        codeLines = [];
      } else {
        // End of code block
        inCodeBlock = false;
        const codeContent = codeLines.join('\n');
        const meta = parseCodeFenceMeta(codeFenceMeta);

        if (codeFenceLang === 'mermaid') {
          const id = meta.id || `${tab}-diagram-${blockIndex++}`;
          blocks.push({
            id,
            type: 'mermaid',
            title: meta.title || 'Architecture Diagram',
            content: codeContent,
            meta,
          });
        } else if (['log', 'console', 'bash', 'sh', 'output', 'terminal'].includes(codeFenceLang) || meta.command || meta.exitCode) {
          const id = meta.id || `${tab}-log-${blockIndex++}`;
          blocks.push({
            id,
            type: 'log',
            title: meta.title || meta.command || 'Execution Log',
            content: codeContent,
            meta,
          });
        } else {
          // Regular code block: keep as part of text
          currentTextLines.push('```' + codeFenceLang + (codeFenceMeta ? ' ' + codeFenceMeta : ''));
          currentTextLines.push(codeContent);
          currentTextLines.push('```');
        }
      }
    } else if (inCodeBlock) {
      codeLines.push(line);
    } else {
      currentTextLines.push(line);
    }
  }

  // Flush remaining text
  flushTextBlock();

  return blocks;
}

/**
 * Main parser entry point: parses raw PR body markdown into architecture and verification sections.
 */
export function parsePRBody(rawBody: string): ParsedPRContent {
  if (!rawBody) {
    return { hasOverlayContent: false };
  }

  // 1. Check Architecture
  let archMarkdown = extractCommentSection(rawBody, 'architecture');
  if (!archMarkdown) {
    archMarkdown = extractHeaderSection(rawBody, /^(#{1,3})\s+(?:🏛️\s*)?Architecture/im);
  }

  // 2. Check Verification
  let verifMarkdown = extractCommentSection(rawBody, 'verification');
  if (!verifMarkdown) {
    verifMarkdown = extractHeaderSection(rawBody, /^(#{1,3})\s+(?:🧪\s*|✅\s*)?Verification/im);
  }

  const result: ParsedPRContent = {
    hasOverlayContent: Boolean(archMarkdown || verifMarkdown),
  };

  if (archMarkdown) {
    result.architecture = {
      tab: 'architecture',
      title: 'Architecture',
      rawMarkdown: archMarkdown,
      blocks: parseSectionBlocks(archMarkdown, 'architecture'),
    };
  }

  if (verifMarkdown) {
    result.verification = {
      tab: 'verification',
      title: 'Verification',
      rawMarkdown: verifMarkdown,
      blocks: parseSectionBlocks(verifMarkdown, 'verification'),
    };
  }

  return result;
}

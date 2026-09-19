import { OverlayComment, OverlayTabType } from '../types';

export interface RawCommentInput {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  createdAt: string;
  body: string;
  htmlUrl?: string;
}

const ANCHOR_REGEX = /(?:^|\n)>\s*\\?\[pr-overlay:(architecture|verification)#([a-zA-Z0-9_-]+)\\?\]\s*\r?\n?/;

/**
 * Creates the anchor tag text to prepend to a comment.
 */
export function formatAnchorQuote(tab: OverlayTabType, anchorId: string): string {
  return `> [pr-overlay:${tab}#${anchorId}]\n\n`;
}

/**
 * Parses a comment body to check if it contains a pr-overlay anchor.
 */
export function parseCommentAnchor(body: string): { tab: OverlayTabType; anchorId: string; cleanBody: string } | null {
  const match = ANCHOR_REGEX.exec(body);
  if (!match) return null;

  const tab = match[1].toLowerCase() as OverlayTabType;
  const anchorId = match[2];
  // Remove the anchor quote from the display body
  const cleanBody = body.replace(ANCHOR_REGEX, '').trim();

  return { tab, anchorId, cleanBody };
}

/**
 * Parses a list of raw GitHub comments and extracts all anchored overlay comments.
 */
export function parseOverlayComments(comments: RawCommentInput[]): Map<string, OverlayComment[]> {
  const commentMap = new Map<string, OverlayComment[]>();

  for (const raw of comments) {
    const parsed = parseCommentAnchor(raw.body);
    if (parsed) {
      const comment: OverlayComment = {
        id: raw.id,
        author: raw.author,
        authorAvatarUrl: raw.authorAvatarUrl,
        createdAt: raw.createdAt,
        body: parsed.cleanBody || raw.body,
        anchorId: parsed.anchorId,
        tab: parsed.tab,
        htmlUrl: raw.htmlUrl,
      };

      const list = commentMap.get(parsed.anchorId) || [];
      list.push(comment);
      commentMap.set(parsed.anchorId, list);
    }
  }

  return commentMap;
}

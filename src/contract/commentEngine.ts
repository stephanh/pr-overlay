import { OverlayComment, PROverlayCommentMeta } from '../types/manifest';

export const COMMENT_TAG_REGEX = /<!--\s*pr-overlay-comment:\s*({[\s\S]*?})\s*-->/i;

/**
 * Encodes comment metadata and body into a GitHub-compatible issue comment string (Option B).
 */
export function encodeOverlayComment(
  body: string,
  meta: PROverlayCommentMeta
): string {
  const jsonMeta = JSON.stringify(meta);
  const tag = `<!-- pr-overlay-comment: ${jsonMeta} -->`;
  return `${tag}\n\n${body.trim()}`;
}

/**
 * Parses a single GitHub issue comment body to see if it contains PR Overlay comment metadata.
 */
export function parseOverlayComment(
  fullCommentBody: string,
  githubCommentDetails: {
    githubCommentId?: number;
    author: string;
    avatarUrl?: string;
    createdAt: string;
  }
): OverlayComment | null {
  if (!fullCommentBody) return null;

  const match = fullCommentBody.match(COMMENT_TAG_REGEX);
  if (!match || !match[1]) return null;

  try {
    const meta = JSON.parse(match[1]) as PROverlayCommentMeta;
    // Clean out the hidden HTML comment tag to get user visible text
    const cleanBody = fullCommentBody.replace(COMMENT_TAG_REGEX, '').trim();

    return {
      id: meta.commentId,
      tabId: meta.tabId,
      sectionId: meta.sectionId,
      author: meta.author || githubCommentDetails.author,
      avatarUrl: githubCommentDetails.avatarUrl,
      createdAt: meta.createdAt || githubCommentDetails.createdAt,
      body: cleanBody,
      githubCommentId: githubCommentDetails.githubCommentId,
      parentCommentId: meta.parentCommentId,
    };
  } catch {
    return null;
  }
}

/**
 * Filters a list of generic GitHub comments and extracts all valid PR Overlay comments.
 */
export function extractOverlayComments(
  rawComments: Array<{
    id?: number;
    body: string;
    user?: { login: string; avatar_url?: string };
    created_at?: string;
  }>
): OverlayComment[] {
  const results: OverlayComment[] = [];

  for (const raw of rawComments) {
    const parsed = parseOverlayComment(raw.body, {
      githubCommentId: raw.id,
      author: raw.user?.login || 'anonymous',
      avatarUrl: raw.user?.avatar_url,
      createdAt: raw.created_at || new Date().toISOString(),
    });
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

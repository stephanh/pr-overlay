import { PRDetails } from '../types';
import { RawCommentInput } from '../parser/comment-parser';

/**
 * Parses owner, repo, and pull number from GitHub PR URL.
 */
export function getPRDetails(): PRDetails | null {
  const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    pullNumber: parseInt(match[3], 10),
  };
}

/**
 * Scrapes existing comments from the GitHub PR DOM timeline.
 */
export function scrapeCommentsFromDOM(): RawCommentInput[] {
  const comments: RawCommentInput[] = [];
  const commentElements = document.querySelectorAll('.timeline-comment-group, div[id^="issuecomment-"]');

  commentElements.forEach((el) => {
    const id = el.id || `comment-${Math.random().toString(36).substring(2, 9)}`;
    const authorEl = el.querySelector('.author');
    const author = authorEl ? authorEl.textContent?.trim() || 'Unknown' : 'Unknown';

    const avatarEl = el.querySelector('img.avatar') as HTMLImageElement | null;
    const authorAvatarUrl = avatarEl ? avatarEl.src : undefined;

    const timeEl = el.querySelector('relative-time');
    const createdAt = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent || '') : '';

    const bodyEl = el.querySelector('.comment-body');
    const body = bodyEl ? bodyEl.textContent || '' : '';

    if (body) {
      comments.push({
        id,
        author,
        authorAvatarUrl,
        createdAt,
        body,
      });
    }
  });

  return comments;
}

/**
 * Submits a comment directly using GitHub's native page authenticity token.
 */
export async function submitComment(prDetails: PRDetails, commentBody: string): Promise<boolean> {
  // Find GitHub's native comment form authenticity token on the page
  const form = document.querySelector<HTMLFormElement>(
    `form[action*="/issues/${prDetails.pullNumber}/comments"], form[action*="/pull/${prDetails.pullNumber}/comments"], form.js-new-comment-form`
  );

  if (form) {
    const action = form.getAttribute('action') || `/${prDetails.owner}/${prDetails.repo}/issues/${prDetails.pullNumber}/comments`;
    const tokenInput = form.querySelector<HTMLInputElement>('input[name="authenticity_token"]');
    const token = tokenInput ? tokenInput.value : null;

    if (token) {
      const formData = new FormData();
      formData.append('authenticity_token', token);
      formData.append('comment[body]', commentBody);

      try {
        const response = await fetch(action, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'text/html, application/xhtml+xml',
          },
        });

        if (response.ok) {
          return true;
        }
      } catch (err) {
        console.warn('[pr-overlay] Failed to submit comment via page form:', err);
      }
    }
  }

  // Fallback: Populate the native bottom comment box so the user can hit Comment
  const nativeTextarea = document.querySelector<HTMLTextAreaElement>('#new_comment_field');
  if (nativeTextarea) {
    nativeTextarea.value = (nativeTextarea.value ? nativeTextarea.value + '\n\n' : '') + commentBody;
    nativeTextarea.focus();
    nativeTextarea.scrollIntoView({ behavior: 'smooth' });
    return true;
  }

  return false;
}

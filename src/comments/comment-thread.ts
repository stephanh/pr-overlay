import { OverlayComment, OverlayTabType, PRDetails } from '../types';
import { formatAnchorQuote } from '../parser/comment-parser';
import { submitComment } from './github-api';

export interface CommentThreadOptions {
  anchorId: string;
  tab: OverlayTabType;
  prDetails: PRDetails | null;
  comments: OverlayComment[];
}

export function createCommentThread(options: CommentThreadOptions): HTMLElement {
  const { anchorId, tab, prDetails, comments } = options;

  const threadEl = document.createElement('div');
  threadEl.className = 'pr-overlay-thread';
  threadEl.dataset.anchorId = anchorId;

  // Header / toggle
  const header = document.createElement('div');
  header.className = 'pr-overlay-thread-header';

  const countBadge = document.createElement('span');
  countBadge.className = 'pr-overlay-comment-date';
  countBadge.textContent = comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : '';

  const addCommentBtn = document.createElement('button');
  addCommentBtn.className = 'pr-overlay-btn pr-overlay-btn-sm';
  addCommentBtn.textContent = '💬 Add comment';

  header.appendChild(countBadge);
  header.appendChild(addCommentBtn);
  threadEl.appendChild(header);

  // Existing comments list
  const listContainer = document.createElement('div');
  listContainer.className = 'pr-overlay-comments-list';

  comments.forEach((c) => {
    listContainer.appendChild(renderCommentItem(c));
  });
  threadEl.appendChild(listContainer);

  // Reply box (hidden by default unless opened)
  const replyBox = document.createElement('div');
  replyBox.className = 'pr-overlay-reply-box';
  replyBox.style.display = 'none';

  const textarea = document.createElement('textarea');
  textarea.className = 'pr-overlay-reply-textarea';
  textarea.placeholder = `Leave a comment on this section... (will post to PR conversation tagged with [pr-overlay:${tab}#${anchorId}])`;

  const actions = document.createElement('div');
  actions.className = 'pr-overlay-reply-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'pr-overlay-btn pr-overlay-btn-sm';
  cancelBtn.textContent = 'Cancel';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'pr-overlay-btn pr-overlay-btn-primary pr-overlay-btn-sm';
  submitBtn.textContent = 'Comment';

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);

  replyBox.appendChild(textarea);
  replyBox.appendChild(actions);
  threadEl.appendChild(replyBox);

  // Event handlers
  addCommentBtn.addEventListener('click', () => {
    replyBox.style.display = replyBox.style.display === 'none' ? 'flex' : 'none';
    if (replyBox.style.display === 'flex') {
      textarea.focus();
    }
  });

  cancelBtn.addEventListener('click', () => {
    replyBox.style.display = 'none';
    textarea.value = '';
  });

  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    const formatted = formatAnchorQuote(tab, anchorId) + text;

    let success = false;
    if (prDetails) {
      success = await submitComment(prDetails, formatted);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Comment';

    if (success) {
      // Optimistic update
      const newComment: OverlayComment = {
        id: `opt-${Date.now()}`,
        author: 'You',
        createdAt: 'just now',
        body: text,
        anchorId,
        tab,
      };
      listContainer.appendChild(renderCommentItem(newComment));
      countBadge.textContent = `${listContainer.children.length} comment${listContainer.children.length > 1 ? 's' : ''}`;
      textarea.value = '';
      replyBox.style.display = 'none';
    } else {
      alert('Could not submit comment automatically. Please check your GitHub session or try again.');
    }
  });

  return threadEl;
}

function renderCommentItem(comment: OverlayComment): HTMLElement {
  const item = document.createElement('div');
  item.className = 'pr-overlay-comment-item';

  if (comment.authorAvatarUrl) {
    const avatar = document.createElement('img');
    avatar.className = 'pr-overlay-avatar';
    avatar.src = comment.authorAvatarUrl;
    avatar.alt = comment.author;
    item.appendChild(avatar);
  }

  const main = document.createElement('div');
  main.className = 'pr-overlay-comment-main';

  const meta = document.createElement('div');
  const authorSpan = document.createElement('span');
  authorSpan.className = 'pr-overlay-comment-author';
  authorSpan.textContent = comment.author;

  const dateSpan = document.createElement('span');
  dateSpan.className = 'pr-overlay-comment-date';
  dateSpan.textContent = comment.createdAt;

  meta.appendChild(authorSpan);
  meta.appendChild(dateSpan);

  const text = document.createElement('div');
  text.className = 'pr-overlay-comment-text';
  text.textContent = comment.body;

  main.appendChild(meta);
  main.appendChild(text);
  item.appendChild(main);

  return item;
}

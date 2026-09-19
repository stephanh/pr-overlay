import { OverlayComment } from '../types/manifest';
import { encodeOverlayComment } from '../contract/commentEngine';

export type PostCommentHandler = (
  commentBody: string,
  tabId: string,
  sectionId: string
) => Promise<OverlayComment>;

export class CommentComponent {
  private comments: OverlayComment[] = [];
  private onPostComment: PostCommentHandler;

  constructor(comments: OverlayComment[], onPostComment: PostCommentHandler) {
    this.comments = comments;
    this.onPostComment = onPostComment;
  }

  public renderThread(tabId: string, sectionId: string, sectionTitle: string): HTMLElement {
    const threadBox = document.createElement('div');
    threadBox.className = 'pr-overlay-comment-thread border rounded-2 p-3 my-3 color-bg-subtle';
    threadBox.setAttribute('data-section-id', sectionId);

    const threadHeader = document.createElement('div');
    threadHeader.className = 'd-flex flex-items-center flex-justify-between mb-3 border-bottom pb-2';
    threadHeader.innerHTML = `
      <div class="font-weight-bold f5">💬 Feedback on "${sectionTitle}"</div>
      <span class="Counter">${this.getSectionComments(tabId, sectionId).length}</span>
    `;
    threadBox.appendChild(threadHeader);

    // List of existing comments
    const commentsList = document.createElement('div');
    commentsList.className = 'comments-list mb-3';

    const sectionComments = this.getSectionComments(tabId, sectionId);
    if (sectionComments.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'color-fg-muted f6 italic my-2';
      emptyMsg.textContent = 'No comments yet on this section. Be the first to leave feedback!';
      commentsList.appendChild(emptyMsg);
    } else {
      sectionComments.forEach((comment) => {
        commentsList.appendChild(this.renderCommentCard(comment));
      });
    }

    threadBox.appendChild(commentsList);

    // Add Comment Form
    const form = document.createElement('form');
    form.className = 'add-comment-form mt-3';

    const textarea = document.createElement('textarea');
    textarea.className = 'form-control input-block mb-2';
    textarea.placeholder = 'Leave a comment... (Markdown supported)';
    textarea.rows = 3;
    textarea.style.resize = 'vertical';

    const actionsBar = document.createElement('div');
    actionsBar.className = 'd-flex flex-justify-end';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-sm';
    submitBtn.textContent = 'Comment';

    actionsBar.appendChild(submitBtn);
    form.appendChild(textarea);
    form.appendChild(actionsBar);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = textarea.value.trim();
      if (!body) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';

      try {
        const newComment = await this.onPostComment(body, tabId, sectionId);
        this.comments.push(newComment);

        // Re-render thread list
        commentsList.appendChild(this.renderCommentCard(newComment));
        textarea.value = '';
      } catch (err) {
        alert(`Failed to post comment: ${err}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Comment';
      }
    });

    threadBox.appendChild(form);
    return threadBox;
  }

  private renderCommentCard(comment: OverlayComment): HTMLElement {
    const card = document.createElement('div');
    card.className = 'border rounded-2 p-3 mb-2 color-bg-default';

    const header = document.createElement('div');
    header.className = 'd-flex flex-items-center mb-2';

    const avatarHtml = comment.avatarUrl
      ? `<img src="${comment.avatarUrl}" class="avatar avatar-user mr-2" width="20" height="20" alt="${comment.author}">`
      : `<span class="avatar avatar-user mr-2 bg-blue color-fg-on-emphasis text-center" style="width:20px; height:20px; line-height:20px; font-size:12px;">${comment.author.charAt(0).toUpperCase()}</span>`;

    const formattedDate = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '';

    header.innerHTML = `
      ${avatarHtml}
      <span class="font-weight-bold f6 mr-2">${comment.author}</span>
      <span class="color-fg-muted f6">${formattedDate}</span>
    `;

    const body = document.createElement('div');
    body.className = 'markdown-body f6';
    body.textContent = comment.body;

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  private getSectionComments(tabId: string, sectionId: string): OverlayComment[] {
    return this.comments.filter(
      (c) => c.tabId === tabId && c.sectionId === sectionId
    );
  }
}

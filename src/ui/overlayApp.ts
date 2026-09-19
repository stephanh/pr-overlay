import { Manifest, TabConfig, OverlayComment, VerificationData } from '../types/manifest';
import { extractManifestPointer, fetchManifest, fetchContent } from '../contract/manifestExtractor';
import { extractOverlayComments, encodeOverlayComment } from '../contract/commentEngine';
import { TabInjector } from './tabInjector';
import { SPARouter } from './spaRouter';
import { MarkdownRenderer } from '../renderers/markdownRenderer';
import { VerificationRenderer } from '../renderers/verificationRenderer';
import { CommentComponent } from './commentComponent';

export class PROverlayApp {
  private manifest: Manifest | null = null;
  private comments: OverlayComment[] = [];
  private tabInjector: TabInjector;
  private spaRouter: SPARouter;
  private markdownRenderer: MarkdownRenderer;
  private verificationRenderer: VerificationRenderer;
  private overlayContainer: HTMLElement | null = null;
  private githubPRContentElements: HTMLElement[] = [];

  constructor() {
    this.tabInjector = new TabInjector((tabId) => this.handleTabSelect(tabId));
    this.spaRouter = new SPARouter();
    this.markdownRenderer = new MarkdownRenderer();
    this.verificationRenderer = new VerificationRenderer();
  }

  public async init(): Promise<void> {
    this.spaRouter.onChange(() => this.bootstrap());
    this.spaRouter.start();
    await this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const prBodyElement = document.querySelector<HTMLElement>('.comment-body, [data-target="pull-request.description"]');
    if (!prBodyElement) return;

    // Use innerHTML so HTML comment tags like <!-- pr-overlay-manifest: ... --> are preserved
    const pointer = extractManifestPointer(prBodyElement.innerHTML || prBodyElement.innerText || '');
    if (!pointer) return;

    try {
      if (pointer.type === 'url') {
        this.manifest = await fetchManifest(pointer.data);
      } else {
        this.manifest = JSON.parse(pointer.data) as Manifest;
      }
    } catch (err) {
      console.error('[PR Overlay] Failed to load manifest:', err);
      return;
    }

    if (!this.manifest || !this.manifest.tabs) return;

    // Fetch existing GitHub comments for Option B comment sync
    await this.fetchExistingComments();

    // Inject tabs into GitHub header bar
    const tabsToInject = this.manifest.tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      icon: tab.icon || (tab.id.includes('arch') ? '📐' : '✅'),
    }));

    this.tabInjector.injectTabs(tabsToInject);
  }

  private async fetchExistingComments(): Promise<void> {
    // Attempt fetching comments via GitHub page DOM or REST API
    // Use innerHTML so HTML comment tags like <!-- pr-overlay-comment: ... --> are preserved
    const commentBodies = Array.from(document.querySelectorAll<HTMLElement>('.comment-body')).map((el, idx) => ({
      id: idx + 1,
      body: el.innerHTML || el.innerText || '',
      user: {
        login: el.closest('.timeline-comment')?.querySelector('.author')?.textContent || 'reviewer',
      },
      created_at: new Date().toISOString(),
    }));

    this.comments = extractOverlayComments(commentBodies);
  }

  private async handleTabSelect(tabId: string): Promise<void> {
    if (tabId === 'native') {
      this.restoreNativeView();
      return;
    }

    const tabConfig = this.manifest?.tabs.find((t) => t.id === tabId);
    if (!tabConfig) return;

    this.hideNativeView();
    const container = this.getOrCreateOverlayContainer();
    container.innerHTML = '<div class="p-4 text-center color-fg-muted"><span class="animated-ellipsis">Loading PR Overlay content...</span></div>';

    try {
      let contentEl: HTMLElement;

      if (tabConfig.type === 'markdown' && tabConfig.contentUrl) {
        const markdownText = await fetchContent(tabConfig.contentUrl);
        contentEl = await this.markdownRenderer.render(
          markdownText,
          tabId,
          (sectionId, sectionTitle) => this.showCommentModal(tabId, sectionId, sectionTitle)
        );
      } else if (tabConfig.type === 'verification' && tabConfig.data) {
        contentEl = this.verificationRenderer.render(
          tabConfig.data as VerificationData,
          (sectionId, sectionTitle) => this.showCommentModal(tabId, sectionId, sectionTitle)
        );
      } else {
        contentEl = document.createElement('div');
        contentEl.className = 'p-4';
        contentEl.textContent = 'Custom tab content.';
      }

      container.innerHTML = '';
      container.appendChild(contentEl);
    } catch (err) {
      container.innerHTML = `<div class="flash flash-error m-4">Failed to load tab content: ${err}</div>`;
    }
  }

  private showCommentModal(tabId: string, sectionId: string, sectionTitle: string): void {
    const existingModal = document.getElementById('pr-overlay-comment-modal');
    if (existingModal) existingModal.remove();

    const commentComponent = new CommentComponent(this.comments, async (body, tId, sId) => {
      return await this.postComment(body, tId, sId);
    });

    const modal = document.createElement('div');
    modal.id = 'pr-overlay-comment-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '999999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const modalContent = document.createElement('div');
    modalContent.className = 'color-bg-default border rounded-2 p-4';
    modalContent.style.maxWidth = '600px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-link float-right color-fg-muted';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', () => modal.remove());

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(commentComponent.renderThread(tabId, sectionId, sectionTitle));
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  private async postComment(body: string, tabId: string, sectionId: string): Promise<OverlayComment> {
    const commentMeta = {
      tabId,
      sectionId,
      commentId: `c-${Date.now()}`,
      author: 'you',
      createdAt: new Date().toISOString(),
    };

    const encodedBody = encodeOverlayComment(body, commentMeta);

    // Option B: Post to GitHub comment form or API
    const commentFormTextarea = document.querySelector<HTMLTextAreaElement>('textarea[name="comment[body]"]');
    if (commentFormTextarea) {
      commentFormTextarea.value = encodedBody;
      const submitBtn = commentFormTextarea.form?.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      }
    }

    const newComment: OverlayComment = {
      id: commentMeta.commentId,
      tabId,
      sectionId,
      author: 'you',
      createdAt: commentMeta.createdAt,
      body,
    };

    return newComment;
  }

  private getOrCreateOverlayContainer(): HTMLElement {
    if (!this.overlayContainer) {
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.id = 'pr-overlay-container';
      this.overlayContainer.className = 'clearfix container-xl px-3 px-md-4 px-lg-5 mt-4';

      const mainWorkspace = document.querySelector('#js-repo-pjax-container, main, #repo-content-pjax-container, .repository-content');
      if (mainWorkspace) {
        mainWorkspace.appendChild(this.overlayContainer);
      } else {
        document.body.appendChild(this.overlayContainer);
      }
    }
    this.overlayContainer.style.display = 'block';
    return this.overlayContainer;
  }

  private hideNativeView(): void {
    const targets = ['#discussion_bucket', 'div[data-target="navigation-refresh.tab-container"]', '.js-discussion'];
    this.githubPRContentElements = [];

    targets.forEach((selector) => {
      const els = document.querySelectorAll<HTMLElement>(selector);
      els.forEach((el) => {
        if (el.style.display !== 'none') {
          el.dataset.prOverlayPrevDisplay = el.style.display;
          el.style.display = 'none';
          this.githubPRContentElements.push(el);
        }
      });
    });
  }

  private restoreNativeView(): void {
    if (this.overlayContainer) {
      this.overlayContainer.style.display = 'none';
    }

    this.githubPRContentElements.forEach((el) => {
      el.style.display = el.dataset.prOverlayPrevDisplay || '';
    });
  }
}

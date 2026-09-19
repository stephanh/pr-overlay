import './styles/overlay.css';
import { parsePRBody } from './parser/pr-body-parser';
import { parseOverlayComments } from './parser/comment-parser';
import { getPRDetails, scrapeCommentsFromDOM } from './comments/github-api';
import { TabManager } from './ui/tabs';
import { OverlayContainer } from './ui/container';
import { OverlayTabType, ParsedPRContent } from './types';

class PROverlayApp {
  private tabManager: TabManager | null = null;
  private container: OverlayContainer = new OverlayContainer();
  private parsedContent: ParsedPRContent | null = null;
  private isInitialized = false;

  public init() {
    this.setupNavigationHooks();
    this.tryMount();
  }

  private setupNavigationHooks() {
    // GitHub uses Turbo / PJAX for seamless page navigation
    document.addEventListener('turbo:load', () => this.tryMount());
    document.addEventListener('turbo:render', () => this.tryMount());
    document.addEventListener('pjax:end', () => this.tryMount());
    window.addEventListener('popstate', () => this.tryMount());

    // Observe DOM mutations in case elements render asynchronously
    const observer = new MutationObserver(() => {
      if (!this.isInitialized && this.isPRPage()) {
        this.tryMount();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private isPRPage(): boolean {
    return Boolean(getPRDetails());
  }

  private async tryMount() {
    if (!this.isPRPage()) {
      this.cleanup();
      return;
    }

    const prDetails = getPRDetails();
    if (!prDetails) return;

    // Extract raw PR body from DOM or GitHub
    const rawBody = this.extractPRBodyText();
    if (!rawBody) {
      return;
    }

    this.parsedContent = parsePRBody(rawBody);

    if (!this.tabManager) {
      this.tabManager = new TabManager({
        onSelectTab: (tab: OverlayTabType | null) => this.handleTabSelected(tab),
      });
    }

    const injected = this.tabManager.injectTabs();
    if (injected) {
      this.isInitialized = true;
    }
  }

  private extractPRBodyText(): string {
    // 1. Try first comment body in the timeline (the PR description)
    const firstCommentBody = document.querySelector<HTMLElement>(
      '.timeline-comment-group .comment-body, div[data-testid="issue-comment-body"]'
    );

    if (firstCommentBody) {
      // In DOM, comments <!-- --> are present in innerHTML
      return firstCommentBody.innerHTML || firstCommentBody.textContent || '';
    }

    // 2. Check for PR description meta or hidden input
    const issueBodyInput = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="issue[body]"], textarea[name="pull_request[body]"]'
    );
    if (issueBodyInput && issueBodyInput.value) {
      return issueBodyInput.value;
    }

    return '';
  }

  private async handleTabSelected(tab: OverlayTabType | null) {
    if (!tab) {
      this.container.hide();
      return;
    }

    const prDetails = getPRDetails();
    const rawComments = scrapeCommentsFromDOM();
    const commentsMap = parseOverlayComments(rawComments);

    if (this.parsedContent) {
      await this.container.showTab(tab, this.parsedContent, commentsMap, prDetails);
    }
  }

  private cleanup() {
    this.isInitialized = false;
    this.tabManager?.destroy();
    this.tabManager = null;
    this.container.destroy();
  }
}

// Start pr-overlay
const app = new PROverlayApp();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

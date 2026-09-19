import { OverlayTabType, ParsedPRContent, PRDetails, OverlayComment } from '../types';
import { renderArchitectureView } from '../renderers/architecture-view';
import { renderVerificationView } from '../renderers/verification-view';

export class OverlayContainer {
  private containerEl: HTMLElement | null = null;
  private currentTab: OverlayTabType | null = null;

  public getOrCreateContainer(): HTMLElement {
    let container = document.getElementById('pr-overlay-view-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pr-overlay-view-root';
      container.className = 'pr-overlay-container';
      container.style.display = 'none';

      // Attach after the main PR header/nav
      const targetParent = document.querySelector(
        '#discussion_bucket, .clearfix.new-discussion-timeline, [data-turbo-body]'
      );

      if (targetParent && targetParent.parentElement) {
        targetParent.parentElement.insertBefore(container, targetParent);
      } else {
        document.body.appendChild(container);
      }
    }
    this.containerEl = container;
    return container;
  }

  public async showTab(
    tab: OverlayTabType,
    prContent: ParsedPRContent,
    commentsMap: Map<string, OverlayComment[]>,
    prDetails: PRDetails | null
  ) {
    this.currentTab = tab;
    const container = this.getOrCreateContainer();

    // Hide native GitHub buckets
    this.toggleNativeBuckets(false);

    // Show overlay container
    container.style.display = 'flex';
    container.innerHTML = `
      <div class="pr-overlay-header">
        <div class="pr-overlay-title">
          <span>${tab === 'architecture' ? '🏛️ Architecture Review' : '🧪 Verification & Evidence'}</span>
          <span class="pr-overlay-badge">pr-overlay active</span>
        </div>
        <div style="font-size: 12px; color: var(--fgColor-muted, #656d76);">
          Review &amp; comment on AI agent deliverables
        </div>
      </div>
    `;

    if (tab === 'architecture') {
      const archView = await renderArchitectureView(prContent.architecture, commentsMap, prDetails);
      container.appendChild(archView);
    } else if (tab === 'verification') {
      const verifView = await renderVerificationView(prContent.verification, commentsMap, prDetails);
      container.appendChild(verifView);
    }
  }

  public hide() {
    this.currentTab = null;
    if (this.containerEl) {
      this.containerEl.style.display = 'none';
      this.containerEl.innerHTML = '';
    }
    this.toggleNativeBuckets(true);
  }

  private toggleNativeBuckets(show: boolean) {
    const buckets = document.querySelectorAll<HTMLElement>(
      '#discussion_bucket, #files_bucket, #commits_bucket, .js-discussion, .pull-discussion-timeline'
    );
    buckets.forEach((bucket) => {
      bucket.style.display = show ? '' : 'none';
    });
  }

  public destroy() {
    this.hide();
    this.containerEl?.remove();
  }
}

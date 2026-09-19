export interface CustomTabSpec {
  id: string;
  title: string;
  icon?: string;
  badgeCount?: number;
}

export type TabSelectHandler = (tabId: string) => void;

export class TabInjector {
  private activeTabId: string | null = null;
  private onSelectCallback: TabSelectHandler;

  constructor(onSelect: TabSelectHandler) {
    this.onSelectCallback = onSelect;
  }

  /**
   * Finds the PR header navigation tab bar element in GitHub's DOM.
   */
  public findHeaderNav(): HTMLElement | null {
    // Selectors covering modern GitHub designs (UnderlineNav, tabnav-tabs, PR navigation aria-label)
    const selectors = [
      'nav[aria-label="Pull request"] ul',
      'nav[aria-label="Pull request"]',
      'nav[aria-label="PR navigation"] ul',
      'nav[aria-label="PR navigation"]',
      '.tabnav-tabs',
      '.js-line-comments-tab', // parent item sibling
      'ul.UnderlineNav-body',
      'ul[role="tablist"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }
    return null;
  }

  /**
   * Injects custom tabs into GitHub's PR header bar if not already present.
   */
  public injectTabs(tabs: CustomTabSpec[]): boolean {
    const navContainer = this.findHeaderNav();
    if (!navContainer) return false;

    // Standardize injection container to be a list if nav is standard HTML nav
    const targetParent = navContainer.tagName.toLowerCase() === 'ul' || navContainer.tagName.toLowerCase() === 'ol'
      ? navContainer
      : (navContainer.querySelector('ul') || navContainer);

    for (const tab of tabs) {
      const existingTab = document.getElementById(`pr-overlay-tab-${tab.id}`);
      if (existingTab) continue;

      const tabElement = this.createTabElement(tab);
      targetParent.appendChild(tabElement);
    }

    this.attachNativeTabListeners();
    return true;
  }

  /**
   * Creates a styled DOM tab matching GitHub's UnderlineNav or TabNav styling.
   */
  private createTabElement(tab: CustomTabSpec): HTMLElement {
    const li = document.createElement('li');
    li.id = `pr-overlay-tab-${tab.id}`;
    li.className = 'pr-overlay-tab-item d-inline-block';
    li.setAttribute('data-tab-id', tab.id);

    const a = document.createElement('a');
    a.href = `#pr-overlay-${tab.id}`;
    a.className = 'tabnav-tab UnderlineNav-item js-pr-overlay-tab';
    a.style.cursor = 'pointer';
    a.style.userSelect = 'none';

    // Icon handling
    if (tab.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'mr-1';
      iconSpan.textContent = tab.icon;
      a.appendChild(iconSpan);
    }

    const titleSpan = document.createElement('span');
    titleSpan.setAttribute('data-content', tab.title);
    titleSpan.textContent = tab.title;
    a.appendChild(titleSpan);

    if (tab.badgeCount !== undefined) {
      const badge = document.createElement('span');
      badge.className = 'Counter ml-1';
      badge.textContent = String(tab.badgeCount);
      a.appendChild(badge);
    }

    a.addEventListener('click', (e) => {
      e.preventDefault();
      this.setActiveTab(tab.id);
      this.onSelectCallback(tab.id);
    });

    li.appendChild(a);
    return li;
  }

  /**
   * Listens for clicks on native GitHub tabs so we can hide our overlay when user returns to Conversation / Files changed.
   */
  private attachNativeTabListeners(): void {
    const nav = this.findHeaderNav();
    if (!nav) return;

    const nativeTabs = nav.querySelectorAll<HTMLElement>('a:not(.js-pr-overlay-tab)');
    nativeTabs.forEach((nativeTab) => {
      if (nativeTab.dataset.prOverlayBound) return;
      nativeTab.dataset.prOverlayBound = 'true';

      nativeTab.addEventListener('click', () => {
        this.clearActiveCustomTab();
        this.onSelectCallback('native');
      });
    });
  }

  /**
   * Sets active styling on the selected custom tab.
   */
  public setActiveTab(tabId: string): void {
    this.activeTabId = tabId;

    // Clear active status on native GitHub tabs
    const nav = this.findHeaderNav();
    if (nav) {
      const nativeLinks = nav.querySelectorAll<HTMLElement>('a');
      nativeLinks.forEach((link) => {
        link.classList.remove('selected');
        link.removeAttribute('aria-current');
      });
    }

    // Set active status on our tab
    const customTabs = document.querySelectorAll<HTMLElement>('.js-pr-overlay-tab');
    customTabs.forEach((tabEl) => {
      const parent = tabEl.closest('.pr-overlay-tab-item');
      const isThisTab = parent?.getAttribute('data-tab-id') === tabId;

      if (isThisTab) {
        tabEl.classList.add('selected');
        tabEl.setAttribute('aria-current', 'page');
      } else {
        tabEl.classList.remove('selected');
        tabEl.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Clears active state from all custom overlay tabs.
   */
  public clearActiveCustomTab(): void {
    this.activeTabId = null;
    const customTabs = document.querySelectorAll<HTMLElement>('.js-pr-overlay-tab');
    customTabs.forEach((tabEl) => {
      tabEl.classList.remove('selected');
      tabEl.removeAttribute('aria-current');
    });
  }

  public getActiveTabId(): string | null {
    return this.activeTabId;
  }
}

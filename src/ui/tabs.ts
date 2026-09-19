import { OverlayTabType } from '../types';

export interface TabManagerOptions {
  onSelectTab: (tab: OverlayTabType | null) => void;
}

export class TabManager {
  private archTabEl: HTMLElement | null = null;
  private verifTabEl: HTMLElement | null = null;
  private currentTab: OverlayTabType | null = null;
  private onSelectTab: (tab: OverlayTabType | null) => void;

  constructor(options: TabManagerOptions) {
    this.onSelectTab = options.onSelectTab;
    this.handleHashChange = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.handleHashChange);
  }

  public injectTabs(): boolean {
    // Check if already injected
    if (document.getElementById('pr-overlay-tab-arch')) {
      return true;
    }

    // Locate GitHub PR tab navigation
    const nav = document.querySelector<HTMLElement>(
      'nav[aria-label="Pull request tabs"], .tabnav-tabs, nav.UnderlineNav-body'
    );

    if (!nav) {
      return false;
    }

    // Determine the styling class based on existing tabs
    const sampleTab = nav.querySelector<HTMLElement>('a, button');
    const isUnderlineNav = sampleTab?.classList.contains('UnderlineNav-item') || nav.classList.contains('UnderlineNav-body');
    const baseClass = isUnderlineNav ? 'UnderlineNav-item' : 'tabnav-tab';

    // 1. Architecture Tab
    const archTab = document.createElement('a');
    archTab.id = 'pr-overlay-tab-arch';
    archTab.className = `${baseClass} pr-overlay-custom-tab`;
    archTab.href = '#pr-overlay-architecture';
    archTab.setAttribute('role', 'tab');
    archTab.innerHTML = `
      <span class="pr-overlay-tab-icon">🏛️</span>
      <span data-content="Architecture">Architecture</span>
    `;

    // 2. Verification Tab
    const verifTab = document.createElement('a');
    verifTab.id = 'pr-overlay-tab-verif';
    verifTab.className = `${baseClass} pr-overlay-custom-tab`;
    verifTab.href = '#pr-overlay-verification';
    verifTab.setAttribute('role', 'tab');
    verifTab.innerHTML = `
      <span class="pr-overlay-tab-icon">🧪</span>
      <span data-content="Verification">Verification</span>
    `;

    // Intercept native tabs clicks to restore GitHub's normal view
    const nativeTabs = nav.querySelectorAll<HTMLElement>('a:not(.pr-overlay-custom-tab)');
    nativeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.deselectCustomTabs();
        this.currentTab = null;
        this.onSelectTab(null);
      });
    });

    archTab.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = 'pr-overlay-architecture';
      this.selectTab('architecture');
    });

    verifTab.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = 'pr-overlay-verification';
      this.selectTab('verification');
    });

    nav.appendChild(archTab);
    nav.appendChild(verifTab);

    this.archTabEl = archTab;
    this.verifTabEl = verifTab;

    // Check if initial URL has hash
    this.handleHashChange();

    return true;
  }

  public selectTab(tab: OverlayTabType | null) {
    this.currentTab = tab;

    // Deselect native tabs
    const nav = document.querySelector('nav[aria-label="Pull request tabs"], .tabnav-tabs, nav.UnderlineNav-body');
    if (nav) {
      const nativeTabs = nav.querySelectorAll<HTMLElement>('a:not(.pr-overlay-custom-tab)');
      nativeTabs.forEach((t) => {
        if (tab !== null) {
          t.classList.remove('selected');
          t.removeAttribute('aria-current');
        }
      });
    }

    if (this.archTabEl) {
      if (tab === 'architecture') {
        this.archTabEl.classList.add('selected');
        this.archTabEl.setAttribute('aria-current', 'page');
      } else {
        this.archTabEl.classList.remove('selected');
        this.archTabEl.removeAttribute('aria-current');
      }
    }

    if (this.verifTabEl) {
      if (tab === 'verification') {
        this.verifTabEl.classList.add('selected');
        this.verifTabEl.setAttribute('aria-current', 'page');
      } else {
        this.verifTabEl.classList.remove('selected');
        this.verifTabEl.removeAttribute('aria-current');
      }
    }

    this.onSelectTab(tab);
  }

  public deselectCustomTabs() {
    this.archTabEl?.classList.remove('selected');
    this.archTabEl?.removeAttribute('aria-current');
    this.verifTabEl?.classList.remove('selected');
    this.verifTabEl?.removeAttribute('aria-current');
  }

  private handleHashChange() {
    const hash = window.location.hash;
    if (hash === '#pr-overlay-architecture') {
      this.selectTab('architecture');
    } else if (hash === '#pr-overlay-verification') {
      this.selectTab('verification');
    }
  }

  public destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    this.archTabEl?.remove();
    this.verifTabEl?.remove();
  }
}

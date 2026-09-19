type RouteChangeListener = () => void;

export class SPARouter {
  private listeners: RouteChangeListener[] = [];
  private observer: MutationObserver | null = null;
  private currentUrl: string = '';

  constructor() {
    this.currentUrl = window.location.href;
  }

  public onChange(listener: RouteChangeListener): void {
    this.listeners.push(listener);
  }

  public start(): void {
    // 1. GitHub Turbo / PJAX events
    const events = ['turbo:render', 'turbo:load', 'pjax:end', 'pjax:complete', 'popstate'];
    events.forEach((evt) => {
      window.addEventListener(evt, () => this.handleNavigation());
    });

    // 2. Mutation Observer fallback for dynamic GitHub SPA DOM replacements
    this.observer = new MutationObserver(() => {
      if (window.location.href !== this.currentUrl) {
        this.currentUrl = window.location.href;
        this.handleNavigation();
      }
    });

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
      this.observer.observe(targetNode, { childList: true, subtree: true });
    }
  }

  private handleNavigation(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('[PR Overlay] Error in route change listener:', err);
      }
    }
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

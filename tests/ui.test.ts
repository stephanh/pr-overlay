/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabInjector } from '../src/ui/tabInjector';

describe('TabInjector', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav aria-label="Pull request">
        <ul class="UnderlineNav-body">
          <li><a href="/pull/1" class="selected">Conversation</a></li>
          <li><a href="/pull/1/files">Files changed</a></li>
        </ul>
      </nav>
      <div id="discussion_bucket">PR Content</div>
    `;
  });

  it('injects custom tabs into GitHub nav bar', () => {
    const onSelect = vi.fn();
    const injector = new TabInjector(onSelect);

    const injected = injector.injectTabs([
      { id: 'architecture', title: 'Architecture', icon: '📐' },
      { id: 'verification', title: 'Verification', icon: '✅', badgeCount: 3 },
    ]);

    expect(injected).toBe(true);

    const archTab = document.getElementById('pr-overlay-tab-architecture');
    const verifTab = document.getElementById('pr-overlay-tab-verification');

    expect(archTab).not.toBeNull();
    expect(verifTab).not.toBeNull();
    expect(archTab?.textContent).toContain('📐');
    expect(archTab?.textContent).toContain('Architecture');
    expect(verifTab?.textContent).toContain('Verification');
    expect(verifTab?.textContent).toContain('3');
  });

  it('handles tab selection state correctly', () => {
    const onSelect = vi.fn();
    const injector = new TabInjector(onSelect);

    injector.injectTabs([
      { id: 'architecture', title: 'Architecture' },
    ]);

    injector.setActiveTab('architecture');

    const archLink = document.querySelector('#pr-overlay-tab-architecture a');
    expect(archLink?.classList.contains('selected')).toBe(true);
    expect(archLink?.getAttribute('aria-current')).toBe('page');

    injector.clearActiveCustomTab();
    expect(archLink?.classList.contains('selected')).toBe(false);
  });
});

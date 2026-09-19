/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { VerificationRenderer } from '../src/renderers/verificationRenderer';
import { CommentComponent } from '../src/ui/commentComponent';
import { OverlayComment } from '../src/types/manifest';

describe('VerificationRenderer', () => {
  it('renders status badge and test metrics correctly', () => {
    const renderer = new VerificationRenderer();
    const el = renderer.render({
      status: 'passed',
      suiteName: 'Playwright E2E Suite',
      summary: 'All end-to-end tests completed successfully.',
      testsRun: 42,
      testsPassed: 42,
      testsFailed: 0,
      durationMs: 12500,
      media: [
        { type: 'image', url: 'https://example.com/screenshot.png', title: 'Dashboard Screenshot' },
      ],
    });

    expect(el.textContent).toContain('PASSED');
    expect(el.textContent).toContain('Playwright E2E Suite');
    expect(el.textContent).toContain('42');
    expect(el.textContent).toContain('12.50s');

    const img = el.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.src).toBe('https://example.com/screenshot.png');
  });
});

describe('CommentComponent', () => {
  it('renders thread with existing comments and posts new comments', async () => {
    const existingComments: OverlayComment[] = [
      {
        id: 'c-1',
        tabId: 'architecture',
        sectionId: 'sec-overview',
        author: 'alice',
        createdAt: '2026-09-18T10:00:00Z',
        body: 'Looks good to me!',
      },
    ];

    const onPost = vi.fn().mockImplementation(async (body, tabId, sectionId) => {
      return {
        id: 'c-2',
        tabId,
        sectionId,
        author: 'bob',
        createdAt: new Date().toISOString(),
        body,
      };
    });

    const component = new CommentComponent(existingComments, onPost);
    const threadEl = component.renderThread('architecture', 'sec-overview', 'Overview Section');

    expect(threadEl.textContent).toContain('Looks good to me!');
    expect(threadEl.textContent).toContain('alice');

    const textarea = threadEl.querySelector('textarea')!;
    const form = threadEl.querySelector('form')!;

    textarea.value = 'New comment on overview';
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    expect(onPost).toHaveBeenCalledWith('New comment on overview', 'architecture', 'sec-overview');
  });
});

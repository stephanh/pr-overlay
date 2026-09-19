import { describe, it, expect } from 'vitest';
import { extractManifestPointer } from '../src/contract/manifestExtractor';
import {
  encodeOverlayComment,
  parseOverlayComment,
  extractOverlayComments,
} from '../src/contract/commentEngine';

describe('manifestExtractor', () => {
  it('extracts URL manifest pointer correctly', () => {
    const prBody = `
## Summary
This PR refactors the core renderer.

<!-- pr-overlay-manifest: https://example.com/artifacts/manifest.json -->

Thanks!
    `;

    const pointer = extractManifestPointer(prBody);
    expect(pointer).not.toBeNull();
    expect(pointer?.type).toBe('url');
    expect(pointer?.data).toBe('https://example.com/artifacts/manifest.json');
  });

  it('extracts inline JSON manifest pointer correctly', () => {
    const prBody = `
<!-- pr-overlay-manifest-json: {"version":"1.0.0","tabs":[{"id":"arch","title":"Architecture","type":"markdown"}]} -->
    `;

    const pointer = extractManifestPointer(prBody);
    expect(pointer).not.toBeNull();
    expect(pointer?.type).toBe('json');
    expect(JSON.parse(pointer!.data).version).toBe('1.0.0');
  });

  it('returns null when no tag is present', () => {
    expect(extractManifestPointer('Just a standard PR description')).toBeNull();
  });
});

describe('commentEngine', () => {
  it('encodes and parses overlay comments correctly', () => {
    const encoded = encodeOverlayComment('Great architectural decision!', {
      tabId: 'architecture',
      sectionId: 'sec-database',
      commentId: 'c-101',
      author: 'octocat',
      createdAt: '2026-09-18T12:00:00Z',
    });

    expect(encoded).toContain('<!-- pr-overlay-comment:');
    expect(encoded).toContain('Great architectural decision!');

    const parsed = parseOverlayComment(encoded, {
      githubCommentId: 999,
      author: 'octocat',
      createdAt: '2026-09-18T12:00:00Z',
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe('c-101');
    expect(parsed?.tabId).toBe('architecture');
    expect(parsed?.sectionId).toBe('sec-database');
    expect(parsed?.body).toBe('Great architectural decision!');
    expect(parsed?.githubCommentId).toBe(999);
  });

  it('extracts multiple comments from raw GitHub issue comments', () => {
    const rawComments = [
      { id: 1, body: 'Regular GitHub comment', user: { login: 'user1' } },
      {
        id: 2,
        body: encodeOverlayComment('Comment on verification suite', {
          tabId: 'verification',
          sectionId: 'sec-tests',
          commentId: 'c-102',
        }),
        user: { login: 'user2', avatar_url: 'https://example.com/avatar.png' },
        created_at: '2026-09-18T14:00:00Z',
      },
    ];

    const extracted = extractOverlayComments(rawComments);
    expect(extracted.length).toBe(1);
    expect(extracted[0].id).toBe('c-102');
    expect(extracted[0].author).toBe('user2');
    expect(extracted[0].tabId).toBe('verification');
  });
});

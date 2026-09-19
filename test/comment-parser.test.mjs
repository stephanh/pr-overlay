import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation logic of comment parser
const ANCHOR_REGEX = /(?:^|\n)>\s*\\?\[pr-overlay:(architecture|verification)#([a-zA-Z0-9_-]+)\\?\]\s*\r?\n?/;

function formatAnchorQuote(tab, anchorId) {
  return `> [pr-overlay:${tab}#${anchorId}]\n\n`;
}

function parseCommentAnchor(body) {
  const match = ANCHOR_REGEX.exec(body);
  if (!match) return null;

  const tab = match[1].toLowerCase();
  const anchorId = match[2];
  const cleanBody = body.replace(ANCHOR_REGEX, '').trim();

  return { tab, anchorId, cleanBody };
}

function parseOverlayComments(comments) {
  const commentMap = new Map();

  for (const raw of comments) {
    const parsed = parseCommentAnchor(raw.body);
    if (parsed) {
      const comment = {
        id: raw.id,
        author: raw.author,
        authorAvatarUrl: raw.authorAvatarUrl,
        createdAt: raw.createdAt,
        body: parsed.cleanBody || raw.body,
        anchorId: parsed.anchorId,
        tab: parsed.tab,
      };

      const list = commentMap.get(parsed.anchorId) || [];
      list.push(comment);
      commentMap.set(parsed.anchorId, list);
    }
  }

  return commentMap;
}

test('formatAnchorQuote formats correctly', () => {
  const quote = formatAnchorQuote('architecture', 'data-flow');
  assert.equal(quote, '> [pr-overlay:architecture#data-flow]\n\n');
});

test('parseCommentAnchor parses valid architecture anchor and strips quote', () => {
  const comment = '> [pr-overlay:architecture#data-flow]\n\nShould we use an event bus here instead?';
  const parsed = parseCommentAnchor(comment);

  assert.ok(parsed);
  assert.equal(parsed.tab, 'architecture');
  assert.equal(parsed.anchorId, 'data-flow');
  assert.equal(parsed.cleanBody, 'Should we use an event bus here instead?');
});

test('parseCommentAnchor parses valid verification anchor with markdown escape brackets', () => {
  const comment = '> \\[pr-overlay:verification#log-unit-tests\\]\n\nLooks like tests 4 and 5 were skipped.';
  const parsed = parseCommentAnchor(comment);

  assert.ok(parsed);
  assert.equal(parsed.tab, 'verification');
  assert.equal(parsed.anchorId, 'log-unit-tests');
  assert.equal(parsed.cleanBody, 'Looks like tests 4 and 5 were skipped.');
});

test('parseCommentAnchor ignores regular comments without anchor', () => {
  const comment = 'LGTM! Great work on this PR.';
  const parsed = parseCommentAnchor(comment);
  assert.equal(parsed, null);
});

test('parseOverlayComments groups comments by anchorId', () => {
  const rawComments = [
    {
      id: '1',
      author: 'alice',
      createdAt: '2026-09-19T10:00:00Z',
      body: '> [pr-overlay:architecture#api-gateway]\n\nDo we need rate limiting?',
    },
    {
      id: '2',
      author: 'bob',
      createdAt: '2026-09-19T10:05:00Z',
      body: '> [pr-overlay:architecture#api-gateway]\n\nYes, added Redis token bucket.',
    },
    {
      id: '3',
      author: 'charlie',
      createdAt: '2026-09-19T10:10:00Z',
      body: '> [pr-overlay:verification#test-run]\n\nAll green!',
    },
  ];

  const map = parseOverlayComments(rawComments);
  assert.equal(map.size, 2);

  const gatewayComments = map.get('api-gateway');
  assert.equal(gatewayComments.length, 2);
  assert.equal(gatewayComments[0].author, 'alice');
  assert.equal(gatewayComments[1].author, 'bob');

  const testComments = map.get('test-run');
  assert.equal(testComments.length, 1);
  assert.equal(testComments[0].author, 'charlie');
});

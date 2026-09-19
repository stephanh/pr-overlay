import test from 'node:test';
import assert from 'node:assert/strict';

function extractCommentSection(body, sectionKey) {
  const startMarker = new RegExp(`<!--\\s*pr-overlay:${sectionKey}:start\\s*-->`, 'i');
  const endMarker = new RegExp(`<!--\\s*pr-overlay:${sectionKey}:end\\s*-->`, 'i');

  const startMatch = startMarker.exec(body);
  if (!startMatch) return null;

  const startIndex = startMatch.index + startMatch[0].length;
  const subContent = body.slice(startIndex);
  const endMatch = endMarker.exec(subContent);

  if (endMatch) {
    return subContent.slice(0, endMatch.index).trim();
  }
  return subContent.trim();
}

function extractHeaderSection(body, headerPattern) {
  const match = headerPattern.exec(body);
  if (!match) return null;

  const startIndex = match.index;
  const headingLevel = match[1].length;
  const rest = body.slice(startIndex + match[0].length);

  const nextHeadingRegex = new RegExp(`(^|\\n)#{1,${headingLevel}}\\s+`, 'm');
  const nextMatch = nextHeadingRegex.exec(rest);

  if (nextMatch) {
    return (match[0] + rest.slice(0, nextMatch.index)).trim();
  }
  return (match[0] + rest).trim();
}

function parseCodeFenceMeta(metaStr) {
  const result = {};
  if (!metaStr) return result;

  const attrRegex = /([a-zA-Z0-9_-]+)=["']?([^"'\]\s]+)["']?/g;
  let m;
  while ((m = attrRegex.exec(metaStr)) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

test('extractCommentSection extracts clean content between tags', () => {
  const prBody = `
Summary of changes.

<!-- pr-overlay:architecture:start -->
## Architecture
Here is the system design.
\`\`\`mermaid
graph TD; A-->B;
\`\`\`
<!-- pr-overlay:architecture:end -->

Other details...
  `;

  const content = extractCommentSection(prBody, 'architecture');
  assert.ok(content);
  assert.match(content, /^## Architecture/);
  assert.match(content, /graph TD; A-->B;/);
});

test('extractHeaderSection falls back to markdown headers', () => {
  const prBody = `
## Summary
This PR adds auth.

## Architecture
This is the architecture description.

### Component Details
Some component notes.

## Verification
Ran tests with npm test.
  `;

  const archContent = extractHeaderSection(prBody, /^(#{1,3})\s+(?:🏛️\s*)?Architecture/im);
  assert.ok(archContent);
  assert.match(archContent, /## Architecture/);
  assert.match(archContent, /Component Details/);
  assert.ok(!archContent.includes('## Verification'));

  const verifContent = extractHeaderSection(prBody, /^(#{1,3})\s+(?:🧪\s*|✅\s*)?Verification/im);
  assert.ok(verifContent);
  assert.match(verifContent, /## Verification/);
  assert.match(verifContent, /Ran tests with npm test/);
});

test('parseCodeFenceMeta parses attributes properly', () => {
  const metaStr = '[title="Unit Tests" command="npm test" exitCode="0"]';
  const meta = parseCodeFenceMeta(metaStr);

  assert.equal(meta.title, 'Unit Tests');
  assert.equal(meta.command, 'npm test');
  assert.equal(meta.exitCode, '0');
});

import { Manifest } from '../types/manifest';

export const MANIFEST_TAG_REGEX = /<!--\s*pr-overlay-manifest:\s*(\S+?)\s*-->/i;
export const MANIFEST_INLINE_REGEX = /<!--\s*pr-overlay-manifest-json:\s*({[\s\S]*?})\s*-->/i;

/**
 * Extract manifest URL or inline JSON manifest from PR description/comment body text.
 */
export function extractManifestPointer(bodyText: string): { type: 'url' | 'json'; data: string } | null {
  if (!bodyText) return null;

  const urlMatch = bodyText.match(MANIFEST_TAG_REGEX);
  if (urlMatch && urlMatch[1]) {
    return { type: 'url', data: urlMatch[1] };
  }

  const jsonMatch = bodyText.match(MANIFEST_INLINE_REGEX);
  if (jsonMatch && jsonMatch[1]) {
    return { type: 'json', data: jsonMatch[1] };
  }

  return null;
}

/**
 * Fetches an external manifest JSON from a URL.
 * Uses GM_xmlhttpRequest if available to bypass potential CORS restrictions on external hosts, falling back to standard fetch.
 */
export async function fetchManifest(manifestUrl: string): Promise<Manifest> {
  if (typeof GM_xmlhttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: manifestUrl,
        onload: (response) => {
          if (response.status >= 200 && response.status < 300) {
            try {
              const manifest = JSON.parse(response.responseText) as Manifest;
              resolve(manifest);
            } catch (err) {
              reject(new Error(`Failed to parse manifest JSON: ${err}`));
            }
          } else {
            reject(new Error(`Failed to fetch manifest: HTTP ${response.status}`));
          }
        },
        onerror: (err) => reject(new Error(`GM_xmlhttpRequest network error: ${JSON.stringify(err)}`)),
      });
    });
  }

  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: HTTP ${response.status}`);
  }
  return (await response.json()) as Manifest;
}

/**
 * Loads an external markdown or resource content.
 */
export async function fetchContent(contentUrl: string): Promise<string> {
  if (typeof GM_xmlhttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: contentUrl,
        onload: (response) => {
          if (response.status >= 200 && response.status < 300) {
            resolve(response.responseText);
          } else {
            reject(new Error(`Failed to fetch content: HTTP ${response.status}`));
          }
        },
        onerror: (err) => reject(new Error(`GM_xmlhttpRequest network error: ${JSON.stringify(err)}`)),
      });
    });
  }

  const response = await fetch(contentUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch content: HTTP ${response.status}`);
  }
  return await response.text();
}

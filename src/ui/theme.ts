/**
 * GitHub theme detection utility
 */

export type ThemeMode = 'light' | 'dark';

export function getGitHubTheme(): ThemeMode {
  const html = document.documentElement;
  const colorMode = html.getAttribute('data-color-mode');

  if (colorMode === 'dark') {
    return 'dark';
  } else if (colorMode === 'light') {
    return 'light';
  }

  // If set to auto, check dark theme attribute or system preference
  const darkTheme = html.getAttribute('data-dark-theme');
  if (darkTheme && html.getAttribute('data-color-mode') === 'dark') {
    return 'dark';
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function observeThemeChange(callback: (theme: ThemeMode) => void): () => void {
  const observer = new MutationObserver(() => {
    callback(getGitHubTheme());
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode', 'data-dark-theme', 'data-light-theme'],
  });

  return () => observer.disconnect();
}

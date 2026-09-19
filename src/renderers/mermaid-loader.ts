import { getGitHubTheme } from '../ui/theme';

declare global {
  interface Window {
    mermaid?: any;
  }
}

let mermaidLoadedPromise: Promise<any> | null = null;

export async function ensureMermaid(): Promise<any> {
  if (window.mermaid) {
    return window.mermaid;
  }

  if (mermaidLoadedPromise) {
    return mermaidLoadedPromise;
  }

  mermaidLoadedPromise = new Promise((resolve, reject) => {
    // Check if already injected
    const existing = document.getElementById('pr-overlay-mermaid-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.mermaid));
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pr-overlay-mermaid-script';
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: getGitHubTheme() === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
        });
        resolve(window.mermaid);
      } else {
        reject(new Error('Mermaid failed to load'));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return mermaidLoadedPromise;
}

let diagramCounter = 0;

export async function renderMermaidDiagram(chartCode: string): Promise<string> {
  const mermaid = await ensureMermaid();
  const theme = getGitHubTheme() === 'dark' ? 'dark' : 'default';

  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: 'loose',
  });

  const id = `pr-overlay-mermaid-${diagramCounter++}`;
  try {
    const { svg } = await mermaid.render(id, chartCode.trim());
    return svg;
  } catch (error) {
    console.error('[pr-overlay] Mermaid rendering error:', error);
    return `<div style="color: var(--color-danger-fg, #cf222e); padding: 12px; font-family: monospace;">
      Failed to render diagram: ${escapeHtml((error as Error).message)}
      <pre style="margin-top: 8px; font-size: 11px;">${escapeHtml(chartCode)}</pre>
    </div>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

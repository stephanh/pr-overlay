import { marked } from 'marked';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export class MarkdownRenderer {
  private static mermaidIdCounter = 0;

  /**
   * Renders markdown string into HTML, processes mermaid diagrams, and instruments section comment anchors.
   */
  public async render(
    markdownContent: string,
    tabId: string,
    onCommentClick?: (sectionId: string, sectionTitle: string) => void
  ): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.className = 'pr-overlay-markdown-body markdown-body p-4';

    // Parse Markdown to HTML string
    const parsedHtml = await marked.parse(markdownContent);
    container.innerHTML = parsedHtml;

    // 1. Process Mermaid diagrams
    await this.processMermaidDiagrams(container);

    // 2. Instrument section headings with comment buttons
    this.instrumentHeadings(container, tabId, onCommentClick);

    return container;
  }

  private async processMermaidDiagrams(container: HTMLElement): Promise<void> {
    const codeBlocks = container.querySelectorAll<HTMLElement>('code.language-mermaid, pre code.language-mermaid');

    for (const block of Array.from(codeBlocks)) {
      const code = block.textContent || '';
      const mermaidContainer = document.createElement('div');
      mermaidContainer.className = 'pr-overlay-mermaid my-3 text-center';

      MarkdownRenderer.mermaidIdCounter++;
      const graphId = `pr-overlay-mermaid-${MarkdownRenderer.mermaidIdCounter}`;

      try {
        const { svg } = await mermaid.render(graphId, code);
        mermaidContainer.innerHTML = svg;

        const parentToReplace = block.closest('pre') || block;
        parentToReplace.replaceWith(mermaidContainer);
      } catch (err) {
        console.error('[PR Overlay] Error rendering Mermaid diagram:', err);
        const errorNotice = document.createElement('div');
        errorNotice.className = 'flash flash-error my-2 p-2';
        errorNotice.textContent = `Failed to render diagram: ${err}`;
        block.replaceWith(errorNotice);
      }
    }
  }

  private instrumentHeadings(
    container: HTMLElement,
    tabId: string,
    onCommentClick?: (sectionId: string, sectionTitle: string) => void
  ): void {
    const headings = container.querySelectorAll<HTMLElement>('h1, h2, h3, h4');

    headings.forEach((heading, idx) => {
      const title = heading.textContent?.trim() || `Section ${idx + 1}`;
      const sectionId = heading.id || `sec-${idx + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      heading.id = sectionId;

      heading.style.display = 'flex';
      heading.style.alignItems = 'center';
      heading.style.justifyContent = 'space-between';

      const commentBtn = document.createElement('button');
      commentBtn.type = 'button';
      commentBtn.className = 'btn btn-sm btn-outline ml-2 pr-overlay-comment-btn';
      commentBtn.style.fontSize = '12px';
      commentBtn.style.padding = '2px 8px';
      commentBtn.innerHTML = '💬 Comment';

      commentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onCommentClick) {
          onCommentClick(sectionId, title);
        }
      });

      heading.appendChild(commentBtn);
    });
  }
}

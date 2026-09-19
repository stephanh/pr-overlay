import { marked } from 'marked';
import { ParsedSection, OverlayComment, PRDetails } from '../types';
import { renderLogBlock } from './log-viewer';
import { renderMermaidDiagram } from './mermaid-loader';
import { createCommentThread } from '../comments/comment-thread';

export async function renderVerificationView(
  section: ParsedSection | undefined,
  commentsMap: Map<string, OverlayComment[]>,
  prDetails: PRDetails | null
): Promise<HTMLElement> {
  const container = document.createElement('div');
  container.className = 'pr-overlay-content';

  if (!section || section.blocks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pr-overlay-empty';
    empty.innerHTML = `
      <div class="pr-overlay-empty-icon">🧪</div>
      <div class="pr-overlay-empty-title">No Verification Results Found</div>
      <div class="pr-overlay-empty-desc">
        The PR description does not contain verification evidence.
        AI agents can provide test runs, animated GIFs, and CLI logs using <code>&lt;!-- pr-overlay:verification:start --&gt;</code> or a <code>## Verification</code> heading with <code>\`\`\`log</code> blocks.
      </div>
    `;
    container.appendChild(empty);
    return container;
  }

  for (const block of section.blocks) {
    const blockComments = commentsMap.get(block.id) || [];

    if (block.type === 'log') {
      const logEl = renderLogBlock(block);
      const thread = createCommentThread({
        anchorId: block.id,
        tab: 'verification',
        prDetails,
        comments: blockComments,
      });
      logEl.appendChild(thread);
      container.appendChild(logEl);
    } else if (block.type === 'mermaid') {
      const card = document.createElement('div');
      card.className = 'pr-overlay-mermaid-card';
      card.id = block.id;

      const header = document.createElement('div');
      header.className = 'pr-overlay-mermaid-header';
      header.innerHTML = `
        <span>📊 ${escapeHtml(block.title || 'Verification Flow')}</span>
        <span class="pr-overlay-badge">Mermaid</span>
      `;

      const canvas = document.createElement('div');
      canvas.className = 'pr-overlay-mermaid-canvas';
      canvas.innerHTML = '<div>Rendering diagram...</div>';

      card.appendChild(header);
      card.appendChild(canvas);

      renderMermaidDiagram(block.content).then((svg) => {
        canvas.innerHTML = svg;
      });

      const thread = createCommentThread({
        anchorId: block.id,
        tab: 'verification',
        prDetails,
        comments: blockComments,
      });
      card.appendChild(thread);

      container.appendChild(card);
    } else {
      const card = document.createElement('div');
      card.className = 'pr-overlay-card';
      card.id = block.id;

      if (block.title) {
        const header = document.createElement('div');
        header.className = 'pr-overlay-card-header';
        header.innerHTML = `
          <div class="pr-overlay-card-title">
            <span>✅</span>
            <span>${escapeHtml(block.title)}</span>
          </div>
        `;
        card.appendChild(header);
      }

      const body = document.createElement('div');
      body.className = 'pr-overlay-card-body pr-overlay-markdown';
      body.innerHTML = await marked.parse(block.content);
      card.appendChild(body);

      const thread = createCommentThread({
        anchorId: block.id,
        tab: 'verification',
        prDetails,
        comments: blockComments,
      });
      card.appendChild(thread);

      container.appendChild(card);
    }
  }

  return container;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

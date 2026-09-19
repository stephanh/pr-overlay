import { ParsedBlock } from '../types';

/**
 * Basic ANSI escape sequence to HTML converter
 */
export function ansiToHtml(text: string): string {
  // Escape raw HTML first
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Replace common ANSI color codes
  escaped = escaped
    .replace(/\x1b\[32m/g, '<span class="ansi-green">')
    .replace(/\x1b\[31m/g, '<span class="ansi-red">')
    .replace(/\x1b\[33m/g, '<span class="ansi-yellow">')
    .replace(/\x1b\[34m/g, '<span class="ansi-blue">')
    .replace(/\x1b\[35m/g, '<span class="ansi-magenta">')
    .replace(/\x1b\[36m/g, '<span class="ansi-cyan">')
    .replace(/\x1b\[1m/g, '<span style="font-weight:bold;">')
    .replace(/\x1b\[2m/g, '<span class="ansi-dim">')
    .replace(/\x1b\[0?m/g, '</span>');

  return escaped;
}

/**
 * Creates an interactive terminal log block element
 */
export function renderLogBlock(block: ParsedBlock): HTMLElement {
  const meta = block.meta || {};
  const command = meta.command || block.title || 'Command Output';
  const exitCode = meta.exitCode !== undefined ? meta.exitCode : (meta.status === 'failed' ? '1' : '0');
  const isSuccess = exitCode === '0' || exitCode === 'success';

  const container = document.createElement('div');
  container.className = 'pr-overlay-terminal';
  container.dataset.anchorId = block.id;

  // Header Bar
  const bar = document.createElement('div');
  bar.className = 'pr-overlay-terminal-bar';

  const titleCol = document.createElement('div');
  titleCol.className = 'pr-overlay-terminal-title';
  titleCol.innerHTML = `
    <span>⚡</span>
    <span class="pr-overlay-terminal-command">${escapeHtml(command)}</span>
    <span class="pr-overlay-status-badge ${isSuccess ? 'success' : 'failed'}">
      ${isSuccess ? '✓ Exit 0' : `✗ Exit ${escapeHtml(exitCode)}`}
    </span>
  `;

  const actionsCol = document.createElement('div');
  actionsCol.className = 'pr-overlay-terminal-actions';

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'pr-overlay-btn-icon';
  copyBtn.textContent = 'Copy';
  copyBtn.title = 'Copy log to clipboard';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 2000);
    } catch {
      copyBtn.textContent = 'Failed';
    }
  });

  // Collapse / Expand button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'pr-overlay-btn-icon';
  toggleBtn.textContent = 'Collapse';
  
  actionsCol.appendChild(copyBtn);
  actionsCol.appendChild(toggleBtn);
  bar.appendChild(titleCol);
  bar.appendChild(actionsCol);

  // Terminal Body
  const body = document.createElement('div');
  body.className = 'pr-overlay-terminal-body';
  body.innerHTML = ansiToHtml(block.content);

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = body.classList.toggle('collapsed');
    toggleBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
  });

  container.appendChild(bar);
  container.appendChild(body);

  return container;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

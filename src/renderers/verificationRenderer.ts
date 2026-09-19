import { VerificationData } from '../types/manifest';

export class VerificationRenderer {
  public render(data: VerificationData, onCommentClick?: (sectionId: string, title: string) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'pr-overlay-verification p-4';

    // Status Badge & Header
    const statusColorMap = {
      passed: { bg: '#238636', text: '#ffffff', label: 'PASSED' },
      failed: { bg: '#da3633', text: '#ffffff', label: 'FAILED' },
      warning: { bg: '#d29922', text: '#ffffff', label: 'WARNING' },
      skipped: { bg: '#6e7681', text: '#ffffff', label: 'SKIPPED' },
    };

    const statusInfo = statusColorMap[data.status] || statusColorMap.passed;

    const header = document.createElement('div');
    header.className = 'd-flex flex-items-center flex-justify-between pb-3 mb-4 border-bottom';
    header.innerHTML = `
      <div class="d-flex flex-items-center">
        <span class="State mr-3" style="background-color: ${statusInfo.bg}; color: ${statusInfo.text}; padding: 4px 12px; font-weight: 600; border-radius: 6px;">
          ${statusInfo.label}
        </span>
        <h2 class="h3 mb-0">${data.suiteName || 'Verification Suite'}</h2>
      </div>
    `;

    const commentBtn = document.createElement('button');
    commentBtn.type = 'button';
    commentBtn.className = 'btn btn-sm btn-outline';
    commentBtn.innerHTML = '💬 Comment on Verification';
    commentBtn.addEventListener('click', () => {
      if (onCommentClick) {
        onCommentClick('verification-suite', data.suiteName || 'Verification Suite');
      }
    });
    header.appendChild(commentBtn);
    container.appendChild(header);

    // Summary text
    if (data.summary) {
      const summaryBox = document.createElement('div');
      summaryBox.className = 'markdown-body mb-4 p-3 color-bg-subtle rounded-2 border';
      summaryBox.textContent = data.summary;
      container.appendChild(summaryBox);
    }

    // Metrics Cards Grid
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'd-flex flex-wrap gap-3 mb-4';
    metricsGrid.style.display = 'grid';
    metricsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    metricsGrid.style.gap = '12px';

    const metrics = [
      { label: 'Tests Run', value: data.testsRun ?? '-' },
      { label: 'Passed', value: data.testsPassed ?? '-', color: '#3fb950' },
      { label: 'Failed', value: data.testsFailed ?? '-', color: data.testsFailed ? '#f85149' : undefined },
      { label: 'Skipped', value: data.testsSkipped ?? '-' },
      { label: 'Duration', value: data.durationMs ? `${(data.durationMs / 1000).toFixed(2)}s` : '-' },
    ];

    metrics.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-2 border text-center color-bg-subtle';
      card.innerHTML = `
        <div class="color-fg-muted f6 mb-1">${m.label}</div>
        <div class="f3 font-weight-bold" style="${m.color ? `color: ${m.color};` : ''}">${m.value}</div>
      `;
      metricsGrid.appendChild(card);
    });

    container.appendChild(metricsGrid);

    // Media Gallery (Images, Animated GIFs, Video recordings)
    if (data.media && data.media.length > 0) {
      const mediaSection = document.createElement('div');
      mediaSection.className = 'mb-4';
      mediaSection.innerHTML = '<h3 class="h4 mb-3">Verification Visual Artifacts</h3>';

      const mediaGrid = document.createElement('div');
      mediaGrid.style.display = 'grid';
      mediaGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
      mediaGrid.style.gap = '16px';

      data.media.forEach((item) => {
        const itemBox = document.createElement('div');
        itemBox.className = 'border rounded-2 p-2 color-bg-subtle';

        if (item.title) {
          const title = document.createElement('div');
          title.className = 'font-weight-bold mb-2 f5';
          title.textContent = item.title;
          itemBox.appendChild(title);
        }

        if (item.type === 'video') {
          const video = document.createElement('video');
          video.src = item.url;
          video.controls = true;
          video.autoplay = false;
          video.style.width = '100%';
          video.style.borderRadius = '4px';
          itemBox.appendChild(video);
        } else {
          // image or gif
          const img = document.createElement('img');
          img.src = item.url;
          img.alt = item.title || 'Verification image';
          img.style.width = '100%';
          img.style.height = 'auto';
          img.style.borderRadius = '4px';
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => window.open(item.url, '_blank'));
          itemBox.appendChild(img);
        }

        if (item.caption) {
          const caption = document.createElement('div');
          caption.className = 'color-fg-muted f6 mt-2';
          caption.textContent = item.caption;
          itemBox.appendChild(caption);
        }

        mediaGrid.appendChild(itemBox);
      });

      mediaSection.appendChild(mediaGrid);
      container.appendChild(mediaSection);
    }

    // Logs Link
    if (data.logsUrl) {
      const logsBox = document.createElement('div');
      logsBox.className = 'mt-3';
      logsBox.innerHTML = `
        <a href="${data.logsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
          📄 View Raw Execution Logs
        </a>
      `;
      container.appendChild(logsBox);
    }

    return container;
  }
}

import { PROverlayApp } from './ui/overlayApp';

function init() {
  const app = new PROverlayApp();
  app.init().catch((err) => {
    console.error('[PR Overlay] Initialization error:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

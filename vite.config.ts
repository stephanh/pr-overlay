import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'PR Overlay - AI Verification & Architecture for GitHub',
        namespace: 'https://github.com/stephanh/pr-overlay',
        version: '0.1.0',
        description: 'Enriches GitHub PRs with Architecture and Verification tabs, diagrams, CLI log viewers, and anchored review comments.',
        author: 'stephanh',
        match: ['https://github.com/*/*/pull/*'],
        icon: 'https://github.githubassets.com/favicons/favicon.svg',
        grant: [
          'GM_addStyle',
          'GM_setClipboard'
        ],
        'run-at': 'document-end',
      },
    }),
  ],
});

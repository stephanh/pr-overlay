import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'PR Overlay',
        namespace: 'https://github.com/pr-overlay',
        version: '1.0.0',
        description: 'Enrich GitHub PR UI with verification results, architecture diagrams, and custom review tabs',
        author: 'PR Overlay Team',
        match: [
          'https://github.com/*/*/pull/*'
        ],
        grant: [
          'GM_xmlhttpRequest'
        ]
      },
    }),
  ],
});

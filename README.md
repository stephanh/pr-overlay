# pr-overlay

`pr-overlay` is a Greasemonkey/Tampermonkey userscript that enriches the GitHub Pull Request interface with external verification results, architecture diagrams, media artifacts (screenshots, animated GIFs, videos), and interactive commenting tabs.

---

## 🌟 Why PR Overlay?

Reviewing code produced by AI coding agents can be cumbersome when looking purely at git diffs. AI agents produce rich verification evidence (E2E test video recordings, Playwright screenshots, metrics) and system design diagrams.

`pr-overlay` presents this enriched evidence right inside GitHub's PR UI header bar, allowing human reviewers to review and comment on:
- 📐 **Architecture** (Markdown, interactive Mermaid diagrams, system design)
- ✅ **Verification Results** (Test suite metrics, pass/fail status badges, screenshots, animated GIFs, recorded videos)

---

## 🛠️ Installation

1. Install a userscript manager browser extension:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Greasemonkey](https://www.greasemonkey.expert/)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. Build the userscript:
   ```bash
   npm install
   npm run build
   ```
3. Install the generated file `dist/pr-overlay.user.js` into your userscript manager.

---

## 🤖 AI Agent Integration Protocol & Contract

AI agents raising pull requests do **not** need to clutter the repository codebase with ephemeral verification artifacts. Instead, artifacts are hosted on external storage (S3 bucket, CDN, GitHub Actions artifact storage, Gist, or raw GitHub URLs).

### 1. Linking the Manifest in the PR Description
The AI agent includes a pointer tag anywhere in the Pull Request body description or initial comment:

```html
<!-- pr-overlay-manifest: https://cdn.example.com/pr-123/manifest.json -->
```

*(Alternatively, inline JSON manifests can be embedded using `<!-- pr-overlay-manifest-json: {...} -->`)*

### 2. Manifest JSON Schema (`manifest.json`)

```json
{
  "version": "1.0.0",
  "title": "PR Overlay Artifact Manifest",
  "tabs": [
    {
      "id": "architecture",
      "title": "Architecture",
      "icon": "📐",
      "type": "markdown",
      "contentUrl": "https://cdn.example.com/pr-123/architecture/overview.md"
    },
    {
      "id": "verification",
      "title": "Verification Results",
      "icon": "✅",
      "type": "verification",
      "data": {
        "status": "passed",
        "suiteName": "Playwright E2E Suite",
        "summary": "All 28 end-to-end tests passed successfully.",
        "testsRun": 28,
        "testsPassed": 28,
        "testsFailed": 0,
        "durationMs": 14200,
        "media": [
          {
            "type": "image",
            "url": "https://cdn.example.com/pr-123/verification/screenshot.png",
            "title": "Frontend Verification Screenshot"
          }
        ],
        "logsUrl": "https://github.com/example/repo/actions/runs/12345"
      }
    }
  ]
}
```

---

## 💬 Option B Comment Sync Engine

Reviewers commenting on an Architecture section or Verification result leave inline feedback. To keep comments synced across team members without custom backend servers, `pr-overlay` uses **Option B (PR Issue Comments with Metadata Anchors)**:

```html
<!-- pr-overlay-comment: {"tabId":"architecture","sectionId":"sec-overview","commentId":"c-1726617600","author":"alice","createdAt":"2026-09-18T12:00:00Z"} -->

Great architecture breakdown! I approve the design decision.
```

The userscript parses these comments automatically when loading the PR page and renders them as threaded comments directly beside the relevant architecture heading or test suite result.

---

## 💻 Development & Testing

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Build production userscript bundle
npm run build
```

---

## 📁 Repository Structure

```text
pr-overlay/
├── src/
│   ├── contract/
│   │   ├── manifestExtractor.ts  # Manifest URL & pointer extractor
│   │   └── commentEngine.ts      # Option B comment serializer / parser
│   ├── renderers/
│   │   ├── markdownRenderer.ts   # Marked & Mermaid diagram renderer
│   │   └── verificationRenderer.ts# Verification metrics & media gallery renderer
│   ├── types/
│   │   ├── manifest.ts           # TypeScript interfaces for manifests & comments
│   │   └── tampermonkey.d.ts     # Userscript type definitions
│   ├── ui/
│   │   ├── commentComponent.ts   # Interactive comment thread UI
│   │   ├── overlayApp.ts         # Main PR Overlay controller
│   │   ├── spaRouter.ts          # GitHub SPA (Turbo/PJAX) listener
│   │   └── tabInjector.ts        # Header nav tab injector
│   └── main.ts                   # Entry point
├── tests/                        # Vitest unit test suite
├── examples/                     # Example manifest & markdown files
├── vite.config.ts                # Vite & vite-plugin-monkey configuration
└── package.json
```

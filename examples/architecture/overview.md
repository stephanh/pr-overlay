# System Architecture Overview

This pull request introduces the **PR Overlay Userscript**, which enriches the standard GitHub Pull Request interface with external verification results, architecture diagrams, and custom review tabs.

## High-Level Architecture Diagram

```mermaid
graph TD
    PR[GitHub PR UI] -->|Injects Tabs| TabInjector[Tab Injector Module]
    PR -->|Scans Description| ManifestExtractor[Manifest Extractor]
    ManifestExtractor -->|Fetches JSON| ExtStorage[External Storage S3/CDN/GitHub Raw]
    ExtStorage -->|Loads Manifest & Content| PR
    TabInjector -->|Renders Tab| OverlayView[PR Overlay Container]
    OverlayView --> MarkdownRenderer[Markdown & Mermaid Renderer]
    OverlayView --> VerificationRenderer[Verification View Renderer]
    OverlayView --> CommentComponent[Option B Comment Engine]
    CommentComponent -->|Posts Tagged Comments| GitHubComments[GitHub Issue Comments API]
```

## Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Reviewer
    participant Userscript as PR Overlay Userscript
    participant GitHub as GitHub PR UI
    participant ExtStorage as External Artifact Storage

    AI Agent->>GitHub: Post PR with <!-- pr-overlay-manifest: <URL> -->
    Reviewer->>GitHub: Open PR Page
    Userscript->>GitHub: Parse PR Body
    Userscript->>ExtStorage: Fetch Manifest JSON & Markdown
    Userscript->>GitHub: Inject "📐 Architecture" & "✅ Verification" Tabs
    Reviewer->>Userscript: Click "📐 Architecture" Tab
    Userscript->>Reviewer: Display Markdown + Diagrams + Comment Anchors
    Reviewer->>Userscript: Leave feedback on section
    Userscript->>GitHub: Post PR Comment with <!-- pr-overlay-comment: {...} -->
```

## Key Modules

### 1. Tab Injector
Injects navigation tabs into GitHub's `nav[aria-label="Pull request"]` header bar, keeping native GitHub navigation intact when switching back to Conversation or Files Changed.

### 2. Option B Comment Sync Engine
Comments left on architecture sections or verification items post directly to standard GitHub PR issue comments containing encoded HTML comment metadata anchors (`<!-- pr-overlay-comment: {...} -->`).

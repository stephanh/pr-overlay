/**
 * Common types for pr-overlay
 */

export type OverlayTabType = 'architecture' | 'verification';

export interface ParsedBlock {
  id: string;
  type: 'text' | 'mermaid' | 'log' | 'image';
  title?: string;
  content: string;
  meta?: Record<string, string>;
}

export interface ParsedSection {
  tab: OverlayTabType;
  title: string;
  rawMarkdown: string;
  blocks: ParsedBlock[];
}

export interface ParsedPRContent {
  architecture?: ParsedSection;
  verification?: ParsedSection;
  hasOverlayContent: boolean;
}

export interface OverlayComment {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  createdAt: string;
  body: string;
  anchorId: string;
  tab: OverlayTabType;
  htmlUrl?: string;
}

export interface PRDetails {
  owner: string;
  repo: string;
  pullNumber: number;
}

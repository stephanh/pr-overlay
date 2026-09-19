export interface MediaItem {
  type: 'image' | 'video' | 'gif';
  url: string;
  title?: string;
  caption?: string;
}

export interface VerificationData {
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  summary?: string;
  suiteName?: string;
  durationMs?: number;
  testsRun?: number;
  testsPassed?: number;
  testsFailed?: number;
  testsSkipped?: number;
  media?: MediaItem[];
  logsUrl?: string;
}

export interface TabConfig {
  id: string;
  title: string;
  icon?: string;
  type: 'markdown' | 'verification' | 'custom';
  contentUrl?: string;
  data?: Record<string, unknown> | VerificationData;
}

export interface Manifest {
  version: string;
  title?: string;
  description?: string;
  tabs: TabConfig[];
  metadata?: Record<string, unknown>;
}

export interface PROverlayCommentMeta {
  tabId: string;
  sectionId: string;
  commentId: string;
  author?: string;
  createdAt?: string;
  parentCommentId?: string;
}

export interface OverlayComment {
  id: string;
  tabId: string;
  sectionId: string;
  author: string;
  avatarUrl?: string;
  createdAt: string;
  body: string;
  githubCommentId?: number;
  parentCommentId?: string;
}

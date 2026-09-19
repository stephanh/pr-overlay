declare function GM_xmlhttpRequest(details: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  url: string;
  headers?: Record<string, string>;
  data?: string;
  onload?: (response: {
    status: number;
    statusText: string;
    responseText: string;
    responseHeaders: string;
  }) => void;
  onerror?: (error: unknown) => void;
}): void;

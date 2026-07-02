/**
 * Thin API client. Holds the access token in memory (never localStorage, to
 * limit XSS token theft); the refresh token lives in an httpOnly cookie handled
 * by the browser. On a 401, it transparently tries to refresh once and retries.
 */
// A stray UTF-8 BOM / zero-width char or whitespace in NEXT_PUBLIC_API_URL
// silently turns the request into a relative URL and breaks every API call.
// Extract the URL from the "http(s)://" scheme onward, so any leading garbage
// (and trailing whitespace, since \s includes the BOM) is dropped.
export const API_URL =
  ((process.env.NEXT_PUBLIC_API_URL ?? '').match(/https?:\/\/[^\s]+/)?.[0] ?? '') ||
  'http://localhost:4000/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown; // JSON object or FormData
  retry?: boolean;
  signal?: AbortSignal;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isForm && opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include',
    signal: opts.signal,
    body: isForm ? (opts.body as FormData) : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  // Transparent one-shot refresh on auth expiry.
  if (res.status === 401 && opts.retry !== false && path !== '/auth/refresh') {
    const ok = await refreshAccessToken();
    if (ok) return apiFetch<T>(path, { ...opts, retry: false });
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = data?.error ?? { code: 'ERROR', message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return data as T;
}

import type { Feed, Match, SwipeDirection, SwipeResult } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !body?.success) {
    const message = body && !body.success ? body.message : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body.data;
}

export const api = {
  feed: (limit: number) => request<Feed>(`/feed?limit=${limit}`),
  swipe: (targetId: string, direction: SwipeDirection) =>
    request<SwipeResult>('/swipe', {
      method: 'POST',
      body: JSON.stringify({ targetId, direction }),
    }),
  matches: () => request<{ matches: Match[] }>('/matches'),
  resetDemo: () => request<unknown>('/demo/reset', { method: 'POST' }),
};

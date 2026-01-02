import type { GetToken } from '@clerk/types';

const DEFAULT_API_URL = 'http://localhost:8000';

export function getApiBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { getToken?: GetToken; tokenTemplate?: string } = {}
): Promise<T> {
  const { getToken, tokenTemplate, headers, ...rest } = options;
  const baseUrl = getApiBaseUrl();

  const token =
    getToken ? await getToken(tokenTemplate ? { template: tokenTemplate } : undefined) : null;

  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body?.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}



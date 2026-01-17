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
    let detail: string = `Request failed (${res.status}${res.statusText ? ` ${res.statusText}` : ''})`;
    try {
      const body = await res.json();

      const rawDetail = body?.detail ?? body?.message ?? body;
      if (typeof rawDetail === 'string') {
        detail = rawDetail;
      } else if (Array.isArray(rawDetail)) {
        // FastAPI validation errors: list of { loc, msg, type }
        const msgs = rawDetail
          .map((e) => {
            if (typeof e === 'string') return e;
            const msg = e?.msg ? String(e.msg) : JSON.stringify(e);
            const loc = Array.isArray(e?.loc) ? e.loc.join('.') : e?.loc ? String(e.loc) : '';
            return loc ? `${loc}: ${msg}` : msg;
          })
          .filter(Boolean);
        detail = msgs.length ? msgs.join('\n') : detail;
      } else if (rawDetail && typeof rawDetail === 'object') {
        detail = JSON.stringify(rawDetail);
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}



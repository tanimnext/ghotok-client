// Browser API client used by the website, the member dashboard and the admin
// dashboard. Every request goes to /api on the page's own origin, which Next.js
// forwards to ghotok-server, so the session cookie stays first-party.

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field errors from a 400 VALIDATION_ERROR, e.g. `{ trxId: 'invalid' }`. */
  get fields() {
    return this.details?.fields ?? {};
  }
}

function toQueryString(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

/**
 * Calls the API and returns the parsed JSON. The Better Auth session cookie is
 * sent automatically; sign-in itself goes through the auth client (lib/auth-client.js).
 * @throws {ApiError}
 */
export async function apiFetch(path, { method = 'GET', body, query } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}${toQueryString(query)}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server.');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = data?.error ?? {};
    throw new ApiError(
      res.status,
      error.code ?? 'SERVER_ERROR',
      error.message ?? res.statusText,
      error.details,
    );
  }
  return data;
}

export const api = {
  get: (path, query) => apiFetch(path, { query }),
  post: (path, body = {}) => apiFetch(path, { method: 'POST', body }),
  put: (path, body = {}) => apiFetch(path, { method: 'PUT', body }),
  patch: (path, body = {}) => apiFetch(path, { method: 'PATCH', body }),
  delete: (path, body) => apiFetch(path, { method: 'DELETE', body }),
};

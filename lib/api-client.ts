/**
 * The single request path for every call this console makes.
 *
 * Adapted from salon-owner-dashboard/src/lib/api-client.ts — the refresh-and-replay behaviour is
 * the same because the backend is the same. What differs is the session key (an operator may well
 * be signed into both dashboards in one browser, and one must not overwrite the other) and the
 * role check at login: this console is useless to anyone but a SUPER_ADMIN, so it refuses the
 * session up front rather than letting every panel 403 one by one.
 */
function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return 'http://localhost:3000/api';
    }
  }

  return 'https://salunbd-backend-service.onrender.com/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

/** Deliberately distinct from the owner dashboard's 'salon_session_v1'. */
const SESSION_KEY = 'salon_platform_session_v1';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Sends the operator back to sign-in once the session is definitively gone.
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/sign-in') return;
  window.location.assign('/sign-in');
}

let refreshInFlight: Promise<string | null> | null = null;

function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = getSession();
    if (!session?.refreshToken) return null;
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) {
        // Only clear if server explicitly rejected the token (400, 401, 403)
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          clearSession();
          redirectToLogin();
        }
        return null;
      }
      const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
      setSession({ ...session, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return tokens.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function authHeader(token?: string): Record<string, string> {
  const access = token ?? getSession()?.accessToken;
  return access ? { authorization: `Bearer ${access}` } : {};
}

async function failureMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.message === 'string' && b.message.trim()) return b.message;
    if (Array.isArray(b.message) && typeof b.message[0] === 'string') {
      return b.message.filter((m) => typeof m === 'string').join(', ');
    }
    if (typeof b.error === 'string' && b.error.trim()) return b.error;
    if (typeof b.detail === 'string' && b.detail.trim()) return b.detail;
  }
  return fallback;
}

function isAuthMintPath(path: string): boolean {
  return (
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/refresh' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password'
  );
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();

  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const hasBody = init?.body !== undefined && init?.body !== null;
  const shouldSetJsonHeader = hasBody && !isFormData;

  const send = (token?: string, targetBaseUrl: string = baseUrl) => {
    const headers: Record<string, string> = {
      ...(shouldSetJsonHeader ? { 'content-type': 'application/json' } : {}),
      ...authHeader(token),
      ...(init?.headers as Record<string, string> | undefined),
    };

    return fetch(`${targetBaseUrl}${cleanPath}`, {
      cache: 'no-store',
      ...init,
      headers,
    });
  };

  let res: Response;
  try {
    res = await send();
  } catch (netErr) {
    // If local backend connection failed, attempt remote Render backend fallback
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const remoteFallback = 'https://salunbd-backend-service.onrender.com/api';
    if (isLocal && baseUrl !== remoteFallback) {
      try {
        console.warn(`[api-client] Local backend (${baseUrl}) connection failed. Falling back to remote (${remoteFallback})...`);
        res = await send(undefined, remoteFallback);
      } catch {
        throw netErr;
      }
    } else {
      throw netErr;
    }
  }

  // The auth mint endpoints mint sessions rather than consuming them; a 401 there is a real answer.
  // Authenticated routes like /auth/users or /auth/me MUST refresh and replay on 401.
  if (res.status === 401 && !isAuthMintPath(cleanPath)) {
    const token = await refreshSession();
    if (!token) {
      clearSession();
      redirectToLogin();
      throw new ApiError('Your session has expired. Sign in again to continue.', 401);
    }
    res = await send(token);
  }

  if (!res.ok) {
    throw new ApiError(await failureMessage(res, `Request failed (${res.status})`), res.status);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return undefined as T;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // If not valid JSON, return the raw trimmed text
    return trimmed as unknown as T;
  }
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();

  const send = (token?: string) =>
    fetch(`${baseUrl}${cleanPath}`, {
      method: 'POST',
      cache: 'no-store',
      headers: authHeader(token),
      body: form,
    });

  let res = await send();
  if (res.status === 401 && !isAuthMintPath(cleanPath)) {
    const token = await refreshSession();
    if (!token) {
      clearSession();
      redirectToLogin();
      throw new ApiError('Your session has expired. Sign in again to continue.', 401);
    }
    res = await send(token);
  }

  if (!res.ok) {
    throw new ApiError(await failureMessage(res, `Upload failed (${res.status})`), res.status);
  }

  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return undefined as T;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return trimmed as unknown as T;
  }
}

export async function login(email: string, password: string): Promise<Session> {
  const auth = await apiFetch<{ accessToken: string; refreshToken: string; user: SessionUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );

  if (auth.user.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      'That account is not a platform operator. Shop owners sign in on the owner dashboard.',
      403,
    );
  }

  const session: Session = { accessToken: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user };
  setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const session = getSession();
  if (session?.refreshToken) {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }).catch(() => {
      // Best-effort — the local session is cleared regardless of the network outcome.
    });
  }
  clearSession();
}

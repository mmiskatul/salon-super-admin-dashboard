/**
 * The single request path for every call this console makes — now backed by an axios instance
 * instead of raw fetch, so every one of the ~20 modules under lib/api/ gets connection pooling,
 * automatic JSON handling, and a real interceptor pipeline for free without changing a single
 * call site: `apiFetch<T>(path, init)` keeps its exact old (fetch-shaped) signature.
 *
 * Adapted from salon-owner-dashboard/src/lib/api-client.ts — the refresh-and-replay behaviour is
 * the same because the backend is the same. What differs is the session key (an operator may well
 * be signed into both dashboards in one browser, and one must not overwrite the other) and the
 * role check at login: this console is useless to anyone but a SUPER_ADMIN, so it refuses the
 * session up front rather than letting every panel 403 one by one.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  return 'https://salunbd-backend-service.onrender.com/api';
}

export const API_BASE_URL = resolveApiBaseUrl();
const REMOTE_FALLBACK_URL = 'https://salunbd-backend-service.onrender.com/api';

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

/** Bare axios call (not the `http` instance below) — refreshing must never itself go through the
 *  401-handling interceptor, or a rejected refresh would try to refresh itself forever. */
function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = getSession();
    if (!session?.refreshToken) return null;
    try {
      const res = await axios.post(
        `${getApiBaseUrl()}/auth/refresh`,
        { refreshToken: session.refreshToken },
        { headers: { 'content-type': 'application/json' }, validateStatus: () => true },
      );
      if (res.status < 200 || res.status >= 300) {
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          clearSession();
          redirectToLogin();
        }
        return null;
      }
      const tokens = res.data as { accessToken: string; refreshToken: string };
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

function isAuthMintPath(path: string): boolean {
  return (
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/refresh' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password'
  );
}

function failureMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const b = data as Record<string, unknown>;
    if (typeof b.message === 'string' && b.message.trim()) return b.message;
    if (Array.isArray(b.message) && typeof b.message[0] === 'string') {
      return b.message.filter((m) => typeof m === 'string').join(', ');
    }
    if (typeof b.error === 'string' && b.error.trim()) return b.error;
    if (typeof b.detail === 'string' && b.detail.trim()) return b.detail;
  }
  return fallback;
}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retried401?: boolean;
    _triedRemoteFallback?: boolean;
  }
}

/** The shared axios instance every request in this console goes through. */
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // NOTE: deliberately does NOT set a Cache-Control header here (the old fetch-based client's
  // `cache: 'no-store'` was a RequestInit option, not a real HTTP header, so this is not a
  // behavior change). Setting one adds it to the CORS preflight's Access-Control-Request-Headers,
  // and the backend's allowedHeaders list (src/common/cors.config.ts) does not include
  // Cache-Control — the preflight then fails and every request surfaces as a generic axios
  // "Network Error" with no further detail, which is exactly what broke this after the axios
  // migration. XHR/axios GET requests to a JSON API aren't disk-cached by the browser regardless.
  const method = (config.method ?? 'GET').toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (!isFormData && (config.data != null || ['POST', 'PUT', 'PATCH'].includes(method))) {
    config.headers.set('Content-Type', 'application/json');
  }

  const path = config.url ?? '';
  if (!isAuthMintPath(path)) {
    const token = getSession()?.accessToken;
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;

    // Network-level failure (no response at all) — if we're pointed at a local backend, retry once
    // against the deployed Render backend rather than surfacing a dead-console error.
    if (!error.response && config && !config._triedRemoteFallback) {
      const isLocal = String(config.baseURL).includes('localhost') || String(config.baseURL).includes('127.0.0.1');
      if (isLocal && config.baseURL !== REMOTE_FALLBACK_URL) {
        console.warn(`[api-client] Local backend (${config.baseURL}) connection failed. Falling back to remote (${REMOTE_FALLBACK_URL})...`);
        config._triedRemoteFallback = true;
        config.baseURL = REMOTE_FALLBACK_URL;
        return http.request(config);
      }
    }

    const path = config?.url ?? '';
    if (error.response?.status === 401 && config && !config._retried401 && !isAuthMintPath(path)) {
      config._retried401 = true;
      const token = await refreshSession();
      if (!token) {
        clearSession();
        redirectToLogin();
        throw new ApiError('Your session has expired. Sign in again to continue.', 401);
      }
      config.headers.set('Authorization', `Bearer ${token}`);
      return http.request(config);
    }

    if (error.response) {
      throw new ApiError(
        failureMessage(error.response.data, `Request failed (${error.response.status})`),
        error.response.status,
      );
    }

    throw error;
  },
);

/**
 * Fetch-shaped adapter over `http`, kept so every existing `lib/api/*.ts` module (which all call
 * `apiFetch<T>(path, { method, body: JSON.stringify(...) })`) needed zero changes for this switch.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const method = (init?.method ?? 'GET') as string;
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  let data: unknown;
  if (isFormData) {
    data = init!.body;
  } else if (typeof init?.body === 'string') {
    try {
      data = JSON.parse(init.body);
    } catch {
      data = init.body;
    }
  } else if (init?.body != null) {
    data = init.body;
  }

  const res = await http.request<T>({
    url: cleanPath,
    method,
    data,
    headers: init?.headers as Record<string, string> | undefined,
  });

  if (res.status === 204 || res.data === '') return undefined as T;
  return res.data;
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const res = await http.request<T>({
    url: cleanPath,
    method: 'POST',
    data: form,
  });
  if (res.status === 204 || res.data === '') return undefined as T;
  return res.data;
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

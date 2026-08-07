const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

const SESSION_KEY = 'salon_admin_session_v1';

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

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  businessType: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
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
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(session ? { authorization: `Bearer ${session.accessToken}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(email: string, password: string): Promise<Session> {
  const auth = await apiFetch<{ accessToken: string; refreshToken: string; user: SessionUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
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
      // Best-effort — clear the local session regardless of network outcome.
    });
  }
  clearSession();
}

// GET /tenants is SUPER_ADMIN-only on the backend (service-business/src/tenant/tenant.controller.ts).
export function getTenants(): Promise<Tenant[]> {
  return apiFetch<Tenant[]>('/tenants');
}

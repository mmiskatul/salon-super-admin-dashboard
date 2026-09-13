/**
 * The single request path for every call this console makes.
 *
 * Adapted from salon-owner-dashboard/src/lib/api-client.ts — the refresh-and-replay behaviour is
 * the same because the backend is the same. What differs is the session key (an operator may well
 * be signed into both dashboards in one browser, and one must not overwrite the other) and the
 * role check at login: this console is useless to anyone but a SUPER_ADMIN, so it refuses the
 * session up front rather than letting every panel 403 one by one.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

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
  }
}

/**
 * Sends the operator back to sign-in once the session is definitively gone.
 *
 * A hard assignment rather than the Next router: this is reachable from module scope, on behalf of
 * any in-flight request rather than a component, where no router instance is in hand.
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/sign-in') return;
  window.location.assign('/sign-in');
}

/**
 * Exchanges the stored refresh token for a fresh pair.
 *
 * Held as a module-level promise so a burst of panels all 401-ing at once triggers exactly one
 * exchange. That is not merely an efficiency concern: the server revokes the old refresh token as
 * it issues the new one, so a second concurrent call would present an already-revoked token and
 * sign the operator out for no reason. This console fans out across every tenant on one screen,
 * so simultaneous 401s are the normal case here rather than a rare race.
 */
let refreshInFlight: Promise<string | null> | null = null;

function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = getSession();
    if (!session?.refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) return null;
      // /auth/refresh answers with tokens only, so the cached user is carried across unchanged.
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
  const body = await res.json().catch(() => ({}));
  const raw = (body as { message?: unknown })?.message;
  if (typeof raw === 'string') return raw;
  // class-validator answers with an array of constraint messages for a bad DTO.
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return fallback;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const send = (token?: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...authHeader(token),
        ...init?.headers,
      },
    });

  let res = await send();

  // The auth endpoints mint sessions rather than consuming them; a 401 there is a real answer
  // (wrong password, dead refresh token), not something a retry could fix.
  if (res.status === 401 && !path.startsWith('/auth/')) {
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
  // A handler that returns void still answers 200 with an empty body, which res.json() rejects.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function login(email: string, password: string): Promise<Session> {
  const auth = await apiFetch<{ accessToken: string; refreshToken: string; user: SessionUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );

  // Checked here rather than left to the individual panels. GET /tenants is the spine of this
  // console and is SUPER_ADMIN-only (service-business/src/tenant/tenant.controller.ts), so an
  // owner or barber who signs in successfully would land on a console where every panel reads
  // "Forbidden" — a worse answer than being told plainly that this is the wrong door.
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

import { apiFetch } from '../api-client';

/** The insight pages (backend AdminInsightsService, GET /admin/insights/*). Super admins only. */

export type InsightDays = 7 | 30 | 90 | 365;
export type ListingStep = 'service' | 'hours' | 'location' | 'photos';
export interface Counted { key: string; count: number }

export interface ReadinessRow {
  kind: 'shop' | 'barber';
  id: string;
  name: string;
  contactUserId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  signedUpAt: string;
  daysSinceSignup: number;
  hidden: 'SUSPENDED' | 'UNLISTED' | 'BANNED' | null;
  steps: Record<ListingStep, boolean>;
  missing: ListingStep[];
  listed: boolean;
  services: number;
  team: number;
  openSlots7d: number;
  booked7d: number;
  lastBookingAt: string | null;
}

export interface Readiness {
  summary: {
    total: number;
    listed: number;
    hidden: number;
    missing: Record<ListingStep, number>;
    noHoursAhead: number;
    openSlots7d: number;
    booked7d: number;
    fillRate7d: number | null;
  };
  rows: ReadinessRow[];
}

export interface ActiveCount { total: number; customers: number; partners: number }
export interface Reach { users: number; withPush: number; percent: number | null }
export interface Growth {
  days: number;
  totals: { users: number; customers: number; barbers: number; owners: number; unverified: number };
  funnel: {
    startedNotFinished: number;
    gaveUp: number;
    signedUp: number;
    firstBooking: number;
    bookedAgain: number;
    signupToBookingRate: number | null;
    repeatRate: number | null;
  };
  active: { day: ActiveCount; week: ActiveCount; month: ActiveCount };
  bookers: { firstTime: number; returning: number };
  signupsByDay: { day: string; customers: number; barbers: number; owners: number }[];
  push: { customers: Reach; partners: Reach; devices: number; platforms: Counted[] };
  referrals: {
    codes: number;
    total: number;
    inPeriod: number;
    byStatus: Counted[];
    referredWithoutBooking: number;
    topReferrers: { userId: string; name: string | null; count: number }[];
    suspicious: { userId: string; name: string | null; day: string; count: number }[];
  };
}

export interface BookingQuality {
  days: number;
  funnel: {
    requested: number;
    accepted: number;
    completed: number;
    noShow: number;
    cancelledByCustomer: number;
    cancelledByShop: number;
    expiredUnaccepted: number;
    stillWaiting: number;
    acceptRate: number | null;
    completionRate: number | null;
  };
  acceptance: {
    measured: number;
    medianMinutes: number | null;
    averageMinutes: number | null;
    within15min: number | null;
    slowest: { key: string; name: string; medianMinutes: number | null; bookings: number }[];
  };
  cancellations: {
    total: number;
    late: number;
    reasons: Counted[];
    customersWithStrikes: { userId: string; name: string | null; lateCancels: number; restricted: boolean }[];
    strikeLimit: number;
    strikeWindowDays: number;
  };
  sessions: {
    started: number;
    medianLateMinutes: number | null;
    onTime: number | null;
    startedEarly: number;
    finished: number;
    medianOverrunMinutes: number | null;
    overranBy15: number;
  };
  heatmap: number[][];
  places: { key: string; name: string; total: number; noShow: number; cancelled: number; noShowRate: number | null; cancelRate: number | null }[];
}

export interface MapData {
  places: { kind: 'shop' | 'barber'; id: string; name: string; listed: boolean; lat: number; lng: number }[];
  demand: { lat: number; lng: number; count: number; nearestListedKm: number | null }[];
  unservedAreas: { lat: number; lng: number; count: number; nearestListedKm: number | null }[];
  totals: { places: number; listed: number; savedAddresses: number; demandCells: number };
}

export interface Money {
  days: number;
  cash: {
    total: number;
    payments: number;
    byMethod: Counted[];
    byDay: { day: string; amount: number }[];
    byPlace: { key: string; name: string; amount: number; count: number }[];
  };
  coupons: { redemptions: number; discountGiven: number; bookingsWithCoupon: number; topCodes: Counted[]; byPlace: { key: string; name: string; amount: number }[] };
  giftCards: { outstanding: number; liveCards: number; expired: number; byShop: { key: string; name: string; amount: number }[] };
  wallets: { totalBalance: number; withBalance: number };
  loyalty: { pointsOutstanding: number; accountsWithPoints: number };
}

export interface Safety {
  days: number;
  reports: { open: number; total: number; oldestOpenDays: number | null; byReason: Counted[]; byType: Counted[]; inPeriod: number };
  repeatOffenders: { userId: string; name: string | null; reports: number }[];
  blocks: { total: number; inPeriod: number; mostBlocked: { userId: string; name: string | null; blockedBy: number }[] };
  banned: { userId: string; name: string | null; email: string; role: string; bannedAt: string | null; reason: string | null }[];
  reviews: {
    inPeriod: number;
    distribution: { stars: number; count: number }[];
    average: number | null;
    lowRecent: { id: string; rating: number; comment: string | null; createdAt: string; place: string | null; replied: boolean }[];
    unansweredByPlace: { key: string; name: string; count: number }[];
  };
  chat: {
    conversations: number;
    messagesInPeriod: number;
    activeConversations: number;
    medianReplyMinutes: number | null;
    slowestRepliers: { key: string; name: string; medianMinutes: number | null; replies: number }[];
  };
}

export interface JobRun {
  name: string;
  lastRunAt: string | null;
  outcome: 'ok' | 'failed' | 'skipped' | null;
  durationMs: number | null;
  error: string | null;
  runs: number;
  failures: number;
}

export interface SystemHealth {
  checkedAt: string;
  database: { status: string; latencyMs: number };
  redis: { status: string; latencyMs: number | null };
  process: { startedAt: string; uptimeSeconds: number; memoryMb: number; heapUsedMb: number; node: string };
  requests: {
    total: number;
    lastHour: number;
    clientErrors: number;
    serverErrors: number;
    errorRate: number;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    recentErrors: { at: string; status: number; route: string; message: string }[];
  };
  cache: { hits: number; misses: number; hitRate: number | null };
  jobs: JobRun[];
  security: { passwordResets24h: number; passwordResets7d: number; activeSessions: number; signedInAccounts: number };
  rows: { users: number; shops: number; bookings: number; chatMessages: number; notifications: number };
}

export interface CustomerInsight {
  user: { id: string; name: string | null; email: string; phone: string | null; role: string; joinedAt: string; emailVerified: boolean; isBanned: boolean; bannedReason: string | null };
  bookings: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
    noShow: number;
    lateCancels: number;
    spent: number;
    recent: { id: string; place: string | null; tenantId: string | null; staffId: string; service: string | null; startAt: string; status: string; price: number; lateCancel: boolean; reason: string | null }[];
  };
  strikes: { count: number; limit: number; windowDays: number; restricted: boolean };
  addresses: { name: string; address: string; city: string; isDefault: boolean }[];
  favorites: { type: string; id: string; name: string | null; since: string }[];
  safety: {
    reportsFiled: { reason: string; targetType: string; status: string; createdAt: string }[];
    reportsAgainst: { reason: string; targetType: string; status: string; createdAt: string }[];
    blocked: number;
    blockedBy: number;
  };
  sessions: { active: number; lastSeenAt: string | null; pushDevices: number };
  referrals: { code: string | null; invited: number; invitedBy: { userId: string; name: string | null; status: string } | null };
  wallet: { balance: number };
  loyalty: { points: number };
}

export interface ShopInsight {
  shop: { id: string; name: string };
  readiness: { steps: Record<ListingStep, boolean>; missing: ListingStep[]; listed: boolean; hidden: string | null } | null;
  supply: { day: string; open: number; booked: number }[];
  acceptance: { measured: number; medianMinutes: number | null; within15min: number | null };
  reviews: { average: number | null; count: number; distribution: { stars: number; count: number }[]; unanswered: number };
  revenueWeekly: { weekStart: string; amount: number }[];
  team: {
    current: number;
    history: { userId: string; name: string | null; title: string | null; startedAt: string; endedAt: string | null; endReason: string | null }[];
    joinRequests: { userId: string; name: string | null; createdAt: string; state: 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'PENDING' }[];
  };
}

export const getReadiness = () => apiFetch<Readiness>('/admin/insights/readiness');
export const nudgeListing = (body: { tenantId?: string; barberId?: string; message?: string }) =>
  apiFetch<{ sent: boolean; pushDevices: number; body: string }>('/admin/insights/readiness/nudge', { method: 'POST', body: JSON.stringify(body) });
export const getGrowth = (days: InsightDays) => apiFetch<Growth>(`/admin/insights/growth?days=${days}`);
export const getBookingQuality = (days: InsightDays) => apiFetch<BookingQuality>(`/admin/insights/bookings?days=${days}`);
export const getMap = () => apiFetch<MapData>('/admin/insights/map');
export const getMoney = (days: InsightDays) => apiFetch<Money>(`/admin/insights/money?days=${days}`);
export const getSafety = (days: InsightDays) => apiFetch<Safety>(`/admin/insights/safety?days=${days}`);
export const getSystem = () => apiFetch<SystemHealth>('/admin/insights/system');
export const getCustomerInsight = (id: string) => apiFetch<CustomerInsight>(`/admin/insights/customers/${encodeURIComponent(id)}`);
export const getShopInsight = (tenantId: string) => apiFetch<ShopInsight>(`/admin/insights/shops/${encodeURIComponent(tenantId)}`);

export const STEP_LABELS: Record<ListingStep, string> = { service: 'Service', hours: 'Hours', location: 'Map pin', photos: 'Photo' };

import { apiFetch } from '../api-client';
import { listUsers, getUserWallet, getUserWalletEntries, type PlatformUser, type UserWallet, type UserWalletEntry } from './users';
import { listTenants, type Tenant } from './tenants';
import { listStaff, listSoloBarbers, type Staff, type SoloBarber } from './people';
import { profilesByIds, servicesByOwner, listGallery, type UserProfile, type GalleryPhoto } from './profiles';
import { listAppointments, listReviews, type Appointment, type Review } from './bookings';
import { getScheduleRange, type ScheduleDay } from './schedule';
import { getWorkingHoursFor, type WorkingHours } from './workingHours';
import { listServices, type ServiceItem } from './catalog';

export interface BarberSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  type: 'SHOP_STAFF' | 'SOLO';
  tenantId: string | null;
  tenantName: string | null;
  shopBrandColor: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  ratingAvg: string | number;
  ratingCount: number;
  servicesCount: number;
  appointmentsCount: number;
  walletBalance: number;
  createdAt: string;
}

export interface BarberClientRecord {
  key: string;
  customerId: string | null;
  name: string;
  phone: string | null;
  visits: number;
  totalSpent: number;
  lastVisitAt: string | null;
  isGuest: boolean;
}

export interface BarberDashboardDetail {
  barber: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
    businessName: string | null;
    address: string | null;
    role: string;
    type: 'SHOP_STAFF' | 'SOLO';
    isBanned: boolean;
    bannedReason: string | null;
    bannedAt: string | null;
    createdAt: string;
  };
  tenant: Tenant | null;
  staffRecord: Staff | null;
  metrics: {
    totalBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    cancelledBookings: number;
    uniqueClientsCount: number;
    lifetimeRevenue: number;
    servicesCount: number;
    ratingAvg: string | number;
    ratingCount: number;
    walletBalance: number;
    scheduledHoursCount: number;
  };
  appointments: Appointment[];
  clients: BarberClientRecord[];
  services: ServiceItem[];
  schedule: ScheduleDay[];
  workingHours: WorkingHours | null;
  wallet: UserWallet | null;
  walletEntries: UserWalletEntry[];
  reviews: Review[];
  gallery: GalleryPhoto[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Lists all barbers across the platform:
 * Combines shop-linked staff with role BARBER and independent solo barbers.
 */
export async function listAllBarbers(): Promise<BarberSummary[]> {
  const [usersPage, allTenants, soloBarbers] = await Promise.all([
    listUsers({ role: 'BARBER', limit: 200 }).catch(() => ({ data: [] as PlatformUser[], total: 0, page: 1, limit: 200 })),
    listTenants().catch(() => [] as Tenant[]),
    listSoloBarbers().catch(() => [] as SoloBarber[]),
  ]);

  const tenantMap = new Map<string, Tenant>();
  for (const t of allTenants) {
    tenantMap.set(t.id, t);
  }

  // Also collect staff records from all tenants in parallel to catch staff records whose User.role might differ
  const staffByTenant = await Promise.allSettled(
    allTenants.map(async (t) => {
      const staffList = await listStaff(t.id).catch(() => []);
      return { tenant: t, staffList };
    }),
  );

  const staffMap = new Map<string, { staff: Staff; tenant: Tenant }>();
  for (const res of staffByTenant) {
    if (res.status === 'fulfilled') {
      for (const s of res.value.staffList) {
        staffMap.set(s.userId, { staff: s, tenant: res.value.tenant });
      }
    }
  }

  const soloIdSet = new Set(soloBarbers.map((b) => b.id).filter(Boolean));

  // Collect all unique barber user IDs
  const allBarberUserIds = new Set<string>();
  for (const u of usersPage.data) {
    allBarberUserIds.add(u.id);
  }
  for (const id of soloIdSet) {
    allBarberUserIds.add(id);
  }
  for (const s of staffMap.keys()) {
    allBarberUserIds.add(s);
  }

  const idsArray = Array.from(allBarberUserIds);
  if (idsArray.length === 0) return [];

  // Batch lookup profiles
  const profiles = await profilesByIds(idsArray).catch(() => ({} as Record<string, UserProfile>));

  // Build unified summary rows
  const summaries: BarberSummary[] = [];

  for (const userId of idsArray) {
    const user = usersPage.data.find((u) => u.id === userId);
    const staffEntry = staffMap.get(userId);
    const isSolo = soloIdSet.has(userId) || (!user?.tenantId && !staffEntry);
    const profile = profiles[userId];

    const tenantId = staffEntry?.tenant.id || user?.tenantId || null;
    const tenant = tenantId ? tenantMap.get(tenantId) : null;

    const name = profile?.name || staffEntry?.staff.name || user?.email?.split('@')[0] || `Barber ${userId.slice(0, 6)}`;
    const email = user?.email || (profile as unknown as { email?: string })?.email || '—';
    const phone = profile?.phone || null;
    const isBanned = !!user?.isBanned;
    const bannedReason = user?.bannedReason || null;
    const ratingAvg = profile?.ratingAvg || staffEntry?.staff.rating || 0;
    const ratingCount = profile?.ratingCount || staffEntry?.staff.reviewCount || 0;

    summaries.push({
      id: userId,
      name,
      email,
      phone,
      role: user?.role || 'BARBER',
      type: isSolo ? 'SOLO' : 'SHOP_STAFF',
      tenantId,
      tenantName: tenant?.name || null,
      shopBrandColor: tenant?.brandColor || null,
      isBanned,
      bannedReason,
      ratingAvg,
      ratingCount,
      servicesCount: 0,
      appointmentsCount: 0,
      walletBalance: 0,
      createdAt: user?.createdAt || profile?.createdAt || new Date().toISOString(),
    });
  }

  return summaries;
}

/**
 * Deep inspection and operations fetcher for an individual barber.
 */
type RawReview = Omit<Review, 'customerName'>;

export async function getBarberDashboard(userId: string): Promise<BarberDashboardDetail> {
  // Fetch user record and profile in parallel
  const [userRes, profileRes, soloBarbers, allTenants, gallery, schedule, workingHours, wallet, walletEntries] =
    await Promise.all([
      listUsers({ search: userId, limit: 10 }).catch(() => ({ data: [] as PlatformUser[], total: 0, page: 1, limit: 10 })),
      profilesByIds([userId]).catch(() => ({} as Record<string, UserProfile>)),
      listSoloBarbers().catch(() => [] as SoloBarber[]),
      listTenants().catch(() => [] as Tenant[]),
      listGallery(userId).catch(() => [] as GalleryPhoto[]),
      getScheduleRange(userId, todayIso(), inDaysIso(6)).catch(() => [] as ScheduleDay[]),
      getWorkingHoursFor(userId).catch(() => null as WorkingHours | null),
      getUserWallet(userId).catch(() => null as UserWallet | null),
      getUserWalletEntries(userId).catch(() => [] as UserWalletEntry[]),
    ]);

  const user = userRes.data.find((u) => u.id === userId);
  const profile = profileRes[userId];

  // Determine tenant and staff record if any
  let matchedTenant: Tenant | null = null;
  let matchedStaff: Staff | null = null;

  if (user?.tenantId) {
    matchedTenant = allTenants.find((t) => t.id === user.tenantId) || null;
  }

  // If not found yet, check staff in tenants
  if (!matchedTenant) {
    for (const t of allTenants) {
      const staffList = await listStaff(t.id).catch(() => []);
      const found = staffList.find((s) => s.userId === userId);
      if (found) {
        matchedTenant = t;
        matchedStaff = found;
        break;
      }
    }
  } else {
    const staffList = await listStaff(matchedTenant.id).catch(() => []);
    matchedStaff = staffList.find((s) => s.userId === userId) || null;
  }

  // Independent = not on any shop's team. It used to be decided by `user?.tenantId`, but `user` comes
  // from a name/email search run with the id, which never matches, so every shop barber showed as
  // "Independent Solo" (Rakib Hasan of Gulshan Grooming Lounge included).
  const isSolo = !matchedTenant && (soloBarbers.some((s) => s.id === userId) || !user?.tenantId);

  // Fetch services: either from shop or solo owner services
  let services: ServiceItem[] = [];
  if (matchedTenant) {
    services = await listServices(matchedTenant.id).catch(() => []);
  } else {
    const soloServices = await servicesByOwner(userId).catch(() => []);
    services = soloServices.map((s) => ({
      id: s.id,
      tenantId: null,
      ownerUserId: userId,
      categoryId: null,
      name: s.name,
      description: null,
      durationMinutes: 30,
      price: s.price,
      imageUrl: null,
      isActive: s.isActive,
    }));
  }

  // This barber's bookings across the platform, with customer names (GET /appointments?staffId=,
  // which a SUPER_ADMIN may ask cross-shop). Only a shop's bookings used to be fetched, so an
  // independent barber's page had none, and customers showed as ids.
  const appointments: Appointment[] = await listAppointments({ staffId: userId }).catch(() => []);

  // Fetch reviews for this barber
  let reviews: Review[] = [];
  if (matchedTenant) {
    const tenantReviews = await listReviews(matchedTenant.id).catch(() => []);
    reviews = tenantReviews.filter(
      (r) => r.staffId === userId || (matchedStaff && r.staffId === matchedStaff.id),
    );
  } else {
    // An independent barber has no shop review list: their own (GET /reviews?staffId=).
    const own = await apiFetch<RawReview[]>(`/reviews?staffId=${encodeURIComponent(userId)}`).catch(() => [] as RawReview[]);
    const names = await profilesByIds([...new Set(own.map((r) => r.customerId).filter(Boolean))]).catch(
      () => ({}) as Record<string, UserProfile>,
    );
    reviews = own.map((r) => ({ ...r, customerName: names[r.customerId]?.name || 'Customer' }));
  }

  // Group appointments into connected clients
  const clientMap = new Map<string, BarberClientRecord>();
  let totalRevenue = 0;
  let completedBookings = 0;
  let upcomingBookings = 0;
  let cancelledBookings = 0;

  for (const a of appointments) {
    const isCompleted = a.status === 'COMPLETED';
    const isCancelled = a.status === 'CANCELLED' || a.status === 'NO_SHOW';
    const isUpcoming = a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS';

    if (isCompleted) {
      completedBookings++;
      totalRevenue += Number(a.price || 0);
    } else if (isCancelled) {
      cancelledBookings++;
    } else if (isUpcoming) {
      upcomingBookings++;
    }

    const key = a.customerId ? `user:${a.customerId}` : `guest:${a.guestPhone || a.guestName || a.id}`;
    const name = a.guestName || a.customerName || (a.customerId ? `Customer ${a.customerId.slice(0, 6)}` : 'Walk-in Guest');
    const phone = a.guestPhone || null;

    const existing = clientMap.get(key);
    if (existing) {
      if (isCompleted) {
        existing.visits += 1;
        existing.totalSpent += Number(a.price || 0);
      }
      if (!existing.lastVisitAt || a.startAt > existing.lastVisitAt) {
        existing.lastVisitAt = a.startAt;
      }
    } else {
      clientMap.set(key, {
        key,
        customerId: a.customerId,
        name,
        phone,
        visits: isCompleted ? 1 : 0,
        totalSpent: isCompleted ? Number(a.price || 0) : 0,
        lastVisitAt: a.startAt,
        isGuest: !a.customerId,
      });
    }
  }

  const clients = Array.from(clientMap.values()).sort(
    (a, b) => (b.lastVisitAt || '').localeCompare(a.lastVisitAt || ''),
  );

  // Count scheduled open slots
  let scheduledHoursCount = 0;
  if (workingHours?.schedule) {
    scheduledHoursCount = workingHours.schedule.filter((d) => d.isOpen).length;
  }

  return {
    barber: {
      id: userId,
      email: user?.email || (profile as unknown as { email?: string })?.email || '—',
      name: profile?.name || matchedStaff?.name || user?.email?.split('@')[0] || `Barber ${userId.slice(0, 6)}`,
      phone: profile?.phone || null,
      avatarUrl: profile?.avatarUrl || null,
      bio: profile?.bio || matchedStaff?.bio || null,
      businessName: profile?.businessName || null,
      address: profile?.address || null,
      role: user?.role || 'BARBER',
      type: isSolo ? 'SOLO' : 'SHOP_STAFF',
      isBanned: !!user?.isBanned,
      bannedReason: user?.bannedReason || null,
      bannedAt: user?.bannedAt || null,
      createdAt: user?.createdAt || profile?.createdAt || new Date().toISOString(),
    },
    tenant: matchedTenant,
    staffRecord: matchedStaff,
    metrics: {
      totalBookings: appointments.length,
      completedBookings,
      upcomingBookings,
      cancelledBookings,
      uniqueClientsCount: clients.length,
      lifetimeRevenue: Math.round(totalRevenue * 100) / 100,
      servicesCount: services.length,
      ratingAvg: profile?.ratingAvg || matchedStaff?.rating || 0,
      ratingCount: profile?.ratingCount || matchedStaff?.reviewCount || 0,
      walletBalance: Number(wallet?.balance || 0),
      scheduledHoursCount,
    },
    appointments,
    clients,
    services,
    schedule,
    workingHours,
    wallet,
    walletEntries,
    reviews,
    gallery,
  };
}

/** One stint at a shop in a barber's work history — see BarberEmployment in the backend schema. */
export interface BarberStint {
  id: string;
  tenantId: string | null;
  shopName: string;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  current: boolean;
  /** LEFT (barber left) | REMOVED (owner removed/terminated them); null while current. */
  endReason: string | null;
  completedBookings: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface BarberCareer {
  currentShop: { tenantId: string; name: string; logoUrl: string | null; staffId: string | null } | null;
  experience: BarberStint[];
  stats: { completedBookings: number; ratingAvg: number; ratingCount: number; shopsWorkedAt: number };
  memberSince: string;
}

/** The barber's public profile carries their whole career: current shop, every stint, totals. */
export function getBarberCareer(userId: string): Promise<BarberCareer> {
  return apiFetch<BarberCareer>(`/profile/${encodeURIComponent(userId)}`);
}

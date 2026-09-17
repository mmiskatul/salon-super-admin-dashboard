import { apiFetch } from '../api-client';
import {
  listTenants,
  getTenant,
  listLocations,
  getShopHours,
  listProducts,
  listClients,
  listFiles,
  type Tenant,
  type Location,
  type ShopHours,
  type Product,
  type Client,
  type StoredFile,
} from './tenants';
import { listUsers, type PlatformUser } from './users';
import { listStaff, type Staff } from './people';
import { listServices, type ServiceItem } from './catalog';
import { listAppointments, listReviews, type Appointment, type Review } from './bookings';
import { listTransactions, type Transaction } from './finance';

const SETTLED = new Set(['PAID', 'SETTLED', 'COMPLETED', 'SUCCEEDED', 'CAPTURED']);

export interface OwnerDashboardSummary {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerCreatedAt: string;
  isBanned: boolean;
  bannedReason: string | null;
  tenantId: string;
  tenantName: string;
  businessType: string;
  brandColor: string | null;
  logoUrl: string | null;
  joinCode: string | null;
  isSuspended: boolean;
  suspendedReason: string | null;
  isListed: boolean;
  tenantCreatedAt: string;
  barbersCount: number;
  clientsCount: number;
  servicesCount: number;
  appointmentsCount: number;
  revenueTotal: number;
  locationsCount: number;
  productsCount: number;
  ratingAvg: string | number;
  ratingCount: number;
}

export interface OwnerDashboardDetail {
  owner: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    isBanned: boolean;
    bannedReason: string | null;
    bannedAt: string | null;
    createdAt: string;
  };
  tenant: Tenant;
  metrics: {
    barbersCount: number;
    clientsCount: number;
    servicesCount: number;
    appointmentsCount: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    revenueTotal: number;
    locationsCount: number;
    productsCount: number;
    ratingAvg: string | number;
    ratingCount: number;
  };
  barbers: Staff[];
  clients: Client[];
  appointments: Appointment[];
  services: ServiceItem[];
  transactions: Transaction[];
  locations: Location[];
  shopHours: ShopHours | null;
  products: Product[];
  reviews: Review[];
  files: StoredFile[];
}

function deriveOwnerName(email: string, fallback: string): string {
  const name = (email || '').split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return name || fallback;
}

/**
 * Lists all owner dashboards.
 * Attempts the optimized server-side aggregator `/dashboard/owners` first.
 * If the endpoint returns an error (e.g. 500 or schema drift on an upstream backend),
 * it seamlessly falls back to client-side resource aggregation so the dashboard never breaks.
 */
export async function listOwnerDashboards(): Promise<OwnerDashboardSummary[]> {
  try {
    const res = await apiFetch<OwnerDashboardSummary[]>('/dashboard/owners');
    if (Array.isArray(res)) return res;
  } catch (err) {
    console.warn('Dedicated /dashboard/owners endpoint failed, falling back to client-side aggregation:', err);
  }
  return fallbackListOwnerDashboards();
}

async function fallbackListOwnerDashboards(): Promise<OwnerDashboardSummary[]> {
  const [usersPage, allTenants] = await Promise.all([
    listUsers({ role: 'OWNER', limit: 100 }).catch(() => ({ data: [] as PlatformUser[], total: 0, page: 1, limit: 100 })),
    listTenants().catch(() => [] as Tenant[]),
  ]);

  const owners = usersPage.data || [];
  const tenantMap = new Map<string, Tenant>();
  for (const t of allTenants) {
    tenantMap.set(t.id, t);
    if (t.contactEmail) tenantMap.set(t.contactEmail.toLowerCase(), t);
  }

  // Create pairing list of { owner, tenant }
  const pairs: { owner: Partial<PlatformUser>; tenant: Tenant }[] = [];
  const matchedTenantIds = new Set<string>();

  for (const owner of owners) {
    let tenant: Tenant | undefined;
    if (owner.tenantId && tenantMap.has(owner.tenantId)) {
      tenant = tenantMap.get(owner.tenantId);
    } else if (owner.email && tenantMap.has(owner.email.toLowerCase())) {
      tenant = tenantMap.get(owner.email.toLowerCase());
    }

    if (tenant) {
      matchedTenantIds.add(tenant.id);
      pairs.push({ owner, tenant });
    } else {
      // Owner without a tenant row yet
      pairs.push({
        owner,
        tenant: {
          id: owner.tenantId || `orphaned-${owner.id}`,
          name: (owner.email || 'Salon').split('@')[0],
          businessType: 'Salon',
          brandColor: '#635BFF',
          logoUrl: null,
          tagline: null,
          contactEmail: owner.email || '',
          contactPhone: null,
          joinCode: null,
          description: null,
          coverImageUrl: null,
          gallery: [],
          amenities: [],
          establishedYear: null,
          ratingAvg: 0,
          ratingCount: 0,
          isListed: true,
          isSuspended: false,
          suspendedReason: null,
          suspendedAt: null,
          createdAt: owner.createdAt || new Date().toISOString(),
          updatedAt: owner.updatedAt || new Date().toISOString(),
        },
      });
    }
  }

  // Include any remaining tenants that didn't match an explicit owner user
  for (const tenant of allTenants) {
    if (!matchedTenantIds.has(tenant.id)) {
      pairs.push({
        owner: {
          id: `tenant-owner-${tenant.id}`,
          email: tenant.contactEmail,
          role: 'OWNER',
          tenantId: tenant.id,
          emailVerified: true,
          isBanned: false,
          bannedReason: null,
          bannedAt: null,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
        tenant,
      });
    }
  }

  // Probe connected metrics for each pair in pooled concurrency
  const summaries: OwnerDashboardSummary[] = await Promise.all(
    pairs.map(async ({ owner, tenant }) => {
      const tenantId = tenant.id;
      let barbersCount = 0;
      let clientsCount = 0;
      let servicesCount = 0;
      let appointmentsCount = 0;
      let revenueTotal = 0;
      let locationsCount = 0;
      let productsCount = 0;

      if (!tenantId.startsWith('orphaned-')) {
        const [staffRes, clientsRes, servicesRes, apptsRes, transRes, locsRes, prodsRes] =
          await Promise.allSettled([
            listStaff(tenantId),
            listClients(tenantId),
            listServices(tenantId),
            listAppointments(tenantId),
            listTransactions(tenantId),
            listLocations(tenantId),
            listProducts(tenantId),
          ]);

        if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value)) barbersCount = staffRes.value.length;
        if (clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value)) clientsCount = clientsRes.value.length;
        if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value)) servicesCount = servicesRes.value.length;
        if (apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value)) appointmentsCount = apptsRes.value.length;
        if (transRes.status === 'fulfilled' && Array.isArray(transRes.value)) {
          revenueTotal = transRes.value
            .filter((t) => SETTLED.has(String(t.status ?? '').toUpperCase()))
            .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
        }
        if (locsRes.status === 'fulfilled' && Array.isArray(locsRes.value)) locationsCount = locsRes.value.length;
        if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) productsCount = prodsRes.value.length;
      }

      const email = owner.email ?? tenant.contactEmail ?? '';
      const derivedName = deriveOwnerName(email, tenant.name);

      return {
        ownerId: owner.id ?? tenant.id,
        ownerEmail: email,
        ownerName: derivedName,
        ownerPhone: tenant.contactPhone ?? null,
        ownerCreatedAt: owner.createdAt ?? tenant.createdAt,
        isBanned: Boolean(owner.isBanned),
        bannedReason: owner.bannedReason ?? null,
        tenantId: tenant.id,
        tenantName: tenant.name,
        businessType: tenant.businessType,
        brandColor: tenant.brandColor ?? null,
        logoUrl: tenant.logoUrl ?? null,
        joinCode: tenant.joinCode ?? null,
        isSuspended: Boolean(tenant.isSuspended),
        suspendedReason: tenant.suspendedReason ?? null,
        isListed: tenant.isListed !== false,
        tenantCreatedAt: tenant.createdAt,
        barbersCount,
        clientsCount,
        servicesCount,
        appointmentsCount,
        revenueTotal: Math.round(revenueTotal * 100) / 100,
        locationsCount,
        productsCount,
        ratingAvg: tenant.ratingAvg ?? 0,
        ratingCount: tenant.ratingCount ?? 0,
      };
    }),
  );

  return summaries;
}

/**
 * Gets a specific owner dashboard.
 * Attempts the dedicated endpoint `/dashboard/owners/:id` first, falling back to client-side
 * resource aggregation if unavailable.
 */
export async function getOwnerDashboard(id: string): Promise<OwnerDashboardDetail> {
  try {
    const res = await apiFetch<OwnerDashboardDetail>(`/dashboard/owners/${encodeURIComponent(id)}`);
    if (res && res.owner && res.tenant) return res;
  } catch (err) {
    console.warn(`Dedicated /dashboard/owners/${id} endpoint failed, falling back to client-side aggregation:`, err);
  }
  return fallbackGetOwnerDashboard(id);
}

async function fallbackGetOwnerDashboard(id: string): Promise<OwnerDashboardDetail> {
  // 1. Resolve tenant first
  let tenant: Tenant | null = null;
  try {
    tenant = await getTenant(id);
  } catch {
    const allTenants = await listTenants().catch(() => [] as Tenant[]);
    tenant = allTenants.find((t) => t.id === id) ?? null;
  }

  // 2. Resolve owner user
  const usersPage = await listUsers({ role: 'OWNER', limit: 100 }).catch(() => ({ data: [] as PlatformUser[], total: 0, page: 1, limit: 100 }));
  let ownerUser: PlatformUser | undefined;

  if (tenant) {
    ownerUser = usersPage.data.find((u) => u.tenantId === tenant!.id || (u.email && tenant!.contactEmail && u.email.toLowerCase() === tenant!.contactEmail.toLowerCase()));
  } else {
    ownerUser = usersPage.data.find((u) => u.id === id);
    if (ownerUser && ownerUser.tenantId) {
      tenant = await getTenant(ownerUser.tenantId).catch(() => null);
    }
  }

  if (!tenant && !ownerUser) {
    throw new Error('Owner dashboard not found for id: ' + id);
  }

  if (!tenant && ownerUser) {
    tenant = {
      id: ownerUser.tenantId || `tenant-${ownerUser.id}`,
      name: (ownerUser.email || 'Salon').split('@')[0],
      businessType: 'Salon',
      brandColor: '#635BFF',
      logoUrl: null,
      tagline: null,
      contactEmail: ownerUser.email || '',
      contactPhone: null,
      joinCode: null,
      description: null,
      coverImageUrl: null,
      gallery: [],
      amenities: [],
      establishedYear: null,
      ratingAvg: 0,
      ratingCount: 0,
      isListed: true,
      isSuspended: false,
      suspendedReason: null,
      suspendedAt: null,
      createdAt: ownerUser.createdAt || new Date().toISOString(),
      updatedAt: ownerUser.updatedAt || new Date().toISOString(),
    };
  }

  const tenantId = tenant!.id;

  // 3. Fetch all connected data for this tenant concurrently
  const [
    barbersRes,
    clientsRes,
    apptsRes,
    servicesRes,
    transRes,
    locsRes,
    hoursRes,
    prodsRes,
    reviewsRes,
    filesRes,
  ] = await Promise.allSettled([
    listStaff(tenantId),
    listClients(tenantId),
    listAppointments(tenantId),
    listServices(tenantId),
    listTransactions(tenantId),
    listLocations(tenantId),
    getShopHours(tenantId),
    listProducts(tenantId),
    listReviews(tenantId),
    listFiles(tenantId),
  ]);

  const barbers = barbersRes.status === 'fulfilled' && Array.isArray(barbersRes.value) ? barbersRes.value : [];
  const clients = clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value) ? clientsRes.value : [];
  const appointments = apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value) ? apptsRes.value : [];
  const services = servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : [];
  const transactions = transRes.status === 'fulfilled' && Array.isArray(transRes.value) ? transRes.value : [];
  const locations = locsRes.status === 'fulfilled' && Array.isArray(locsRes.value) ? locsRes.value : [];
  const shopHours = hoursRes.status === 'fulfilled' ? hoursRes.value : null;
  const products = prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value) ? prodsRes.value : [];
  const reviews = reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value) ? reviewsRes.value : [];
  const files = filesRes.status === 'fulfilled' && Array.isArray(filesRes.value) ? filesRes.value : [];

  const now = Date.now();
  let upcomingAppointments = 0;
  let completedAppointments = 0;
  let cancelledAppointments = 0;

  for (const a of appointments) {
    const status = String(a.status ?? '').toUpperCase();
    if (status === 'COMPLETED') completedAppointments++;
    else if (status === 'CANCELLED' || status === 'NO_SHOW') cancelledAppointments++;
    else if (a.startAt && new Date(a.startAt).getTime() >= now) upcomingAppointments++;
  }

  const settledTransactions = transactions.filter((t) => SETTLED.has(String(t.status ?? '').toUpperCase()));
  const revenueTotal = settledTransactions.reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  const email = ownerUser?.email ?? tenant!.contactEmail ?? '';
  const derivedName = deriveOwnerName(email, tenant!.name);

  return {
    owner: {
      id: ownerUser?.id ?? `owner-${tenantId}`,
      email,
      name: derivedName,
      phone: tenant!.contactPhone ?? null,
      role: ownerUser?.role ?? 'OWNER',
      isBanned: Boolean(ownerUser?.isBanned),
      bannedReason: ownerUser?.bannedReason ?? null,
      bannedAt: ownerUser?.bannedAt ?? null,
      createdAt: ownerUser?.createdAt ?? tenant!.createdAt,
    },
    tenant: tenant!,
    metrics: {
      barbersCount: barbers.length,
      clientsCount: clients.length,
      servicesCount: services.length,
      appointmentsCount: appointments.length,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      revenueTotal: Math.round(revenueTotal * 100) / 100,
      locationsCount: locations.length,
      productsCount: products.length,
      ratingAvg: tenant!.ratingAvg ?? 0,
      ratingCount: tenant!.ratingCount ?? 0,
    },
    barbers,
    clients,
    appointments,
    services,
    transactions,
    locations,
    shopHours,
    products,
    reviews,
    files,
  };
}

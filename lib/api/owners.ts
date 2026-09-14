import { apiFetch } from '../api-client';
import { listTenants, getTenant, listLocations, getShopHours, listProducts, listClients, listFiles, type Tenant, type Location, type ShopHours, type Product, type Client, type StoredFile } from './tenants';
import { listUsers, type PlatformUser } from './users';
import { listStaff, type Staff } from './people';
import { listServices, type ServiceItem } from './catalog';
import { listAppointments, listReviews, type Appointment, type Review } from './bookings';
import { listTransactions, type Transaction } from './finance';

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
  subdomain: string;
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

const SETTLED = new Set(['COMPLETED', 'PAID', 'SUCCEEDED', 'CAPTURED']);

export async function listOwnerDashboards(): Promise<OwnerDashboardSummary[]> {
  const [usersPage, allTenants] = await Promise.all([
    listUsers({ role: 'OWNER', limit: 100 }).catch(() => ({ data: [] as PlatformUser[], total: 0, page: 1, limit: 100 })),
    listTenants().catch(() => [] as Tenant[]),
  ]);

  const owners = usersPage.data;
  const tenantMap = new Map<string, Tenant>();
  for (const t of allTenants) {
    tenantMap.set(t.id, t);
    tenantMap.set(t.contactEmail.toLowerCase(), t);
  }

  // Create pairing list of { owner, tenant }
  const pairs: { owner: Partial<PlatformUser>; tenant: Tenant }[] = [];
  const matchedTenantIds = new Set<string>();

  for (const owner of owners) {
    let tenant: Tenant | undefined;
    if (owner.tenantId && tenantMap.has(owner.tenantId)) {
      tenant = tenantMap.get(owner.tenantId);
    } else if (tenantMap.has(owner.email.toLowerCase())) {
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
          name: owner.email.split('@')[0],
          subdomain: owner.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          businessType: 'Barber Shop',
          brandColor: '#635BFF',
          logoUrl: null,
          tagline: null,
          contactEmail: owner.email,
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
          createdAt: owner.createdAt,
          updatedAt: owner.updatedAt,
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

        if (staffRes.status === 'fulfilled') barbersCount = staffRes.value.length;
        if (clientsRes.status === 'fulfilled') clientsCount = clientsRes.value.length;
        if (servicesRes.status === 'fulfilled') servicesCount = servicesRes.value.length;
        if (apptsRes.status === 'fulfilled') appointmentsCount = apptsRes.value.length;
        if (transRes.status === 'fulfilled') {
          revenueTotal = transRes.value
            .filter((t) => SETTLED.has(String(t.status ?? '').toUpperCase()))
            .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
        }
        if (locsRes.status === 'fulfilled') locationsCount = locsRes.value.length;
        if (prodsRes.status === 'fulfilled') productsCount = prodsRes.value.length;
      }

      const email = owner.email ?? tenant.contactEmail;
      const derivedName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        ownerId: owner.id ?? tenant.id,
        ownerEmail: email,
        ownerName: derivedName || tenant.name,
        ownerPhone: tenant.contactPhone ?? null,
        ownerCreatedAt: owner.createdAt ?? tenant.createdAt,
        isBanned: Boolean(owner.isBanned),
        bannedReason: owner.bannedReason ?? null,
        tenantId: tenant.id,
        tenantName: tenant.name,
        subdomain: tenant.subdomain,
        businessType: tenant.businessType,
        brandColor: tenant.brandColor,
        logoUrl: tenant.logoUrl,
        joinCode: tenant.joinCode,
        isSuspended: tenant.isSuspended,
        suspendedReason: tenant.suspendedReason,
        isListed: tenant.isListed,
        tenantCreatedAt: tenant.createdAt,
        barbersCount,
        clientsCount,
        servicesCount,
        appointmentsCount,
        revenueTotal,
        locationsCount,
        productsCount,
        ratingAvg: tenant.ratingAvg,
        ratingCount: tenant.ratingCount,
      };
    }),
  );

  return summaries;
}

export async function getOwnerDashboard(id: string): Promise<OwnerDashboardDetail> {
  // 1. Resolve tenant first
  let tenant: Tenant | null = null;
  try {
    tenant = await getTenant(id);
  } catch {
    // If id was not a tenant id, find among listTenants
    const allTenants = await listTenants().catch(() => [] as Tenant[]);
    tenant = allTenants.find((t) => t.id === id || t.subdomain === id) ?? null;
  }

  // 2. Resolve owner user
  const usersPage = await listUsers({ role: 'OWNER', limit: 100 }).catch(() => ({ data: [] as PlatformUser[], total: 0, page: 1, limit: 100 }));
  let ownerUser: PlatformUser | undefined;

  if (tenant) {
    ownerUser = usersPage.data.find((u) => u.tenantId === tenant!.id || u.email.toLowerCase() === tenant!.contactEmail.toLowerCase());
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
      name: ownerUser.email.split('@')[0],
      subdomain: ownerUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      businessType: 'Barber Shop',
      brandColor: '#635BFF',
      logoUrl: null,
      tagline: null,
      contactEmail: ownerUser.email,
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
      createdAt: ownerUser.createdAt,
      updatedAt: ownerUser.updatedAt,
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

  const barbers = barbersRes.status === 'fulfilled' ? barbersRes.value : [];
  const clients = clientsRes.status === 'fulfilled' ? clientsRes.value : [];
  const appointments = apptsRes.status === 'fulfilled' ? apptsRes.value : [];
  const services = servicesRes.status === 'fulfilled' ? servicesRes.value : [];
  const transactions = transRes.status === 'fulfilled' ? transRes.value : [];
  const locations = locsRes.status === 'fulfilled' ? locsRes.value : [];
  const shopHours = hoursRes.status === 'fulfilled' ? hoursRes.value : null;
  const products = prodsRes.status === 'fulfilled' ? prodsRes.value : [];
  const reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value : [];
  const files = filesRes.status === 'fulfilled' ? filesRes.value : [];

  const now = Date.now();
  let upcomingAppointments = 0;
  let completedAppointments = 0;
  let cancelledAppointments = 0;

  for (const a of appointments) {
    const status = String(a.status ?? '').toUpperCase();
    if (status === 'COMPLETED') completedAppointments++;
    else if (status === 'CANCELLED' || status === 'NO_SHOW') cancelledAppointments++;
    else if (new Date(a.startAt).getTime() >= now) upcomingAppointments++;
  }

  const settledTransactions = transactions.filter((t) => SETTLED.has(String(t.status ?? '').toUpperCase()));
  const revenueTotal = settledTransactions.reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  const email = ownerUser?.email ?? tenant!.contactEmail;
  const derivedName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    owner: {
      id: ownerUser?.id ?? `owner-${tenantId}`,
      email,
      name: derivedName || tenant!.name,
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
      revenueTotal,
      locationsCount: locations.length,
      productsCount: products.length,
      ratingAvg: tenant!.ratingAvg,
      ratingCount: tenant!.ratingCount,
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

import { apiFetch } from '../api-client';

/** Mirrors service-business/prisma/schema.prisma `model Tenant`. Decimal columns arrive as strings. */
export interface Tenant {
  id: string;
  name: string;
  businessType: string;
  brandColor: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactEmail: string;
  contactPhone: string | null;
  joinCode: string | null;
  description: string | null;
  coverImageUrl: string | null;
  gallery: string[];
  amenities: string[];
  establishedYear: number | null;
  ratingAvg: string | number;
  ratingCount: number;
  isListed: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  suspendedAt: string | null;
  ownerUserId?: string | null;
  isIndividual?: boolean;
  isOwnerStudio?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  isPrimary: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface CreateTenantInput {
  name: string;
  businessType: string;
  contactEmail: string;
  contactPhone?: string;
  brandColor?: string;
  tagline?: string;
  logoUrl?: string;
}

/** Only the subset of UpdateTenantDto this console actually edits. */
export interface UpdateTenantInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  brandColor?: string;
  tagline?: string;
  logoUrl?: string;
  isListed?: boolean;
}

/**
 * The whole platform. SUPER_ADMIN-only and unpaginated — `TenantService.findAll()` is a bare
 * `findMany()` with no take/skip, so this returns every shop in one response. Fine at the current
 * scale and the reason the roster can compute platform totals client-side; if the platform grows
 * past a few hundred shops this is the first call that needs a page parameter on the backend.
 */
export function listTenants(): Promise<Tenant[]> {
  return apiFetch<Tenant[]>('/tenants');
}

export function getTenant(id: string): Promise<Tenant> {
  return apiFetch<Tenant>(`/tenants/${id}`);
}

export function createTenant(input: CreateTenantInput): Promise<Tenant> {
  return apiFetch<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(input) });
}

export function updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant> {
  return apiFetch<Tenant>(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

/** Answers 204 with no body. */
export function deleteTenant(id: string): Promise<void> {
  return apiFetch<void>(`/tenants/${id}`, { method: 'DELETE' });
}

/** Freezes new bookings platform-wide — distinct from isListed, which only affects discovery. */
export function suspendTenant(id: string, reason?: string): Promise<Tenant> {
  return apiFetch<Tenant>(`/tenants/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function unsuspendTenant(id: string): Promise<Tenant> {
  return apiFetch<Tenant>(`/tenants/${id}/unsuspend`, { method: 'PATCH' });
}

export function listLocations(tenantId: string): Promise<Location[]> {
  return apiFetch<Location[]>(`/locations?tenantId=${encodeURIComponent(tenantId)}`);
}

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  /** What the owner's Hours screen saves (same shape as a barber's Working Hours). */
  startTime?: string;
  endTime?: string;
  /** Older name for the same fields. */
  openTime?: string;
  closeTime?: string;
}

export interface ShopHours {
  id?: string;
  tenantId: string;
  schedule: DaySchedule[];
  bufferBeforeMin: number;
  bufferAfterMin: number;
  minNotice: string;
  bookingWindow: string;
}

export function getShopHours(tenantId: string): Promise<ShopHours> {
  return apiFetch<ShopHours>(`/shop-hours/${encodeURIComponent(tenantId)}`);
}

export interface ClientAllergy {
  id: string;
  name: string;
  severity: string;
  note: string | null;
}

export interface Client {
  id: string;
  tenantId: string;
  customerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  notes: string | null;
  gender: string | null;
  allergies?: ClientAllergy[];
  createdAt: string;
  updatedAt?: string;
}

interface ClientPage {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** GET /clients now answers with a paginated { items, total, ... } envelope rather than a bare
 *  array — unwrapped here so every existing caller (the shop detail Clients tab) keeps working
 *  against a plain Client[] without having to know about pagination it doesn't use. */
export async function listClients(tenantId: string): Promise<Client[]> {
  const page = await apiFetch<ClientPage>(`/clients?tenantId=${encodeURIComponent(tenantId)}&pageSize=100`);
  return page.items;
}

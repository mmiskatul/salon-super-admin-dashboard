import { apiFetch } from '../api-client';

/**
 * A shop's barber as the public GET /staff?tenantId= returns them. The Staff row itself is only
 * their employment at the shop; name, bio, specialties and rating come from their own profile
 * (the same values their barber profile shows), so they match everywhere.
 */
export interface Staff {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  title: string | null;
  specialties: string[];
  rating: string | number | null;
  reviewCount: number;
  bio: string | null;
  experienceYears: number | null;
  active: boolean;
}

/**
 * A barber with no tenant — service-auth's `listSoloBarbers()`. Carries no PII beyond the account
 * id and email; display names live in service-user's profiles and are fetched separately, which is
 * why this shape is as thin as it is.
 */
export interface SoloBarber {
  id: string;
  email?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export function listStaff(tenantId: string): Promise<Staff[]> {
  return apiFetch<Staff[]>(`/staff?tenantId=${encodeURIComponent(tenantId)}`);
}

/**
 * Barbers operating without a shop. These accounts hold real appointments, catalogues and reviews
 * of their own (every one of those models has a nullable tenantId for exactly this case), so they
 * are part of the platform's footprint even though they never appear in the tenant roster.
 */
export function listSoloBarbers(): Promise<SoloBarber[]> {
  return apiFetch<SoloBarber[]>('/auth/barbers/independent');
}

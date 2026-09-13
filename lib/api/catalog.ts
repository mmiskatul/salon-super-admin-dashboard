import { apiFetch } from '../api-client';

/** Mirrors service-business `model ServiceItem`. */
export interface ServiceItem {
  id: string;
  tenantId: string | null;
  ownerUserId: string | null;
  categoryId: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string | number;
  imageUrl: string | null;
  isActive: boolean;
}

/**
 * A shop's service catalogue.
 *
 * Note this returns active *and* inactive rows for an operator: services are soft-deleted by
 * flipping `isActive`, and "the owner says customers can't see their services" is far more often
 * a shelf of isActive=false rows than a query fault. Hiding them here would hide the answer.
 */
export function listServices(tenantId: string): Promise<ServiceItem[]> {
  return apiFetch<ServiceItem[]>(`/catalog/services?tenantId=${encodeURIComponent(tenantId)}`);
}

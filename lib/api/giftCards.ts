import { apiFetch } from '../api-client';

/** Mirrors `model GiftCard` — create and redeem existed on the backend before; list never did,
 *  so a shop (or this console) had no way to see outstanding gift-card liability. No createdAt
 *  column exists on this model, so there's no meaningful chronological order to sort by. */
export interface GiftCard {
  id: string;
  tenantId: string;
  code: string;
  balance: string | number;
  expiresAt: string | null;
}

export function listGiftCards(tenantId: string): Promise<GiftCard[]> {
  return apiFetch<GiftCard[]>(`/gift-cards?tenantId=${encodeURIComponent(tenantId)}`);
}

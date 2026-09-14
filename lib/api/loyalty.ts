import { apiFetch } from '../api-client';

/** Mirrors service-payment `model LoyaltyAccount`/`LoyaltyTransaction` — a customer's own points
 *  balance and history. GET /loyalty/:userId is SUPER_ADMIN-only, added specifically so the
 *  console can look up a customer's balance instead of only ever seeing it self-service. */
export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  appointmentId: string | null;
  type: string;
  points: number;
  description: string | null;
  createdAt: string;
}

export interface LoyaltyAccount {
  id: string;
  customerId: string;
  points: number;
  updatedAt: string;
  recentTransactions: LoyaltyTransaction[];
}

export function getLoyaltyFor(userId: string): Promise<LoyaltyAccount> {
  return apiFetch<LoyaltyAccount>(`/loyalty/${encodeURIComponent(userId)}`);
}

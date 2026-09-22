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

export interface LoyaltyRewardItem {
  id: string;
  title: string;
  pointsRequired: number;
  creditAmount: number;
  icon?: string;
  description?: string;
}

export interface LoyaltyProgramConfig {
  id: string;
  pointsPerCurrencyUnit: number;
  pointRedemptionValue: number;
  minRedemptionPoints: number;
  rewards: LoyaltyRewardItem[];
  updatedAt: string;
  createdAt: string;
}

export interface UpdateLoyaltyConfigInput {
  pointsPerCurrencyUnit?: number;
  pointRedemptionValue?: number;
  minRedemptionPoints?: number;
}

export interface LoyaltyRewardInput {
  id?: string;
  title: string;
  pointsRequired: number;
  creditAmount: number;
  icon?: string;
  description?: string;
}

export function getLoyaltyFor(userId: string): Promise<LoyaltyAccount> {
  return apiFetch<LoyaltyAccount>(`/loyalty/${encodeURIComponent(userId)}`);
}

export function getLoyaltyConfig(): Promise<LoyaltyProgramConfig> {
  return apiFetch<LoyaltyProgramConfig>('/loyalty/admin/config').catch((err) => {
    return apiFetch<LoyaltyProgramConfig>('/loyalty/config');
  });
}

export function updateLoyaltyConfig(data: UpdateLoyaltyConfigInput): Promise<LoyaltyProgramConfig> {
  return apiFetch<LoyaltyProgramConfig>('/loyalty/admin/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function addLoyaltyReward(data: LoyaltyRewardInput): Promise<LoyaltyProgramConfig> {
  return apiFetch<LoyaltyProgramConfig>('/loyalty/admin/rewards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateLoyaltyReward(id: string, data: Partial<LoyaltyRewardInput>): Promise<LoyaltyProgramConfig> {
  return apiFetch<LoyaltyProgramConfig>(`/loyalty/admin/rewards/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteLoyaltyReward(id: string): Promise<LoyaltyProgramConfig> {
  return apiFetch<LoyaltyProgramConfig>(`/loyalty/admin/rewards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

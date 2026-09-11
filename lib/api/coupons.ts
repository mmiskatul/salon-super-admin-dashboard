import { apiFetch } from '../api-client';

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  discountPercent: string | number | null;
  discountAmount: string | number | null;
  expiresAt: string | null;
  minOrderAmount: string | number | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  active: boolean;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  shopName?: string | null;
}

export interface CreateCouponInput {
  tenantId: string;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  expiresAt?: string;
  minOrderAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  title?: string;
  description?: string;
}

export function listCoupons(tenantId?: string): Promise<Coupon[]> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return apiFetch<Coupon[]>(`/coupons${query}`);
}

export function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  return apiFetch<Coupon>('/coupons', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

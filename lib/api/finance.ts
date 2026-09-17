import { apiFetch } from '../api-client';

/** Mirrors service-payment `model Transaction` — the shop's books, tenant-scoped per appointment. */
export interface Transaction {
  id: string;
  tenantId: string;
  appointmentId: string | null;
  type: string;
  amount: string | number;
  status: string;
  paymentMethod?: string | null;
  createdAt: string;
  // Resolved server-side from the appointment/profile this was billed against
  customerName?: string | null;
  customerPhone?: string | null;
  serviceName?: string | null;
  staffName?: string | null;
  notes?: string | null;
  tenantName?: string | null;
  tenantBrandColor?: string | null;
  tenantLogoUrl?: string | null;
}

export interface ListTransactionsParams {
  tenantId?: string;
  status?: string;
  type?: string;
  from?: string;
  to?: string;
}

export function listTransactions(arg1?: string | ListTransactionsParams): Promise<Transaction[]> {
  const params: ListTransactionsParams = typeof arg1 === 'string' ? { tenantId: arg1 } : (arg1 ?? {});
  const query = new URLSearchParams();
  if (params.tenantId) query.set('tenantId', params.tenantId);
  if (params.status && params.status.toUpperCase() !== 'ALL') query.set('status', params.status);
  if (params.type && params.type.toUpperCase() !== 'ALL') query.set('type', params.type);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const qs = query.toString();
  return apiFetch<Transaction[]>(`/transactions${qs ? `?${qs}` : ''}`);
}

/** SUPER_ADMIN may refund any tenant's transaction — see transaction.controller.ts's `refund`. */
export function refundTransaction(id: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${encodeURIComponent(id)}/refund`, { method: 'PATCH' });
}


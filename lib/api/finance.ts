import { apiFetch } from '../api-client';

/** Mirrors service-payment `model Transaction` — the shop's books, tenant-scoped per appointment. */
export interface Transaction {
  id: string;
  tenantId: string;
  appointmentId: string | null;
  type: string;
  amount: string | number;
  status: string;
  createdAt: string;
  // Resolved server-side from the appointment this was billed against, when there is one.
  customerName?: string | null;
  serviceName?: string | null;
  staffName?: string | null;
}

export function listTransactions(tenantId: string): Promise<Transaction[]> {
  return apiFetch<Transaction[]>(`/transactions?tenantId=${encodeURIComponent(tenantId)}`);
}

/** SUPER_ADMIN may refund any tenant's transaction — see transaction.controller.ts's `refund`. */
export function refundTransaction(id: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${encodeURIComponent(id)}/refund`, { method: 'PATCH' });
}

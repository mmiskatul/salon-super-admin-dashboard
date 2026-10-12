import { apiFetch } from '../api-client';

export interface BroadcastNotification {
  id: string;
  userId: string;
  tenantId: string | null;
  tenantName?: string | null;
  category: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface SendBroadcastInput {
  title: string;
  body: string;
  tenantId?: string;
  userIds?: string[];
  category?: string;
}

export function listRecentBroadcasts(): Promise<BroadcastNotification[]> {
  return apiFetch<BroadcastNotification[]>('/notifications/recent');
}

export function sendBroadcast(input: SendBroadcastInput): Promise<{ count: number; notification?: BroadcastNotification }> {
  return apiFetch<{ count: number; notification?: BroadcastNotification }>('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteBroadcast(id: string): Promise<unknown> {
  return apiFetch<unknown>(`/notifications/broadcast/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

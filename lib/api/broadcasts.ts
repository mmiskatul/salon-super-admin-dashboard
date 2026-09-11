import { apiFetch } from '../api-client';

export interface BroadcastNotification {
  id: string;
  userId: string;
  tenantId: string | null;
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
}

export function listRecentBroadcasts(): Promise<BroadcastNotification[]> {
  return apiFetch<BroadcastNotification[]>('/notifications/recent');
}

export function sendBroadcast(input: SendBroadcastInput): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

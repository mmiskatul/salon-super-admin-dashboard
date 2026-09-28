import { apiFetch } from '../api-client';

/** Reports of objectionable content or accounts from the two apps (backend ModerationService).
 *  Google Play requires that reports are reviewed and acted on; this is where that happens. */

export type ReportTargetType = 'REVIEW' | 'CHAT_MESSAGE' | 'GALLERY_PHOTO' | 'USER';
export type ReportStatus = 'OPEN' | 'ACTIONED' | 'DISMISSED';

export interface ReportPerson {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  isBanned: boolean;
}

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  reporter: ReportPerson | null;
  reportedUser: ReportPerson | null;
  /** The review text, message or photo URL; null once removed (or for an account report). */
  content: string | null;
}

export const REPORT_STATUSES: ReportStatus[] = ['OPEN', 'ACTIONED', 'DISMISSED'];

export const TARGET_LABELS: Record<ReportTargetType, string> = {
  REVIEW: 'Review',
  CHAT_MESSAGE: 'Chat message',
  GALLERY_PHOTO: 'Photo',
  USER: 'Account',
};

export const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam or scam',
  HARASSMENT: 'Harassment',
  HATE: 'Hate speech',
  SEXUAL: 'Sexual content',
  VIOLENCE: 'Violence or threats',
  FAKE: 'Fake or misleading',
  OTHER: 'Other',
};

export function listReports(status?: ReportStatus): Promise<ContentReport[]> {
  return apiFetch<ContentReport[]>(`/reports${status ? `?status=${status}` : ''}`);
}

export function resolveReport(
  id: string,
  body: { status: 'ACTIONED' | 'DISMISSED'; note?: string; removeContent?: boolean },
): Promise<ContentReport> {
  return apiFetch<ContentReport>(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
}

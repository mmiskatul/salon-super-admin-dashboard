import { apiFetch, API_BASE_URL } from '../api-client';

/**
 * The public legal pages (backend LegalController): the super admin edits and publishes them here,
 * the API serves them at /legal/<slug>, and the website, both apps and the store listings link there.
 */

export type LegalSlug = 'privacy-policy' | 'terms-of-service' | 'delete-account';

export const LEGAL_PAGES: { slug: LegalSlug; label: string; hint: string }[] = [
  { slug: 'privacy-policy', label: 'Privacy Policy', hint: 'Required by Google Play for both apps.' },
  { slug: 'terms-of-service', label: 'Terms of Service', hint: 'Accepted at sign-up in both apps.' },
  { slug: 'delete-account', label: 'Account deletion', hint: 'Shown above the web form that deletes an account.' },
];

/** Where the API serves the public pages, e.g. https://salunbd-backend-service.onrender.com/legal/privacy-policy */
export const publicLegalUrl = (slug: LegalSlug) => `${API_BASE_URL.replace(/\/api$/, '')}/legal/${slug}`;

export interface LegalDocumentSummary {
  slug: LegalSlug;
  title: string;
  /** 0 while the built-in text is live (nothing published yet). */
  version: number;
  publishedAt: string;
  isDefault: boolean;
  publishedBy: string | null;
}

export interface LegalDocumentVersionInfo {
  version: number;
  title: string;
  publishedAt: string;
  publishedBy: string | null;
}

export interface LegalDocumentDetail {
  slug: LegalSlug;
  title: string;
  content: string;
  html: string;
  version: number;
  publishedAt: string;
  isDefault: boolean;
  versions: LegalDocumentVersionInfo[];
}

export function listLegalDocuments(): Promise<LegalDocumentSummary[]> {
  return apiFetch<LegalDocumentSummary[]>('/legal/admin/documents');
}

export function getLegalDocument(slug: LegalSlug): Promise<LegalDocumentDetail> {
  return apiFetch<LegalDocumentDetail>(`/legal/admin/documents/${slug}`);
}

export function getLegalDocumentVersion(slug: LegalSlug, version: number): Promise<{ version: number; title: string; content: string; publishedAt: string }> {
  return apiFetch(`/legal/admin/documents/${slug}/versions/${version}`);
}

export function publishLegalDocument(slug: LegalSlug, body: { title: string; content: string }): Promise<LegalDocumentDetail> {
  return apiFetch<LegalDocumentDetail>(`/legal/admin/documents/${slug}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function previewLegalDocument(content: string): Promise<{ html: string }> {
  return apiFetch<{ html: string }>('/legal/admin/preview', { method: 'POST', body: JSON.stringify({ content }) });
}

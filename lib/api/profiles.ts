import { apiFetch } from '../api-client';

/**
 * Mirrors service-user `model UserProfile`. Display fields for an account live here rather than
 * on service-auth's `User`, which holds only credentials and role.
 */
export interface UserProfile {
  id: string;
  name: string;
  businessName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ratingAvg: string | number;
  ratingCount: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

/**
 * Names for a batch of account ids, in one request.
 *
 * `GET /auth/barbers/independent` answers with ids and nothing else by design, so anything that
 * lists solo barbers has to pair it with this. Batched rather than one call per barber: the
 * endpoint exists precisely because the customer app's discovery list had the same problem.
 */
export async function profilesByIds(ids: string[]): Promise<Record<string, UserProfile>> {
  if (ids.length === 0) return {};

  // Chunked so the id list cannot outgrow a sane URL length on a platform with many solo barbers.
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

  const results = await Promise.allSettled(
    chunks.map((chunk) =>
      apiFetch<UserProfile[]>(`/profile/bulk?ids=${encodeURIComponent(chunk.join(','))}`),
    ),
  );

  const byId: Record<string, UserProfile> = {};
  for (const result of results) {
    if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue;
    for (const profile of result.value) byId[profile.id] = profile;
  }
  return byId;
}

/** A solo barber's own catalogue — keyed by owner rather than tenant, since they have no shop. */
export function servicesByOwner(ownerUserId: string) {
  return apiFetch<{ id: string; name: string; price: string | number; isActive: boolean }[]>(
    `/catalog/services?ownerUserId=${encodeURIComponent(ownerUserId)}`,
  );
}

/** Mirrors `model GalleryPhoto` — a barber's portfolio. GET /profile/gallery/:userId is public (no
 *  auth guard at all, by design — a portfolio is meant to be shown to prospective customers), so
 *  this works for any barber's id with no special permission. */
export interface GalleryPhoto {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: string;
}

export function listGallery(userId: string): Promise<GalleryPhoto[]> {
  return apiFetch<GalleryPhoto[]>(`/profile/gallery/${encodeURIComponent(userId)}`);
}

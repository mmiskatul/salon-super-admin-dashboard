'use client';

import type { TenantVitals, Vitality } from '@/lib/api/platform';
import { Badge } from './primitives';

/**
 * Four bars per shop: staff, services, bookings, reviews.
 *
 * This is the console's one signature device, and it exists because of a real question the tenant
 * table cannot otherwise answer. Every shop on the platform looks identical in a list of names and
 * identifiers — the ones that signed up and never furnished themselves look exactly like the ones
 * running fifty bookings a week. Rendering the four counts as a glyph turns that into something
 * you scan rather than read: an empty shop shows as a row of baseline ticks, and dormant signups
 * appear as gaps running down the column.
 *
 * The scale is deliberately shared across every row on screen (`ceiling`), so bar heights are
 * comparable between shops. It is also a fourth-root curve rather than linear: the platform's
 * busiest shop has orders of magnitude more bookings than its quietest, and on a linear scale every
 * shop but the leader would flatten to nothing — which is precisely the distinction being drawn.
 */

const BAR_LABELS = ['staff', 'services', 'bookings', 'reviews'] as const;

export interface VitalsCeiling {
  staff: number;
  services: number;
  appointments: number;
  reviews: number;
}

export function ceilingOf(all: TenantVitals[]): VitalsCeiling {
  const max = (pick: (v: TenantVitals) => number | null) =>
    all.reduce((acc, v) => Math.max(acc, pick(v) ?? 0), 0);
  return {
    staff: max((v) => v.staff),
    services: max((v) => v.services),
    appointments: max((v) => v.appointments),
    reviews: max((v) => v.reviews),
  };
}

function height(value: number | null, ceiling: number): number {
  if (value === null) return 0;
  if (value <= 0) return 0;
  if (ceiling <= 0) return 1;
  const ratio = Math.min(1, value / ceiling) ** 0.25;
  return Math.max(2, Math.round(ratio * 16));
}

export function Vitals({
  vitals,
  ceiling,
  color,
}: {
  vitals: TenantVitals | undefined;
  ceiling: VitalsCeiling;
  /** The shop's own brand colour — the bars are the tenant's, not the console's. */
  color: string;
}) {
  if (!vitals) {
    return (
      <span className="inline-flex h-[18px] items-end gap-[3px]" aria-hidden>
        {BAR_LABELS.map((k) => (
          <span key={k} className="w-[3px] animate-pulse bg-rule" style={{ height: 4 }} />
        ))}
      </span>
    );
  }

  const bars = [
    { key: 'staff', value: vitals.staff, ceiling: ceiling.staff },
    { key: 'services', value: vitals.services, ceiling: ceiling.services },
    { key: 'bookings', value: vitals.appointments, ceiling: ceiling.appointments },
    { key: 'reviews', value: vitals.reviews, ceiling: ceiling.reviews },
  ] as const;

  const summary = bars.map((b) => `${b.key} ${b.value ?? 'unknown'}`).join(', ');

  return (
    <span
      className="inline-flex h-[18px] items-end gap-[3px]"
      title={summary}
      role="img"
      aria-label={summary}
    >
      {bars.map((bar) => {
        const h = height(bar.value, bar.ceiling);
        // A failed probe is drawn as a hollow tick, never as an empty bar — "we could not ask"
        // and "the answer is zero" must not look the same on a screen used to spot dead shops.
        if (bar.value === null) {
          return (
            <span
              key={bar.key}
              className="w-[3px] border-b-2 border-dotted border-ink-3"
              style={{ height: 3 }}
            />
          );
        }
        if (h === 0) {
          return <span key={bar.key} className="w-[3px] bg-rule" style={{ height: 2 }} />;
        }
        return (
          <span
            key={bar.key}
            className="w-[3px]"
            style={{ height: h, backgroundColor: color }}
          />
        );
      })}
    </span>
  );
}

const VITALITY_COPY: Record<Vitality, { label: string; tone: 'plain' | 'signal' | 'live' | 'quiet' }> = {
  live: { label: 'Live', tone: 'live' },
  idle: { label: 'No bookings', tone: 'plain' },
  dormant: { label: 'Never set up', tone: 'signal' },
  unknown: { label: 'Unreachable', tone: 'quiet' },
};

export function VitalityTag({ vitality }: { vitality: Vitality }) {
  const copy = VITALITY_COPY[vitality];
  return <Badge tone={copy.tone}>{copy.label}</Badge>;
}

import type { PlatformPeriod } from './api/platform';

const PREVIOUS: Record<PlatformPeriod, string> = {
  Daily: 'yesterday',
  Weekly: 'last week',
  Monthly: 'last month',
  Yearly: 'last year',
};

const sum = (xs?: number[]) => (xs ?? []).reduce((a, b) => a + (Number(b) || 0), 0);

/**
 * This period against the one before, from the revenue trend the server sends (current and
 * previous series). Null when there is nothing earlier to compare with: the overview used to show
 * fixed made-up figures ("+14.2% MoM") instead.
 */
export function periodChange(
  trend: { current?: number[]; previous?: number[] } | null | undefined,
  period: PlatformPeriod,
): { pct: number; label: string } | null {
  const previous = sum(trend?.previous);
  if (!trend || previous <= 0) return null;
  const pct = ((sum(trend.current) - previous) / previous) * 100;
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  return { pct, label: `${sign}${Math.abs(pct).toFixed(1)}% vs ${PREVIOUS[period]}` };
}

/**
 * Display helpers.
 *
 * The money format matches salon-owner-dashboard/src/lib/api/budgeting.ts (en-IE / EUR) so a
 * figure means the same thing in both consoles. Note the backend is not internally consistent
 * about this — service-payment's Wallet.currency defaults to "BDT" — so if the platform's real
 * currency is settled elsewhere, this constant is the one place to change.
 */
const CURRENCY = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const COMPACT = new Intl.NumberFormat('en-IE', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Prisma serialises `Decimal` columns as JSON strings, not numbers — every money and rating field
 * crossing the wire from service-payment/service-business arrives as `"12.50"`. Coercing at the
 * boundary (rather than at each call site) is what stops `"12.50" + "3.00"` producing `"12.503.00"`
 * somewhere down the line.
 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function money(value: unknown): string {
  return CURRENCY.format(toNumber(value));
}

export function count(value: unknown): string {
  return new Intl.NumberFormat('en-IE').format(toNumber(value));
}

export function compact(value: unknown): string {
  return COMPACT.format(toNumber(value));
}

export function rating(value: unknown): string {
  const n = toNumber(value);
  return n > 0 ? n.toFixed(1) : '—';
}

export function date(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function time(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${date(d)} ${time(d)}`;
}

/** "3d ago" / "in 2h" — for freshness, where the exact stamp matters less than the distance. */
export function since(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);

  const units: [number, string][] = [
    [1000 * 60 * 60 * 24 * 365, 'y'],
    [1000 * 60 * 60 * 24 * 30, 'mo'],
    [1000 * 60 * 60 * 24, 'd'],
    [1000 * 60 * 60, 'h'],
    [1000 * 60, 'm'],
  ];
  for (const [ms, label] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      return future ? `in ${n}${label}` : `${n}${label} ago`;
    }
  }
  return future ? 'shortly' : 'just now';
}

/** ISO yyyy-mm-dd in the viewer's own timezone — what the /appointments `date` filter expects. */
export function isoDay(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length <= 10 ? id : `${id.slice(0, 8)}…`;
}

/**
 * A tenant's own brand colour, validated before it reaches a style attribute.
 *
 * `Tenant.brandColor` is a free-text column an owner types into, so it can hold anything at all.
 * Since this console's whole visual premise is that tenant colours are the only saturated hues on
 * screen, an unparseable value has to fall back to the chrome's ink rather than colouring nothing.
 */
export function brandColor(value: string | null | undefined): string {
  if (typeof value !== 'string') return '#15171b';
  const trimmed = value.trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : '#15171b';
}

export function initials(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

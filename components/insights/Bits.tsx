'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import type { InsightDays, ListingStep } from '@/lib/api/insights';
import { STEP_LABELS } from '@/lib/api/insights';

/** 7 / 30 / 90 / 365 days, for the insight pages. */
export function DaysPicker({ value, onChange }: { value: InsightDays; onChange: (d: InsightDays) => void }) {
  const options: InsightDays[] = [7, 30, 90, 365];
  return (
    <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5" role="group" aria-label="Period">
      {options.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-pressed={value === d}
          className={`rounded-md px-3 py-1.5 text-[12px] font-bold transition-colors ${value === d ? 'bg-[#635BFF] text-white' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
          {d === 365 ? '1 year' : `${d} days`}
        </button>
      ))}
    </div>
  );
}

/** The four go-live steps as ticks and crosses. */
export function StepChecks({ steps }: { steps: Record<ListingStep, boolean> }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {(Object.keys(STEP_LABELS) as ListingStep[]).map((k) => (
        <span
          key={k}
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${steps[k] ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]' : 'border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48]'}`}>
          {steps[k] ? <Check size={11} aria-hidden /> : <X size={11} aria-hidden />}
          {STEP_LABELS[k]}
        </span>
      ))}
    </span>
  );
}

/** Columns over time (one per day or week), with a label under the first, middle and last. */
export function Columns({
  points,
  color = '#635BFF',
  height = 120,
  format = (v: number) => String(v),
}: {
  points: { label: string; value: number }[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const ticks = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }} role="img" aria-label={`${points.length} values, highest ${format(max)}`}>
        {points.map((p, i) => (
          <div key={i} className="flex-1 rounded-t-[2px]" title={`${p.label}: ${format(p.value)}`}
            style={{ height: `${Math.max(p.value > 0 ? 3 : 0, (p.value / max) * 100)}%`, backgroundColor: color, opacity: p.value > 0 ? 1 : 0.15, minHeight: 1 }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[#94A3B8]">
        {points.map((p, i) => (ticks.has(i) ? <span key={i}>{p.label}</span> : null))}
      </div>
    </div>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Day-of-week x hour-of-day counts (7 x 24), darker = busier. */
export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const label = (h: number) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`);
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th />
            {hours.map((h) => (
              <th key={h} className="px-0 text-[9px] font-semibold text-[#94A3B8]">{h % 3 === 0 ? label(h) : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, d) => (
            <tr key={d}>
              <th className="pr-2 text-right text-[11px] font-bold text-[#64748B]">{DAYS[d]}</th>
              {row.map((v, h) => (
                <td key={h} title={`${DAYS[d]} ${label(h)}: ${v} booking${v === 1 ? '' : 's'}`}
                  className="h-5 w-5 min-w-5 rounded-[3px]"
                  style={{ backgroundColor: v ? `rgba(99, 91, 255, ${0.15 + (v / max) * 0.85})` : '#F1F5F9' }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Places and customer demand on a plain SVG map (no tile server, no map library): longitude and
 * latitude are scaled into the box around every point, with the same km per pixel both ways.
 */
export function PointMap({
  places,
  demand,
  height = 460,
}: {
  places: { id: string; name: string; listed: boolean; lat: number; lng: number; kind: string }[];
  demand: { lat: number; lng: number; count: number }[];
  height?: number;
}) {
  const all = [...places, ...demand];
  if (all.length === 0) return <p className="py-10 text-center text-[13px] text-[#94A3B8]">No places or saved addresses with a location yet.</p>;
  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  const pad = 0.02;
  let minLat = Math.min(...lats) - pad;
  let maxLat = Math.max(...lats) + pad;
  let minLng = Math.min(...lngs) - pad;
  let maxLng = Math.max(...lngs) + pad;
  const width = 900;
  // Same scale both ways (a degree of longitude is shorter than one of latitude away from the equator).
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLng - minLng) * kx;
  const spanY = maxLat - minLat;
  const ratio = width / height;
  if (spanX / spanY > ratio) {
    const extra = (spanX / ratio - spanY) / 2;
    minLat -= extra;
    maxLat += extra;
  } else {
    const extra = (spanY * ratio - spanX) / 2 / kx;
    minLng -= extra;
    maxLng += extra;
  }
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * width;
  const y = (lat: number) => height - ((lat - minLat) / (maxLat - minLat)) * height;
  const maxCount = Math.max(1, ...demand.map((d) => d.count));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" style={{ maxHeight: height }} role="img" aria-label={`${places.length} places and ${demand.length} customer areas`}>
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * (width / 10)} x2={(i + 1) * (width / 10)} y1={0} y2={height} stroke="#E2E8F0" strokeWidth={1} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h${i}`} y1={(i + 1) * (height / 6)} y2={(i + 1) * (height / 6)} x1={0} x2={width} stroke="#E2E8F0" strokeWidth={1} />
      ))}
      {demand.map((d, i) => (
        <circle key={`d${i}`} cx={x(d.lng)} cy={y(d.lat)} r={6 + (d.count / maxCount) * 18} fill="#F59E0B" opacity={0.28}>
          <title>{`${d.count} saved address${d.count === 1 ? '' : 'es'} near ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}`}</title>
        </circle>
      ))}
      {places.map((p) => (
        <g key={p.id}>
          <circle cx={x(p.lng)} cy={y(p.lat)} r={7} fill={p.listed ? '#16A34A' : '#EF4444'} stroke="#fff" strokeWidth={2}>
            <title>{`${p.name} (${p.kind}) — ${p.listed ? 'visible to customers' : 'hidden: not complete'}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

export function Legend({ items }: { items: { color: string; label: string; ring?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-[#64748B]">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: i.color, opacity: i.ring ? 0.4 : 1 }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** "12 min", "3.5 h", "2 d" from minutes. */
export function duration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  const m = Math.abs(minutes);
  const sign = minutes < 0 ? '-' : '';
  if (m < 60) return `${sign}${Math.round(m)} min`;
  if (m < 60 * 48) return `${sign}${(m / 60).toFixed(1)} h`;
  return `${sign}${(m / 1440).toFixed(1)} d`;
}

export function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${value}%`;
}

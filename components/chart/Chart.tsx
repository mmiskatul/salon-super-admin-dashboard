'use client';

/**
 * Inline SVG, no charting library.
 *
 * The previous build declared chart.js and react-chartjs-2 in package.json without either being
 * installed, so every screen that imported them failed outright. Nothing drawn on this console is
 * beyond a few dozen lines of SVG, so the dependency is not reintroduced.
 */

/** A proportion bar — the composition of a whole, in one row. */
export function Split({
  segments,
  height = 8,
}: {
  segments: { key: string; value: number; color: string; label: string }[];
  height?: number;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  if (total <= 0) {
    return <div className="w-full bg-rule-soft" style={{ height }} aria-hidden />;
  }
  return (
    <>
      <div className="flex w-full overflow-hidden" style={{ height }} role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}>
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${(Math.max(0, s.value) / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[11px] text-ink-2">
            <span className="h-2 w-2 rounded-[1px]" style={{ backgroundColor: s.color }} aria-hidden />
            {s.label}
            <span className="tabular text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * A time series, drawn as a line with its own baseline.
 *
 * Points are plotted in the order given, evenly spaced, rather than positioned by their real
 * timestamps — metric snapshots are recorded ad hoc by whoever calls POST /metrics, so the gaps
 * between them carry no meaning worth encoding as distance.
 */
export function Line({
  points,
  color = '#15171b',
  height = 96,
}: {
  points: { value: number; label: string }[];
  color?: string;
  height?: number;
}) {
  if (points.length === 0) {
    return <p className="py-6 text-[12px] text-ink-3">No snapshots to plot.</p>;
  }

  const width = 600;
  const pad = 6;
  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) =>
    points.length === 1 ? width / 2 : pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = `${path} L ${x(points.length - 1).toFixed(1)} ${height - pad} L ${x(0).toFixed(1)} ${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${points.length} snapshots, from ${points[0].label} to ${points[points.length - 1].label}`}
    >
      <path d={area} fill={color} opacity={0.08} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={2} fill={color} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** A ranked horizontal bar list — "which shops account for the most of X". */
export function Ranked({
  rows,
  format,
}: {
  rows: { key: string; label: string; value: number; color: string; href?: string }[];
  format: (value: number) => string;
}) {
  const max = rows.reduce((acc, r) => Math.max(acc, r.value), 0);
  if (rows.length === 0) return <p className="py-6 text-[12px] text-ink-3">Nothing to rank yet.</p>;

  return (
    <ol className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[12px]">{row.label}</span>
            <span className="tabular shrink-0 text-[12px]">{format(row.value)}</span>
          </div>
          <div className="mt-1 h-[5px] w-full bg-rule-soft">
            <div
              className="h-full"
              style={{
                width: max > 0 ? `${Math.max(2, (row.value / max) * 100)}%` : '2px',
                backgroundColor: row.color,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

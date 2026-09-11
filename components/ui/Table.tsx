'use client';

/**
 * Table furniture.
 *
 * `Scroll` is not optional decoration: these tables carry uuids and money columns that will not
 * fold, so the overflow is contained here rather than being allowed to push the page body into a
 * horizontal scroll.
 */
export function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>;
}

export function Th({
  children,
  align = 'left',
  width,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  width?: number | string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={`eyebrow border-b border-rule px-3 py-2.5 font-medium whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  onClick,
  accent,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  /** The shop's own brand colour, drawn as the row's left identity edge. */
  accent?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-rule-soft last:border-b-0 ${
        onClick ? 'cursor-pointer hover:bg-ground/70' : ''
      }`}
      style={accent ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = 'left',
  mono,
  muted,
  nowrap = true,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
  muted?: boolean;
  nowrap?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2.5 text-[13px] ${align === 'right' ? 'text-right' : 'text-left'} ${
        mono ? 'tabular text-[12px]' : ''
      } ${muted ? 'text-ink-2' : ''} ${nowrap ? 'whitespace-nowrap' : ''}`}
    >
      {children}
    </td>
  );
}

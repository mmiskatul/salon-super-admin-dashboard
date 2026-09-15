'use client';

/**
 * Table components styled to match salon-owner-dashboard tables:
 * - Soft purple/gray header (#F8F9FE) with crisp borders (#E2E8F0)
 * - Bold headings (#1E293B) with Manrope typography
 * - Clean row dividers, vertical column borders, and soft hover state (#F8FAFC)
 */
export function Scroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full overflow-x-auto custom-scrollbar ${className}`}>{children}</div>;
}

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <table className={`w-full min-w-[700px] border-collapse text-left table-auto font-manrope ${className}`}>
      {children}
    </table>
  );
}

export function Th({
  children,
  align = 'left',
  width,
  className = '',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  width?: number | string;
  className?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={`bg-[#F8F9FE] border-b border-r border-[#E2E8F0] last:border-r-0 px-4 py-3.5 text-[13px] font-bold text-[#1E293B] font-manrope whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  onClick,
  accent,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  /** Optional brand color indicator on the row */
  accent?: string;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-[#E2E8F0] last:border-b-0 transition-colors group ${
        onClick ? 'cursor-pointer hover:bg-[#F8FAFC]' : 'hover:bg-[#F8FAFC]/60'
      } ${className}`}
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
  className = '',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
  muted?: boolean;
  nowrap?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3.5 text-[13px] border-r border-[#E2E8F0] last:border-r-0 font-manrope transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${mono ? 'tabular font-medium text-[#1E293B]' : 'text-[#64748B]'} ${
        muted ? '!text-[#94A3B8]' : ''
      } ${nowrap ? 'whitespace-nowrap' : ''} ${className}`}
    >
      {children}
    </td>
  );
}


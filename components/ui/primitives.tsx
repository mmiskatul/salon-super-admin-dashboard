'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

/** The page banner every screen opens with, styled like owner dashboard page titles. */
export function PageHead({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-[#E2E8F0] bg-white px-5 py-6 sm:px-8 font-manrope">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#635BFF] uppercase tracking-wider font-manrope">{eyebrow}</p>
          <h1 className="mt-1 text-2xl md:text-[28px] font-extrabold text-[#1E293B] tracking-tight font-manrope">
            {title}
          </h1>
          {lede && <p className="mt-1 max-w-[70ch] text-[13px] text-[#64748B] font-medium leading-relaxed">{lede}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}

export function Panel({
  title,
  note,
  actions,
  children,
  flush,
  className = '',
}: {
  title?: string;
  note?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Drops the body padding, for panels whose child is a full-bleed table. */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm font-manrope ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4 bg-white">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-[#1E293B] font-manrope">{title}</h2>}
            {note && <p className="mt-0.5 text-[12px] font-medium text-[#94A3B8]">{note}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

/**
 * A headline figure matching owner dashboard's stat cards.
 */
export function Stat({
  label,
  value,
  sub,
  pending,
  tone = 'plain',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  pending?: boolean;
  tone?: 'plain' | 'signal' | 'live';
}) {
  const toneClass =
    tone === 'signal' ? 'text-[#EF4444]' : tone === 'live' ? 'text-[#10B981]' : 'text-[#1E293B]';

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all hover:shadow-md hover:border-[#CBD5E1] font-manrope">
      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider font-manrope">{label}</p>
      <p
        className={`mt-2 text-[26px] md:text-[28px] font-extrabold font-manrope tracking-tight tabular-nums ${
          pending ? 'text-[#94A3B8]' : toneClass
        }`}
      >
        {pending ? '·····' : value}
      </p>
      {sub && <p className="mt-1 text-[12px] font-semibold text-[#94A3B8]">{sub}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'plain',
}: {
  children: React.ReactNode;
  tone?: 'plain' | 'signal' | 'live' | 'quiet' | 'primary' | 'warning';
}) {
  const tones = {
    plain: 'border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]',
    quiet: 'border-transparent bg-transparent text-[#94A3B8]',
    signal: 'border-[#FECDD3] bg-[#FFE4E6] text-[#E11D48]',
    live: 'border-[#BBF7D0] bg-[#DCFCE7] text-[#16A34A]',
    primary: 'border-[#E0E7FF] bg-[#EEF2FF] text-[#635BFF]',
    warning: 'border-[#FEF08A] bg-[#FEF9C3] text-[#B45309]',
  } as const;

  return (
    <span
      className={`tabular inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold font-manrope whitespace-nowrap tracking-normal ${tones[tone] || tones.plain}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'secondary',
  disabled,
  title,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const variants = {
    primary:
      'bg-[#635BFF] hover:bg-[#524be0] text-white shadow-sm shadow-[#635BFF]/20 disabled:bg-[#CBD5E1]',
    secondary:
      'bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#635BFF] disabled:text-[#94A3B8] disabled:bg-[#F1F5F9]',
    danger:
      'border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] disabled:opacity-50',
    outline:
      'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:text-[#94A3B8]',
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold font-manrope transition-all cursor-pointer disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 p-12 text-[13px] font-semibold text-[#64748B] font-manrope">
      <Loader2 size={16} className="animate-spin text-[#635BFF]" />
      {label}
    </div>
  );
}

export function Failed({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-6 space-y-3 font-manrope">
      <div className="flex items-start gap-2.5 text-[13px] font-medium text-[#EF4444]">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" strokeWidth={2} />
        <p className="max-w-[64ch] leading-relaxed font-semibold">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** An empty state matching the owner dashboard clean style. */
export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="p-12 text-center space-y-2 font-manrope">
      <p className="text-[15px] font-bold text-[#1E293B]">{title}</p>
      {hint && <p className="text-[13px] text-[#94A3B8] max-w-[50ch] mx-auto">{hint}</p>}
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}

/** The canvas gutter every page body sits in. */
export function Canvas({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full font-manrope">{children}</div>;
}


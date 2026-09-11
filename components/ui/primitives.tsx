'use client';

import { AlertTriangle, Loader2, RotateCw } from 'lucide-react';

/** The page banner every screen opens with. */
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
    <header className="border-b border-rule bg-surface px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="font-display mt-2 text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[32px]">
            {title}
          </h1>
          {lede && <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-ink-2">{lede}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
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
}: {
  title?: string;
  note?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Drops the body padding, for panels whose child is a full-bleed table. */
  flush?: boolean;
}) {
  return (
    <section className="border border-rule bg-surface">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule-soft px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h2>}
            {note && <p className="mt-0.5 text-[12px] text-ink-2">{note}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  );
}

/**
 * A headline figure.
 *
 * `pending` is a first-class state rather than a zero. These numbers are summed from a fan-out
 * across every shop on the platform, so during the sweep a real total genuinely is not known yet,
 * and showing 0 would read as an answer instead of as a work-in-progress.
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
    tone === 'signal' ? 'text-signal' : tone === 'live' ? 'text-live' : 'text-ink';
  return (
    <div className="border border-rule bg-surface px-4 py-4">
      <p className="eyebrow">{label}</p>
      <p
        className={`font-display mt-2.5 text-[27px] leading-none font-extrabold tracking-[-0.035em] tabular-nums ${
          pending ? 'text-ink-3' : toneClass
        }`}
      >
        {pending ? '·····' : value}
      </p>
      {sub && <p className="mt-2 text-[12px] leading-snug text-ink-2">{sub}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'plain',
}: {
  children: React.ReactNode;
  tone?: 'plain' | 'signal' | 'live' | 'quiet';
}) {
  const tones = {
    plain: 'border-rule bg-ground text-ink-2',
    quiet: 'border-transparent bg-transparent text-ink-3',
    signal: 'border-signal/25 bg-signal-soft text-signal',
    live: 'border-live/25 bg-live-soft text-live',
  } as const;
  return (
    <span
      className={`tabular inline-flex items-center rounded-[2px] border px-1.5 py-[3px] text-[10px] font-medium tracking-[0.06em] uppercase ${tones[tone]}`}
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  title?: string;
}) {
  const variants = {
    primary: 'bg-ink text-white hover:bg-ink/85 disabled:bg-ink-3',
    secondary: 'border border-rule bg-surface text-ink hover:bg-ground disabled:text-ink-3',
    danger: 'border border-signal/40 bg-surface text-signal hover:bg-signal-soft disabled:opacity-50',
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-[3px] px-3 py-[7px] text-[12px] font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-10 text-[13px] text-ink-2">
      <Loader2 size={14} className="animate-spin" />
      {label}
    </div>
  );
}

/**
 * A failed panel.
 *
 * States what did not load and offers the retry, in that order. Nothing here apologises: the
 * operator needs to know which call broke so they can tell whether it is one service or the whole
 * gateway, and a "sorry" costs a line that could have carried the endpoint name.
 */
export function Failed({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 px-1 py-8">
      <div className="flex items-start gap-2 text-[13px] text-signal">
        <AlertTriangle size={15} className="mt-px shrink-0" strokeWidth={1.9} />
        <p className="max-w-[64ch] leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry}>
          <RotateCw size={12} />
          Try again
        </Button>
      )}
    </div>
  );
}

/** An empty screen is an invitation to act, so this takes the next step as a prop. */
export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="px-1 py-10">
      <p className="text-[13px] font-semibold">{title}</p>
      {hint && <p className="mt-1.5 max-w-[60ch] text-[12px] leading-relaxed text-ink-2">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** The canvas gutter every page body sits in. */
export function Canvas({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 px-5 py-6 sm:px-8 lg:px-10">{children}</div>;
}

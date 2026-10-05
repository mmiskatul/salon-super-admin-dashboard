'use client';

import React from 'react';
import { Banknote, Clock, Layers, ArrowUpRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import { count, money } from '@/lib/format';
import type { PlatformPeriod } from '@/lib/api/platform';

interface FinancialCommandCenterProps {
  /** Completed payments at every shop. */
  totalRevenue: number;
  /** What the platform itself earns: its subscriptions (it takes no cut of bookings). */
  platformNetEarnings?: number;
  subscriptionMrr?: number;
  activeSubscriptions?: number;
  pendingPaymentsAmount?: number;
  pendingPaymentsCount?: number;
  period?: PlatformPeriod;
}

/**
 * The money picture, from the server's own figures. It used to invent most of it: a 5% "take-rate"
 * on every shop's takings (customers pay the shop in cash; there is no platform fee), ৳4,900 of
 * subscription income per busy shop when the server sent none, and "100% Settled / 0 pending
 * chargebacks" and "SaaS Ledger Verified" whatever the data said.
 */
export default function FinancialCommandCenter({
  totalRevenue,
  platformNetEarnings,
  subscriptionMrr,
  activeSubscriptions,
  pendingPaymentsAmount,
  pendingPaymentsCount,
  period = 'Monthly',
}: FinancialCommandCenterProps) {
  const income = platformNetEarnings ?? subscriptionMrr ?? 0;
  const mrr = subscriptionMrr ?? 0;
  const subs = activeSubscriptions ?? 0;
  const pendingCount = pendingPaymentsCount ?? 0;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#1E293B]">Money</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#635BFF]">
              {period}
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            What shops took, what the platform earns, and what is still to be paid at the counter
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/payments"
            className="text-xs font-bold text-[#635BFF] hover:text-[#524be0] inline-flex items-center gap-1 hover:underline"
          >
            Payments <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/subscriptions"
            className="text-xs font-bold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 hover:underline ml-2"
          >
            Subscriptions <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <Card
          label="Platform income"
          tone="indigo"
          icon={<Wallet className="w-4 h-4 text-[#635BFF]" />}
          value={money(income)}
          sub="Shop subscriptions. Bookings carry no platform fee."
        />
        <Card
          label="Paid at shops"
          tone="green"
          icon={<Banknote className="w-4 h-4 text-[#10B981]" />}
          value={money(totalRevenue)}
          sub="Completed payments across all shops, kept by the shops"
        />
        <Card
          label="Subscriptions"
          tone="amber"
          icon={<Layers className="w-4 h-4 text-[#D97706]" />}
          value={<>{money(mrr)}<span className="text-xs text-[#94A3B8] font-normal">/mo</span></>}
          sub={subs === 0 ? 'No shop is on a paid plan yet' : `${count(subs)} active subscription${subs === 1 ? '' : 's'}`}
        />
        <Card
          label="To be paid at the counter"
          tone="cyan"
          icon={<Clock className="w-4 h-4 text-[#0891B2]" />}
          value={money(pendingPaymentsAmount ?? 0)}
          sub={pendingCount === 0 ? 'Nothing outstanding' : `${count(pendingCount)} booking${pendingCount === 1 ? '' : 's'} not paid yet`}
        />
      </div>
    </div>
  );
}

const TONES = {
  indigo: { border: 'border-[#E0E7FF]', from: 'from-[#635BFF]/[8%]', label: 'text-[#635BFF]', iconBg: 'bg-[#EEF2FF]' },
  green: { border: 'border-[#D1FAE5]', from: 'from-[#10B981]/[8%]', label: 'text-[#10B981]', iconBg: 'bg-[#D1FAE5]' },
  amber: { border: 'border-[#FEF3C7]', from: 'from-[#F59E0B]/[8%]', label: 'text-[#D97706]', iconBg: 'bg-[#FEF3C7]' },
  cyan: { border: 'border-[#CFFAFE]', from: 'from-[#06B6D4]/[8%]', label: 'text-[#0891B2]', iconBg: 'bg-[#CFFAFE]' },
} as const;

function Card({
  label,
  tone,
  icon,
  value,
  sub,
}: {
  label: string;
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  value: React.ReactNode;
  sub: string;
}) {
  const t = TONES[tone];
  return (
    <div className={`p-4 rounded-xl border ${t.border} bg-gradient-to-b ${t.from} to-transparent flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold ${t.label} uppercase tracking-wider`}>{label}</span>
        <div className={`w-8 h-8 rounded-lg ${t.iconBg} flex items-center justify-center`}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-[24px] font-extrabold text-[#1E293B] tabular-nums">{value}</p>
        <p className="text-[11px] font-semibold text-[#64748B] mt-1">{sub}</p>
      </div>
    </div>
  );
}

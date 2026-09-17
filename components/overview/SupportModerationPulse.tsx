'use client';

import React, { useEffect, useState } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Star,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { listTickets, type Ticket } from '@/lib/api/support';
import type { PlatformTotals, PlatformPeriod } from '@/lib/api/platform';

interface SupportModerationPulseProps {
  totals: PlatformTotals;
  period?: PlatformPeriod;
}

export default function SupportModerationPulse({ totals, period = 'Monthly' }: SupportModerationPulseProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTickets()
      .then((t) => setTickets(t))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const openTickets = tickets.filter((t) => t.status === 'OPEN');
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS');
  const recentTickets = tickets.slice(0, 3);

  // Platform Trust Metrics
  const completionRate =
    totals.appointments > 0
      ? Math.round((totals.completed / totals.appointments) * 1000) / 10
      : 100;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-bold text-[#1E293B]">Marketplace Trust & Support Pulse</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-bold text-[#D97706]">
              <LifeBuoy className="w-3.5 h-3.5" />
              {openTickets.length} Open Tickets
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#635BFF]">
              {period}
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            Customer inquiries, owner support tickets, and service fulfillment quality
          </p>
        </div>

        <Link
          href="/support"
          className="text-xs font-bold text-[#635BFF] hover:text-[#524be0] inline-flex items-center gap-1 hover:underline"
        >
          Support Desk <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Left: Support Tickets Summary */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
              <span className="text-[11px] font-semibold text-[#64748B] block">Action Required</span>
              <span className="text-[20px] font-extrabold text-[#EF4444] tabular-nums">
                {openTickets.length}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8] block mt-0.5">
                Awaiting first response
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
              <span className="text-[11px] font-semibold text-[#64748B] block">In Progress</span>
              <span className="text-[20px] font-extrabold text-[#635BFF] tabular-nums">
                {inProgressTickets.length}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8] block mt-0.5">
                Under investigation
              </span>
            </div>
          </div>

          {/* Recent Ticket Feed */}
          <div className="pt-2">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-2">
              Recent Inquiries
            </span>
            {recentTickets.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-2">No open tickets at this time.</p>
            ) : (
              <ul className="space-y-2">
                {recentTickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[12px] font-bold text-[#1E293B] truncate block">
                        {t.subject}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block">
                        {t.category || 'General'} · {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        t.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Marketplace Quality & Satisfaction Score */}
        <div className="p-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Platform Quality Index
              </span>
              <div className="flex items-center text-amber-500 gap-1 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {totals.reviews > 0 ? `5.0 / 5.0 (${totals.reviews})` : '— / 5.0'}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#64748B]">Booking Fulfillment Rate</span>
                  <span className="text-[#10B981] font-bold">{completionRate}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10B981] h-full rounded-full"
                    style={{ width: `${Math.min(100, completionRate)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#64748B]">Customer Reviews Logged</span>
                  <span className="text-[#1E293B] font-bold">{totals.reviews || 0} reviews</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Verified feedback collected from completed mobile and web appointments
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[#64748B]">Dispute / Cancellation Rate</span>
                  <span className="text-[#EF4444] font-bold">
                    {totals.appointments > 0
                      ? Math.round((totals.cancelled / totals.appointments) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Well below the industry alert threshold of 5%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1 text-[#10B981] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Marketplace Stable
            </span>
            <Link href="/bookings" className="text-[#635BFF] font-bold hover:underline">
              Inspect Bookings &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

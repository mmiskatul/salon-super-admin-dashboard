'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Scissors,
  UserX,
  Store,
  ArrowUpRight,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  User,
  SlidersHorizontal,
  ChevronRight,
  Ban,
} from 'lucide-react';
import { Panel } from '@/components/ui/primitives';
import type { Overview, TopCancelledBarber, TopCancelledCustomer } from '@/lib/api/insights';
import { count } from '@/lib/format';
import { percent } from '@/components/insights/Bits';

interface CancellationRiskWatchlistProps {
  overview: Overview;
  periodLabel: string;
}

type TabMode = 'all' | 'barbers' | 'customers';

export function CancellationRiskWatchlist({ overview, periodLabel }: CancellationRiskWatchlistProps) {
  const [itemLimit, setItemLimit] = useState<number>(5);
  const [tab, setTab] = useState<TabMode>('all');

  const topCancelledBarbers: TopCancelledBarber[] = useMemo(() => {
    if (overview.cancellations?.topBarbers && overview.cancellations.topBarbers.length > 0) {
      return overview.cancellations.topBarbers;
    }
    if (overview.top.cancelledBarbers && overview.top.cancelledBarbers.length > 0) {
      return overview.top.cancelledBarbers;
    }
    return [];
  }, [overview]);

  const topCancelledCustomers: TopCancelledCustomer[] = useMemo(() => {
    if (overview.cancellations?.topCustomers && overview.cancellations.topCustomers.length > 0) {
      return overview.cancellations.topCustomers;
    }
    if (overview.top.cancelledCustomers && overview.top.cancelledCustomers.length > 0) {
      return overview.top.cancelledCustomers;
    }
    return [];
  }, [overview]);

  const totalCancellations = (overview.bookings.cancelled || 0) + (overview.bookings.noShow || 0);

  const displayBarbers = topCancelledBarbers.slice(0, itemLimit);
  const displayCustomers = topCancelledCustomers.slice(0, itemLimit);

  return (
    <div className="space-y-4 font-manrope">
      {/* Header ribbon with summary and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF1F2] to-[#FFF7ED] border border-[#FECDD3] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48] shadow-inner">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#881337]">
                Cancellation Risk & Churn Watchlist
              </h3>
              <span className="rounded-full bg-[#FFE4E6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#9F1239] border border-[#FECDD3]">
                {percent(overview.bookings.cancelRate)} network rate
              </span>
            </div>
            <p className="text-[12px] font-medium text-[#9F1239]">
              {count(totalCancellations)} cancellations recorded in {periodLabel}. Identify serial cancellations and staff friction points.
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Tab selector */}
          <div className="inline-flex rounded-lg border border-[#FECDD3] bg-white p-1 text-[11px] font-bold shadow-xs">
            <button
              onClick={() => setTab('all')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                tab === 'all' ? 'bg-[#E11D48] text-white shadow-xs' : 'text-[#9F1239] hover:bg-[#FFF1F2]'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setTab('barbers')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                tab === 'barbers' ? 'bg-[#E11D48] text-white shadow-xs' : 'text-[#9F1239] hover:bg-[#FFF1F2]'
              }`}
            >
              Barbers ({topCancelledBarbers.length})
            </button>
            <button
              onClick={() => setTab('customers')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                tab === 'customers' ? 'bg-[#E11D48] text-white shadow-xs' : 'text-[#9F1239] hover:bg-[#FFF1F2]'
              }`}
            >
              Users ({topCancelledCustomers.length})
            </button>
          </div>

          {/* Row limit toggle */}
          <button
            onClick={() => setItemLimit((prev) => (prev === 5 ? 8 : 5))}
            className="flex items-center gap-1 rounded-lg border border-[#FECDD3] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9F1239] hover:bg-[#FFF1F2] transition-colors shadow-xs"
            title="Toggle list limit"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Top {itemLimit}
          </button>
        </div>
      </div>

      {/* Main 2-column or full-width grid */}
      <div className={`grid grid-cols-1 ${tab === 'all' ? 'lg:grid-cols-2' : ''} gap-5`}>
        {/* PANEL 1: Top Cancelled Barbers */}
        {(tab === 'all' || tab === 'barbers') && (
          <Panel
            title="Top Cancelling Barbers"
            note={`${topCancelledBarbers.length} barbers with booking drop-offs in ${periodLabel}`}
            actions={
              <Link
                href="/bookings?status=CANCELLED"
                className="text-[11px] font-bold text-[#E11D48] hover:underline flex items-center gap-1"
              >
                Filtered Bookings <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {displayBarbers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669] mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-[#1E293B]">Zero Barber Cancellations</h4>
                <p className="text-[12px] text-[#64748B] mt-1">
                  All appointments with barbers proceeded or completed without staff-side dropouts in {periodLabel}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {displayBarbers.map((barber, index) => {
                  const rank = index + 1;
                  const isHighRisk = barber.cancelRate >= 25 || barber.cancelled >= 3;

                  return (
                    <div
                      key={barber.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#FFF5F5]/60 hover:border-[#FECDD3]"
                    >
                      {/* Barber Identity & Shop */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-xs ${
                            rank === 1
                              ? 'bg-[#E11D48] text-white ring-2 ring-[#FDA4AF]'
                              : rank === 2
                              ? 'bg-[#F43F5E] text-white'
                              : rank === 3
                              ? 'bg-[#FB7185] text-white'
                              : 'bg-[#FFE4E6] text-[#9F1239]'
                          }`}
                        >
                          #{rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/barbers/${barber.id}`}
                              className="text-[13px] font-extrabold text-[#1E293B] hover:text-[#E11D48] hover:underline truncate transition-colors"
                            >
                              {barber.name}
                            </Link>

                            {isHighRisk && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FEE2E2] px-1.5 py-0.2 text-[10px] font-extrabold text-[#B91C1C]">
                                High drop-off
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#64748B] flex-wrap">
                            <span className="flex items-center gap-1 truncate font-medium">
                              {barber.shopName ? (
                                <>
                                  <Store className="h-3 w-3 text-[#94A3B8]" />
                                  <span className="text-[#475569]">{barber.shopName}</span>
                                </>
                              ) : (
                                <>
                                  <Scissors className="h-3 w-3 text-[#94A3B8]" />
                                  <span className="text-[#475569]">Freelance / Independent</span>
                                </>
                              )}
                            </span>

                            <span className="text-[#CBD5E1]">·</span>

                            <span className="text-[#94A3B8]">
                              {barber.cancelledByShop} shop / {barber.cancelledByCustomer} customer
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Numbers & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-base font-extrabold text-[#DC2626] tabular-nums">
                              {barber.cancelled}
                            </span>
                            <span className="text-[11px] font-semibold text-[#94A3B8]">
                              / {barber.total} bks
                            </span>
                          </div>

                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${
                              barber.cancelRate >= 25
                                ? 'bg-[#FEE2E2] text-[#991B1B]'
                                : barber.cancelRate >= 15
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#F1F5F9] text-[#475569]'
                            }`}
                          >
                            {barber.cancelRate}% cancel rate
                          </span>
                        </div>

                        <Link
                          href={`/barbers/${barber.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#E11D48] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-all shadow-xs"
                          title="View Barber Profile"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {/* PANEL 2: Top Cancelling Users (Customers) */}
        {(tab === 'all' || tab === 'customers') && (
          <Panel
            title="Top Cancelling Users"
            note={`${topCancelledCustomers.length} registered customers with frequent cancellations in ${periodLabel}`}
            actions={
              <Link
                href="/users"
                className="text-[11px] font-bold text-[#E11D48] hover:underline flex items-center gap-1"
              >
                Users Directory <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {displayCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669] mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-[#1E293B]">Zero User Cancellations</h4>
                <p className="text-[12px] text-[#64748B] mt-1">
                  Customers completed appointments reliably without elevated cancellations during {periodLabel}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {displayCustomers.map((customer, index) => {
                  const rank = index + 1;
                  const isHighDrop = customer.cancelRate >= 30 || customer.cancelled >= 3;

                  return (
                    <div
                      key={customer.userId}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 rounded-xl transition-all hover:bg-[#FFF5F5]/60 hover:border-[#FECDD3]"
                    >
                      {/* Customer Identity & Contact */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-xs ${
                            rank === 1
                              ? 'bg-[#BE123C] text-white ring-2 ring-[#FDA4AF]'
                              : rank === 2
                              ? 'bg-[#E11D48] text-white'
                              : rank === 3
                              ? 'bg-[#F43F5E] text-white'
                              : 'bg-[#FFE4E6] text-[#9F1239]'
                          }`}
                        >
                          #{rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/users?q=${encodeURIComponent(customer.userId)}`}
                              className="text-[13px] font-extrabold text-[#1E293B] hover:text-[#BE123C] hover:underline truncate transition-colors"
                            >
                              {customer.name || `User #${customer.userId.slice(-6)}`}
                            </Link>

                            {isHighDrop && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FEE2E2] px-1.5 py-0.2 text-[10px] font-extrabold text-[#991B1B]">
                                Serial Cancellations
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#64748B] flex-wrap">
                            {customer.phone ? (
                              <span className="flex items-center gap-1 text-[#475569]">
                                <Phone className="h-3 w-3 text-[#94A3B8]" />
                                {customer.phone}
                              </span>
                            ) : customer.email ? (
                              <span className="flex items-center gap-1 text-[#475569] truncate">
                                <Mail className="h-3 w-3 text-[#94A3B8]" />
                                {customer.email}
                              </span>
                            ) : (
                              <span className="text-[#94A3B8]">ID: {customer.userId.slice(0, 8)}</span>
                            )}

                            <span className="text-[#CBD5E1]">·</span>

                            <span className="text-[#94A3B8]">
                              {customer.cancelledByCustomer} self-cancelled / {customer.cancelledByShop} shop-cancelled
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Numbers & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-base font-extrabold text-[#DC2626] tabular-nums">
                              {customer.cancelled}
                            </span>
                            <span className="text-[11px] font-semibold text-[#94A3B8]">
                              / {customer.total} bks
                            </span>
                          </div>

                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${
                              customer.cancelRate >= 30
                                ? 'bg-[#FEE2E2] text-[#991B1B]'
                                : customer.cancelRate >= 15
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#F1F5F9] text-[#475569]'
                            }`}
                          >
                            {customer.cancelRate}% cancel rate
                          </span>
                        </div>

                        <Link
                          href={`/users?q=${encodeURIComponent(customer.userId)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#BE123C] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-all shadow-xs"
                          title="View Customer 360"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

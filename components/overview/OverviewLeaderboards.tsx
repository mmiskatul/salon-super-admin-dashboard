'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Scissors,
  Award,
  Crown,
  Tag,
  User,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Eye,
  CheckCircle2,
  Banknote,
  SlidersHorizontal,
} from 'lucide-react';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Panel } from '@/components/ui/primitives';
import type { Overview } from '@/lib/api/insights';

interface OverviewLeaderboardsProps {
  overview: Overview;
  periodLabel: string;
}

export function OverviewLeaderboards({ overview, periodLabel }: OverviewLeaderboardsProps) {
  const [showDetailed, setShowDetailed] = useState(true);

  const topPlaces = overview.top.places;
  const topServices = overview.top.services;
  const topCustomers = overview.top.customers;

  const maxPlaceBookings = Math.max(1, ...topPlaces.map((p) => p.bookings));
  const maxServiceBookings = Math.max(1, ...topServices.map((s) => s.bookings));
  const maxCustomerBookings = Math.max(1, ...topCustomers.map((c) => c.bookings));

  const totalBookings = overview.bookings.total || 1;

  return (
    <div className="space-y-4 font-manrope">
      {/* Section Header with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#1E293B]">Platform Leaderboards</h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              Top performing salons, trending treatments, and highest frequency VIP customers for {periodLabel}
            </p>
          </div>
        </div>

        {/* Toggle Detailed Metrics */}
        <button
          type="button"
          onClick={() => setShowDetailed(!showDetailed)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#64748B] transition-all hover:border-[#635BFF]/40 hover:text-[#1E293B]"
        >
          <SlidersHorizontal className="h-3 w-3 text-[#635BFF]" />
          <span>{showDetailed ? 'Detailed View Active' : 'Compact View Active'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Top Performing Places */}
        <Panel
          title="Top Performing Places"
          note={`Ranked by bookings in ${periodLabel}`}
          actions={
            <Link
              href="/readiness"
              className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#635BFF] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#635BFF]/30 transition-colors"
            >
              <span>All Places</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {!topPlaces.length ? (
              <p className="py-8 text-center text-[12px] text-[#94A3B8]">No bookings recorded in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {topPlaces.map((place, idx) => {
                  const rank = idx + 1;
                  const pct = Math.max(6, Math.round((place.bookings / maxPlaceBookings) * 100));
                  const shareOfTotal = Math.round((place.bookings / totalBookings) * 100);
                  const isShop = place.kind === 'shop' || !place.key.startsWith('barber:');
                  const href = placeHref(place.key);

                  return (
                    <div
                      key={place.key}
                      className="group rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 transition-all hover:border-[#635BFF]/30 hover:bg-white hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Rank + Icon + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${
                              rank === 1
                                ? 'bg-[#FEF3C7] text-[#B45309]'
                                : rank === 2
                                ? 'bg-[#F1F5F9] text-[#475569]'
                                : rank === 3
                                ? 'bg-[#FFEDD5] text-[#C2410C]'
                                : 'bg-[#F8FAFC] text-[#94A3B8]'
                            }`}
                          >
                            #{rank}
                          </span>

                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] text-[#635BFF]">
                            {isShop ? <Store className="h-3.5 w-3.5" /> : <Scissors className="h-3.5 w-3.5" />}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#1E293B] group-hover:text-[#635BFF] transition-colors">
                              {place.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                              <span className="font-semibold">{isShop ? 'Salon Shop' : 'Freelance Barber'}</span>
                              <span>·</span>
                              <span className="font-bold text-[#635BFF]">{shareOfTotal}% share</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Count Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[14px] font-extrabold text-[#1E293B] tabular-nums">
                            {count(place.bookings)}
                          </span>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase">Bookings</span>
                        </div>
                      </div>

                      {/* Extended Details (if enabled) */}
                      {showDetailed && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-[11px]">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            {place.completed !== undefined && (
                              <span className="flex items-center gap-1 font-semibold text-[#15803D]">
                                <CheckCircle2 className="h-3 w-3" />
                                {place.completed} done
                              </span>
                            )}
                            {place.revenue !== undefined && place.revenue > 0 && (
                              <>
                                <span>·</span>
                                <span className="font-extrabold text-[#1E293B] tabular-nums">
                                  {money(place.revenue)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Action Button */}
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#635BFF] shadow-2xs hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition-all"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {/* Visual Volume Bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#635BFF] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Footer Action */}
            <div className="pt-1">
              <Link
                href="/readiness"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] py-2 text-[11px] font-bold text-[#635BFF] transition-all hover:bg-[#EEF2FF] hover:border-[#635BFF]/30"
              >
                <span>Explore Salon Readiness Pipeline</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Panel>

        {/* 2. Top Booked Services */}
        <Panel
          title="Top Booked Services"
          note={`Most popular treatments in ${periodLabel}`}
          actions={
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#16A34A] border border-[#E2E8F0] hover:bg-[#DCFCE7] hover:border-[#16A34A]/30 transition-colors"
            >
              <span>Bookings Log</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {!topServices.length ? (
              <p className="py-8 text-center text-[12px] text-[#94A3B8]">No treatments recorded in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {topServices.map((service, idx) => {
                  const rank = idx + 1;
                  const pct = Math.max(6, Math.round((service.bookings / maxServiceBookings) * 100));
                  const shareOfTotal = Math.round((service.bookings / totalBookings) * 100);
                  const searchHref = `/bookings?search=${encodeURIComponent(service.name)}`;

                  return (
                    <div
                      key={service.name}
                      className="group rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 transition-all hover:border-[#16A34A]/30 hover:bg-white hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Rank + Icon + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${
                              rank === 1
                                ? 'bg-[#FEF3C7] text-[#B45309]'
                                : rank === 2
                                ? 'bg-[#F1F5F9] text-[#475569]'
                                : rank === 3
                                ? 'bg-[#FFEDD5] text-[#C2410C]'
                                : 'bg-[#F8FAFC] text-[#94A3B8]'
                            }`}
                          >
                            #{rank}
                          </span>

                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] text-[#16A34A]">
                            <Tag className="h-3.5 w-3.5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#1E293B] group-hover:text-[#16A34A] transition-colors">
                              {service.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                              <span className="font-semibold">Catalog Treatment</span>
                              <span>·</span>
                              <span className="font-bold text-[#16A34A]">{shareOfTotal}% volume</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Count Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[14px] font-extrabold text-[#15803D] tabular-nums">
                            {count(service.bookings)}
                          </span>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase">Booked</span>
                        </div>
                      </div>

                      {/* Extended Details (if enabled) */}
                      {showDetailed && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-[11px]">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            {service.completed !== undefined && (
                              <span className="flex items-center gap-1 font-semibold text-[#15803D]">
                                <CheckCircle2 className="h-3 w-3" />
                                {service.completed} done
                              </span>
                            )}
                            {service.revenue !== undefined && service.revenue > 0 && (
                              <>
                                <span>·</span>
                                <span className="font-extrabold text-[#1E293B] tabular-nums">
                                  {money(service.revenue)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Action Button */}
                          <Link
                            href={searchHref}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#16A34A] shadow-2xs hover:bg-[#16A34A] hover:text-white hover:border-[#16A34A] transition-all"
                          >
                            <span>Filter Bookings</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {/* Visual Volume Bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Footer Action */}
            <div className="pt-1">
              <Link
                href="/bookings"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] py-2 text-[11px] font-bold text-[#16A34A] transition-all hover:bg-[#DCFCE7] hover:border-[#16A34A]/30"
              >
                <span>View Full Appointments Ledger</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Panel>

        {/* 3. Top VIP Customers */}
        <Panel
          title="Top Repeat Customers"
          note={`Most frequent clients across network in ${periodLabel}`}
          actions={
            <Link
              href="/users?role=CUSTOMER"
              className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#0EA5E9] border border-[#E2E8F0] hover:bg-[#E0F2FE] hover:border-[#0EA5E9]/30 transition-colors"
            >
              <span>All Clients</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="space-y-3">
            {!topCustomers.length ? (
              <p className="py-8 text-center text-[12px] text-[#94A3B8]">No customer activity in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {topCustomers.map((customer, idx) => {
                  const rank = idx + 1;
                  const pct = Math.max(6, Math.round((customer.bookings / maxCustomerBookings) * 100));
                  const profileHref = `/customers/${encodeURIComponent(customer.userId)}`;
                  const displayName = customer.name || `Client #${customer.userId.slice(-6)}`;

                  return (
                    <div
                      key={customer.userId}
                      className="group rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 transition-all hover:border-[#0EA5E9]/30 hover:bg-white hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Rank + Icon + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${
                              rank === 1
                                ? 'bg-[#FEF3C7] text-[#B45309]'
                                : rank === 2
                                ? 'bg-[#F1F5F9] text-[#475569]'
                                : rank === 3
                                ? 'bg-[#FFEDD5] text-[#C2410C]'
                                : 'bg-[#F8FAFC] text-[#94A3B8]'
                            }`}
                          >
                            #{rank}
                          </span>

                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] text-[#0EA5E9]">
                            {rank === 1 ? <Crown className="h-3.5 w-3.5 text-[#F59E0B]" /> : <User className="h-3.5 w-3.5" />}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#1E293B] group-hover:text-[#0EA5E9] transition-colors">
                              {displayName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                              <span className="font-semibold">{customer.phone || customer.email || 'VIP Member'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Count Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-[14px] font-extrabold text-[#0284C7] tabular-nums">
                            {count(customer.bookings)}
                          </span>
                          <span className="block text-[10px] font-bold text-[#64748B] uppercase">Visits</span>
                        </div>
                      </div>

                      {/* Extended Details (if enabled) */}
                      {showDetailed && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-[11px]">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            {customer.completed !== undefined && (
                              <span className="flex items-center gap-1 font-semibold text-[#15803D]">
                                <CheckCircle2 className="h-3 w-3" />
                                {customer.completed} done
                              </span>
                            )}
                            {customer.spent !== undefined && customer.spent > 0 && (
                              <>
                                <span>·</span>
                                <span className="font-extrabold text-[#1E293B] tabular-nums">
                                  {money(customer.spent)} spent
                                </span>
                              </>
                            )}
                          </div>

                          {/* Action Button */}
                          <Link
                            href={profileHref}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#0EA5E9] shadow-2xs hover:bg-[#0EA5E9] hover:text-white hover:border-[#0EA5E9] transition-all"
                          >
                            <span>Profile</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {/* Visual Volume Bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0EA5E9] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Footer Action */}
            <div className="pt-1">
              <Link
                href="/users?role=CUSTOMER"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] py-2 text-[11px] font-bold text-[#0EA5E9] transition-all hover:bg-[#E0F2FE] hover:border-[#0EA5E9]/30"
              >
                <span>Browse All Registered Clients</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

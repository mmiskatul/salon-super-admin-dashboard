'use client';

import React, { useState, useMemo } from 'react';
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
  Calendar,
  Clock,
  CheckCircle2,
  Banknote,
  SlidersHorizontal,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Panel } from '@/components/ui/primitives';
import type { Overview } from '@/lib/api/insights';

interface OverviewLeaderboardsProps {
  overview: Overview;
  periodLabel: string;
}

type TabFilter = 'all' | 'shops' | 'barbers' | 'services' | 'customers';

function formatLastBooking(iso: string | null | undefined): string {
  if (!iso) return 'Active';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const isYesterday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() - 1;

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today ${timeStr}`;
  if (isYesterday) return `Ystd ${timeStr}`;

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function OverviewLeaderboards({ overview, periodLabel }: OverviewLeaderboardsProps) {
  const [itemLimit, setItemLimit] = useState<number>(5); // Default to compact 5 items to keep length small
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Fallbacks to guarantee data even if cached response is used
  const topShops = useMemo(() => {
    if (overview.top.shops && overview.top.shops.length > 0) {
      return overview.top.shops;
    }
    return overview.top.places
      .filter((p) => p.kind !== 'barber' && !p.key.startsWith('barber:'))
      .map((p) => ({
        id: p.key,
        name: p.name,
        bookings: p.bookings,
        completed: p.completed ?? 0,
        revenue: p.revenue ?? 0,
        lastBookingAt: p.lastBookingAt ?? null,
      }));
  }, [overview]);

  const topBarbers = useMemo(() => {
    if (overview.top.barbers && overview.top.barbers.length > 0) {
      return overview.top.barbers;
    }
    return overview.top.places
      .filter((p) => p.kind === 'barber' || p.key.startsWith('barber:'))
      .map((p) => ({
        id: p.key.replace('barber:', ''),
        name: p.name,
        shopName: null,
        isIndependent: true,
        bookings: p.bookings,
        completed: p.completed ?? 0,
        revenue: p.revenue ?? 0,
        lastBookingAt: p.lastBookingAt ?? null,
      }));
  }, [overview]);

  const topServices = overview.top.services ?? [];
  const topCustomers = overview.top.customers ?? [];

  const maxShopBookings = Math.max(1, ...topShops.map((s) => s.bookings));
  const maxBarberBookings = Math.max(1, ...topBarbers.map((b) => b.bookings));
  const maxServiceBookings = Math.max(1, ...topServices.map((s) => s.bookings));
  const maxCustomerBookings = Math.max(1, ...topCustomers.map((c) => c.bookings));

  const formattedSelectedDate = useMemo(() => {
    if (!overview.selectedDate) return null;
    const d = new Date(`${overview.selectedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return overview.selectedDate;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [overview.selectedDate]);

  return (
    <div className="space-y-3 font-manrope">
      {/* Section Header with Mode Switcher & Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1E293B]">Platform Leaderboards</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAFBFD] px-2 py-0.5 text-[10px] font-bold text-[#64748B] border border-[#E2E8F0]">
                <Calendar className="h-3 w-3 text-[#635BFF]" />
                {formattedSelectedDate ? `${periodLabel} (${formattedSelectedDate})` : periodLabel}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#64748B]">
              Top performing salons, barbers, catalog services, and VIP clients
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'all' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              All (4)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shops')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'shops' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Salons
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('barbers')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'barbers' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Barbers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'services' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'customers' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              VIP Clients
            </button>
          </div>

          {/* Toggle Length: Top 5 vs Top 8 */}
          <button
            type="button"
            onClick={() => setItemLimit(itemLimit === 5 ? 8 : 5)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#64748B] transition-all hover:border-[#635BFF]/40 hover:text-[#1E293B]"
            title="Toggle list height"
          >
            <SlidersHorizontal className="h-3 w-3 text-[#635BFF]" />
            <span>{itemLimit === 5 ? 'Top 5 (Compact)' : 'Top 8 (Extended)'}</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Cards Grid (Smaller, Sleeker, Compact Height) */}
      <div
        className={`grid gap-4 ${
          activeTab === 'all'
            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-2 max-w-4xl'
        }`}
      >
        {/* 1. Top Salon Shops */}
        {(activeTab === 'all' || activeTab === 'shops') && (
          <Panel
            title="Top Salon Shops"
            note={`Ranked by bookings in ${periodLabel}`}
            actions={
              <Link
                href="/readiness"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[10px] font-bold text-[#635BFF] border border-[#E2E8F0] hover:bg-[#EEF2FF] transition-colors"
              >
                <span>All Salons</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </Link>
            }
          >
            <div className="space-y-2">
              {!topShops.length ? (
                <p className="py-6 text-center text-[11px] text-[#94A3B8]">No salon bookings recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {topShops.slice(0, itemLimit).map((shop, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((shop.bookings / maxShopBookings) * 100));
                    const href = placeHref(shop.id);

                    return (
                      <div
                        key={shop.id}
                        className="group rounded-lg border border-[#F1F5F9] bg-[#FAFBFD] px-2.5 py-2 transition-all hover:border-[#635BFF]/30 hover:bg-white hover:shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-extrabold ${
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

                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-bold text-[#1E293B] group-hover:text-[#635BFF] transition-colors leading-tight">
                                {shop.name}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                                <span className="font-semibold text-[#15803D]">{shop.completed} done</span>
                                {shop.revenue > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="font-extrabold text-[#1E293B]">{money(shop.revenue)}</span>
                                  </>
                                )}
                                {shop.lastBookingAt && (
                                  <>
                                    <span className="hidden xl:inline">·</span>
                                    <span className="hidden xl:inline text-[#94A3B8] truncate max-w-[85px]">
                                      {formatLastBooking(shop.lastBookingAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="text-[12px] font-extrabold text-[#1E293B] tabular-nums">
                                {count(shop.bookings)}
                              </span>
                              <span className="block text-[9px] font-bold text-[#94A3B8] uppercase leading-none">bks</span>
                            </div>
                            <Link
                              href={href}
                              className="flex h-5.5 w-5.5 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#635BFF] hover:bg-[#635BFF] hover:text-white transition-colors"
                              title="Inspect Salon"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Thin volume bar */}
                        <div className="mt-1.5 h-1 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#635BFF] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom toggle / link */}
              <div className="pt-0.5 flex items-center justify-between text-[11px] font-bold">
                {topShops.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setItemLimit(itemLimit === 5 ? 8 : 5)}
                    className="cursor-pointer text-[#635BFF] hover:underline"
                  >
                    {itemLimit === 5 ? `+${topShops.length - 5} more` : 'Show fewer'}
                  </button>
                )}
                <Link
                  href="/readiness"
                  className="ml-auto inline-flex items-center gap-0.5 text-[#64748B] hover:text-[#635BFF]"
                >
                  <span>Pipeline</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Panel>
        )}

        {/* 2. Top Barbers & Stylists */}
        {(activeTab === 'all' || activeTab === 'barbers') && (
          <Panel
            title="Top Barbers & Stylists"
            note={`Highest performing professionals in ${periodLabel}`}
            actions={
              <Link
                href="/barbers"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[10px] font-bold text-[#7C3AED] border border-[#E2E8F0] hover:bg-[#EDE9FE] transition-colors"
              >
                <span>All Barbers</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </Link>
            }
          >
            <div className="space-y-2">
              {!topBarbers.length ? (
                <p className="py-6 text-center text-[11px] text-[#94A3B8]">No barber bookings recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {topBarbers.slice(0, itemLimit).map((barber, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((barber.bookings / maxBarberBookings) * 100));
                    const href = `/barbers/${encodeURIComponent(barber.id)}`;

                    return (
                      <div
                        key={barber.id}
                        className="group rounded-lg border border-[#F1F5F9] bg-[#FAFBFD] px-2.5 py-2 transition-all hover:border-[#7C3AED]/30 hover:bg-white hover:shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-extrabold ${
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

                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-bold text-[#1E293B] group-hover:text-[#7C3AED] transition-colors leading-tight">
                                {barber.name}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                                <span className="font-semibold text-[#7C3AED] truncate max-w-[70px]">
                                  {barber.shopName || (barber.isIndependent ? 'Individual' : 'Shop')}
                                </span>
                                <span>·</span>
                                <span className="font-semibold text-[#15803D]">{barber.completed} done</span>
                                {barber.revenue > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="font-extrabold text-[#1E293B]">{money(barber.revenue)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="text-[12px] font-extrabold text-[#7C3AED] tabular-nums">
                                {count(barber.bookings)}
                              </span>
                              <span className="block text-[9px] font-bold text-[#94A3B8] uppercase leading-none">cuts</span>
                            </div>
                            <Link
                              href={href}
                              className="flex h-5.5 w-5.5 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors"
                              title="Barber Profile"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Thin volume bar */}
                        <div className="mt-1.5 h-1 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom toggle / link */}
              <div className="pt-0.5 flex items-center justify-between text-[11px] font-bold">
                {topBarbers.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setItemLimit(itemLimit === 5 ? 8 : 5)}
                    className="cursor-pointer text-[#7C3AED] hover:underline"
                  >
                    {itemLimit === 5 ? `+${topBarbers.length - 5} more` : 'Show fewer'}
                  </button>
                )}
                <Link
                  href="/barbers"
                  className="ml-auto inline-flex items-center gap-0.5 text-[#64748B] hover:text-[#7C3AED]"
                >
                  <span>Barbers Directory</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Panel>
        )}

        {/* 3. Top Booked Services */}
        {(activeTab === 'all' || activeTab === 'services') && (
          <Panel
            title="Top Booked Services"
            note={`Most popular treatments in ${periodLabel}`}
            actions={
              <Link
                href="/bookings"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[10px] font-bold text-[#16A34A] border border-[#E2E8F0] hover:bg-[#DCFCE7] transition-colors"
              >
                <span>Bookings</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </Link>
            }
          >
            <div className="space-y-2">
              {!topServices.length ? (
                <p className="py-6 text-center text-[11px] text-[#94A3B8]">No service treatments recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {topServices.slice(0, itemLimit).map((service, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((service.bookings / maxServiceBookings) * 100));
                    const searchHref = `/bookings?search=${encodeURIComponent(service.name)}`;

                    return (
                      <div
                        key={service.name}
                        className="group rounded-lg border border-[#F1F5F9] bg-[#FAFBFD] px-2.5 py-2 transition-all hover:border-[#16A34A]/30 hover:bg-white hover:shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-extrabold ${
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

                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-bold text-[#1E293B] group-hover:text-[#16A34A] transition-colors leading-tight">
                                {service.name}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                                <span className="font-semibold text-[#15803D]">{service.completed} done</span>
                                {service.revenue !== undefined && service.revenue > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="font-extrabold text-[#1E293B]">{money(service.revenue)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="text-[12px] font-extrabold text-[#15803D] tabular-nums">
                                {count(service.bookings)}
                              </span>
                              <span className="block text-[9px] font-bold text-[#94A3B8] uppercase leading-none">bks</span>
                            </div>
                            <Link
                              href={searchHref}
                              className="flex h-5.5 w-5.5 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#16A34A] hover:bg-[#16A34A] hover:text-white transition-colors"
                              title="Filter Bookings"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Thin volume bar */}
                        <div className="mt-1.5 h-1 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#16A34A] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom toggle / link */}
              <div className="pt-0.5 flex items-center justify-between text-[11px] font-bold">
                {topServices.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setItemLimit(itemLimit === 5 ? 8 : 5)}
                    className="cursor-pointer text-[#16A34A] hover:underline"
                  >
                    {itemLimit === 5 ? `+${topServices.length - 5} more` : 'Show fewer'}
                  </button>
                )}
                <Link
                  href="/bookings"
                  className="ml-auto inline-flex items-center gap-0.5 text-[#64748B] hover:text-[#16A34A]"
                >
                  <span>Bookings Ledger</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Panel>
        )}

        {/* 4. Top VIP Repeat Customers */}
        {(activeTab === 'all' || activeTab === 'customers') && (
          <Panel
            title="Top Repeat Customers"
            note={`Highest frequency clients in ${periodLabel}`}
            actions={
              <Link
                href="/users?role=CUSTOMER"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[10px] font-bold text-[#0EA5E9] border border-[#E2E8F0] hover:bg-[#E0F2FE] transition-colors"
              >
                <span>Clients</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </Link>
            }
          >
            <div className="space-y-2">
              {!topCustomers.length ? (
                <p className="py-6 text-center text-[11px] text-[#94A3B8]">No customer activity recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {topCustomers.slice(0, itemLimit).map((customer, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((customer.bookings / maxCustomerBookings) * 100));
                    const profileHref = `/customers/${encodeURIComponent(customer.userId)}`;
                    const displayName = customer.name || `Client #${customer.userId.slice(-6)}`;

                    return (
                      <div
                        key={customer.userId}
                        className="group rounded-lg border border-[#F1F5F9] bg-[#FAFBFD] px-2.5 py-2 transition-all hover:border-[#0EA5E9]/30 hover:bg-white hover:shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-extrabold ${
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

                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-bold text-[#1E293B] group-hover:text-[#0EA5E9] transition-colors leading-tight">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                                <span className="font-semibold text-[#15803D]">{customer.completed} done</span>
                                {customer.spent !== undefined && customer.spent > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="font-extrabold text-[#1E293B]">{money(customer.spent)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="text-[12px] font-extrabold text-[#0284C7] tabular-nums">
                                {count(customer.bookings)}
                              </span>
                              <span className="block text-[9px] font-bold text-[#94A3B8] uppercase leading-none">vsts</span>
                            </div>
                            <Link
                              href={profileHref}
                              className="flex h-5.5 w-5.5 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white transition-colors"
                              title="Customer Profile"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Thin volume bar */}
                        <div className="mt-1.5 h-1 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0EA5E9] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom toggle / link */}
              <div className="pt-0.5 flex items-center justify-between text-[11px] font-bold">
                {topCustomers.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setItemLimit(itemLimit === 5 ? 8 : 5)}
                    className="cursor-pointer text-[#0EA5E9] hover:underline"
                  >
                    {itemLimit === 5 ? `+${topCustomers.length - 5} more` : 'Show fewer'}
                  </button>
                )}
                <Link
                  href="/users?role=CUSTOMER"
                  className="ml-auto inline-flex items-center gap-0.5 text-[#64748B] hover:text-[#0EA5E9]"
                >
                  <span>Clients Directory</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

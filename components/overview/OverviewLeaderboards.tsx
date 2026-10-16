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
  if (!iso) return 'Recently active';
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

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${timeStr}`;
}

export function OverviewLeaderboards({ overview, periodLabel }: OverviewLeaderboardsProps) {
  const [showDetailed, setShowDetailed] = useState(true);
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

  const totalBookings = overview.bookings.total || 1;

  const formattedSelectedDate = useMemo(() => {
    if (!overview.selectedDate) return null;
    const d = new Date(`${overview.selectedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return overview.selectedDate;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [overview.selectedDate]);

  return (
    <div className="space-y-4 font-manrope">
      {/* Section Header with Mode Switcher & Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#1E293B]">Platform Leaderboards</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAFBFD] px-2 py-0.5 text-[10px] font-bold text-[#64748B] border border-[#E2E8F0]">
                <Calendar className="h-3 w-3 text-[#635BFF]" />
                {formattedSelectedDate ? `Period: ${periodLabel} (${formattedSelectedDate})` : `Period: ${periodLabel}`}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#64748B]">
              Top salons, barbers, trending treatments, and highest frequency VIP clients with activity dates
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
              All Leaderboards
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shops')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'shops' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Top Salons
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('barbers')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'barbers' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Top Barbers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'services' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Top Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-all ${
                activeTab === 'customers' ? 'bg-[#635BFF] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Top VIPs
            </button>
          </div>

          {/* Toggle Detailed Metrics */}
          <button
            type="button"
            onClick={() => setShowDetailed(!showDetailed)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#64748B] transition-all hover:border-[#635BFF]/40 hover:text-[#1E293B]"
          >
            <SlidersHorizontal className="h-3 w-3 text-[#635BFF]" />
            <span>{showDetailed ? 'Details: On' : 'Details: Off'}</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Cards Grid */}
      <div
        className={`grid gap-5 ${
          activeTab === 'all'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-2 max-w-4xl'
        }`}
      >
        {/* 1. Top Salon Shops */}
        {(activeTab === 'all' || activeTab === 'shops') && (
          <Panel
            title="Top Salon Shops"
            note={`Highest booking salon stores in ${periodLabel}`}
            actions={
              <Link
                href="/readiness"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#635BFF] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#635BFF]/30 transition-colors"
              >
                <span>All Salons</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="space-y-3">
              {!topShops.length ? (
                <p className="py-8 text-center text-[12px] text-[#94A3B8]">No salon bookings recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {topShops.map((shop, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((shop.bookings / maxShopBookings) * 100));
                    const shareOfTotal = Math.round((shop.bookings / totalBookings) * 100);
                    const href = placeHref(shop.id);

                    return (
                      <div
                        key={shop.id}
                        className="group rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 transition-all hover:border-[#635BFF]/30 hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
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
                              <Store className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-[#1E293B] group-hover:text-[#635BFF] transition-colors">
                                {shop.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                                <span className="font-semibold text-[#635BFF]">{shareOfTotal}% volume</span>
                                {shop.lastBookingAt && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 truncate text-[#64748B]">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatLastBooking(shop.lastBookingAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[14px] font-extrabold text-[#1E293B] tabular-nums">
                              {count(shop.bookings)}
                            </span>
                            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Bookings</span>
                          </div>
                        </div>

                        {showDetailed && (
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-[11px]">
                            <div className="flex items-center gap-2 text-[#64748B]">
                              <span className="flex items-center gap-1 font-semibold text-[#15803D]">
                                <CheckCircle2 className="h-3 w-3" />
                                {shop.completed} done
                              </span>
                              {shop.revenue > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="font-extrabold text-[#15803D] tabular-nums">
                                    {money(shop.revenue)}
                                  </span>
                                </>
                              )}
                            </div>

                            <Link
                              href={href}
                              className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#635BFF] shadow-2xs hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition-all"
                            >
                              <span>Inspect</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}

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
        )}

        {/* 2. Top Barbers & Stylists */}
        {(activeTab === 'all' || activeTab === 'barbers') && (
          <Panel
            title="Top Barbers & Stylists"
            note={`Highest performing professionals in ${periodLabel}`}
            actions={
              <Link
                href="/barbers"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#7C3AED] border border-[#E2E8F0] hover:bg-[#EDE9FE] hover:border-[#7C3AED]/30 transition-colors"
              >
                <span>All Barbers</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="space-y-3">
              {!topBarbers.length ? (
                <p className="py-8 text-center text-[12px] text-[#94A3B8]">No barber bookings recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {topBarbers.map((barber, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((barber.bookings / maxBarberBookings) * 100));
                    const href = `/barbers/${encodeURIComponent(barber.id)}`;

                    return (
                      <div
                        key={barber.id}
                        className="group rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 transition-all hover:border-[#7C3AED]/30 hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
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

                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] text-[#7C3AED]">
                              <Scissors className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-[#1E293B] group-hover:text-[#7C3AED] transition-colors">
                                {barber.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                                <span className="font-semibold text-[#7C3AED]">
                                  {barber.shopName || (barber.isIndependent ? 'Freelance' : 'Shop Barber')}
                                </span>
                                {barber.lastBookingAt && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 truncate text-[#64748B]">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatLastBooking(barber.lastBookingAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[14px] font-extrabold text-[#7C3AED] tabular-nums">
                              {count(barber.bookings)}
                            </span>
                            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Cuts</span>
                          </div>
                        </div>

                        {showDetailed && (
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-[11px]">
                            <div className="flex items-center gap-2 text-[#64748B]">
                              <span className="flex items-center gap-1 font-semibold text-[#15803D]">
                                <CheckCircle2 className="h-3 w-3" />
                                {barber.completed} done
                              </span>
                              {barber.revenue > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="font-extrabold text-[#15803D] tabular-nums">
                                    {money(barber.revenue)}
                                  </span>
                                </>
                              )}
                            </div>

                            <Link
                              href={href}
                              className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#7C3AED] shadow-2xs hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] transition-all"
                            >
                              <span>Profile</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}

                        <div className="mt-2 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-1">
                <Link
                  href="/barbers"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] py-2 text-[11px] font-bold text-[#7C3AED] transition-all hover:bg-[#EDE9FE] hover:border-[#7C3AED]/30"
                >
                  <span>View All Network Barbers</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Panel>
        )}

        {/* 3. Top Booked Services */}
        {(activeTab === 'all' || activeTab === 'services') && (
          <Panel
            title="Top Booked Services"
            note={`Most requested treatments in ${periodLabel}`}
            actions={
              <Link
                href="/bookings"
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#16A34A] border border-[#E2E8F0] hover:bg-[#DCFCE7] hover:border-[#16A34A]/30 transition-colors"
              >
                <span>Bookings</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="space-y-3">
              {!topServices.length ? (
                <p className="py-8 text-center text-[12px] text-[#94A3B8]">No service treatments recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {topServices.map((service, idx) => {
                    const rank = idx + 1;
                    const pct = Math.max(6, Math.round((service.bookings / maxServiceBookings) * 100));
                    const searchHref = `/bookings?search=${encodeURIComponent(service.name)}`;

                    return (
                      <div
                        key={service.name}
                        className="group rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 transition-all hover:border-[#16A34A]/30 hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
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
                                <span className="font-semibold text-[#16A34A]">Catalog Service</span>
                                {service.lastBookingAt && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 truncate text-[#64748B]">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatLastBooking(service.lastBookingAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[14px] font-extrabold text-[#15803D] tabular-nums">
                              {count(service.bookings)}
                            </span>
                            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Booked</span>
                          </div>
                        </div>

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
                                  <span className="font-extrabold text-[#15803D] tabular-nums">
                                    {money(service.revenue)}
                                  </span>
                                </>
                              )}
                            </div>

                            <Link
                              href={searchHref}
                              className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#16A34A] shadow-2xs hover:bg-[#16A34A] hover:text-white hover:border-[#16A34A] transition-all"
                            >
                              <span>Filter</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}

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

              <div className="pt-1">
                <Link
                  href="/bookings"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] py-2 text-[11px] font-bold text-[#16A34A] transition-all hover:bg-[#DCFCE7] hover:border-[#16A34A]/30"
                >
                  <span>View Appointments Ledger</span>
                  <ChevronRight className="h-3.5 w-3.5" />
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
                className="inline-flex items-center gap-1 rounded-md bg-[#FAFBFD] px-2 py-0.5 text-[11px] font-bold text-[#0EA5E9] border border-[#E2E8F0] hover:bg-[#E0F2FE] hover:border-[#0EA5E9]/30 transition-colors"
              >
                <span>Clients</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="space-y-3">
              {!topCustomers.length ? (
                <p className="py-8 text-center text-[12px] text-[#94A3B8]">No customer activity recorded.</p>
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
                                <span className="font-semibold text-[#0EA5E9]">VIP Client</span>
                                {customer.lastBookingAt && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5 truncate text-[#64748B]">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatLastBooking(customer.lastBookingAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[14px] font-extrabold text-[#0284C7] tabular-nums">
                              {count(customer.bookings)}
                            </span>
                            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Visits</span>
                          </div>
                        </div>

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
                                  <span className="font-extrabold text-[#15803D] tabular-nums">
                                    {money(customer.spent)} spent
                                  </span>
                                </>
                              )}
                            </div>

                            <Link
                              href={profileHref}
                              className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#0EA5E9] shadow-2xs hover:bg-[#0EA5E9] hover:text-white hover:border-[#0EA5E9] transition-all"
                            >
                              <span>Profile</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}

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
        )}
      </div>
    </div>
  );
}

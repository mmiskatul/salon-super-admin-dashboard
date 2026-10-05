'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, RotateCw, Megaphone, AlertCircle } from 'lucide-react';
import { usePlatform } from '@/lib/usePlatform';
import { brandColor, count } from '@/lib/format';
import { Button, Canvas, Failed, Loading, PageHead, Panel } from '@/components/ui/primitives';
import { Ranked } from '@/components/chart/Chart';

import OverviewHeroCards from '@/components/overview/OverviewHeroCards';
import FinancialCommandCenter from '@/components/overview/FinancialCommandCenter';
import PlatformRevenueChart from '@/components/overview/PlatformRevenueChart';
import TenantGrowthChart from '@/components/overview/TenantGrowthChart';
import PeriodFilterBar from '@/components/ui/PeriodFilterBar';
import OnboardingFunnelWidget from '@/components/overview/OnboardingFunnelWidget';
import BookingOutcomesChart from '@/components/overview/BookingOutcomesChart';
import SupportModerationPulse from '@/components/overview/SupportModerationPulse';
import ClusterHealthWidget from '@/components/overview/ClusterHealthWidget';

export default function OverviewPage() {
  const platform = usePlatform();
  const {
    overview,
    tenants,
    vitals,
    totals,
    loading,
    sweeping,
    swept,
    error,
    reload,
    selectedPeriod,
    charts,
    trustPulse,
  } = platform;
  const selectedCharts = charts[selectedPeriod.toLowerCase()] ?? null;

  const sweepNote = tenants
    ? sweeping
      ? `Syncing ${swept} of ${tenants.length} shops...`
      : `${tenants.length} shops synchronized`
    : null;

  const leaderboardRows = overview?.leaderboard?.length
    ? overview.leaderboard.map((item) => ({
        key: item.id,
        label: item.name,
        value: item.appointments,
        color: brandColor(item.brandColor),
      }))
    : (tenants || [])
        .map((t) => ({
          key: t.id,
          label: t.name,
          value: vitals[t.id]?.appointments ?? 0,
          color: brandColor(t.brandColor),
        }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

  return (
    <>
      <PageHead
        eyebrow="Super Admin Console"
        title="Platform Overview"
        lede="Every shop on the platform: who is taking bookings, what they took, and whether the system is healthy."
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <PeriodFilterBar showLabel={true} />

            {sweepNote && (
              <span className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold text-[#64748B]">
                {sweeping && (
                  <span className="h-2 w-2 rounded-full bg-[#635BFF] animate-ping" aria-hidden />
                )}
                {sweepNote}
              </span>
            )}

            <Link href="/broadcasts">
              <Button variant="secondary" className="hidden md:inline-flex">
                <Megaphone className="w-3.5 h-3.5 text-[#635BFF]" />
                Broadcast Alert
              </Button>
            </Link>

            <Button
              variant="primary"
              onClick={reload}
              disabled={loading || sweeping}
              className="shadow-sm shadow-[#635BFF]/25"
            >
              <RotateCw className={`w-3.5 h-3.5 ${sweeping ? 'animate-spin' : ''}`} />
              Refresh Snapshot
            </Button>
          </div>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label="Aggregating platform telemetry and shop rosters..." />}

        {tenants && totals && !error && (
          <div className="space-y-6 pb-6">
            {/* 1. Hero KPI Cards (Owner Dashboard Aesthetic) */}
            <OverviewHeroCards totals={totals} sweeping={sweeping} swept={swept} />

            {/* Incomplete / Degraded Shop Warning Notice */}
            {totals.incomplete > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {count(totals.incomplete)} shop{totals.incomplete === 1 ? '' : 's'} did not respond to telemetry requests.
                  </span>{' '}
                  Aggregate counts above reflect answering nodes. Inspect individual shops in the{' '}
                  <Link href="/shops" className="font-bold underline hover:text-amber-900">
                    Shops Directory
                  </Link>{' '}
                  for details.
                </div>
              </div>
            )}

            {/* 2. Financial Command Center: GMV vs Net Platform Revenue vs Subscription MRR */}
            <FinancialCommandCenter
              totalRevenue={totals.revenue}
              platformNetEarnings={overview?.summary?.platformNetEarnings}
              subscriptionMrr={overview?.summary?.subscriptionMrr}
              activeSubscriptions={overview?.summary?.activeSubscriptions}
              pendingPaymentsAmount={overview?.summary?.pendingPaymentsAmount}
              pendingPaymentsCount={overview?.summary?.pendingPaymentsCount}
              period={selectedPeriod}
            />

            {/* 3. Primary Graphs: Revenue Trajectory & Tenant Growth */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PlatformRevenueChart
                totalRevenue={totals.revenue}
                totalAppointments={totals.appointments}
                chart={selectedCharts}
              />
              <TenantGrowthChart
                totals={totals}
                tenants={tenants}
                vitals={vitals}
                period={selectedPeriod}
                chart={selectedCharts}
              />
            </div>

            {/* 4. Tenant Onboarding & Activation Lifecycle Funnel */}
            <OnboardingFunnelWidget tenants={tenants} vitals={vitals} />

            {/* 5. Marketplace Operations: Booking Outcomes & Support/Moderation Pulse */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BookingOutcomesChart totals={totals} period={selectedPeriod} />
              <SupportModerationPulse totals={totals} period={selectedPeriod} trustPulse={trustPulse} />
            </div>

            {/* 6. Infrastructure & Leaderboard: Backend Health & Busiest Salons */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ClusterHealthWidget />

              <Panel
                title="Busiest Salons Leaderboard"
                note="Ranked by total customer bookings taken to date"
                actions={
                  <Link
                    href="/shops"
                    className="text-xs font-bold text-[#635BFF] hover:text-[#524be0] inline-flex items-center gap-1 hover:underline"
                  >
                    All shops <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                }
              >
                <div className="pt-2">
                  <Ranked
                    format={(v) => `${count(v)} bookings`}
                    rows={leaderboardRows}
                  />

                  {leaderboardRows.length === 0 && (
                    <p className="py-8 text-center text-xs font-semibold text-[#94A3B8]">
                      {sweeping
                        ? 'Calculating bookings across salons...'
                        : 'No bookings recorded across the platform yet.'}
                    </p>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </Canvas>
    </>
  );
}

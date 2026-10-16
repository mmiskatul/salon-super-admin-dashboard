'use client';

import { useState } from 'react';
import {
  RotateCw,
  TrendingUp,
  Users,
  Activity,
  Repeat,
  Sparkles,
  Smartphone,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getGrowth, type InsightDays } from '@/lib/api/insights';
import { count } from '@/lib/format';
import { Badge, Button, Canvas, Failed, Loading, PageHead, Stat } from '@/components/ui/primitives';
import { DaysPicker, percent } from '@/components/insights/Bits';
import {
  SignupTrajectoryChart,
  FunnelAnalysisSuite,
  BookerCompositionSuite,
  ActivePulseSuite,
  PushReachSuite,
  ReferralEngineSuite,
} from '@/components/growth/GrowthCharts';

type NeedView = 'all' | 'acquisition' | 'funnel' | 'activity' | 'viral';

const PERIOD_TABS: { days: InsightDays; label: string; sub: string }[] = [
  { days: 1, label: 'Today', sub: '24h' },
  { days: 7, label: 'Weekly', sub: '7d' },
  { days: 30, label: 'Monthly', sub: '30d' },
  { days: 365, label: 'Yearly', sub: '1y' },
];

/** Customers & Growth Analytics Suite with interactive Recharts */
export default function GrowthPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const [activeNeed, setActiveNeed] = useState<NeedView>('all');
  const data = useApi(() => getGrowth(days), [days], 'insights-growth');
  const g = data.data;

  // Key derived ratios
  const stickiness = g && g.active.month.total > 0
    ? Math.round((g.active.day.total / g.active.month.total) * 100)
    : 0;

  const periodLabel = days === 1 ? 'Today (24 Hours)' : days === 7 ? 'Weekly (7 Days)' : days === 30 ? 'Monthly (30 Days)' : 'Yearly (Past Year)';

  return (
    <>
      <PageHead
        eyebrow="Super Admin Insights"
        title="Customers & Growth Intelligence"
        lede="Track new customer acquisition dynamics, conversion drop-off funnels, daily/weekly/monthly active stickiness, push notification penetration, and viral referral loops."
        actions={
          <>
            {/* Today / Weekly / Monthly / Yearly Granular Period Switcher */}
            <div className="inline-flex rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-2xs font-manrope text-[12px] font-bold" role="group" aria-label="Period Filter">
              {PERIOD_TABS.map((tab) => (
                <button
                  key={tab.days}
                  type="button"
                  onClick={() => setDays(tab.days)}
                  aria-pressed={days === tab.days}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                    days === tab.days
                      ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                      : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] rounded px-1 py-0.2 ${
                      days === tab.days ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'
                    }`}
                  >
                    {tab.sub}
                  </span>
                </button>
              ))}
            </div>

            <Button onClick={data.refresh} disabled={data.loading}>
              <RotateCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </>
        }
      />

      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !g ? (
          <Loading label="Synthesizing customer & growth metrics" />
        ) : (
          <div className="space-y-6">
            {/* Top Headline Executive Growth Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Stat
                label="Active Today (DAU)"
                value={count(g.active.day.total)}
                sub={`${g.active.day.customers} cust · ${g.active.day.partners} part`}
                tone="live"
                icon={<Activity className="h-4 w-4 text-[#10B981]" />}
                iconBg="bg-[#ECFDF5]"
              />
              <Stat
                label="Active This Week"
                value={count(g.active.week.total)}
                sub={`${g.active.week.customers} cust · ${g.active.week.partners} part`}
                icon={<Users className="h-4 w-4 text-[#635BFF]" />}
                iconBg="bg-[#EEF2FF]"
              />
              <Stat
                label="Active Month (MAU)"
                value={count(g.active.month.total)}
                sub={`${stickiness}% DAU/MAU stickiness`}
                icon={<TrendingUp className="h-4 w-4 text-[#0EA5E9]" />}
                iconBg="bg-[#E0F2FE]"
              />
              <Stat
                label="All Accounts"
                value={count(g.totals.users)}
                sub={`${count(g.totals.customers)} cust · ${count(g.totals.barbers)} barb · ${count(g.totals.owners)} own`}
                icon={<ShieldCheck className="h-4 w-4 text-[#8B5CF6]" />}
                iconBg="bg-[#F5F3FF]"
              />
              <Stat
                label="1st Booking Conv."
                value={percent(g.funnel.signupToBookingRate)}
                sub={`${count(g.funnel.firstBooking)} of ${count(g.funnel.signedUp)} signups`}
                tone={g.funnel.signupToBookingRate && g.funnel.signupToBookingRate > 25 ? 'live' : 'plain'}
                icon={<Sparkles className="h-4 w-4 text-[#F59E0B]" />}
                iconBg="bg-[#FEF3C7]"
              />
              <Stat
                label="Repeat Retention"
                value={percent(g.funnel.repeatRate)}
                sub={`${count(g.funnel.bookedAgain)} repeat bookers`}
                tone={g.funnel.repeatRate && g.funnel.repeatRate > 30 ? 'live' : 'plain'}
                icon={<Repeat className="h-4 w-4 text-[#10B981]" />}
                iconBg="bg-[#ECFDF5]"
              />
            </div>

            {/* Need-Wise Filter Navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-2xs font-manrope">
              <div className="flex items-center gap-2 pl-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#635BFF]" /> Focus View:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveNeed('all')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeNeed === 'all'
                      ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>All Growth Insights</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNeed('acquisition')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeNeed === 'acquisition'
                      ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Acquisition Dynamics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNeed('funnel')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeNeed === 'funnel'
                      ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Conversion & Retention</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNeed('activity')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeNeed === 'activity'
                      ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Activity & Stickiness</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveNeed('viral')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeNeed === 'viral'
                      ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Viral & Push Channels</span>
                </button>
              </div>
            </div>

            {/* NEED 1: ACQUISITION & SIGNUPS DYNAMICS */}
            {(activeNeed === 'all' || activeNeed === 'acquisition') && (
              <section className="space-y-4">
                {activeNeed === 'all' && (
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-[14px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#635BFF]" /> User Acquisition Dynamics
                    </h2>
                    <span className="text-[12px] text-[#94A3B8] font-medium">{periodLabel} observation window</span>
                  </div>
                )}
                <SignupTrajectoryChart growth={g} days={days} />
              </section>
            )}

            {/* NEED 2: CONVERSION FUNNEL & RETENTION COHORTS */}
            {(activeNeed === 'all' || activeNeed === 'funnel') && (
              <section className="space-y-4">
                {activeNeed === 'all' && (
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-[14px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Onboarding Funnel & Repeat Loyalty
                    </h2>
                    <span className="text-[12px] text-[#94A3B8] font-medium">Activation & Drop-off rates</span>
                  </div>
                )}
                <div className="grid gap-5 lg:grid-cols-12">
                  <div className="lg:col-span-8">
                    <FunnelAnalysisSuite growth={g} days={days} />
                  </div>
                  <div className="lg:col-span-4">
                    <BookerCompositionSuite growth={g} />
                  </div>
                </div>
              </section>
            )}

            {/* NEED 3: ACTIVE USERS PULSE & PLATFORM STICKINESS */}
            {(activeNeed === 'all' || activeNeed === 'activity') && (
              <section className="space-y-4">
                {activeNeed === 'all' && (
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-[14px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" /> Platform Engagement & Stickiness
                    </h2>
                    <span className="text-[12px] text-[#94A3B8] font-medium">DAU vs WAU vs MAU Horizonal Health</span>
                  </div>
                )}
                <div className="grid gap-5 lg:grid-cols-12">
                  <div className="lg:col-span-8">
                    <ActivePulseSuite growth={g} />
                  </div>
                  <div className="lg:col-span-4">
                    <PushReachSuite growth={g} />
                  </div>
                </div>
              </section>
            )}

            {/* NEED 4: VIRAL REFERRALS & DEVICE REACH CHANNELS */}
            {(activeNeed === 'all' || activeNeed === 'viral') && (
              <section className="space-y-4">
                {activeNeed === 'all' && (
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-[14px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Growth Viral Loop & Advocacy
                    </h2>
                    <span className="text-[12px] text-[#94A3B8] font-medium">Member-get-member referral momentum</span>
                  </div>
                )}
                <ReferralEngineSuite growth={g} days={days} />
              </section>
            )}
          </div>
        )}
      </Canvas>
    </>
  );
}

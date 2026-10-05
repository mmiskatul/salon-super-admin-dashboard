'use client';

import React from 'react';
import { Store, CalendarCheck, Banknote, Users, Activity } from 'lucide-react';
import { Stat } from '@/components/ui/primitives';
import { count, compact, money } from '@/lib/format';
import type { PlatformTotals } from '@/lib/api/platform';
import { useAppSelector } from '@/lib/redux/hooks';
import { usePlatformCharts } from '@/lib/query/platformQueries';
import { periodChange } from '@/lib/trend';

interface OverviewHeroCardsProps {
  totals: PlatformTotals;
  sweeping: boolean;
  swept: number;
}

export default function OverviewHeroCards({ totals, sweeping, swept }: OverviewHeroCardsProps) {
  const selectedPeriod = useAppSelector((state) => state.platform.selectedPeriod);
  const liveRatio = totals.tenants > 0 ? Math.round((totals.live / totals.tenants) * 100) : 0;
  const completionRate =
    totals.appointments > 0 ? Math.round((totals.completed / totals.appointments) * 100) : 0;

  // Real change against the previous period (these used to be fixed made-up figures).
  const charts = usePlatformCharts(selectedPeriod);
  const periodRevChange = periodChange(charts.data?.revenueTrend, selectedPeriod)?.label;

  const periodRevSub = {
    Daily: "Today's settled transactions",
    Weekly: "Weekly settled volume",
    Monthly: "Completed payments",
    Yearly: "Annual network volume",
  }[selectedPeriod] || 'Completed payments';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <Stat
        label="Total Salons"
        value={count(totals.tenants)}
        sub={`${totals.live} taking bookings`}
        change={`${liveRatio}% live`}
        icon={<Store className="w-5 h-5 text-[#635BFF]" />}
        iconBg="bg-[#EEF2FF]"
        gradient="bg-gradient-to-b from-[#635BFF]/[12%] to-[#635BFF]/[2%]"
      />

      <Stat
        label="Settled Revenue"
        value={money(totals.revenue)}
        sub={periodRevSub}
        change={periodRevChange}
        icon={<Banknote className="w-5 h-5 text-[#10B981]" />}
        iconBg="bg-[#D1FAE5]"
        gradient="bg-gradient-to-b from-[#10B981]/[12%] to-[#10B981]/[2%]"
        pending={sweeping && totals.revenue === 0}
      />

      <Stat
        label="Bookings Placed"
        value={compact(totals.appointments)}
        sub={`${count(totals.upcoming)} upcoming`}
        change={`${completionRate}% completed`}
        icon={<CalendarCheck className="w-5 h-5 text-[#06B6D4]" />}
        iconBg="bg-[#CFFAFE]"
        gradient="bg-gradient-to-b from-[#06B6D4]/[12%] to-[#06B6D4]/[2%]"
        pending={sweeping && totals.appointments === 0}
      />

      <Stat
        label="Barbers & Stylists"
        value={count(totals.staff)}
        sub={`${count(totals.services)} services listed`}
        change="Active across shops"
        icon={<Users className="w-5 h-5 text-[#F59E0B]" />}
        iconBg="bg-[#FEF3C7]"
        gradient="bg-gradient-to-b from-[#F59E0B]/[12%] to-[#F59E0B]/[2%]"
        pending={sweeping && totals.staff === 0}
      />

      <Stat
        label="Platform Vitality"
        value={`${totals.dormant === 0 ? '100%' : `${100 - Math.round((totals.dormant / Math.max(1, totals.tenants)) * 100)}%`}`}
        sub={totals.dormant > 0 ? `${count(totals.dormant)} need setup` : 'All shops configured'}
        tone={totals.dormant > 0 ? 'signal' : 'live'}
        icon={<Activity className="w-5 h-5 text-[#EC4899]" />}
        iconBg="bg-[#FCE7F3]"
        gradient="bg-gradient-to-b from-[#EC4899]/[12%] to-[#EC4899]/[2%]"
        pending={sweeping && swept === 0}
      />
    </div>
  );
}

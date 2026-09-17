'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Store, ArrowUpRight, Calendar } from 'lucide-react';
import type { PlatformTotals, TenantVitals } from '@/lib/api/platform';
import type { PlatformPeriod } from '@/lib/api/platform';
import type { Tenant } from '@/lib/api/tenants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TenantGrowthChartProps {
  totals: PlatformTotals;
  tenants?: Tenant[];
  vitals?: Record<string, TenantVitals>;
  period?: PlatformPeriod;
}

import Link from 'next/link';

export default function TenantGrowthChart({ totals, tenants, vitals, period = 'Monthly' }: TenantGrowthChartProps) {
  const { labels, liveSeries, idleSeries, dormantSeries } = useMemo(() => {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, idx) => {
      const offset = 5 - idx;
      const d = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);
      return {
        label: monthNames[d.getMonth()],
        end: d,
      };
    });

    const labels = months.map((m) => m.label);

    if (tenants && tenants.length > 0 && vitals) {
      const live = months.map((m) =>
        tenants.filter((t) => {
          const created = new Date(t.createdAt);
          const v = vitals[t.id];
          return created <= m.end && (v?.appointments ?? 0) > 0;
        }).length,
      );

      const idle = months.map((m) =>
        tenants.filter((t) => {
          const created = new Date(t.createdAt);
          const v = vitals[t.id];
          return (
            created <= m.end &&
            (v?.appointments ?? 0) === 0 &&
            ((v?.staff ?? 0) > 0 || (v?.services ?? 0) > 0)
          );
        }).length,
      );

      const dormant = months.map((m) =>
        tenants.filter((t) => {
          const created = new Date(t.createdAt);
          const v = vitals[t.id];
          return (
            created <= m.end &&
            (v?.appointments ?? 0) === 0 &&
            (v?.staff ?? 0) === 0 &&
            (v?.services ?? 0) === 0
          );
        }).length,
      );

      return {
        labels,
        liveSeries: live,
        idleSeries: idle,
        dormantSeries: dormant,
      };
    }

    // Fallback based directly on current real totals if roster is still syncing
    return {
      labels,
      liveSeries: [0, 0, 0, 0, 0, totals.live],
      idleSeries: [0, 0, 0, 0, 0, totals.idle],
      dormantSeries: [0, 0, 0, 0, 0, totals.dormant],
    };
  }, [totals, tenants, vitals]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Live (Bookings Active)',
        data: liveSeries,
        backgroundColor: '#10B981',
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: 'Furnished (Idle)',
        data: idleSeries,
        backgroundColor: '#635BFF',
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: 'Needs Setup',
        data: dormantSeries,
        backgroundColor: '#CBD5E1',
        borderRadius: 4,
        stack: 'Stack 0',
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { family: 'Manrope', size: 11, weight: '600' },
          color: '#64748B',
        },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: { family: 'Manrope', size: 12, weight: '700' },
        bodyFont: { family: 'Manrope', size: 11, weight: '600' },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Manrope', size: 11, weight: '600' },
          color: '#94A3B8',
        },
      },
      y: {
        stacked: true,
        grid: {
          color: '#F1F5F9',
          drawBorder: false,
        },
        ticks: {
          font: { family: 'Manrope', size: 11, weight: '500' },
          color: '#94A3B8',
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#1E293B]">Salon Network Onboarding</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-bold text-[#635BFF]">
              <Store className="w-3 h-3" />
              {totals.tenants} Total
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-bold text-[#10B981]">
              <Calendar className="w-3 h-3" />
              {period}
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            Active salons, configured branches, and onboarding pipeline
          </p>
        </div>

        <Link
          href="/shops"
          className="text-xs font-bold text-[#635BFF] hover:text-[#524be0] inline-flex items-center gap-1 hover:underline"
        >
          View all shops <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="h-[280px] w-full pt-4">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

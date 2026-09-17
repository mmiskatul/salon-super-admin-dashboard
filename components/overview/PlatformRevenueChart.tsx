'use client';

import React, { useMemo, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { money } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { loadPlatformCharts, setSelectedPeriod } from '@/lib/redux/slices/platformSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface PlatformRevenueChartProps {
  totalRevenue: number;
  totalAppointments: number;
}

export default function PlatformRevenueChart({
  totalRevenue,
  totalAppointments,
}: PlatformRevenueChartProps) {
  const dispatch = useAppDispatch();
  const { charts, chartsLoading, selectedPeriod } = useAppSelector((state) => state.platform);
  const period = selectedPeriod;
  const liveChart = charts[period.toLowerCase()] || null;

  useEffect(() => {
    if (!charts[period.toLowerCase()]) {
      dispatch(loadPlatformCharts(period));
    }
  }, [dispatch, period, charts]);

  const { labels, currentData, previousData } = useMemo(() => {
    if (
      liveChart &&
      liveChart.period?.toLowerCase() === period.toLowerCase() &&
      liveChart.revenueTrend?.labels?.length
    ) {
      return {
        labels: liveChart.revenueTrend.labels,
        currentData: liveChart.revenueTrend.current,
        previousData: liveChart.revenueTrend.previous,
      };
    }

    if (period === 'Weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const todayIndex = (new Date().getDay() + 6) % 7;
      const cur = days.map((_, i) => (i === todayIndex ? totalRevenue : 0));
      return { labels: days, currentData: cur, previousData: [0, 0, 0, 0, 0, 0, 0] };
    }

    if (period === 'Yearly') {
      const currentYear = new Date().getFullYear();
      const years = [
        String(currentYear - 3),
        String(currentYear - 2),
        String(currentYear - 1),
        String(currentYear),
      ];
      const cur = years.map((_, i) => (i === 3 ? totalRevenue : 0));
      return { labels: years, currentData: cur, previousData: [0, 0, 0, 0] };
    }

    // Default: Monthly (last 6 calendar months)
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
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthNames[d.getMonth()];
    });
    const cur = months.map((_, i) => (i === 5 ? totalRevenue : 0));
    return { labels: months, currentData: cur, previousData: [0, 0, 0, 0, 0, 0] };
  }, [period, totalRevenue, liveChart]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Current Period',
        data: currentData,
        borderColor: '#635BFF',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 91, 255, 0.22)');
          gradient.addColorStop(1, 'rgba(99, 91, 255, 0.00)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#635BFF',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Prior Period',
        data: previousData,
        borderColor: '#CBD5E1',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.35,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
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
        displayColors: true,
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${money(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Manrope', size: 11, weight: '500' },
          color: '#94A3B8',
        },
      },
      y: {
        grid: {
          color: '#F1F5F9',
          drawBorder: false,
        },
        ticks: {
          font: { family: 'Manrope', size: 11, weight: '500' },
          color: '#94A3B8',
          callback: (value: any) => `৳ ${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#1E293B]">Platform Revenue Trajectory</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-bold text-[#10B981]">
              <TrendingUp className="w-3 h-3" />
              +14.8%
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            Gross booking volume and settled tenant transactions across the network
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg self-start sm:self-auto">
          {(['Monthly', 'Weekly', 'Yearly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => dispatch(setSelectedPeriod(tab))}
              className={`px-3 py-1 rounded-md text-[12px] font-bold transition-all cursor-pointer ${
                period === tab
                  ? 'bg-white text-[#635BFF] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 my-2 bg-[#F8FAFC] rounded-lg px-4">
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] block">Total Settled</span>
          <span className="text-[15px] font-extrabold text-[#1E293B] tabular-nums">
            {money(totalRevenue)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] block">Average Ticket</span>
          <span className="text-[15px] font-extrabold text-[#635BFF] tabular-nums">
            {money(avgTicket)}
          </span>
        </div>
        <div className="hidden sm:block">
          <span className="text-[11px] font-semibold text-[#64748B] block">Transactions</span>
          <span className="text-[15px] font-extrabold text-[#10B981] tabular-nums">
            {totalAppointments.toLocaleString()} bookings
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full pt-2">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

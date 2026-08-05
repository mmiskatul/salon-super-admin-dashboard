"use client";

import React from "react";
import Link from "next/link";
import {
  Download,
  ArrowLeft,
  Banknote,
  Wallet,
  TrendingUp,
  Percent,
  Receipt,
  Sparkles,
  BarChart2,
  Users,
  Store,
  Scissors,
  DollarSign,
} from "lucide-react";

export default function ExecutiveDashboardRevenueSummary() {
  const timeHorizons = [
    { label: "Today", val: "$12,450", isLifetime: false },
    { label: "Yesterday", val: "$10,230", isLifetime: false },
    { label: "This Week", val: "$84,120", isLifetime: false },
    { label: "This Month", val: "$324,500", isLifetime: false },
    { label: "This Year", val: "$1.8M", isLifetime: false },
    { label: "Lifetime", val: "$4.2M", isLifetime: true },
  ];

  const businessKpis = [
    {
      title: "Gross Revenue",
      amount: "$324,500",
      desc: "Total transaction volume",
      icon: Banknote,
      iconBg: "bg-[#dbeafe] text-blue-600",
    },
    {
      title: "Net Revenue",
      amount: "$285,120",
      desc: "Revenue after deductions",
      icon: Wallet,
      iconBg: "bg-[#dbeafe] text-blue-600",
    },
    {
      title: "Profit",
      amount: "$94,220",
      desc: "Operational net income",
      icon: TrendingUp,
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Platform Commission",
      amount: "$48,675",
      desc: "15% average take rate",
      icon: Percent,
      iconBg: "bg-[#dbeafe] text-blue-600",
    },
    {
      title: "Average Booking Value",
      amount: "$45.00",
      desc: "Per scheduled service",
      icon: Receipt,
      iconBg: "bg-[#dbeafe] text-blue-600",
    },
    {
      title: "Average Customer Value",
      amount: "$182.00",
      desc: "Annual spend per user",
      icon: Sparkles,
      iconBg: "bg-[#dbeafe] text-blue-600",
    },
  ];

  const growthMetrics = [
    {
      title: "Monthly Growth",
      desc: "Overall business expansion",
      val: "+12.4%",
      icon: BarChart2,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Customer Growth",
      desc: "New user acquisition",
      val: "+8.2%",
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Shop Growth",
      desc: "New establishments joined",
      val: "+5.1%",
      icon: Store,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Barber Growth",
      desc: "Individual service providers",
      val: "+15.8%",
      icon: Scissors,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Revenue Growth",
      desc: "Gross transaction increase",
      val: "+18.3%",
      icon: DollarSign,
      iconBg: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6 lg:px-10 lg:py-8 space-y-8">
      {/* Top Navigation & Page Header */}
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard Hub
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Revenue Summary
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Performance across different time horizons.
            </p>
          </div>

          <button
            onClick={() => alert("Exporting financial data...")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98 self-start sm:self-auto"
          >
            <Download size={14} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Time Horizons Row (6 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {timeHorizons.map((th) => (
          <div
            key={th.label}
            className={`rounded-2xl p-4.5 border shadow-2xs space-y-1 ${
              th.isLifetime
                ? "bg-[#f0f5ff] border-blue-200"
                : "bg-white border-slate-100"
            }`}
          >
            <p className="text-xs font-semibold text-slate-500">{th.label}</p>
            <p
              className={`text-xl lg:text-2xl font-black tracking-tight ${
                th.isLifetime ? "text-blue-600" : "text-slate-900"
              }`}
            >
              {th.val}
            </p>
          </div>
        ))}
      </div>

      {/* Business KPIs Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Business KPIs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessKpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <div
                key={kpi.title}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">
                      {kpi.title}
                    </p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                      {kpi.amount}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${kpi.iconBg} shadow-2xs`}>
                    <Icon size={20} />
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-400">
                  {kpi.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row (2 Columns: Growth Metrics & Predictive Forecasts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Col-7): Growth Metrics */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Growth Metrics
          </h2>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
            {growthMetrics.map((gm, idx) => {
              const Icon = gm.icon;

              return (
                <div
                  key={gm.title}
                  className={`flex items-center justify-between py-3 ${
                    idx !== growthMetrics.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center ${gm.iconBg}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {gm.title}
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        {gm.desc}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-emerald-600">
                    {gm.val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (Col-5): Predictive Forecasts */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Predictive Forecasts
          </h2>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-6 flex flex-col justify-between">
            {/* Next Month Revenue Section */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500">
                Next Month Revenue
              </p>
              <p className="text-3xl font-black text-blue-600 tracking-tight">
                $385,000
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[94%]" />
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Confidence: 94% (AI Model V2)
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-1">
              <p className="text-xs font-bold text-slate-500">
                Expected Bookings
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  8,450
                </span>
                <span className="text-xs font-extrabold text-emerald-600">
                  +14% vs Current
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-1">
              <p className="text-xs font-bold text-slate-500">
                Expected New Users
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  1,240
                </span>
                <span className="text-xs font-extrabold text-emerald-600">
                  Targeted Growth
                </span>
              </div>
            </div>

            {/* AI Callout Box */}
            <div className="bg-[#f0f5ff] border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs font-semibold text-blue-900">
              <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                AI projections suggest optimal barber capacity for New York markets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

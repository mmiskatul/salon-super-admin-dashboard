"use client";

import React, { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  Download,
  RotateCw,
  Mail,
  MessageSquare,
  CreditCard,
  MapPin,
  Flame,
  Cloud,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function PlatformHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const infraCards = [
    { label: "API STATUS", val: "● 99.9%", statusClass: "text-emerald-600 font-black" },
    { label: "DATABASE", val: "● Online", statusClass: "text-emerald-600 font-black" },
    { label: "REDIS", val: "⚡ Active", statusClass: "text-blue-600 font-black" },
    { label: "STORAGE", val: "84% Used", progress: 84 },
    { label: "CDN", val: "94ms EDGE", statusClass: "text-slate-900 font-black" },
    { label: "CRON JOBS", val: "✓ Pass", statusClass: "text-emerald-600 font-black" },
    { label: "WORKERS", val: "12/12", statusClass: "text-slate-900 font-black" },
  ];

  const servicesList = [
    { name: "Email", status: "OPERATIONAL", variant: "green" as const, icon: Mail },
    { name: "SMS", status: "OPERATIONAL", variant: "green" as const, icon: MessageSquare },
    { name: "Stripe", status: "OPERATIONAL", variant: "green" as const, icon: CreditCard },
    { name: "Mapbox", status: "OPERATIONAL", variant: "green" as const, icon: MapPin },
    { name: "Firebase", status: "MAINTENANCE", variant: "blue" as const, icon: Flame },
    { name: "AWS", status: "OPERATIONAL", variant: "green" as const, icon: Cloud },
  ];

  const incidentHistory = [
    {
      time: "2023-11-20 14:02",
      component: "Edge Gateway",
      level: "CRITICAL",
      levelClass: "bg-rose-100 text-rose-700 border-rose-200",
      message: "Elevated 5xx rates in EU-West-1 clusters.",
      status: "RESOLVED",
    },
    {
      time: "2023-11-19 22:15",
      component: "Stripe Webhook",
      level: "WARNING",
      levelClass: "bg-blue-100 text-blue-700 border-blue-200",
      message: "Network delay impacting payment confirmation sync.",
      status: "RESOLVED",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6 lg:px-10 lg:py-8 space-y-8">
      {/* Refactored Header */}
      <DashboardHeader
        title="Platform Health"
        subtitle="Real-time infrastructure monitoring for Barber Pro"
        actions={
          <>
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-medium">LAST REFRESHED</span>
              <span className="font-bold text-slate-800">Today, 14:24:02 UTC</span>
              <button
                onClick={handleRefresh}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
              >
                <RotateCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>

            <button
              onClick={() => alert("Exporting system health metrics...")}
              className="flex items-center gap-2 rounded-xl bg-[#1e232a] hover:bg-slate-900 text-white px-5 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              <Download size={14} />
              <span>Export Metrics</span>
            </button>
          </>
        }
      />

      {/* Section 1: Infrastructure */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-tight">
          <Zap size={15} />
          <h2 className="text-sm uppercase tracking-wider text-slate-900 font-extrabold">
            Infrastructure
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {infraCards.map((c, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                {c.label}
              </span>

              {c.progress !== undefined ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-900">{c.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-[84%]" />
                  </div>
                </div>
              ) : (
                <span className={`text-base lg:text-lg font-black ${c.statusClass}`}>
                  {c.val}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Performance Metrics + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-tight">
            <Zap size={15} />
            <h2 className="text-sm uppercase tracking-wider text-slate-900 font-extrabold">
              Performance Metrics
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-3">
                <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  AVG RESPONSE TIME
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">242</span>
                  <span className="text-xs font-bold text-slate-500">ms</span>
                </div>
                <div className="h-16 w-full bg-slate-50 rounded-xl p-2 flex items-end justify-between gap-1 overflow-hidden">
                  {[40, 60, 85, 55, 45, 95].map((h, idx) => (
                    <div key={idx} style={{ height: `${h}%` }} className="w-full bg-blue-600 rounded-xs opacity-90" />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-3">
                <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  AVG API TIME
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">118</span>
                  <span className="text-xs font-bold text-slate-500">ms</span>
                </div>
                <div className="h-16 w-full bg-slate-50 rounded-xl p-2 flex items-end justify-between gap-1 overflow-hidden">
                  {[35, 45, 55, 80, 50, 60].map((h, idx) => (
                    <div key={idx} style={{ height: `${h}%` }} className="w-full bg-blue-400 rounded-xs opacity-80" />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    QUEUE STATUS
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-emerald-600">0</span>
                    <span className="text-xs font-bold text-emerald-600">PENDING</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Active Threads</span>
                    <span className="text-slate-900">42</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">CPU USAGE</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">64%</p>
                </div>
                <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-slate-100 flex items-center justify-center" />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">RAM USAGE</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">42%</p>
                </div>
                <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-slate-100 flex items-center justify-center" />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">DISK USAGE</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">84%</p>
                </div>
                <div className="h-12 w-12 rounded-full border-4 border-rose-500 border-t-slate-100 flex items-center justify-center" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <h2 className="text-sm uppercase tracking-wider text-slate-900 font-extrabold">Services</h2>
            <span className="text-[10px] uppercase font-bold text-slate-400">HEALTH</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              {servicesList.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100/60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{s.name}</span>
                    </div>

                    <StatusBadge status={s.status} variant={s.variant} />
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] italic font-medium text-blue-900 leading-relaxed">
                Total system availability is currently exceeding SLA targets for Q4 2023.
              </p>
              <div className="flex items-center justify-between border-t border-blue-100/80 pt-2">
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">GLOBAL UPTIME</span>
                <span className="text-xl font-black text-blue-700">99.998%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Incident History */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Incident History</h3>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md">
              LAST 30 DAYS
            </span>
          </div>

          <div className="bg-[#1e232a] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2.5">
            <RotateCw size={14} className="text-emerald-400" />
            <div>
              <p className="font-bold leading-none text-xs">System Health Synchronized</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Barber Pro clusters reporting healthy across all nodes.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">TIME (UTC)</th>
                <th className="py-2.5 px-3">COMPONENT</th>
                <th className="py-2.5 px-3">LEVEL</th>
                <th className="py-2.5 px-3">MESSAGE</th>
                <th className="py-2.5 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incidentHistory.map((inc, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">{inc.time}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{inc.component}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${inc.levelClass}`}>
                      {inc.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">{inc.message}</td>
                  <td className="py-3.5 px-3 text-right font-bold text-emerald-600">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

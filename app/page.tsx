"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  RotateCw,
  TrendingUp,
  BarChart3,
  CreditCard,
  Radio,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";

export default function DashboardHubPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const navCards = [
    {
      id: "overview",
      title: "Dashboard Overview",
      icon: TrendingUp,
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      accentBg: "from-blue-50/50 to-transparent",
      graphic: (
        <svg className="w-16 h-16 text-blue-100/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-4-4-3 3" />
        </svg>
      ),
      description:
        "View real-time platform statistics, today's activities, booking summary, revenue summary, pending approvals, and system alerts.",
      buttonText: "Open Dashboard Overview →",
      href: "/admin/dashboard/overview",
    },
    {
      id: "executive",
      title: "Executive Dashboard",
      icon: BarChart3,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accentBg: "from-emerald-50/50 to-transparent",
      graphic: (
        <svg className="w-16 h-16 text-emerald-100/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
      ),
      description:
        "Designed for CEO / Founder. High-level business intelligence, growth metrics, and business forecasts.",
      buttonText: "View Executive Dashboard →",
      href: "/admin/dashboard/executive",
    },
    {
      id: "revenue",
      title: "Revenue Dashboard",
      icon: CreditCard,
      iconBg: "bg-purple-50 text-purple-600 border-purple-100",
      accentBg: "from-purple-50/50 to-transparent",
      graphic: (
        <svg className="w-16 h-16 text-purple-100/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
      description:
        "Comprehensive financial tracking including Taxes, Commission, Refunds, and Profit analysis.",
      buttonText: "View Revenue Dashboard →",
      href: "/admin/dashboard/revenue",
    },
    {
      id: "live",
      title: "Live Monitoring",
      icon: Radio,
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      isLive: true,
      hasLeftBorder: true,
      accentBg: "from-rose-50/50 to-transparent",
      graphic: (
        <svg className="w-16 h-16 text-rose-100/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      description:
        "Real-time command center for new customers, bookings, and system errors. Refreshes every 5 seconds.",
      buttonText: "Open Live Monitor →",
      href: "/admin/dashboard/live-monitoring",
    },
    {
      id: "health",
      title: "Platform Health",
      icon: ShieldCheck,
      iconBg: "bg-teal-50 text-teal-600 border-teal-100",
      accentBg: "from-teal-50/50 to-transparent",
      graphic: (
        <svg className="w-16 h-16 text-teal-100/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect width="18" height="8" x="3" y="3" rx="2" />
          <rect width="18" height="8" x="3" y="13" rx="2" />
        </svg>
      ),
      description:
        "Infrastructure status for CPU, RAM, Database, Redis, and API response times.",
      buttonText: "Check System Health →",
      href: "/admin/dashboard/platform-health",
    },
    {
      id: "actions",
      title: "Quick Actions",
      icon: Zap,
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      accentBg: "from-amber-50/50 to-transparent",
      graphic: (
        <svg className="w-16 h-16 text-amber-100/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      description:
        "One-click shortcuts for approvals, coupons, notifications, and system backups.",
      buttonText: "View Quick Actions →",
      href: "/admin/dashboard/quick-actions",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-8 lg:px-10 lg:py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Welcome back, Super Admin. Monitor your entire Barber Pro platform from one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => alert("Generating full executive summary report...")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <RotateCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh Global Data</span>
          </button>
        </div>
      </div>

      {/* 6 Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                card.hasLeftBorder ? "border-l-4 border-l-rose-500" : ""
              }`}
            >
              {/* Card Header & Graphic */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center border ${card.iconBg} shadow-2xs`}
                    >
                      <Icon size={22} />
                    </div>
                    {card.isLive && (
                      <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  {/* Subtle Graphic background */}
                  <div className="absolute top-3 right-3 opacity-40 group-hover:opacity-80 transition-opacity">
                    {card.graphic}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Bottom Link Button */}
              <div className="pt-6 mt-4 border-t border-slate-50">
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:gap-2.5 transition-all cursor-pointer"
                >
                  <span>{card.buttonText}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#f0f5ff]/80 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            ACTIVE SESSIONS
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">1,284</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp size={13} /> +12.5% vs LW
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#f0f5ff]/80 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            PROCESSING VOLUME
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">$42,850</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> Target Reached
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#f0f5ff]/80 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            SYSTEM UPTIME
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">99.98%</span>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Clock size={13} /> Last 30 Days
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#f0f5ff]/80 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            PENDING ALERTS
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">3</span>
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertTriangle size={13} /> Action Required
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
        <p>© 2024 Barber Pro Executive Management System. All Rights Reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Security Audit</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </main>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KpiCard from "@/components/dashboard/KpiCard";
import {
  Download,
  RotateCw,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Store,
  UserPlus,
  Send,
  BarChart3,
  Users,
  CreditCard,
  Server,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const topKpis = [
    { label: "TODAY'S REVENUE", val: "$4,280" },
    { label: "MONTHLY REVENUE", val: "$124,500" },
    { label: "YEARLY REVENUE", val: "$1.4M" },
    { label: "TODAY'S BOOKINGS", val: "312" },
    { label: "ACTIVE SHOPS", val: "1,204" },
    { label: "ACTIVE CUSTOMERS", val: "42,890" },
    { label: "ACTIVE BARBERS", val: "2,856" },
    { label: "PENDING APPROVALS", val: "14", textClass: "text-rose-600" },
    { label: "PENDING WITHDRAWALS", val: "8", textClass: "text-emerald-600" },
    { label: "PENDING TICKETS", val: "21" },
    { label: "NEW USERS TODAY", val: "85" },
    { label: "ONLINE USERS", val: "1,042 ●" },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6 lg:px-8 lg:py-8 space-y-6">
      {/* Refactored Header */}
      <DashboardHeader
        title="Dashboard Overview"
        subtitle="Real-time health and performance metrics for the Barber Pro platform."
        actions={
          <>
            <button
              onClick={() => alert("Exporting summary...")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Export Summary</span>
            </button>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>Refresh Data</span>
            </button>
          </>
        }
      />

      {/* 12 Top KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {topKpis.map((kpi, idx) => (
          <KpiCard
            key={idx}
            label={kpi.label}
            value={kpi.val}
            textClass={kpi.textClass}
          />
        ))}
      </div>

      {/* 6 Trend Charts Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { title: "Revenue Trend", bg: "bg-blue-400", bars: [35, 60, 45, 90] },
          { title: "Booking Trend", bg: "bg-slate-700", bars: [50, 70, 60, 85] },
          { title: "User Growth", bg: "bg-emerald-600", bars: [30, 50, 70, 95] },
          { title: "Shop Growth", bg: "bg-blue-600", bars: [40, 65, 55, 75] },
          { title: "Barber Growth", bg: "bg-slate-600", bars: [45, 60, 75, 90] },
          { title: "Commission Trend", bg: "bg-emerald-700", bars: [65, 80, 50, 85] },
        ].map((c) => (
          <div key={c.title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
            <div className="h-32 bg-slate-50/80 rounded-xl p-3 flex items-end justify-between gap-2 overflow-hidden border border-slate-100">
              {c.bars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-full ${c.bg} rounded-t-md opacity-90`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 5 Vertical Data Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Latest Bookings */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">LATEST BOOKINGS</span>
          <div className="space-y-3 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Premium Cut</p>
              <p className="text-[11px] font-medium text-slate-400">Alex J. • 12:30 PM</p>
            </div>
            <div className="space-y-0.5 pt-1 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-900">Beard Trim</p>
              <p className="text-[11px] font-medium text-slate-400">Sam K. • 1:00 PM</p>
            </div>
          </div>
        </div>

        {/* Latest Registrations */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">LATEST REGISTRATIONS</span>
          <div className="space-y-3 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">The Groom Room</p>
              <p className="text-[11px] font-medium text-slate-400">Shop • 10m ago</p>
            </div>
            <div className="space-y-0.5 pt-1 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-900">Marco Polo</p>
              <p className="text-[11px] font-medium text-slate-400">Barber • 25m ago</p>
            </div>
          </div>
        </div>

        {/* Latest Reviews */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">LATEST REVIEWS</span>
          <div className="space-y-2 pt-1">
            <div className="flex text-emerald-500 text-xs">★★★★★</div>
            <p className="text-xs italic font-medium text-slate-700">&quot;Best fade in the city!&quot;</p>
          </div>
        </div>

        {/* Latest Refunds */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">LATEST REFUNDS</span>
          <div className="space-y-0.5 pt-1">
            <p className="text-sm font-black text-rose-600">-$25.00</p>
            <p className="text-[11px] font-medium text-slate-400">Booking #9921</p>
          </div>
        </div>

        {/* Latest Withdrawals */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">LATEST WITHDRAWALS</span>
          <div className="space-y-0.5 pt-1">
            <p className="text-sm font-black text-emerald-600">$1,200.00</p>
            <p className="text-[11px] font-medium text-slate-400">Elite Cuts • 2h ago</p>
          </div>
        </div>
      </div>

      {/* System Alerts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">FAILED PAYMENTS</p>
            <p className="text-xl font-black text-rose-600 mt-1">03</p>
          </div>
          <CreditCard size={18} className="text-rose-500" />
        </div>

        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">SERVER ERRORS</p>
            <p className="text-xl font-black text-rose-600 mt-1">0</p>
          </div>
          <Server size={18} className="text-rose-500" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">EXPIRED MEMBERSHIPS</p>
            <p className="text-xl font-black text-slate-800 mt-1">12</p>
          </div>
          <Calendar size={18} className="text-slate-400" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">INACTIVE SHOPS</p>
            <p className="text-xl font-black text-slate-800 mt-1">4</p>
          </div>
          <Store size={18} className="text-slate-400" />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">FLAGGED REVIEWS</p>
            <p className="text-xl font-black text-slate-800 mt-1">2</p>
          </div>
          <AlertTriangle size={18} className="text-slate-400" />
        </div>
      </div>

      {/* Bottom Section: Recent Activities & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Recent Activities</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100/60">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Shop Approved: &quot;The Royal Blade&quot;</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Verified by Alex Mercer • 2h ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100/60">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Booking Created: #B-2910</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Customer: Marcus V. • 3h ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100/60">
              <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Suspicious Activity Detected</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Multiple failed login attempts from IP 192.x.x.x • 5h ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Quick Shortcuts</h3>
          <div className="space-y-2">
            {[
              { label: "Create Shop", icon: Store, href: "/admin/dashboard/quick-actions" },
              { label: "Create Admin", icon: UserPlus, href: "/admin/dashboard/quick-actions" },
              { label: "Send Notification", icon: Send, href: "/admin/dashboard/quick-actions" },
              { label: "View Reports", icon: BarChart3, href: "/admin/dashboard/overview" },
              { label: "View Users", icon: Users, href: "/admin/dashboard/overview" },
            ].map((sc) => {
              const Icon = sc.icon;
              return (
                <Link
                  key={sc.label}
                  href={sc.href}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f4f6fb] hover:bg-blue-50 hover:text-blue-600 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-slate-400" />
                    <span>{sc.label}</span>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

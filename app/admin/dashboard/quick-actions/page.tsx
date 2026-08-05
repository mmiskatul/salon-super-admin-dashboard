"use client";

import React, { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  Store,
  UserCheck,
  UserX,
  BarChart3,
  Ticket,
  Megaphone,
  Download,
  Database,
  RotateCw,
  Wrench,
  ChevronRight,
  Headphones,
  CheckCircle2,
} from "lucide-react";

export default function QuickActionsPage() {
  const [maintMode, setMaintMode] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = (title: string) => {
    setLastAction(title);
    setTimeout(() => {
      setLastAction(null);
    }, 3000);
  };

  const actionCards = [
    {
      title: "Approve Shops",
      desc: "Review and verify new barbershop registrations.",
      icon: Store,
      iconBg: "bg-[#eef2ff] text-[#5c59f0]",
    },
    {
      title: "Approve Barbers",
      desc: "Validate professional barber profile applications.",
      icon: UserCheck,
      iconBg: "bg-[#e6f4ea] text-[#137333]",
    },
    {
      title: "Suspend User",
      desc: "Restrict account access for policy violations.",
      icon: UserX,
      iconBg: "bg-[#fce8e6] text-[#c5221f]",
    },
    {
      title: "Generate Report",
      desc: "Compile latest performance and financial stats.",
      icon: BarChart3,
      iconBg: "bg-[#eef2ff] text-[#5c59f0]",
    },
    {
      title: "Create Coupon",
      desc: "Issue new discount codes and promos.",
      icon: Ticket,
      iconBg: "bg-[#f3e8ff] text-[#9333ea]",
    },
    {
      title: "Broadcast",
      desc: "Send push alerts to all platform users.",
      icon: Megaphone,
      iconBg: "bg-[#eef2ff] text-[#5c59f0]",
    },
    {
      title: "Export Data",
      desc: "Download system datasets in CSV/JSON.",
      icon: Download,
      iconBg: "bg-[#eef2ff] text-[#5c59f0]",
    },
    {
      title: "Backup DB",
      desc: "Trigger a manual cloud storage snapshot.",
      icon: Database,
      iconBg: "bg-[#e6f4ea] text-[#137333]",
    },
    {
      title: "Restart Queue",
      desc: "Clear and reboot background task workers.",
      icon: RotateCw,
      iconBg: "bg-[#eef2ff] text-[#5c59f0]",
    },
  ];

  const recentLogs = [
    {
      title: "Shop Approved: \"Gentleman's Cut\"",
      sub: "Admin #102 • 4 mins ago",
      dotColor: "bg-[#5c59f0]",
    },
    {
      title: "Database Backup Completed",
      sub: "System Automated • 45 mins ago",
      dotColor: "bg-slate-400",
    },
    {
      title: "User Suspended: #U-9921",
      sub: "Admin #001 • 2 hours ago",
      dotColor: "bg-[#c5221f]",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6 lg:px-10 lg:py-8 space-y-8 relative">
      {/* Refactored Header */}
      <DashboardHeader
        title="Quick Actions"
        subtitle="One-click operations for rapid system management."
        actions={
          <>
            <button
              onClick={() => alert("Opening operation audit logs...")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>View Logs</span>
            </button>

            <button
              onClick={() => alert("Locking system access...")}
              className="flex items-center gap-2 rounded-xl bg-[#ef4444] hover:bg-rose-600 text-white px-5 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              <span>Lock System</span>
            </button>
          </>
        }
      />

      {/* Action Notification Toast */}
      {lastAction && (
        <div className="bg-[#5c59f0] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={18} />
          <span>Executed operation: {lastAction}</span>
        </div>
      )}

      {/* 10 Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actionCards.map((ac) => {
          const Icon = ac.icon;
          return (
            <div
              key={ac.title}
              onClick={() => handleAction(ac.title)}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-2xs hover:shadow-md transition-all duration-200 space-y-4 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ac.iconBg} shadow-2xs`}>
                  <Icon size={18} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#5c59f0] transition-colors">
                    {ac.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">{ac.desc}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Maintenance Mode Card */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#fce8e6] text-[#c5221f] shadow-2xs">
                <Wrench size={18} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMaintMode(!maintMode);
                }}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  maintMode ? "bg-[#5c59f0] justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-2xs" />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Maint. Mode</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">Restrict public access for updates.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Recent Operations Log</h3>
            <button className="text-xs font-bold text-[#5c59f0] hover:underline cursor-pointer">Full Audit Trail</button>
          </div>

          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${log.dotColor}`} />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#5c59f0] transition-colors">{log.title}</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{log.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-[#5c59f0] transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0052cc] text-white rounded-2xl p-6 shadow-md space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white tracking-tight">Health Check</h3>
            <p className="text-xs font-medium text-blue-100">Uptime: 99.98%</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">PENDING APPROVALS</p>
              <p className="text-4xl font-black text-white mt-1">28</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">QUEUED TASKS</p>
              <p className="text-4xl font-black text-white mt-1">104</p>
            </div>
          </div>

          <button
            onClick={() => alert("Running full system diagnostic...")}
            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all shadow-2xs backdrop-blur-xs cursor-pointer active:scale-98"
          >
            System Diagnostic
          </button>
        </div>
      </div>

      <button className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#0052cc] hover:bg-blue-700 text-white flex items-center justify-center shadow-xl border-2 border-white/20 z-50 cursor-pointer">
        <Headphones size={20} />
      </button>
    </main>
  );
}

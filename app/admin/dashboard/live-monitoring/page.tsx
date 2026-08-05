"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Shield,
  Star,
  RotateCcw,
  AlertCircle,
  CreditCard,
  UserPlus,
  Terminal,
} from "lucide-react";

export default function LiveMonitoringPage() {
  const [mapFilter, setMapFilter] = useState<"bookings" | "shops" | "barbers">("bookings");

  const [logs, setLogs] = useState([
    { id: 1, type: "REVIEW", icon: Star, color: "text-slate-300", msg: "Barber_Mike > Status 200 OK", time: "23:52:51" },
    { id: 2, type: "REFUND", icon: RotateCcw, color: "text-rose-400", msg: "Guest_092 > Payload size: 1.2KB", time: "23:52:52" },
    { id: 3, type: "ERROR", icon: AlertCircle, color: "text-rose-400", msg: "Shop_Alpha > Payload size: 1.2KB", time: "23:52:52" },
    { id: 4, type: "REVIEW", icon: Star, color: "text-slate-300", msg: "Shop_Alpha > Booking confirmed #8271", time: "23:52:52" },
    { id: 5, type: "ERROR", icon: AlertCircle, color: "text-rose-400", msg: "Shop_Alpha > Payload size: 1.2KB", time: "23:52:52" },
    { id: 6, type: "ERROR", icon: AlertCircle, color: "text-rose-400", msg: "Guest_092 > Booking confirmed #8271", time: "23:52:52" },
    { id: 7, type: "PAYMENT", icon: CreditCard, color: "text-blue-400", msg: "Admin_Root > Route matched: /api/v1/auth", time: "23:52:52" },
    { id: 8, type: "PAYMENT", icon: CreditCard, color: "text-blue-400", msg: "User_X88 > Booking confirmed #8271", time: "23:52:52" },
    { id: 9, type: "NEW_USER", icon: UserPlus, color: "text-blue-400", msg: "Admin_Root > Status 200 OK", time: "23:52:52" },
    { id: 10, type: "REVIEW", icon: Star, color: "text-slate-300", msg: "User_231 > Status 200 OK", time: "23:52:52" },
    { id: 11, type: "REVIEW", icon: Star, color: "text-slate-300", msg: "Admin_Root > Payload size: 1.2KB", time: "23:52:52" },
  ]);

  // Simulate real-time live event streaming
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ["REVIEW", "PAYMENT", "NEW_USER", "REFUND", "ERROR"];
      const randType = types[Math.floor(Math.random() * types.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      let icon = Star;
      let color = "text-slate-300";
      let msg = "User_771 > Status 200 OK";

      if (randType === "REFUND" || randType === "ERROR") {
        icon = AlertCircle;
        color = "text-rose-400";
        msg = `System_Event > Payload size: ${(Math.random() * 2).toFixed(1)}KB`;
      } else if (randType === "PAYMENT") {
        icon = CreditCard;
        color = "text-blue-400";
        msg = `Booking_${Math.floor(Math.random() * 9000 + 1000)} > Payment verified`;
      } else if (randType === "NEW_USER") {
        icon = UserPlus;
        color = "text-emerald-400";
        msg = `User_${Math.floor(Math.random() * 500 + 100)} > Registered`;
      }

      const newEntry = {
        id: Date.now(),
        type: randType,
        icon,
        color,
        msg,
        time: timeStr,
      };

      setLogs((prev) => [newEntry, ...prev.slice(0, 14)]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] flex flex-col justify-between">
      {/* Top Banner: Dark Mono Metric Bar */}
      <div className="bg-[#0f1914] text-emerald-400 font-mono text-[11px] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-950/60 shadow-2xs">
        <div className="flex items-center gap-6">
          <span>
            SYSTEM_UPTIME: <strong className="text-white">1428:12:04</strong>
          </span>
          <span>
            NETWORK_LATENCY: <strong className="text-white">12ms</strong>
          </span>
          <span>
            DATA_RATE: <strong className="text-white">4.2GB/s</strong>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span>
            CRITICAL_ERRORS: <strong className="text-rose-500">0</strong>
          </span>
          <span>
            SECURITY_STANCE: <strong className="text-emerald-400">DEFENSIVE</strong>
          </span>
        </div>
      </div>

      {/* Main Page Body */}
      <div className="p-6 lg:p-8 space-y-6 flex-1">
        {/* Header Title & Back Link */}
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard Hub
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                Live Monitoring
              </h1>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Server: US-EAST-1 (Active)
              </span>
            </div>

            <button
              onClick={() => alert("Launching Terminal Console...")}
              className="flex items-center gap-2 rounded-xl bg-[#181c24] hover:bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Terminal size={14} />
              <span>Console Access</span>
            </button>
          </div>
        </div>

        {/* 2 Columns Grid: Left Col-8, Right Col-4 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Col-8): Global Map & API Status */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Global Activity Map Card */}
            <div className="bg-[#12161f] rounded-2xl border border-slate-800 text-white p-6 shadow-xl space-y-6 relative overflow-hidden">
              {/* Map Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>🌐</span> GLOBAL ACTIVITY MAP
                </span>

                {/* Filter Buttons */}
                <div className="flex gap-2 text-[10px] font-mono font-bold">
                  <button
                    onClick={() => setMapFilter("bookings")}
                    className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                      mapFilter === "bookings"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    LIVE_BOOKINGS
                  </button>
                  <button
                    onClick={() => setMapFilter("shops")}
                    className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                      mapFilter === "shops"
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    ACTIVE_SHOPS
                  </button>
                  <button
                    onClick={() => setMapFilter("barbers")}
                    className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                      mapFilter === "barbers"
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    ACTIVE_BARBERS
                  </button>
                </div>
              </div>

              {/* Simulated Dark Canvas World Map */}
              <div className="h-64 w-full bg-[#181d29] rounded-xl relative border border-slate-800/80 p-4 overflow-hidden flex items-center justify-center">
                {/* SVG World Map Outline background */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Pulsing Map Nodes */}
                <div className="absolute top-[28%] left-[24%] flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-blue-500/40 animate-ping absolute" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 relative shadow-lg shadow-blue-500" />
                </div>

                <div className="absolute top-[45%] left-[30%] flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-emerald-500/40 animate-ping absolute" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 relative shadow-lg shadow-emerald-400" />
                </div>

                <div className="absolute top-[35%] left-[52%] flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-emerald-500/40 animate-ping absolute" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 relative shadow-lg shadow-emerald-400" />
                </div>

                <div className="absolute top-[22%] left-[62%] flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-blue-500/40 animate-ping absolute" />
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 relative shadow-lg shadow-blue-500" />
                </div>

                <div className="absolute top-[68%] left-[78%] flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-purple-500/40 animate-ping absolute" />
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400 relative shadow-lg shadow-purple-400" />
                </div>
              </div>

              {/* Bottom Metric Overlay Banner */}
              <div className="bg-[#181d29]/90 border border-slate-800 rounded-xl p-3.5 grid grid-cols-3 gap-4 text-center font-mono">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">ACTIVE BOOKINGS</p>
                  <p className="text-xl font-black text-white mt-0.5">1,243</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">ACTIVE SHOPS</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">342</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">ACTIVE BARBERS</p>
                  <p className="text-xl font-black text-white mt-0.5">894</p>
                </div>
              </div>
            </div>

            {/* 2. API Infrastructure Status Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">API Infrastructure Status</h3>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Errors
                  </span>
                </div>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Latency */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">LATENCY</p>
                  <p className="text-xl font-black text-slate-900">20ms</p>
                  <div className="h-10 w-full flex items-end justify-between gap-1 pt-1">
                    {[30, 45, 60, 40, 80, 95].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-500 rounded-2xs" />
                    ))}
                  </div>
                </div>

                {/* Throughput */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">THROUGHPUT</p>
                  <p className="text-xl font-black text-slate-900">11k/s</p>
                  <div className="h-10 w-full flex items-end justify-between gap-1 pt-1">
                    {[40, 50, 65, 80, 75, 90].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-emerald-500 rounded-2xs" />
                    ))}
                  </div>
                </div>

                {/* Errors */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">ERRORS</p>
                  <p className="text-xl font-black text-rose-500">0.02%</p>
                  <div className="h-10 w-full flex items-end justify-between gap-1 pt-1">
                    {[20, 30, 15, 45, 25, 35].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-rose-400 rounded-2xs" />
                    ))}
                  </div>
                </div>

                {/* Memory */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">MEMORY</p>
                  <p className="text-xl font-black text-slate-900">42.8GB</p>
                  <div className="h-10 w-full flex items-end justify-between gap-1 pt-1">
                    {[50, 55, 60, 50, 65, 70].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-slate-400 rounded-2xs" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Col-4): Entity Distribution & Live Event Stream */}
          <div className="lg:col-span-4 space-y-6">
            {/* Entity Distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Entity Distribution</h3>
                <Users size={18} className="text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">CUSTOMERS</p>
                  <p className="text-xl font-black text-slate-900">14.2k</p>
                  <div className="h-1 w-full bg-blue-600 rounded-full" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">BARBERS</p>
                  <p className="text-xl font-black text-slate-900">3.8k</p>
                  <div className="h-1 w-full bg-blue-600 rounded-full" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">SHOP OWNERS</p>
                  <p className="text-xl font-black text-slate-900">942</p>
                  <div className="h-1 w-full bg-slate-700 rounded-full" />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">ADMINS</p>
                  <p className="text-xl font-black text-slate-900">12</p>
                  <div className="h-1 w-full bg-slate-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Dark SYSTEM_EVENT_STREAM Console */}
            <div className="bg-[#181c24] text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
                  SYSTEM_EVENT_STREAM
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  LIVE_TX
                </span>
              </div>

              {/* Console Stream Logs */}
              <div className="h-80 overflow-y-auto space-y-2 pr-1 text-[11px] scrollbar-thin">
                {logs.map((log) => {
                  const Icon = log.icon;

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Icon size={12} className={log.color} />
                        <span className={`font-bold ${log.color}`}>{log.type}</span>
                        <span className="text-slate-300 truncate">{log.msg}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{log.time}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>BUFFER: 50 TX/S</span>
                <span className="text-emerald-400">STREAM ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

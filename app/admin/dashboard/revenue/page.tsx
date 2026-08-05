"use client";

import React from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KpiCard from "@/components/dashboard/KpiCard";
import { Download, Calendar, Star } from "lucide-react";
import Image from "next/image";

export default function RevenueDashboardPage() {
  const timeCards = [
    { label: "TODAY", val: "$14,582", change: "+5.2%", isDark: false },
    { label: "THIS WEEK", val: "$98,420", change: "+12.1%", isDark: false },
    { label: "THIS MONTH", val: "$412,850", change: "+8.4%", isDark: false },
    { label: "THIS YEAR", val: "$4,892,100", change: "+15.7%", isDark: false },
    { label: "LIFETIME", val: "$12.4M", change: "Since Jan 2022", isDark: true },
  ];

  const topShops = [
    { name: "Luxe Cut Studio", code: "LC", bg: "bg-blue-600", rating: "4.9", gross: "$42,500", growth: "+12%" },
    { name: "Blade & Brush", code: "BB", bg: "bg-blue-600", rating: "4.8", gross: "$38,120", growth: "+8%" },
    { name: "The Heritage Co.", code: "TH", bg: "bg-blue-600", rating: "4.7", gross: "$31,400", growth: "+5%" },
  ];

  const eliteBarbers = [
    { name: "Julian Rivera", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", rating: "5.0", net: "$14,200", services: "142" },
    { name: "Elena Petrova", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", rating: "4.9", net: "$12,850", services: "118" },
    { name: "Marcus King", code: "MK", bg: "bg-blue-600", rating: "4.9", net: "$11,400", services: "104" },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f8fafc] px-6 py-6 lg:px-10 lg:py-8 space-y-8">
      {/* Refactored Header */}
      <DashboardHeader
        category="EXECUTIVE INSIGHTS"
        title="Revenue Dashboard"
        actions={
          <>
            <button
              onClick={() => alert("Switching to real-time view...")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Calendar size={14} />
              <span>Real-time View</span>
            </button>

            <button
              onClick={() => alert("Exporting full financial statement...")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              <Download size={14} />
              <span>Export Statement</span>
            </button>
          </>
        }
      />

      {/* Time Horizons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {timeCards.map((c) => (
          <KpiCard
            key={c.label}
            label={c.label}
            value={c.val}
            change={c.change}
            subtext={c.isDark ? "Since Jan 2022" : undefined}
            isDark={c.isDark}
          />
        ))}
      </div>

      {/* Row 2: Daily Revenue Projection + Category & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Daily Revenue Projection</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Forecasted vs Actual revenue performance</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-700" /> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-200" /> Projected
              </span>
            </div>
          </div>

          <div className="h-44 w-full bg-slate-50/60 rounded-2xl p-4 flex flex-col justify-between border border-slate-100">
            <div className="h-28 w-full flex items-end justify-between gap-3 px-2">
              {[40, 55, 45, 75, 90, 80, 95].map((val, idx) => (
                <div key={idx} className="w-full flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    style={{ height: `${val}%` }}
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg group-hover:bg-blue-700 transition-all opacity-90"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 px-2 pt-2 border-t border-slate-200/60">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100/70">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-900">COMMISSION</p>
              <p className="text-sm font-black text-blue-700 mt-0.5">15% ($619K)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100/70">
              <p className="text-[9px] font-black uppercase tracking-wider text-rose-900">REFUND RATE</p>
              <p className="text-sm font-black text-rose-600 mt-0.5">1.2% ($4.9K)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">TOTAL TAX</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">$82.4K</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100/70">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-900">PLATFORM NET</p>
              <p className="text-sm font-black text-emerald-700 mt-0.5">$1.2M</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Service Revenue Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Haircut & Styling</span>
                  <span>$2.8M (58%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[58%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Beard Grooming</span>
                  <span>$1.1M (22%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[22%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Product Sales</span>
                  <span>$992K (20%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full w-[20%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Payment Processing</h3>
            <div className="space-y-2.5 text-xs font-bold">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Credit Card
                </span>
                <span className="text-slate-900 font-black">72%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Apple Pay
                </span>
                <span className="text-slate-900 font-black">18%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Others
                </span>
                <span className="text-slate-900 font-black">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Performing Shops + Elite Barbers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Top Performing Shops</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Ranked by gross platform revenue</p>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-2">SHOP NAME</th>
                  <th className="py-2.5 px-2">RATING</th>
                  <th className="py-2.5 px-2">GROSS REVENUE</th>
                  <th className="py-2.5 px-2 text-right">GROWTH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topShops.map((shop, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg ${shop.bg} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                          {shop.code}
                        </div>
                        <span className="font-bold text-slate-900">{shop.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-slate-800 font-bold">
                        <span>{shop.rating}</span>
                        <Star size={12} className="fill-slate-800 text-slate-800" />
                      </div>
                    </td>
                    <td className="py-3 px-2 font-black text-slate-900">{shop.gross}</td>
                    <td className="py-3 px-2 text-right font-black text-emerald-600">{shop.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Elite Barbers</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Top independent service providers</p>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-2">BARBER</th>
                  <th className="py-2.5 px-2">RATING</th>
                  <th className="py-2.5 px-2">NET EARN</th>
                  <th className="py-2.5 px-2 text-right">SERVICES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eliteBarbers.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        {b.avatar ? (
                          <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
                            <Image src={b.avatar} alt={b.name} width={32} height={32} className="object-cover h-full w-full" />
                          </div>
                        ) : (
                          <div className={`h-8 w-8 rounded-lg ${b.bg} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                            {b.code}
                          </div>
                        )}
                        <span className="font-bold text-slate-900">{b.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1 text-slate-800 font-bold">
                        <span>{b.rating}</span>
                        <Star size={12} className="fill-slate-800 text-slate-800" />
                      </div>
                    </td>
                    <td className="py-3 px-2 font-black text-blue-600">{b.net}</td>
                    <td className="py-3 px-2 text-right text-slate-600 font-bold">{b.services}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

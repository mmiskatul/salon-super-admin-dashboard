"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Scissors,
  Calendar,
  DollarSign,
  CreditCard,
  X,
  Plus,
  LineChart,
  Activity,
  Radio,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const [prevPath, setPrevPath] = useState(pathname);
  const [expandedItem, setExpandedItem] = useState<string | null>(() => {
    if (pathname.startsWith("/admin/dashboard") || pathname === "/") return "Dashboard";
    return null;
  });

  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (pathname.startsWith("/admin/dashboard") || pathname === "/") {
      setExpandedItem("Dashboard");
    }
  }

  const toggleExpand = (name: string) => {
    setExpandedItem((prev) => (prev === name ? null : name));
  };

  const dashboardSubItems = [
    { name: "Dashboard Overview", icon: LineChart, path: "/admin/dashboard/overview", id: "dash-overview" },
    { name: "Executive Dashboard", icon: Activity, path: "/admin/dashboard/executive", id: "dash-executive" },
    { name: "Revenue Dashboard", icon: CreditCard, path: "/admin/dashboard/revenue", id: "dash-revenue" },
    { name: "Live Monitoring", icon: Radio, path: "/admin/dashboard/live-monitoring", id: "dash-live" },
    { name: "Platform Health", icon: ShieldAlert, path: "/admin/dashboard/platform-health", id: "dash-health" },
    { name: "Quick Actions", icon: Zap, path: "/admin/dashboard/quick-actions", id: "dash-actions" },
  ];

  const managementItems = [
    { name: "User Management", icon: Users, path: "/admin/users" },
    { name: "Shop Management", icon: Store, path: "/admin/shops" },
    { name: "Barber Management", icon: Scissors, path: "/admin/barbers" },
    { name: "Booking Management", icon: Calendar, path: "/admin/bookings" },
  ];

  const financeItems = [
    { name: "Payments & Finance", icon: DollarSign, path: "/admin/revenue" },
    { name: "Withdrawals", icon: CreditCard, path: "/admin/withdrawals" },
  ];

  const isDashboardActive = pathname === "/" || pathname.startsWith("/admin/dashboard");

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 flex w-64 h-screen flex-col border-r border-slate-100 bg-white px-5 py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen shrink-0 justify-between
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col flex-1 overflow-hidden space-y-6">
          {/* Header Logo */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-extrabold text-[#1a2b4c] tracking-tight">Barber Pro</h2>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                SYSTEM ADMINISTRATOR
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* Dashboard Section */}
            <div className="space-y-1">
              <div
                onClick={() => toggleExpand("Dashboard")}
                className={`
                  flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer
                  ${
                    isDashboardActive
                      ? "bg-[#dbeafe] text-blue-600 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={16} className={isDashboardActive ? "text-blue-600" : "text-slate-400"} />
                  <Link href="/" className="hover:underline">
                    DASHBOARD
                  </Link>
                </div>
              </div>

              {/* Sub-navigation Items */}
              {(expandedItem === "Dashboard" || isDashboardActive) && (
                <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-100 ml-4 mt-1 animate-in fade-in duration-150">
                  {dashboardSubItems.map((subItem) => {
                    const isSubActive = pathname === subItem.path;
                    const SubIcon = subItem.icon;

                    return (
                      <Link
                        key={subItem.id}
                        href={subItem.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`
                          flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer
                          ${
                            isSubActive
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                          }
                        `}
                      >
                        <SubIcon size={13} className={isSubActive ? "text-white" : "text-slate-400"} />
                        <span className="truncate">{subItem.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Management Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                MANAGEMENT
              </span>
              <nav className="space-y-1 mt-1">
                {managementItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`
                        flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Finance Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                FINANCE
              </span>
              <nav className="space-y-1 mt-1">
                {financeItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`
                        flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-2xs font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="pt-4 border-t border-slate-100">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98">
            <Plus size={16} />
            <span>New Module</span>
          </button>
        </div>
      </aside>
    </>
  );
}

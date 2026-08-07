"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./header/Header";
import { SalonProvider, useSalon } from "@/context/SalonContext";
import { getSession } from "@/lib/api-client";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedSalon, setSelectedSalon } = useSalon();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-main">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          selectedSalon={selectedSalon}
          onSalonChange={setSelectedSalon}
        />
        {/* Children Page Views */}
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (isLoginRoute) return;
    if (!getSession()) {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [isLoginRoute, router]);

  // /login renders full-screen with no sidebar/header chrome.
  if (isLoginRoute) return <>{children}</>;

  // Avoid flashing dashboard content before the session check resolves.
  if (!checked) return null;

  return (
    <SalonProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SalonProvider>
  );
}

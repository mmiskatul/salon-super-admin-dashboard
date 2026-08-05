"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./header/Header";
import { SalonProvider, useSalon } from "@/context/SalonContext";

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
  return (
    <SalonProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SalonProvider>
  );
}

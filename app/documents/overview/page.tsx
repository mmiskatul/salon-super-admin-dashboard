"use client";

import React from "react";
import DashboardHeader from "@/components/common/PageHeader";

export default function DocumentsOverviewPage() {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8 space-y-6">
      <DashboardHeader
        title="Documents Overview"
        description="Centralized document storage and management."
      />
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-white">
        <p className="text-lg font-medium">Documents Overview Architecture Shell</p>
        <p className="text-sm mt-1">Page content area ready for integration.</p>
      </div>
    </main>
  );
}


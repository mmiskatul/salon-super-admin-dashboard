"use client";

import React from "react";
import DashboardHeader from "@/components/common/PageHeader";

export default function OwnerDocumentsPage() {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8 space-y-6">
      <DashboardHeader
        title="Owner Documents"
        description="Access and manage corporate documents, licenses, and ownership agreements."
      />
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-white">
        <p className="text-lg font-medium">Owner Documents Architecture Shell</p>
        <p className="text-sm mt-1">Page content area ready for integration.</p>
      </div>
    </main>
  );
}


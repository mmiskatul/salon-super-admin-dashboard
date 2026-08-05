"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

export default function NotificationsPage() {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <PageHeader
        title="Notifications"
        description="Review and manage your accountant compliance alerts, payroll approvals, and budget status."
      />
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-white">
        <p className="text-lg font-medium">Notifications Architecture Shell</p>
        <p className="text-sm mt-1">Notification list area ready for integration.</p>
      </div>
    </main>
  );
}


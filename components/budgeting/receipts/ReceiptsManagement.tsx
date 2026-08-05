import React, { useState } from "react";
import { Download } from "lucide-react";
import ReceiptsKPICards from "./ReceiptsKPICards";
import ReceiptsTable from "./ReceiptsTable";
import ReceiptDetailView from "./ReceiptDetailView";
import { ReceiptItem } from "./data";

export default function ReceiptsManagement() {
  const [activeView, setActiveView] = useState<"list" | "detail">("list");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);

  if (activeView === "detail" && selectedReceipt) {
    return (
      <ReceiptDetailView
        receipt={selectedReceipt}
        onBack={() => {
          setActiveView("list");
          setSelectedReceipt(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-lg font-black text-slate-800 tracking-tight text-left">
          Receipts
        </h1>
        <button className="flex items-center gap-2 bg-[#5c60f5] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#4c50e0] shadow-sm transition-colors cursor-pointer w-fit">
          <Download size={14} />
          <span>Export Receipts</span>
        </button>
      </div>

      {/* KPI metrics row */}
      <ReceiptsKPICards />

      {/* Table section list */}
      <ReceiptsTable
        onViewReceipt={(receipt) => {
          setSelectedReceipt(receipt);
          setActiveView("detail");
        }}
      />
    </div>
  );
}

import React, { useState } from "react";
import {
  LayoutGrid,
  List as ListIcon,
  Link as LinkIcon,
  AlertTriangle,
  Eye,
  Check,
  CheckCircle2,
  X,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { ExtractedSalary } from "./data";
import Image from "next/image";

interface SalaryUploadStep2Props {
  selectedSalon: string;
  salaries: ExtractedSalary[];
  setSalaries: React.Dispatch<React.SetStateAction<ExtractedSalary[]>>;
  setStep: (step: 1 | 2 | 3 | 4) => void;
}

export default function SalaryUploadStep2({
  salaries,
  setSalaries,
  setStep,
}: SalaryUploadStep2Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingPacket, setEditingPacket] = useState<ExtractedSalary | null>(
    null,
  );

  // Document preview controls and re-extraction state
  const [docPage, setDocPage] = useState(3);
  const [zoom, setZoom] = useState(120);
  const [isReextracting, setIsReextracting] = useState(false);

  // Split name for editing
  const getFirstAndLastName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ") || "";
    return { first, last };
  };

  const handleReextract = () => {
    setIsReextracting(true);
    setTimeout(() => {
      setIsReextracting(false);
      if (editingPacket) {
        setEditingPacket({
          ...editingPacket,
          employeeName: "Angelica Rodriguez",
          cf: "SLNLC87WBW88WJ",
          period: "07/2025",
          causale: "July 2025 Salary",
          confidence: 95,
          grossSalary: 887.42,
          deemed: 124.35,
          netSalary: 762,
          tfrMonthly: "",
          trfThisYear: 687.42,
          trfPrevYears: 4011.71,
          totalTfrAmount: "31/12/2024",
        });
      }
    }, 1000);
  };

  const totalCount = salaries.length;

  // Toggle selection for a single card
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Select all or deselect all
  const toggleSelectAll = () => {
    if (selectedIds.length === salaries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(salaries.map((s) => s.id));
    }
  };

  // Bulk approve selected packets
  const approveSelected = () => {
    setSalaries((prev) =>
      prev.map((s) =>
        selectedIds.includes(s.id) ? { ...s, status: "Approved" } : s,
      ),
    );
    setSelectedIds([]);
  };

  // Individual approve packet
  const approvePacket = (id: string) => {
    setSalaries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Approved" } : s)),
    );
  };

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm p-5">
      {/* 1. Extract status banner */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm">
        <div className="flex flex-col text-left">
          <p className="text-sm font-extrabold text-emerald-300 leading-tight">
            {totalCount} salary packets extracted from {totalCount} pages
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review and approve each packet before finalizing
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-black text-slate-800 block leading-none">
            {salaries.filter((s) => s.status === "Approved").length}/
            {totalCount}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 block mt-1 uppercase tracking-wider">
            Approved
          </span>
        </div>
      </div>

      {/* 2. List/Grid Action Bar */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 text-base sm:text-lg">
          Extracted Salary Packets ({totalCount})
        </h4>

        <div className="flex items-center gap-4">
          {/* Bulk Approve button (only visible when 1 or more are selected) */}
          {selectedIds.length > 0 && (
            <button
              onClick={approveSelected}
              className="bg-emerald-50 text-emerald-600 hover:bg-[#c3fae8]/80 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-emerald-100"
            >
              <Check size={14} />
              <span>Approve Selected ({selectedIds.length})</span>
            </button>
          )}

          {/* Selecte All Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={
                  selectedIds.length === salaries.length && salaries.length > 0
                }
                onChange={toggleSelectAll}
                className="sr-only"
              />
              <div
                className={`h-4.5 w-4.5 rounded-[5px] flex items-center justify-center transition-all ${
                  selectedIds.length === salaries.length && salaries.length > 0
                    ? "bg-brand text-white border-brand"
                    : "border border-slate-300 bg-white hover:border-slate-400"
                }`}
              >
                {selectedIds.length === salaries.length &&
                  salaries.length > 0 && (
                    <Check size={10} strokeWidth={4} className="text-white" />
                  )}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Selecte All
            </span>
          </label>

          {/* Grid/List toggles */}
          <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Packets Render (Grid or List View) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {salaries.map((packet) => {
            const isSelected = selectedIds.includes(packet.id);
            const isApproved = packet.status === "Approved";

            return (
              <div
                key={packet.id}
                className={`group rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 text-left flex flex-col justify-between ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/10 bg-brand/[0.005]"
                    : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <label className="relative flex items-center justify-center shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(packet.id)}
                          className="sr-only"
                        />
                        <div
                          className={`h-4.5 w-4.5 rounded-[5px] flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-brand text-white border-brand"
                              : "border border-slate-300 bg-white hover:border-slate-400"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              size={10}
                              strokeWidth={4}
                              className="text-white"
                            />
                          )}
                        </div>
                      </label>
                      {packet.avatar && (
                        <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                          <Image
                            width={40}
                            height={40}
                            src={packet.avatar}
                            alt={packet.employeeName}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-[14px] leading-tight truncate">
                          {packet.employeeName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                          1 page • {packet.period}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {packet.status}
                    </span>
                  </div>

                  {/* Packet details list */}
                  <div className="mt-4.5 divide-y divide-slate-50 border-t border-b border-slate-50 py-1">
                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Period</span>
                      <span className="text-slate-700 font-bold">
                        {packet.period}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">
                        Causale
                      </span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingPacket(packet);
                        }}
                        className="text-brand font-bold hover:underline flex items-center gap-1 min-w-0"
                      >
                        <span className="truncate max-w-[120px]">
                          {packet.causale}
                        </span>
                        <LinkIcon size={10} className="shrink-0" />
                      </a>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Net</span>
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                        € {packet.netSalary.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Deemed</span>
                      <span className="bg-rose-50 text-rose-500 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                        € {packet.deemed.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Gross</span>
                      <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                        € {packet.grossSalary.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">
                        TRF This Year
                      </span>
                      <span className="text-slate-700 font-bold">
                        € {packet.trfThisYear.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">
                        TRF al 31/12/24
                      </span>
                      <span className="text-slate-700 font-bold">
                        € {packet.trfPrevYears.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 text-xs">
                      <span className="text-slate-400 font-medium">CF</span>
                      <span className="text-slate-800 font-bold tracking-wider font-mono">
                        {packet.cf}
                      </span>
                    </div>
                  </div>

                  {/* Mapping Confidence Status */}
                  <div className="mt-3.5 flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-bold">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>Medium ({packet.confidence}%)</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {packet.mapped ? "Mapped" : "Unmapped"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[9px] text-slate-400 font-medium">
                    Vendor: {packet.vendor}
                  </p>

                  <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-slate-100">
                    <button
                      onClick={() => setEditingPacket(packet)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#5c60f5]/10 text-brand hover:bg-[#5c60f5]/20 font-bold text-xs py-2.5 transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Review</span>
                    </button>
                    <button
                      onClick={() => approvePacket(packet.id)}
                      disabled={isApproved}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs py-2.5 transition-colors cursor-pointer ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-500 cursor-default"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isApproved ? "Approved" : "Approve"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-4">
          {salaries.map((packet) => {
            const isSelected = selectedIds.includes(packet.id);
            const isApproved = packet.status === "Approved";

            return (
              <div
                key={packet.id}
                className={`group rounded-lg border bg-white p-5 shadow-sm transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/10 bg-brand/[0.005]"
                    : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                }`}
              >
                {/* 1. Checkbox + Avatar + Employee Details */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <label className="relative flex items-center justify-center shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(packet.id)}
                      className="sr-only"
                    />
                    <div
                      className={`h-5 w-5 rounded-[5px] flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-brand text-white border-brand"
                          : "border border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      {isSelected && (
                        <Check
                          size={12}
                          strokeWidth={4}
                          className="text-white"
                        />
                      )}
                    </div>
                  </label>
                  {packet.avatar && (
                    <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                      <Image
                        width={40}
                        height={40}
                        src={packet.avatar}
                        alt={packet.employeeName}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                      {packet.employeeName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-brand/80">
                      <span>1 page • {packet.period}</span>
                      <button
                        onClick={() => setEditingPacket(packet)}
                        className="text-brand hover:text-brand-dark p-0.5 cursor-pointer rounded hover:bg-brand/5"
                        title="Edit Period"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
                      CF:{" "}
                      <span className="font-mono font-bold text-slate-500 uppercase">
                        {packet.cf}
                      </span>
                    </p>
                  </div>
                </div>

                {/* 2. Columns Block (Gross, Net, TRF This Year, TRF Prev) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 flex-[2] min-w-0 text-left">
                  {/* Gross Column */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Gross
                    </span>
                    <div className="mt-1.5">
                      <span className="inline-block bg-[#eef2ff] text-brand font-black px-3 py-1 rounded-full text-xs">
                        € {packet.grossSalary.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Net Column */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Net
                    </span>
                    <div className="mt-1.5">
                      <span className="inline-block bg-[#ecfdf5] text-emerald-600 font-black px-3 py-1 rounded-full text-xs">
                        € {packet.netSalary.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* TRF This Year Column */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      TRF This Year
                    </span>
                    <p className="mt-2 text-xs font-black text-slate-800">
                      € {packet.trfThisYear.toFixed(2)}
                    </p>
                  </div>

                  {/* TRF al 31/12/24 Column */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      TRF al 31/12/24
                    </span>
                    <p className="mt-2 text-xs font-black text-slate-800">
                      € {packet.trfPrevYears.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 3. Status/Confidence Column */}
                <div className="flex flex-col justify-center min-w-[150px] text-left lg:text-center items-start lg:items-center">
                  <div className="flex flex-col gap-1 items-start lg:items-center">
                    {isApproved ? (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                        Approved
                      </span>
                    ) : (
                      <>
                        <span className="bg-yellow-50 text-yellow-300 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                          Review
                        </span>
                        <span className="text-xs font-bold text-yellow-300 mt-0.5">
                          Medium ({packet.confidence}%)
                        </span>
                      </>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {packet.vendor}
                    </span>
                  </div>
                </div>

                {/* 4. Action Buttons Column */}
                <div className="flex flex-row lg:flex-col gap-2 min-w-[120px] justify-end lg:justify-center">
                  <button
                    onClick={() => setEditingPacket(packet)}
                    className="flex-1 lg:flex-none flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#eef2ff] text-[#635BFF] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Review</span>
                    <Eye size={14} className="shrink-0" />
                  </button>

                  <button
                    onClick={() => approvePacket(packet.id)}
                    disabled={isApproved}
                    className={`flex-1 lg:flex-none flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isApproved
                        ? "bg-emerald-500/10 text-[#16CDC7] cursor-default"
                        : "bg-emerald-50 text-[#16CDC7] cursor-pointer"
                    }`}
                  >
                    <span>{isApproved ? "Approved" : "Approve"}</span>
                    <Check size={14} className="shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bottom action footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <button
          onClick={() => setStep(1)}
          className="flex items-center justify-center rounded-xl bg-[#5c60f5]/10 text-[#5c60f5] text-xs font-bold px-5 py-3.5 hover:bg-[#5c60f5]/20 transition-all cursor-pointer"
        >
          Upload Different File
        </button>

        <button
          onClick={() => setStep(3)}
          className="flex items-center justify-center rounded-xl bg-brand text-white text-xs font-bold px-6 py-3.5 hover:bg-brand-dark transition-all shadow-md shadow-brand/20 cursor-pointer"
        >
          Continue to Finalize
        </button>
      </div>

      {/* 5. Full-Screen Review Details Editor Modal */}
      {editingPacket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in">
            {/* Left Side: Document Viewer */}
            <div className="w-full md:w-[50%] flex flex-col border-r border-slate-100 bg-[#f8fafc] h-full">
              {/* Header Page Controls */}
              <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDocPage((prev) => Math.max(1, prev - 1))}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-600 w-12 text-center select-none">
                    {docPage} / 8
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocPage((prev) => Math.min(8, prev + 1))}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold text-slate-600 w-12 text-center select-none">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(200, prev + 10))}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Document Container */}
              <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
                <div
                  className="bg-white rounded-2xl shadow-md border border-slate-200/65 p-8 flex flex-col justify-between text-left transition-all origin-top w-full animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    transform: `scale(${zoom / 120})`,
                    maxWidth: "420px",
                    minHeight: "560px",
                  }}
                >
                  <div>
                    {/* Doc Header */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <h5 className="font-extrabold text-slate-800 text-sm tracking-tight">
                          Document Name
                        </h5>
                        <span className="text-[9px] font-semibold text-slate-400">
                          Page {docPage} of 8
                        </span>
                      </div>
                      {/* Your logo */}
                      <Image
                        src="/assets/icons/logo.svg"
                        alt="Logo"
                        width={140}
                        height={40}
                        className="h-6 w-auto object-contain"
                      />
                    </div>

                    {/* Doc Content */}
                    <div className="space-y-4.5 mt-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
                        <div key={idx} className="space-y-0.5">
                          <h6 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight">
                            What is Lorem Ipsum?
                          </h6>
                          <p className="text-[8px] text-slate-400 font-medium leading-relaxed">
                            Lorem Ipsum is simply dummy text of the printing and
                            typesetting industry. Lorem Ipsum has been the
                            industry standard dummy text ever since the 1500s,
                            when an unknown printer took a galley of type and
                            scrambled it to make a type specimen book. It has
                            survived not only five centuries, but also the leap
                            into electronic typesetting, remaining essentially
                            unchanged. It was popularised in the 1960s with the
                            release of Letraset sheets containing Lorem Ipsum
                            passages, and more recently with desktop publishing
                            software like Aldus PageMaker including versions of
                            Lorem Ipsum.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doc Footer */}
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[9px] font-semibold text-slate-400 mt-6">
                    <span>www.name.com</span>
                    <span>CONFIDENTIAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form details */}
            <div className="w-full md:w-[50%] flex flex-col bg-[#f8fafc] h-full">
              {/* Header Title */}
              <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-slate-100 bg-white">
                <span className="font-bold text-slate-800 text-sm">
                  Review and Edit Packet
                </span>
                <button
                  type="button"
                  onClick={() => setEditingPacket(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. Employee Information Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
                    Employee Information
                  </h4>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={
                        getFirstAndLastName(editingPacket.employeeName).first
                      }
                      onChange={(e) => {
                        const { last } = getFirstAndLastName(
                          editingPacket.employeeName,
                        );
                        setEditingPacket({
                          ...editingPacket,
                          employeeName: `${e.target.value} ${last}`.trim(),
                        });
                      }}
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={
                        getFirstAndLastName(editingPacket.employeeName).last
                      }
                      onChange={(e) => {
                        const { first } = getFirstAndLastName(
                          editingPacket.employeeName,
                        );
                        setEditingPacket({
                          ...editingPacket,
                          employeeName: `${first} ${e.target.value}`.trim(),
                        });
                      }}
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Tax Code
                      </label>
                      <span className="text-[11px] font-bold text-emerald-500">
                        {editingPacket.confidence}%
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={editingPacket.cf}
                      onChange={(e) =>
                        setEditingPacket({
                          ...editingPacket,
                          cf: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand uppercase font-mono"
                    />
                    <span className="block text-[10px] text-slate-400 font-medium mt-1">
                      Optional - For reference
                    </span>
                  </div>
                </div>

                {/* 2. Pay Period Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Pay Period
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Period (MM/YYYY)
                      </label>
                      <span className="text-[11px] font-bold text-emerald-500">
                        80%
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={editingPacket.period}
                      onChange={(e) =>
                        setEditingPacket({
                          ...editingPacket,
                          period: e.target.value,
                        })
                      }
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                    />
                  </div>
                </div>

                {/* 3. Payment Reason Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
                    Payment Reason
                  </h4>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Payment Reason
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPacket.causale}
                      onChange={(e) =>
                        setEditingPacket({
                          ...editingPacket,
                          causale: e.target.value,
                        })
                      }
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                    />
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Suggestions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "July 2025 Salary",
                        "TFR",
                        "July 2025 Salary + TRF",
                        "Thirteenth Month Pay",
                        "Fourteenth Month Pay",
                      ].map((suggestion) => {
                        const isActive = editingPacket.causale === suggestion;
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() =>
                              setEditingPacket({
                                ...editingPacket,
                                causale: suggestion,
                              })
                            }
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              isActive
                                ? "bg-brand/10 border-brand text-brand shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {suggestion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Financial Data Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
                    Financial Data
                  </h4>

                  <div className="space-y-4">
                    {/* Gross Amount */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Gross Amount (€)
                        </label>
                        <span className="text-[11px] font-bold text-[#f59e0b]">
                          75%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editingPacket.grossSalary}
                        onChange={(e) =>
                          setEditingPacket({
                            ...editingPacket,
                            grossSalary: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                      />
                    </div>

                    {/* Deductions */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Deductions (€)
                        </label>
                        <span className="text-[11px] font-bold text-[#10b981]">
                          90%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editingPacket.deemed}
                        onChange={(e) =>
                          setEditingPacket({
                            ...editingPacket,
                            deemed: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                      />
                    </div>

                    {/* Net Amount */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Net Amount (€)
                        </label>
                        <span className="text-[11px] font-bold text-[#10b981]">
                          99%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editingPacket.netSalary}
                        onChange={(e) =>
                          setEditingPacket({
                            ...editingPacket,
                            netSalary: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                      />
                    </div>

                    {/* TFR Monthly */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          TFR Monthly (€)
                        </label>
                        <span className="text-[11px] font-bold text-[#ef4444]">
                          10%
                        </span>
                      </div>
                      <input
                        type="text"
                        value={editingPacket.tfrMonthly || ""}
                        onChange={(e) =>
                          setEditingPacket({
                            ...editingPacket,
                            tfrMonthly: e.target.value,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                      />
                    </div>

                    {/* TFR This Year */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          TFR This Year (€)
                        </label>
                        <span className="text-[11px] font-bold text-[#f59e0b]">
                          71%
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        required
                        value={editingPacket.trfThisYear}
                        onChange={(e) =>
                          setEditingPacket({
                            ...editingPacket,
                            trfThisYear: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                      />
                    </div>

                    {/* Bottom Split: TRF al 31/12/xx and Total TFR Amount */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            TRF al 31/12/xx (€)
                          </label>
                          <span className="text-[11px] font-bold text-[#f59e0b] shrink-0 ml-1">
                            72%
                          </span>
                        </div>
                        <input
                          type="number"
                          required
                          value={editingPacket.trfPrevYears}
                          onChange={(e) =>
                            setEditingPacket({
                              ...editingPacket,
                              trfPrevYears: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">
                          Total TFR Amount
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPacket.totalTfrAmount || "31/12/2024"}
                          onChange={(e) =>
                            setEditingPacket({
                              ...editingPacket,
                              totalTfrAmount: e.target.value,
                            })
                          }
                          className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="h-16 shrink-0 flex items-center justify-between px-6 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setEditingPacket(null)}
                  className="border border-[#5c60f5] text-[#5c60f5] bg-white rounded-xl text-xs font-bold px-5 py-2.5 transition-all hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReextract}
                    disabled={isReextracting}
                    className="bg-[#eef2ff] text-[#5c60f5] hover:bg-[#e0e7ff] rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 border border-[#5c60f5]/10"
                  >
                    {isReextracting ? (
                      <>
                        <svg
                          className="animate-spin h-3.5 w-3.5 text-brand"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <span>Re-extract Data</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (editingPacket) {
                        setSalaries((prev) =>
                          prev.map((item) =>
                            item.id === editingPacket.id
                              ? { ...editingPacket, status: "Approved" }
                              : item,
                          ),
                        );
                        setEditingPacket(null);
                      }
                    }}
                    className="bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Save and Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

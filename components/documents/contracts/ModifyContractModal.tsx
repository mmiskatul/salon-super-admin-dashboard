"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { Contract } from "./data";
import CustomSelect from "@/components/common/CustomSelect";

interface ModifyContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedContract: Contract) => void;
  contract: Contract | null;
}

export default function ModifyContractModal({
  isOpen,
  onClose,
  onConfirm,
  contract,
}: ModifyContractModalProps) {
  const [startDate, setStartDate] = useState(contract?.startDate || "");
  const [endDate, setEndDate] = useState(contract?.endDate || "");
  const [type, setType] = useState<Contract["type"]>(contract?.type || "Full Time");
  const [status, setStatus] = useState<Contract["status"]>(contract?.status || "Active");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !contract) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && type && status) {
      onConfirm({
        ...contract,
        startDate,
        endDate,
        type,
        status,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Modify Contract</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Edit contract details for <span className="font-bold text-slate-700">{contract.employee.name}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contract Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Contract Type *</label>
            <CustomSelect
              value={type}
              options={["Full Time", "Part Time", "Vat collaboration", "Stage"]}
              onChange={(val) => setType(val as Contract["type"])}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Start Date *</label>
            <div className="relative">
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Jan 14, 2024"
                className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors pr-10"
                required
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">End Date *</label>
            <div className="relative">
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Dec 30, 2025"
                className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors pr-10"
                required
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Status *</label>
            <CustomSelect
              value={status}
              options={["Active", "Inactive", "Pending"]}
              onChange={(val) => setStatus(val as Contract["status"])}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

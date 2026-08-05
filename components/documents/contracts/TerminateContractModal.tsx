"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TerminateContractModal({ isOpen, onClose, onConfirm }: TerminateContractModalProps) {
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [removeAccessDate, setRemoveAccessDate] = useState("");

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endDate && reason && removeAccessDate) {
      onConfirm();
      onClose();
      // Reset
      setEndDate("");
      setReason("");
      setRemoveAccessDate("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Terminate Contract</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">Are you sure you want to terminate this contract?</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">End Date *</label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Enter end date"
              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason"
              className="w-full min-h-[100px] bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Remove Access To The Platform On *</label>
            <div className="relative">
              <input
                type="text"
                value={removeAccessDate}
                onChange={(e) => setRemoveAccessDate(e.target.value)}
                placeholder="Select date"
                className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors pr-10"
                required
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

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
              className="px-6 py-2.5 bg-[#ffe4e6] hover:bg-rose-200 text-[#e11d48] text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Terminate Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

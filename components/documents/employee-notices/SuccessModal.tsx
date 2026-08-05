"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  title = "Success!", 
  message = "Notice sent successfully." 
}: SuccessModalProps) {
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      <div className="relative w-full max-w-[320px] bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 text-center">
        <div className="mx-auto h-16 w-16 bg-[#eafff5] text-[#22c55e] rounded-full flex items-center justify-center mb-6">
          <Check size={32} strokeWidth={3} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 font-medium mb-8">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          Ok, close
        </button>
      </div>
    </div>
  );
}

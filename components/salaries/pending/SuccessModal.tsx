import React from "react";
import { Check } from "lucide-react";

interface SuccessModalProps {
  onClose: () => void;
}

export default function SuccessModal({ onClose }: SuccessModalProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-6">
        <Check size={32} strokeWidth={3} className="text-cyan-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Success!</h2>
      <p className="text-[13px] font-medium text-slate-400 mb-8">
        Record successfully deleted.
      </p>

      <button
        onClick={onClose}
        className="px-8 py-2.5 rounded-xl bg-[#5c7cfa] text-white text-[13px] font-bold shadow-md shadow-[#5c7cfa]/20 hover:bg-[#4b6bf5] transition-colors"
      >
        Ok, close
      </button>
    </div>
  );
}

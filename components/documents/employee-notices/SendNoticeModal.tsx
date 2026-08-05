"use client";

import React, { useState, useEffect } from "react";
import { X, Bold, Italic, Strikethrough, Code, Link, Heading1, Heading2, AlignLeft, List, ListOrdered, Quote, Minus, AlignCenter, AlignRight, Undo, Redo } from "lucide-react";
import CustomSelect from "@/components/common/CustomSelect";
import { employeeOptions } from "./data";

interface SendNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendNoticeModal({ isOpen, onClose, onSuccess }: SendNoticeModalProps) {
  const [employee, setEmployee] = useState("Select Employee");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
    if (employee !== "Select Employee" && title && description) {
      onClose();
      onSuccess();
      // Reset form
      setEmployee("Select Employee");
      setTitle("");
      setDescription("");
    }
  };

  const ToolbarBtn = ({ icon: Icon }: { icon: any }) => (
    <button type="button" className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer">
      <Icon size={14} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      <div className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Send Notice</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form id="sendNoticeForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Employee *</label>
              <CustomSelect
                value={employee}
                options={employeeOptions}
                onChange={setEmployee}
                placeholder="Select Employee"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter Title"
                className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors"
                required
              />
            </div>

            {/* Description (Mocked RTE) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Description *</label>
              <div className="border border-slate-200 rounded-lg focus-within:border-[#6366f1] overflow-hidden transition-colors">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
                    <ToolbarBtn icon={Bold} />
                    <ToolbarBtn icon={Italic} />
                    <ToolbarBtn icon={Strikethrough} />
                    <ToolbarBtn icon={Code} />
                    <ToolbarBtn icon={Link} />
                  </div>
                  <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                    <ToolbarBtn icon={Heading1} />
                    <ToolbarBtn icon={Heading2} />
                  </div>
                  <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                    <ToolbarBtn icon={AlignLeft} />
                    <ToolbarBtn icon={AlignCenter} />
                    <ToolbarBtn icon={AlignRight} />
                  </div>
                  <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                    <ToolbarBtn icon={List} />
                    <ToolbarBtn icon={ListOrdered} />
                  </div>
                  <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                    <ToolbarBtn icon={Quote} />
                    <ToolbarBtn icon={Minus} />
                  </div>
                  <div className="flex items-center gap-1 pl-2">
                    <ToolbarBtn icon={Undo} />
                    <ToolbarBtn icon={Redo} />
                  </div>
                </div>
                {/* Text Area */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[160px] p-4 text-sm font-medium text-slate-700 outline-none resize-y bg-white"
                  placeholder="Enter notice description..."
                  required
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            form="sendNoticeForm"
            className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Send Notice
          </button>
        </div>
      </div>
    </div>
  );
}

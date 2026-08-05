"use client";

import React, { useState } from "react";
import { X, Calendar, UploadCloud, AlertCircle, Eye, Download, FileText } from "lucide-react";
import Image from "next/image";
import { NewExpenseInput, ExpenseTransaction } from "./data";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewExpenseInput) => void;
}

export function AddExpenseModal({ isOpen, onClose, onSave }: AddExpenseModalProps) {
  const [cost, setCost] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [macroCategory, setMacroCategory] = useState("");
  const [category, setCategory] = useState("");
  const [warranty, setWarranty] = useState("None");
  const [location, setLocation] = useState("");
  const [payee, setPayee] = useState("");
  const [note, setNote] = useState("");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cost || !paymentMethod || !date || !macroCategory || !category) {
      alert("Please fill in all required fields marked with *");
      return;
    }
    onSave({
      cost: parseFloat(cost),
      paymentMethod,
      date: `${date} ${time || "12:00"}`,
      macroCategory,
      category,
      warranty,
      location,
      payee,
      note,
      hasAttachment: !!attachedFile,
      attachmentName: attachedFile || undefined,
    });
  };

  const handleFileChange = () => {
    // Mock file attachment
    setAttachedFile("uploaded_receipt.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[20px] shadow-2xl border border-slate-100 w-full max-w-[620px] overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800">Add Expense</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cost */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cost *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter cost"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand transition-colors"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold bg-white focus:outline-none focus:border-brand transition-colors cursor-pointer"
                required
              >
                <option value="" disabled>Select method</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Online Payment">Online Payment</option>
                <option value="Terminal">Terminal</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Date *</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
                <Calendar size={15} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Time *</label>
              <input
                type="text"
                placeholder="Enter time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            {/* Macro-categories */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Macro-categories *</label>
              <select
                value={macroCategory}
                onChange={(e) => setMacroCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold bg-white focus:outline-none focus:border-brand transition-colors cursor-pointer"
                required
              >
                <option value="" disabled>Select macro categories</option>
                <option value="Internet">Internet</option>
                <option value="HR">HR</option>
                <option value="Consumables">Consumables</option>
                <option value="Products">Products</option>
                <option value="Taxes">Taxes</option>
                <option value="Services">Services</option>
                <option value="Utilities">Utilities</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold bg-white focus:outline-none focus:border-brand transition-colors cursor-pointer"
                required
              >
                <option value="" disabled>Select category</option>
                <option value="Category 1">Category 1</option>
                <option value="Category 2">Category 2</option>
                <option value="Category 3">Category 3</option>
                <option value="Category 4">Category 4</option>
                <option value="Category 5">Category 5</option>
              </select>
            </div>

            {/* Warranty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Warranty *</label>
              <select
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold bg-white focus:outline-none focus:border-brand transition-colors cursor-pointer"
              >
                <option value="None">None</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Location *</label>
              <input
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          {/* Payee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payee *</label>
            <input
              type="text"
              placeholder="Enter payee"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Note</label>
            <textarea
              placeholder="Add a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand transition-colors resize-none"
            />
          </div>

          {/* Drag & Drop attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Attach receipts/invoices</label>
            <div
              onClick={handleFileChange}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-[#fbfbfe] rounded-2xl cursor-pointer transition-all gap-2 group"
            >
              <div className="h-11 w-11 rounded-full bg-[#f0f2ff] flex items-center justify-center text-brand shrink-0 group-hover:scale-105 transition-transform">
                <UploadCloud size={20} />
              </div>
              <span className="text-xs font-bold text-[#5c60f5] group-hover:text-[#4a4ed8] transition-colors">
                {attachedFile ? attachedFile : "Drop here or click to browse"}
              </span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-[#5c60f5] hover:bg-[#4d51e5] text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface BudgetExceededModalProps {
  isOpen: boolean;
  macroCategory: string;
  amountExceeded: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function BudgetExceededModal({
  isOpen,
  macroCategory,
  amountExceeded,
  onClose,
  onConfirm,
}: BudgetExceededModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[20px] shadow-2xl border border-slate-100 w-full max-w-[420px] overflow-hidden p-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center gap-5">
        
        {/* Red warning icon */}
        <div className="h-16 w-16 rounded-full bg-[#fff0f6] flex items-center justify-center text-kpi-pink-text shrink-0 mt-3 animate-bounce">
          <AlertCircle size={32} className="text-kpi-pink-text" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-slate-800">Budget exceeded!</h3>
          <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[280px]">
            Adding this expense will increase the &quot;{macroCategory}&quot; category budget by {amountExceeded}.
          </p>
          <p className="text-xs font-bold text-slate-400">Do you still want to continue?</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#5c60f5] hover:bg-[#4d51e5] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
}

interface AttachmentModalProps {
  isOpen: boolean;
  attachmentName: string | null;
  onClose: () => void;
  onAttach: (fileName: string) => void;
}

export function AttachmentModal({ isOpen, attachmentName, onClose, onAttach }: AttachmentModalProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(attachmentName);

  if (!isOpen) return null;

  const handleUpload = () => {
    onAttach(selectedFile || "uploaded_attachment.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[20px] shadow-2xl border border-slate-100 w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800">Attach receipts/invoices</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <label className="block text-xs font-bold text-slate-700">Attach files *</label>
          <div
            onClick={() => setSelectedFile("new_attached_receipt.pdf")}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-[#fbfbfe] rounded-2xl cursor-pointer transition-all gap-2 group"
          >
            <div className="h-11 w-11 rounded-full bg-[#f0f2ff] flex items-center justify-center text-brand shrink-0 group-hover:scale-105 transition-transform">
              <UploadCloud size={20} />
            </div>
            <span className="text-xs font-bold text-[#5c60f5] group-hover:text-[#4a4ed8] transition-colors">
              {selectedFile ? selectedFile : "Drop here or click to browse"}
            </span>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleUpload}
              className="bg-[#5c60f5] hover:bg-[#4d51e5] text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ViewExpenseModalProps {
  isOpen: boolean;
  expense: ExpenseTransaction | null;
  onClose: () => void;
  onViewAttachment: () => void;
  onDownloadAttachment: () => void;
}

export function ViewExpenseModal({
  isOpen,
  expense,
  onClose,
  onViewAttachment,
  onDownloadAttachment,
}: ViewExpenseModalProps) {
  if (!isOpen || !expense) return null;

  const getMacroCategoryBadge = (macro: string) => {
    switch (macro) {
      case "Internet":
        return "bg-[#ebfbee] text-[#2f9e44]";
      case "HR":
        return "bg-[#eef2ff] text-[#4f46e5]";
      case "Consumables":
        return "bg-[#e0f2fe] text-[#0369a1]";
      case "Products":
        return "bg-[#f3e8ff] text-[#7e22ce]";
      case "Taxes":
        return "bg-[#fff0f6] text-[#e64980]";
      case "Services":
        return "bg-[#fffbeb] text-[#d97706]";
      case "Utilities":
        return "bg-[#f1f5f9] text-[#334155]";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-[#e6fcf5] text-[#0ca678]";
      case "Credit Card":
      case "Terminal":
        return "bg-[#e7f5ff] text-[#228be6]";
      case "Online Payment":
      case "Online":
        return "bg-[#fff9db] text-[#f59f00]";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[20px] shadow-2xl border border-slate-100 w-full max-w-[520px] overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-800">View Expense</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-none text-left">
          {/* Top Info Row */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{expense.date}</span>
            <span className="bg-slate-50 text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-black shadow-sm">
              € {expense.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Salon Details */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salon</label>
            <div className="flex items-center gap-3">
              <Image
                src={expense.salon.avatar}
                alt={expense.salon.name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-cover shadow-sm bg-slate-50 shrink-0"
              />
              <span className="text-sm font-extrabold text-slate-700">{expense.salon.name}</span>
            </div>
          </div>

          {/* Category Rows */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-50 pt-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Macro-category</label>
              <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg ${getMacroCategoryBadge(expense.macroCategory)}`}>
                {expense.macroCategory}
              </span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              <span className="text-xs font-extrabold px-3 py-1.5 rounded-lg bg-[#e6fcf5] text-[#0ca678]">
                {expense.category}
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
              <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg ${getPaymentMethodBadge(expense.paymentMethod)}`}>
                {expense.paymentMethod}
              </span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Supplier</label>
              <span className="text-xs font-bold text-slate-700">{expense.supplier}</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Warranty</label>
              <span className="text-xs font-bold text-slate-700">None</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
              <span className="text-xs font-bold text-slate-700">Lorem</span>
            </div>
          </div>

          {/* Payee */}
          <div className="border-t border-slate-50 pt-5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payee</label>
            <span className="text-xs font-bold text-slate-700">Lorem Ipsum</span>
          </div>

          {/* Note */}
          <div className="border-t border-slate-50 pt-5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Note</label>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">{expense.note || "N/A"}</p>
          </div>

          {/* Attachments card block */}
          <div className="border-t border-slate-50 pt-5 space-y-2.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attach receipts/invoices</label>
            {expense.hasAttachment ? (
              <div className="flex items-center justify-between p-4 border border-slate-100 bg-[#fbfbfe] rounded-2xl gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-[#f0f2ff] flex items-center justify-center text-[#5c60f5] shrink-0 shadow-sm border border-indigo-50/50">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-[#5c60f5] truncate">{expense.attachmentName || "originalname.pdf"}</span>
                    <span className="block text-[10px] font-bold text-slate-400 mt-0.5">4.2 MB</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onViewAttachment}
                    className="h-8 w-8 rounded-lg bg-[#f0f2ff] hover:bg-[#e6e8ff] text-[#5c60f5] flex items-center justify-center transition-colors cursor-pointer"
                    title="View file"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={onDownloadAttachment}
                    className="h-8 w-8 rounded-lg bg-[#f0f2ff] hover:bg-[#e6e8ff] text-[#5c60f5] flex items-center justify-center transition-colors cursor-pointer"
                    title="Download file"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 py-2">No attachments uploaded for this expense.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

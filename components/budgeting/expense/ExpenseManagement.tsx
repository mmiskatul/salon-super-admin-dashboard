"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  ChevronDown,
  List,
  LayoutGrid,
  Search,
  Calendar,
  Plus,
  X,
  Home,
} from "lucide-react";
import ExpenseGrid from "./ExpenseGrid";
import ExpenseList from "./ExpenseList";
import {
  initialExpensesData,
  salonOptions,
  macroCategoryOptions,
  categoryOptions,
  supplierOptions,
  paymentMethodOptions,
  ExpenseTransaction,
  NewExpenseInput,
} from "./data";
import {
  AddExpenseModal,
  BudgetExceededModal,
  AttachmentModal,
  ViewExpenseModal,
} from "./ExpenseModals";

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 bg-white text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-left shadow-sm min-h-[40px]"
      >
        <span className="truncate">
          {value === "All" ? placeholder || "All" : value}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-[68px] bg-white rounded-xl shadow-xl ring-1 ring-slate-100 py-1.5 max-h-56 overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-top-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                opt === value
                  ? "bg-brand/5 text-[#5c60f5]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt === "All" ? placeholder || "All" : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] =
    useState<ExpenseTransaction[]>(initialExpensesData);
  const [viewType, setViewType] = useState<"list" | "grid">("list");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSalon, setSelectedSalon] = useState("All");
  const [selectedMacroCategory, setSelectedMacroCategory] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSupplier, setSelectedSupplier] = useState("All");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All");

  // Export dropdown
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExceededOpen, setIsExceededOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [pendingExpense, setPendingExpense] = useState<NewExpenseInput | null>(
    null,
  );
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeViewTx, setActiveViewTx] = useState<ExpenseTransaction | null>(
    null,
  );
  const [viewingAttachmentTx, setViewingAttachmentTx] =
    useState<ExpenseTransaction | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(event.target as Node)
      ) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter Logic
  const filteredExpenses = expenses.filter((tx) => {
    // Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = tx.salon.name.toLowerCase().includes(q);
      const matchSupplier = tx.supplier.toLowerCase().includes(q);
      const matchNote = (tx.note || "").toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      if (!matchName && !matchSupplier && !matchNote && !matchCat) {
        return false;
      }
    }

    // Salon Dropdown
    if (selectedSalon !== "All" && tx.salon.name !== selectedSalon) {
      return false;
    }

    // Macro Category
    if (
      selectedMacroCategory !== "All" &&
      tx.macroCategory !== selectedMacroCategory
    ) {
      return false;
    }

    // Category
    if (selectedCategory !== "All" && tx.category !== selectedCategory) {
      return false;
    }

    // Supplier
    if (selectedSupplier !== "All" && tx.supplier !== selectedSupplier) {
      return false;
    }

    // Payment Method
    if (
      selectedPaymentMethod !== "All" &&
      tx.paymentMethod !== selectedPaymentMethod
    ) {
      return false;
    }

    // Date (Simple startsWith check since dates are formatted "02/01/2025...")
    if (
      selectedDate &&
      !tx.date.startsWith(selectedDate.split("-").reverse().join("/"))
    ) {
      // Input date is YYYY-MM-DD, transaction date is DD/MM/YYYY
      const parts = selectedDate.split("-"); // [YYYY, MM, DD]
      if (parts.length === 3) {
        const formattedDateInput = `${parts[2]}/${parts[1]}/${parts[0]}`;
        if (!tx.date.startsWith(formattedDateInput)) {
          return false;
        }
      }
    }

    return true;
  });

  // Action Operations
  const handleView = (id: string) => {
    const tx = expenses.find((e) => e.id === id);
    if (tx) {
      setActiveViewTx(tx);
      setIsViewOpen(true);
    }
  };

  const handleEdit = (id: string) => {
    const tx = expenses.find((e) => e.id === id);
    if (tx) {
      const newCost = prompt(
        `Edit cost for ${tx.salon.name} - ${tx.macroCategory}:`,
        tx.cost.toString(),
      );
      if (newCost !== null) {
        const costNum = parseFloat(newCost);
        if (!isNaN(costNum)) {
          setExpenses((prev) =>
            prev.map((e) => (e.id === id ? { ...e, cost: costNum } : e)),
          );
        }
      }
    }
  };

  const handleAttachOpen = (id: string) => {
    setActiveTxId(id);
    setIsAttachOpen(true);
  };

  const handleAttachSave = (fileName: string) => {
    if (activeTxId) {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === activeTxId
            ? { ...e, hasAttachment: true, attachmentName: fileName }
            : e,
        ),
      );
    }
    setIsAttachOpen(false);
    setActiveTxId(null);
  };

  const handleViewAttachment = (id: string) => {
    const tx = expenses.find((e) => e.id === id);
    if (tx && tx.attachmentName) {
      setViewingAttachmentTx(tx);
    }
  };

  const handleDownloadAttachment = (id: string) => {
    const tx = expenses.find((e) => e.id === id);
    if (tx && tx.attachmentName) {
      alert(
        `[Attachment Download Started]\n\nDownloaded file: ${tx.attachmentName}`,
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // Add Expense Save handler
  const handleAddSave = (expenseData: NewExpenseInput) => {
    // If expense cost exceeds €5,000, trigger warning modal
    if (expenseData.cost > 5000) {
      setPendingExpense(expenseData);
      setIsAddOpen(false);
      setIsExceededOpen(true);
    } else {
      saveNewExpense(expenseData);
      setIsAddOpen(false);
    }
  };

  const saveNewExpense = (data: NewExpenseInput) => {
    const newTx: ExpenseTransaction = {
      id: `exp-${Date.now()}`,
      date: data.date,
      salon: {
        name: data.payee || "Glamour Beauty",
        avatar: "/avatar/avatar.png",
      },
      macroCategory: data.macroCategory as ExpenseTransaction["macroCategory"],
      category: data.category,
      cost: data.cost,
      supplier: data.location || "Supplier Name",
      paymentMethod: data.paymentMethod as ExpenseTransaction["paymentMethod"],
      note: data.note || "Added via form",
      hasAttachment: data.hasAttachment,
      attachmentName: data.attachmentName,
    };
    setExpenses((prev) => [newTx, ...prev]);
  };

  const handleConfirmExceeded = () => {
    if (pendingExpense) {
      saveNewExpense(pendingExpense);
      setPendingExpense(null);
    }
    setIsExceededOpen(false);
  };

  if (viewingAttachmentTx) {
    return (
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 px-6 py-5 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            View Attachment
          </h1>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <button
              onClick={() => setViewingAttachmentTx(null)}
              className="hover:text-[#5c60f5] text-slate-400 transition-colors cursor-pointer"
              title="Home"
            >
              <Home size={14} />
            </button>
            <span>/</span>
            <button
              onClick={() => setViewingAttachmentTx(null)}
              className="bg-indigo-50 text-[#5c60f5] hover:bg-[#e6e8ff] px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold text-[11px]"
            >
              Expense Management
            </button>
          </div>
        </div>

        {/* Invoice Card Box */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-6">
          {/* Header Row: Document Name + Download Button */}
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800">
              {viewingAttachmentTx.attachmentName || "originalname.pdf"}
            </h3>
            <button
              onClick={() => handleDownloadAttachment(viewingAttachmentTx.id)}
              className="flex items-center gap-1.5 bg-[#f0f2ff] hover:bg-[#e6e8ff] text-[#5c60f5] text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          </div>

          {/* PDF Paper Sheet Visual Preview */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-12 flex justify-center items-start min-h-[600px]">
            <div className="bg-white shadow-xl border border-slate-200 p-8 sm:p-14 max-w-[680px] w-full text-slate-700 font-sans leading-relaxed text-xs space-y-6 rounded-lg text-left">
              {/* Document Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight">
                    Document Name
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Invoice Receipt
                  </p>
                </div>
                <Image
                  src="/assets/icons/logo.svg"
                  alt="Logo"
                  width={80}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              </div>

              {/* Document Body Columns */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800">
                    What is Lorem Ipsum?
                  </h5>
                  <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-10 pb-6">
                <div>
                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Maria Rodriguez (Client)
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Maria Fernandez (Owner)
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="text-[10px] text-slate-400 font-semibold pt-4 border-t border-slate-100 flex justify-between">
                <span>www.name.com</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Card containing Header and Filters */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Expense Management
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Manage and track salon expense registers
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Export button dropdown */}
            <div className="relative flex-1 sm:flex-none" ref={exportRef}>
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="w-full flex items-center justify-center gap-2 bg-[#f0f2ff] hover:bg-[#e6e8ff] text-[#5c60f5] text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm border border-indigo-50/50"
              >
                <Download size={14} />
                <span>Export Monthly Report</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isExportOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isExportOpen && (
                <div className="absolute right-0 z-20 mt-1.5 w-44 bg-white rounded-xl shadow-xl ring-1 ring-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => setIsExportOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                  >
                    Download PDF Report
                  </button>
                  <button
                    onClick={() => setIsExportOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                  >
                    Download CSV Spreadsheet
                  </button>
                </div>
              )}
            </div>

            {/* Add Expense button */}
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#5c60f5] hover:bg-[#4d51e5] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* 6 Selector Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-slate-50 pt-5">
          {/* Date Filter */}
          <div className="relative flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:border-brand transition-colors cursor-pointer appearance-none min-h-[40px] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="absolute right-7 top-3 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              ) : null}
              <Calendar
                size={14}
                className="absolute right-3 top-[13px] text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Salons Dropdown */}
          <FilterDropdown
            label="Salons"
            value={selectedSalon}
            options={salonOptions}
            onChange={setSelectedSalon}
            placeholder="All Salons"
          />

          {/* Macro-categories */}
          <FilterDropdown
            label="Macro-categories"
            value={selectedMacroCategory}
            options={macroCategoryOptions}
            onChange={setSelectedMacroCategory}
            placeholder="All Categories"
          />

          {/* Category */}
          <FilterDropdown
            label="Category"
            value={selectedCategory}
            options={categoryOptions}
            onChange={setSelectedCategory}
            placeholder="All Subcategories"
          />

          {/* Supplier */}
          <FilterDropdown
            label="Supplier"
            value={selectedSupplier}
            options={supplierOptions}
            onChange={setSelectedSupplier}
            placeholder="All Suppliers"
          />

          {/* Payment Method */}
          <FilterDropdown
            label="Payment Method"
            value={selectedPaymentMethod}
            options={paymentMethodOptions}
            onChange={setSelectedPaymentMethod}
            placeholder="All Methods"
          />
        </div>
      </div>

      {/* Row 3: Search Bar and List/Grid View toggles */}
      <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative w-full max-w-[280px]">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:border-brand transition-colors"
          />
          <Search
            size={14}
            className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center border border-slate-200 bg-white rounded-xl p-0.5 shadow-sm">
          <button
            onClick={() => setViewType("list")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              viewType === "list"
                ? "bg-[#f0f2ff] text-[#5c60f5]"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewType("grid")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              viewType === "grid"
                ? "bg-[#f0f2ff] text-[#5c60f5]"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Card grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div className="w-full">
        {filteredExpenses.length > 0 ? (
          viewType === "list" ? (
            <ExpenseList
              expenses={filteredExpenses}
              onView={handleView}
              onEdit={handleEdit}
              onAttach={handleAttachOpen}
              onViewAttachment={handleViewAttachment}
              onDownloadAttachment={handleDownloadAttachment}
              onDelete={handleDelete}
            />
          ) : (
            <ExpenseGrid
              expenses={filteredExpenses}
              onView={handleView}
              onEdit={handleEdit}
              onAttach={handleAttachOpen}
              onViewAttachment={handleViewAttachment}
              onDownloadAttachment={handleDownloadAttachment}
              onDelete={handleDelete}
            />
          )
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs font-bold shadow-sm">
            No matching expenses found for the selected filter parameters.
          </div>
        )}
      </div>

      {/* Modals mount point */}
      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddSave}
      />

      {isExceededOpen && pendingExpense && (
        <BudgetExceededModal
          isOpen={isExceededOpen}
          macroCategory={pendingExpense.macroCategory}
          amountExceeded={`€${(pendingExpense.cost - 5000).toLocaleString()}`}
          onClose={() => {
            setIsExceededOpen(false);
            setPendingExpense(null);
          }}
          onConfirm={handleConfirmExceeded}
        />
      )}

      {isAttachOpen && (
        <AttachmentModal
          isOpen={isAttachOpen}
          attachmentName={null}
          onClose={() => {
            setIsAttachOpen(false);
            setActiveTxId(null);
          }}
          onAttach={handleAttachSave}
        />
      )}

      <ViewExpenseModal
        isOpen={isViewOpen}
        expense={activeViewTx}
        onClose={() => {
          setIsViewOpen(false);
          setActiveViewTx(null);
        }}
        onViewAttachment={() => {
          if (activeViewTx) {
            handleViewAttachment(activeViewTx.id);
            setIsViewOpen(false);
            setActiveViewTx(null);
          }
        }}
        onDownloadAttachment={() => {
          if (activeViewTx) {
            handleDownloadAttachment(activeViewTx.id);
          }
        }}
      />
    </div>
  );
}

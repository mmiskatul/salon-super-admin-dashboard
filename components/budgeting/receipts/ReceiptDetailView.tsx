import React from "react";
import { ArrowLeft, Download } from "lucide-react";
import { ReceiptItem } from "./data";

interface ReceiptDetailViewProps {
  receipt: ReceiptItem;
  onBack: () => void;
}

export default function ReceiptDetailView({ receipt, onBack }: ReceiptDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <button
            onClick={onBack}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              Service Receipt
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              Italian Fiscal Invoice
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-[#5c60f5] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#4c50e0] shadow-sm transition-colors cursor-pointer w-fit">
          <Download size={14} />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Electronic Invoice Card (Receipt No & Date) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">
            Electronic Invoice
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-5">
              <h4 className="text-2xl font-black text-slate-800">2025-000123</h4>
              <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                Receipt No
              </span>
            </div>
            <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-5">
              <h4 className="text-2xl font-black text-slate-800">11/30/2024</h4>
              <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                Date
              </span>
            </div>
          </div>
        </div>

        {/* Transferor/Provider & Transferee/Client Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Provider */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Transferor/Provider
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-black text-slate-800">Bella Vista Salon</h4>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Via Roma, 123</p>
                <p className="text-xs font-bold text-slate-500">20121 Milan (MI) - Italy</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">P.IVA</span>
                  <span className="text-xs font-extrabold text-slate-700">IT12345678901</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tax Code</span>
                  <span className="text-xs font-extrabold text-slate-700">12345678901</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">PEC</span>
                  <span className="text-xs font-extrabold text-slate-700 break-all">
                    amministrazione@pec.salonflow.it
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">
                    Recipient Code
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">XXXXXXX</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Telephone</span>
                  <span className="text-xs font-extrabold text-slate-700">+39 02 1234567</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Email</span>
                  <span className="text-xs font-extrabold text-slate-700 break-all">
                    fatturazione@salonflow.it
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Client */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Transferee/Client
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-black text-slate-800">{receipt.client.name}</h4>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Via Esempio, 456</p>
                <p className="text-xs font-bold text-slate-500">10100 Turin (TO) - Italy</p>
              </div>

              <div className="pt-2">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Tax Code</span>
                <span className="text-xs font-extrabold text-slate-700">98765432109</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Description */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Service Description
          </h3>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-700 text-center">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-700 text-right">Unit Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-700 text-center">VAT Rate</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-700 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-extrabold text-slate-700">Haircut</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500 text-center">1</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">€ 246.08</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">22%</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-800 text-right">€ 246.08</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* VAT Summary & Document Totals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: VAT Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              VAT Summary
            </h3>
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-700">Rate</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-700 text-right">Taxable</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-700 text-right">IvA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-extrabold text-slate-700">0%</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">€ 0</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">€ 0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Document Totals */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Document Totals
            </h3>
            <div className="divide-y divide-slate-100 space-y-3 pt-2">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold text-slate-400">Total Taxable Amount</span>
                <span className="text-xs font-black text-slate-700">€ 170</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs font-bold text-slate-400">Total VAT</span>
                <span className="text-xs font-black text-slate-700">€ 0</span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-black text-slate-800">Document Total</span>
                <span className="text-xl font-black text-slate-800">€ 170</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods block */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Payment Methods
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Mode</span>
              <span className="text-xs font-extrabold text-slate-700">Credit Card</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Payment Date</span>
              <span className="text-xs font-extrabold text-slate-700">12/02/2024</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Deadline</span>
              <span className="text-xs font-extrabold text-slate-700">12/14/2024</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Amount Paid</span>
              <span className="text-xs font-black text-slate-800">€ 170</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Status</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/50 w-fit block mt-0.5">
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Legal Notes block */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Legal Notes
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-slate-500 text-xs font-medium">
            <li>Invoice issued pursuant to art. 21 of Presidential Decree 26 October 1972, n. 633 and subsequent amendments.</li>
            <li>VAT paid by the purchaser pursuant to art. 17, paragraph 6, of Presidential Decree 26 October 1972, n. 633.</li>
            <li>Digitally signed electronic document pursuant to Legislative Decree 82/2005.</li>
            <li>Replacement storage of documents pursuant to the Ministerial Decree of 17 June 2014.</li>
            <li>Competent court: Milan. Applicable law: Italian.</li>
            <li>Company subject to the management and coordination of [Holding Company].</li>
          </ul>
        </div>

        {/* Footer info details */}
        <div className="text-center text-[10px] font-bold text-slate-400 leading-relaxed py-4 border-t border-slate-100">
          <p>SalonFlow S.r.l. - Via Roma, 123 - 20121 Milan (MI) - VAT number: IT12345678901</p>
          <p className="mt-0.5">Share Capital: € 10,000.00 i.v. - REA MI-1234567 - SDI Code: XXXXXXX</p>
          <p className="mt-0.5">www.salonflow.it - info@salonflow.it - Tel: +39 02 1234567</p>
        </div>
      </div>
    </div>
  );
}

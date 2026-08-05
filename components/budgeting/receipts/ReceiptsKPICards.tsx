import React from "react";
import { Wallet, BarChart3, FileText, Users } from "lucide-react";
import { receiptsKpis } from "./data";

export default function ReceiptsKPICards() {
  const cards = [
    {
      title: "Total",
      value: `€ ${receiptsKpis.total}`,
      icon: Wallet,
      gradient: "from-[#e6fcf5] to-[#c3fae8]/30 border-[#c3fae8]",
      iconBg: "bg-[#0ca678]",
      textColor: "text-[#0ca678]",
    },
    {
      title: "Media",
      value: `€ ${receiptsKpis.media}`,
      icon: BarChart3,
      gradient: "from-[#f0f2ff] to-[#d0ebff]/30 border-[#d0ebff]",
      iconBg: "bg-[#5c60f5]",
      textColor: "text-[#5c60f5]",
    },
    {
      title: "Receipts",
      value: String(receiptsKpis.receiptsCount),
      icon: FileText,
      gradient: "from-[#e6fcf5] to-[#c3fae8]/30 border-[#c3fae8]",
      iconBg: "bg-[#0ca678]",
      textColor: "text-[#0ca678]",
    },
    {
      title: "Unique Customers",
      value: String(receiptsKpis.uniqueCustomers),
      icon: Users,
      gradient: "from-[#fff9db] to-[#fff3bf]/30 border-[#ffe066]",
      iconBg: "bg-[#f59f00]",
      textColor: "text-[#f59f00]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.gradient} border rounded-2xl p-5 flex items-center justify-between shadow-sm hover:-translate-y-1 transition-all duration-300 cursor-default`}
          >
            <div className="space-y-2 text-left">
              <span className="text-[13px] font-black text-slate-400 leading-none">
                {card.title}
              </span>
              <h2 className="text-[38px] font-black text-slate-800 tracking-tight leading-none">
                {card.value}
              </h2>
            </div>
            <div className={`h-11 w-11 shrink-0 rounded-xl ${card.iconBg} text-white flex items-center justify-center shadow-sm`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function FAB({ onAddCattle, onAddExpense, onAddMilk }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const actions = [
    {
      icon: "🐄",
      label: t("addCattle"),
      onClick: onAddCattle,
      color: "bg-emerald-500 hover:bg-emerald-400",
    },
    {
      icon: "🥛",
      label: t("addMilkEntry"),
      onClick: onAddMilk,
      color: "bg-sky-500 hover:bg-sky-400",
    },
    {
      icon: "💸",
      label: t("addExpense"),
      onClick: onAddExpense,
      color: "bg-purple-500 hover:bg-purple-400",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => { action.onClick(); setOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${action.color}`}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300
          bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900
          hover:scale-110 hover:shadow-amber-500/40 active:scale-95
          ${open ? "rotate-45" : "rotate-0"}`}
      >
        +
      </button>
    </div>
  );
}

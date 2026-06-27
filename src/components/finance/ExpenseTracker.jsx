import { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const CAT_ICONS = { feed: "🌾", feed_purchase: "🌾", cattle_purchase: "🐄", cattle_death: "💀", medical: "💊", labor: "👷", electricity: "⚡", other: "📦" };

const Input = (props) => (
  <input {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm" />
);
const Field = ({ label, children }) => (
  <div><label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{label}</label>{children}</div>
);

const EMPTY_EXP = { date: new Date().toISOString().slice(0, 10), category: "feed", amount: "", description: "" };
const EMPTY_INC = { date: new Date().toISOString().slice(0, 10), source: "milk", amount: "", description: "" };

export default function ExpenseTracker() {
  const { expenses, incomes, addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome, stats } = useApp();
  const { t, language } = useLanguage();
  const { hasAccess } = useAuth();

  const [tab, setTab] = useState("expense"); 

  const [showExpForm, setShowExpForm] = useState(false);
  const [editExp,     setEditExp]     = useState(null);
  const [deleteExp,   setDeleteExp]   = useState(null);
  const [expForm,     setExpForm]     = useState(EMPTY_EXP);

  const [showIncForm, setShowIncForm] = useState(false);
  const [editInc,     setEditInc]     = useState(null);
  const [deleteInc,   setDeleteInc]   = useState(null);
  const [incForm,     setIncForm]     = useState(EMPTY_INC);
  
  const [highlightedId, setHighlightedId] = useState(null);

  const canEdit   = hasAccess("worker");
  const canDelete = hasAccess("admin");

  // সার্চ হাইলাইট ডিটেকশন ইফেক্ট
  useEffect(() => {
    const id = sessionStorage.getItem("searchHighlightId");
    if (id) {
      setHighlightedId(id);
      const timer = setTimeout(() => {
        setHighlightedId(null);
        sessionStorage.removeItem("searchHighlightId");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [expenses, incomes]);

  const setE = (k, v) => setExpForm((p) => ({ ...p, [k]: v }));
  const setI = (k, v) => setIncForm((p) => ({ ...p, [k]: v }));

  const openEditExp = (e) => { setEditExp(e); setExpForm({ date: e.date, category: e.category, amount: e.amount, description: e.description }); };
  const openEditInc = (i) => { setEditInc(i); setIncForm({ date: i.date, source: i.source, amount: i.amount, description: i.description }); };
  
  const closeExp = () => { setShowExpForm(false); setEditExp(null); setExpForm(EMPTY_EXP); };
  const closeInc = () => { setShowIncForm(false); setEditInc(null); setIncForm(EMPTY_INC); };

  const saveExp = () => {
    const d = { ...expForm, amount: Number(expForm.amount) };
    editExp ? updateExpense(editExp._id || editExp.id, d) : addExpense(d);
    closeExp();
  };
  
  const saveInc = () => {
    const d = { ...incForm, amount: Number(incForm.amount) };
    editInc ? updateIncome(editInc._id || editInc.id, d) : addIncome(d);
    closeInc();
  };

  const fmt = (n) => n.toLocaleString(language === "bn" ? "bn-BD" : "en-BD");

  const getCatName = (cat) => {
    if (language !== "bn") return cat;
    const names = {
      feed: "গো-খাদ্য", feed_purchase: "খাবার ক্রয়", cattle_purchase: "গরু ক্রয়", cattle_death: "গরুর মৃত্যু (ক্ষতি)", medical: "চিকিৎসা", labor: "শ্রমিক বেতন", electricity: "বিদ্যুৎ", other: "অন্যান্য"
    };
    return names[cat] || cat;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white transition-colors">{t("finance")}</h2>
          <p className="text-[#64748B] dark:text-slate-500 text-sm transition-colors">{language === "bn" ? "আয় ও ব্যয়ের বিস্তারিত হিসাব" : "Income and Expense Details"}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowIncForm(true)}>+ {t("income")}</Button>
            <Button size="sm" onClick={() => setShowExpForm(true)}>+ {t("expense")}</Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#10B981]/30 dark:border-emerald-500/20 shadow-sm rounded-xl p-3 text-center min-w-0 flex flex-col justify-center transition-colors">
          <p className="text-[#64748B] dark:text-slate-400 text-[11px] sm:text-xs mb-1 truncate transition-colors" title={t("monthlyIncome")}>{t("monthlyIncome")}</p>
          <p className="text-base sm:text-xl font-bold text-[#10B981] dark:text-emerald-400 truncate transition-colors">৳{fmt(stats.monthlyIncome)}</p>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#EF4444]/30 dark:border-red-500/20 shadow-sm rounded-xl p-3 text-center min-w-0 flex flex-col justify-center transition-colors">
          <p className="text-[#64748B] dark:text-slate-400 text-[11px] sm:text-xs mb-1 truncate transition-colors" title={t("monthlyExpense")}>{t("monthlyExpense")}</p>
          <p className="text-base sm:text-xl font-bold text-[#EF4444] dark:text-red-400 truncate transition-colors">৳{fmt(stats.monthlyExpense)}</p>
        </div>
        {/* Net Profit */}
        <div className="col-span-2 bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#F59E0B]/30 dark:border-amber-500/20 shadow-sm rounded-xl p-4 text-center min-w-0 flex flex-col justify-center transition-colors">
          <p className="text-[#64748B] dark:text-slate-400 text-xs mb-1 truncate transition-colors" title={t("netProfit")}>{t("netProfit")}</p>
          <p className={`text-xl sm:text-2xl font-bold truncate transition-colors ${stats.netProfit >= 0 ? "text-[#F59E0B] dark:text-amber-400" : "text-[#EF4444] dark:text-red-400"}`}>৳{fmt(stats.netProfit)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F5F4EF] dark:bg-slate-800/60 rounded-xl p-1 w-fit transition-colors">
        {[{ key: "expense", label: `💸 ${t("expense")}` }, { key: "income", label: `💰 ${t("income")}` }].map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tb.key 
                ? "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-400/20 shadow-sm" 
                : "text-[#64748B] dark:text-slate-400 hover:text-[#1A1A2E] dark:hover:text-slate-200"
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {tab === "expense" && (
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                  {[t("date"), t("category"), t("description"), t("amount"), t("action")].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase transition-colors">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30 transition-colors">
                {expenses.map((e) => {
                  const isHighlighted = e._id === highlightedId || e.id === highlightedId;
                  return (
                    <tr key={e._id || e.id} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20 dark:border-amber-400 animate-pulse font-medium text-amber-900 dark:text-amber-200" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
                      <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm transition-colors">{e.date}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-sm text-[#1A1A2E] dark:text-slate-300 whitespace-nowrap transition-colors">
                          {CAT_ICONS[e.category] || "📦"} {getCatName(e.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B] dark:text-slate-300 text-sm max-w-[160px] truncate transition-colors" title={e.description}>{e.description}</td>
                      <td className="px-4 py-3 text-[#EF4444] dark:text-red-400 font-semibold text-sm whitespace-nowrap transition-colors">-৳{fmt(e.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {canEdit   && <button onClick={() => openEditExp(e)} className="px-2 py-1 rounded text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-colors">✏️</button>}
                          {canDelete && <button onClick={() => setDeleteExp(e)} className="px-2 py-1 rounded text-xs text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors">🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#94A3B8] dark:text-slate-500 transition-colors">{t("noData")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Income list */}
      {tab === "income" && (
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                  {[t("date"), t("source"), t("description"), t("amount"), t("action")].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase transition-colors">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30 transition-colors">
                {incomes.map((i) => {
                  const isHighlighted = i._id === highlightedId || i.id === highlightedId;
                  return (
                    <tr key={i._id || i.id} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20 dark:border-amber-400 animate-pulse font-medium text-amber-900 dark:text-amber-200" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
                      <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm transition-colors">{i.date}</td>
                      <td className="px-4 py-3 text-[#1A1A2E] dark:text-slate-300 text-sm whitespace-nowrap transition-colors">💰 {i.source}</td>
                      <td className="px-4 py-3 text-[#64748B] dark:text-slate-300 text-sm max-w-[160px] truncate transition-colors" title={i.description}>{i.description}</td>
                      <td className="px-4 py-3 text-[#10B981] dark:text-emerald-400 font-semibold text-sm whitespace-nowrap transition-colors">+৳{fmt(i.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {canEdit   && <button onClick={() => openEditInc(i)} className="px-2 py-1 rounded text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-colors">✏️</button>}
                          {canDelete && <button onClick={() => setDeleteInc(i)} className="px-2 py-1 rounded text-xs text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors">🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {incomes.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#94A3B8] dark:text-slate-500 transition-colors">{t("noData")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals for Expense */}
      <Modal isOpen={showExpForm || !!editExp} onClose={closeExp} title={editExp ? t("edit") : t("addExpense")}>
        <div className="space-y-3">
          <Field label={t("date")}><Input type="date" value={expForm.date} onChange={(e) => setE("date", e.target.value)} /></Field>
          <Field label={t("category")}>
            <select value={expForm.category} onChange={(e) => setE("category", e.target.value)}
              className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 shadow-sm transition-colors">
              {Object.keys(CAT_ICONS).map((k) => <option key={k} value={k}>{CAT_ICONS[k]} {getCatName(k)}</option>)}
            </select>
          </Field>
          <Field label={t("amount")}><Input type="number" value={expForm.amount} onChange={(e) => setE("amount", e.target.value)} placeholder="5000" /></Field>
          <Field label={t("description")}><Input value={expForm.description} onChange={(e) => setE("description", e.target.value)} placeholder={t("description")} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeExp}>{t("cancel")}</Button>
            <Button onClick={saveExp}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      {/* Modals for Income */}
      <Modal isOpen={showIncForm || !!editInc} onClose={closeInc} title={editInc ? t("edit") : t("addIncome")}>
        <div className="space-y-3">
          <Field label={t("date")}><Input type="date" value={incForm.date} onChange={(e) => setI("date", e.target.value)} /></Field>
          <Field label={t("source")}><Input value={incForm.source} onChange={(e) => setI("source", e.target.value)} placeholder={t("source")} /></Field>
          <Field label={t("amount")}><Input type="number" value={incForm.amount} onChange={(e) => setI("amount", e.target.value)} placeholder="20000" /></Field>
          <Field label={t("description")}><Input value={incForm.description} onChange={(e) => setI("description", e.target.value)} placeholder={t("description")} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeInc}>{t("cancel")}</Button>
            <Button onClick={saveInc}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteExp} message={t("confirm")} onCancel={() => setDeleteExp(null)} onConfirm={() => { deleteExpense(deleteExp._id || deleteExp.id); setDeleteExp(null); }} />
      <ConfirmDialog isOpen={!!deleteInc} message={t("confirm")} onCancel={() => setDeleteInc(null)} onConfirm={() => { deleteIncome(deleteInc._id || deleteInc.id); setDeleteInc(null); }} />
    </div>
  );
}
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const CAT_ICONS = { feed: "🌾", medical: "💊", labor: "👷", electricity: "⚡", other: "📦" };
const CAT_NAMES = { feed: "গো-খাদ্য", medical: "চিকিৎসা", labor: "শ্রমিক বেতন", electricity: "বিদ্যুৎ", other: "অন্যান্য" };

const Input = (props) => (
  <input {...props} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500" />
);
const Field = ({ label, children }) => (
  <div><label className="text-slate-400 text-xs block mb-1">{label}</label>{children}</div>
);

const EMPTY_EXP = { date: new Date().toISOString().slice(0, 10), category: "feed", amount: "", description: "" };
const EMPTY_INC = { date: new Date().toISOString().slice(0, 10), source: "milk", amount: "", description: "" };

export default function ExpenseTracker() {
  // নতুন ফাংশনগুলো রিসিভ করা হলো
  const { expenses, incomes, addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome, stats } = useApp();
  const { t } = useLanguage();
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

  const canEdit   = hasAccess("worker");
  const canDelete = hasAccess("admin");

  const setE = (k, v) => setExpForm((p) => ({ ...p, [k]: v }));
  const setI = (k, v) => setIncForm((p) => ({ ...p, [k]: v }));

  const openEditExp = (e) => { setEditExp(e); setExpForm({ date: e.date, category: e.category, amount: e.amount, description: e.description }); };
  const openEditInc = (i) => { setEditInc(i); setIncForm({ date: i.date, source: i.source, amount: i.amount, description: i.description }); };
  
  const closeExp = () => { setShowExpForm(false); setEditExp(null); setExpForm(EMPTY_EXP); };
  const closeInc = () => { setShowIncForm(false); setEditInc(null); setIncForm(EMPTY_INC); };

  // MongoDB এর জন্য _id ব্যবহার করা হলো
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t("finance")}</h2>
          <p className="text-slate-500 text-sm">আয় ও ব্যয়ের বিস্তারিত হিসাব</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowIncForm(true)}>+ আয়</Button>
            <Button size="sm" onClick={() => setShowExpForm(true)}>+ খরচ</Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("monthlyIncome"),  value: `৳${stats.monthlyIncome.toLocaleString("bn-BD")}`,  color: "text-emerald-400", border: "border-emerald-500/20" },
          { label: t("monthlyExpense"), value: `৳${stats.monthlyExpense.toLocaleString("bn-BD")}`, color: "text-red-400",     border: "border-red-500/20" },
          { label: t("netProfit"),      value: `৳${stats.netProfit.toLocaleString("bn-BD")}`,      color: stats.netProfit >= 0 ? "text-amber-400" : "text-red-400", border: "border-amber-500/20" },
        ].map((s) => (
          <div key={s.label} className={`bg-slate-800/40 border ${s.border} rounded-xl p-4 text-center`}>
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
        {[{ key: "expense", label: "💸 খরচ" }, { key: "income", label: "💰 আয়" }].map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === tb.key ? "bg-amber-400/15 text-amber-400 border border-amber-400/20" : "text-slate-400 hover:text-slate-200"
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {tab === "expense" && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["তারিখ", "বিভাগ", "বিবরণ", "পরিমাণ", "অ্যাকশন"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {expenses.map((e) => (
                  <tr key={e._id || e.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-sm">{e.date}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-slate-300">
                        {CAT_ICONS[e.category]} {CAT_NAMES[e.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm max-w-[160px] truncate">{e.description}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold text-sm">-৳{e.amount.toLocaleString("bn-BD")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canEdit   && <button onClick={() => openEditExp(e)} className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-sky-400/10">✏️ এডিট</button>}
                        {canDelete && <button onClick={() => setDeleteExp(e)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10">🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Income list */}
      {tab === "income" && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["তারিখ", "উৎস", "বিবরণ", "পরিমাণ", "অ্যাকশন"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {incomes.map((i) => (
                  <tr key={i._id || i.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-sm">{i.date}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">💰 {i.source}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm max-w-[160px] truncate">{i.description}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold text-sm">+৳{i.amount.toLocaleString("bn-BD")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canEdit   && <button onClick={() => openEditInc(i)} className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-sky-400/10">✏️ এডিট</button>}
                        {canDelete && <button onClick={() => setDeleteInc(i)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10">🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      <Modal isOpen={showExpForm || !!editExp} onClose={closeExp} title={editExp ? "খরচ এডিট করুন" : "নতুন খরচ"}>
        <div className="space-y-3">
          <Field label="তারিখ"><Input type="date" value={expForm.date} onChange={(e) => setE("date", e.target.value)} /></Field>
          <Field label="বিভাগ">
            <select value={expForm.category} onChange={(e) => setE("category", e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60">
              {Object.entries(CAT_NAMES).map(([k, v]) => <option key={k} value={k}>{CAT_ICONS[k]} {v}</option>)}
            </select>
          </Field>
          <Field label="পরিমাণ (৳)"><Input type="number" value={expForm.amount} onChange={(e) => setE("amount", e.target.value)} placeholder="5000" /></Field>
          <Field label="বিবরণ"><Input value={expForm.description} onChange={(e) => setE("description", e.target.value)} placeholder="বিবরণ লিখুন" /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeExp}>বাতিল</Button>
            <Button onClick={saveExp}>💾 সংরক্ষণ</Button>
          </div>
        </div>
      </Modal>

      {/* Income Add/Edit Modal */}
      <Modal isOpen={showIncForm || !!editInc} onClose={closeInc} title={editInc ? "আয় এডিট করুন" : "নতুন আয়"}>
        <div className="space-y-3">
          <Field label="তারিখ"><Input type="date" value={incForm.date} onChange={(e) => setI("date", e.target.value)} /></Field>
          <Field label="উৎস"><Input value={incForm.source} onChange={(e) => setI("source", e.target.value)} placeholder="দুধ বিক্রি, গরু বিক্রি..." /></Field>
          <Field label="পরিমাণ (৳)"><Input type="number" value={incForm.amount} onChange={(e) => setI("amount", e.target.value)} placeholder="20000" /></Field>
          <Field label="বিবরণ"><Input value={incForm.description} onChange={(e) => setI("description", e.target.value)} placeholder="বিবরণ লিখুন" /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeInc}>বাতিল</Button>
            <Button onClick={saveInc}>💾 সংরক্ষণ</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialogs */}
      <ConfirmDialog isOpen={!!deleteExp} message={`"${deleteExp?.description}" খরচটি মুছে ফেলবেন?`}
        onCancel={() => setDeleteExp(null)} onConfirm={() => { deleteExpense(deleteExp._id || deleteExp.id); setDeleteExp(null); }} />
      <ConfirmDialog isOpen={!!deleteInc} message={`"${deleteInc?.description}" আয়টি মুছে ফেলবেন?`}
        onCancel={() => setDeleteInc(null)} onConfirm={() => { deleteIncome(deleteInc._id || deleteInc.id); setDeleteInc(null); }} />
    </div>
  );
}
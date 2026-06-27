import { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const Field = ({ label, children }) => (
  <div><label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1">{label}</label>{children}</div>
);
const Input = (props) => (
  <input {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm" />
);
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 transition-colors shadow-sm">
    {children}
  </select>
);

const EMPTY = { date: new Date().toISOString().slice(0, 10), cattleId: "", produced: "", sold: "", pricePerLiter: "70" };

export default function DairyLog() {
  const { cattle, milkLogs, addMilkLog, updateMilkLog, deleteMilkLog } = useApp();
  const { t, language } = useLanguage();
  const { hasAccess } = useAuth();

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [highlightedId, setHighlightedId] = useState(null);

  const canEdit   = hasAccess("worker");
  const canDelete = hasAccess("admin");

  // সার্চ থেকে প্রবেশ করলে হাইলাইট আইডি ডিটেক্ট করার জন্য
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
  }, [milkLogs]);

  const dairyCows = cattle?.filter(c => c.type === "dairy" && c.status !== "sold" && c.status !== "dead") || [];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openEdit = (log) => { 
    setEditTarget(log); 
    setForm({ 
      date: log.date, 
      cattleId: log.cattleId || "", 
      produced: log.produced, 
      sold: log.sold, 
      pricePerLiter: log.pricePerLiter 
    }); 
  };
  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY); };

  const handleSave = async () => {
    const selectedCow = dairyCows.find(c => c._id === form.cattleId);
    
    const data = { 
      date: form.date, 
      cattleId: form.cattleId || null,
      tagId: selectedCow ? selectedCow.tagId : (language === "bn" ? "ফার্মের মোট" : "Total Farm"),
      cowName: selectedCow ? selectedCow.name : (language === "bn" ? "সব গরু" : "All Cattle"),
      produced: Number(form.produced), 
      sold: Number(form.sold) || 0, 
      pricePerLiter: Number(form.pricePerLiter) || 0 
    };

    if (editTarget) {
      if (updateMilkLog) await updateMilkLog(editTarget._id || editTarget.id, data);
    } else {
      if (addMilkLog) await addMilkLog(data);
    }
    closeForm();
  };

  const fmt = (n) => n.toLocaleString(language === "bn" ? "bn-BD" : "en-BD");

  const totalProduced = milkLogs?.reduce((s, l) => s + (Number(l.produced) || 0), 0) || 0;
  const totalSold     = milkLogs?.reduce((s, l) => s + (Number(l.sold) || 0), 0) || 0;
  const totalRevenue  = milkLogs?.reduce((s, l) => s + (Number(l.sold) * Number(l.pricePerLiter) || 0), 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white">{t("dairy")}</h2>
          <p className="text-[#64748B] dark:text-slate-500 text-sm">{language === "bn" ? "দৈনিক দুধের হিসাব" : "Daily Milk Records"}</p>
        </div>
        {canEdit && <Button onClick={() => setShowForm(true)}>+ {t("addMilkEntry")}</Button>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: `${t("produced")}`, value: `${totalProduced} L`, color: "text-sky-600 dark:text-sky-400" },
          { label: `${t("sold")}`,     value: `${totalSold} L`,     color: "text-[#10B981] dark:text-emerald-400" },
          { label: language === "bn" ? "মোট আয়" : "Total Revenue", value: `৳${fmt(totalRevenue)}`, color: "text-[#F59E0B] dark:text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl p-4 text-center">
            {/* এই লাইনটিতেই মূলত টাইপিং মিস্টেকটি হয়েছিল যা এখন ঠিক করা হয়েছে */}
            <p className="text-[#64748B] dark:text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/50">
                {[t("date"), language === "bn" ? "উৎস/গাভী" : "Source/Cattle", `${t("produced")} (L)`, `${t("sold")} (L)`, `${t("stock")} (L)`, t("pricePerLiter"), language === "bn" ? "আয়" : "Revenue", t("action")].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30">
              {milkLogs?.map((log) => {
                const isHighlighted = log._id === highlightedId || log.id === highlightedId;
                return (
                  <tr key={log._id || log.id} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20 dark:border-amber-400 animate-pulse font-medium text-amber-900 dark:text-amber-200" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
                    <td className="px-4 py-3 text-[#1A1A2E] dark:text-slate-300 text-sm">{log.date}</td>
                    <td className="px-4 py-3 text-[#F59E0B] dark:text-amber-400 text-sm font-mono">{log.tagId}</td>
                    <td className="px-4 py-3 text-sky-600 dark:text-sky-400 font-medium">{log.produced}</td>
                    <td className="px-4 py-3 text-[#10B981] dark:text-emerald-400 font-medium">{log.sold}</td>
                    <td className="px-4 py-3 text-[#64748B] dark:text-slate-400">{log.produced - log.sold}</td>
                    <td className="px-4 py-3 text-[#64748B] dark:text-slate-300">৳{log.pricePerLiter}</td>
                    <td className="px-4 py-3 text-[#F59E0B] dark:text-amber-400 font-semibold">৳{fmt(log.sold * log.pricePerLiter)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canEdit && <button onClick={() => openEdit(log)} className="px-2 py-1 rounded text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10">✏️ {t("edit")}</button>}
                        {canDelete && <button onClick={() => setDeleteTarget(log)} className="px-2 py-1 rounded text-xs text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10">🗑️</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!milkLogs || milkLogs.length === 0) && (
                <tr><td colSpan={8} className="text-center py-8 text-[#94A3B8] dark:text-slate-500">{t("noData")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm || !!editTarget} onClose={closeForm} title={editTarget ? (language === "bn" ? "এন্ট্রি এডিট করুন" : "Edit Entry") : t("addMilkEntry")}>
        <div className="space-y-4">
          <Field label={t("date")}><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label={language === "bn" ? "কোন গাভীর দুধ? (ঐচ্ছিক)" : "Which Cow? (Optional)"}>
            <Select value={form.cattleId} onChange={(e) => set("cattleId", e.target.value)}>
              <option value="">-- {language === "bn" ? "ফার্মের মোট হিসাব" : "Total Farm"} --</option>
              {dairyCows.map(c => <option key={c._id} value={c._id}>{c.tagId} - {c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("produced")} (L)`}><Input type="number" value={form.produced} onChange={(e) => set("produced", e.target.value)} placeholder="50" /></Field>
            <Field label={`${t("sold")} (L)`}><Input type="number" value={form.sold} onChange={(e) => set("sold", e.target.value)} placeholder="45" /></Field>
          </div>
          <Field label={`${t("pricePerLiter")} (৳)`}><Input type="number" value={form.pricePerLiter} onChange={(e) => set("pricePerLiter", e.target.value)} placeholder="70" /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeForm}>{t("cancel")}</Button>
            <Button onClick={handleSave}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} message={language === "bn" ? "এই রেকর্ডটি মুছে ফেলবেন?" : "Delete this record?"} onCancel={() => setDeleteTarget(null)} onConfirm={() => { deleteMilkLog(deleteTarget._id || deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
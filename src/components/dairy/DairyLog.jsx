import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const Field = ({ label, children }) => (
  <div><label className="text-slate-400 text-xs block mb-1">{label}</label>{children}</div>
);
const Input = (props) => (
  <input {...props} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500" />
);
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60">
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

  const canEdit   = hasAccess("worker");
  const canDelete = hasAccess("admin");

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
          <h2 className="text-xl font-bold text-white">{t("dairy")}</h2>
          <p className="text-slate-500 text-sm">{language === "bn" ? "দৈনিক দুধের হিসাব" : "Daily Milk Records"}</p>
        </div>
        {canEdit && <Button onClick={() => setShowForm(true)}>+ {t("addMilkEntry")}</Button>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: `${t("produced")}`, value: `${totalProduced} L`, color: "text-sky-400" },
          { label: `${t("sold")}`,     value: `${totalSold} L`,     color: "text-emerald-400" },
          { label: language === "bn" ? "মোট আয়" : "Total Revenue", value: `৳${fmt(totalRevenue)}`, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {[t("date"), language === "bn" ? "উৎস/গাভী" : "Source/Cattle", `${t("produced")} (L)`, `${t("sold")} (L)`, `${t("stock")} (L)`, t("pricePerLiter"), language === "bn" ? "আয়" : "Revenue", t("action")].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {milkLogs?.map((log) => (
                <tr key={log._id || log.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300 text-sm">{log.date}</td>
                  <td className="px-4 py-3 text-amber-400 text-sm font-mono">{log.tagId}</td>
                  <td className="px-4 py-3 text-sky-400 font-medium">{log.produced}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">{log.sold}</td>
                  <td className="px-4 py-3 text-slate-400">{log.produced - log.sold}</td>
                  <td className="px-4 py-3 text-slate-300">৳{log.pricePerLiter}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">৳{fmt(log.sold * log.pricePerLiter)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canEdit && <button onClick={() => openEdit(log)} className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-sky-400/10 transition-all">✏️ {t("edit")}</button>}
                      {canDelete && <button onClick={() => setDeleteTarget(log)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10 transition-all">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {(!milkLogs || milkLogs.length === 0) && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">{t("noData")}</td></tr>
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
import { useState } from "react";
import CattleDocuments from "./CattleDocuments"; // নতুন কম্পোনেন্ট ইমপোর্ট
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import WeightTracker from "./WeightTracker";
import { useLanguage } from "../../contexts/LanguageContext";
import { generateCattleReport } from "../../utils/pdfGenerator";
import { useApp } from "../../contexts/AppContext";

const EMPTY_VAC = { name: "", date: "", nextDue: "" };

const Input = (p) => (
  <input
    {...p}
    className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm dark:shadow-none"
  />
);

export default function CattleProfile({ cattle, onEdit }) {
  const { t } = useLanguage();
  const { updateCattle, addToast } = useApp();

  const [showVacForm, setShowVacForm] = useState(false);
  const [editingIdx,  setEditingIdx]  = useState(null);
  const [vacForm,     setVacForm]     = useState(EMPTY_VAC);
  const [deleteIdx,   setDeleteIdx]   = useState(null);

  const setV = (k, v) => setVacForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setVacForm(EMPTY_VAC);
    setEditingIdx(null);
    setShowVacForm(true);
  };

  const openEdit = (idx) => {
    setVacForm({ ...cattle.vaccineHistory[idx] });
    setEditingIdx(idx);
    setShowVacForm(true);
  };

  const handleSaveVac = async () => {
    if (!vacForm.name || !vacForm.date || !vacForm.nextDue) {
      addToast("সব তথ্য পূরণ করুন", "error");
      return;
    }
    const list = [...(cattle.vaccineHistory || [])];
    if (editingIdx !== null) {
      list[editingIdx] = vacForm;
    } else {
      list.push(vacForm);
    }
    
    const cattleId = cattle._id || cattle.id; 
    await updateCattle(cattleId, { vaccineHistory: list });
    
    setShowVacForm(false);
    addToast(editingIdx !== null ? "টিকার তথ্য আপডেট হয়েছে ✓" : "নতুন টিকা যুক্ত হয়েছে ✓");
  };

  const handleDeleteVac = async (idx) => {
    const list = (cattle.vaccineHistory || []).filter((_, i) => i !== idx);
    const cattleId = cattle._id || cattle.id;
    await updateCattle(cattleId, { vaccineHistory: list });
    
    setDeleteIdx(null);
    addToast("টিকার রেকর্ড মুছে ফেলা হয়েছে", "error");
  };

  const handleExportPDF = () => {
    try {
      generateCattleReport(cattle);
      addToast("PDF ডাউনলোড হচ্ছে...");
    } catch (e) {
      addToast("PDF তৈরিতে সমস্যা হয়েছে", "error");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── ছবি (যদি থাকে) ── */}
      {cattle.photo && (
        <div className="w-full h-44 rounded-xl overflow-hidden border border-[#E8E6DE] dark:border-slate-700/40 transition-colors">
          <img src={cattle.photo} alt={cattle.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* ── মূল তথ্য ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t("tagId"),         value: cattle.tagId },
          { label: t("breed"),         value: cattle.breed },
          { label: t("age"),           value: `${cattle.age} বছর` },
          { label: t("purchaseDate"),  value: cattle.purchaseDate },
          { label: t("purchasePrice"), value: `৳${cattle.purchasePrice?.toLocaleString("bn-BD") || "—"}` },
          { label: t("type"),          value: cattle.type === "dairy" ? t("dairy") : t("fattening") },
        ].map((item) => (
          <div key={item.label} className="bg-[#F5F4EF] dark:bg-slate-700/30 rounded-lg px-3 py-2.5 transition-colors">
            <p className="text-[#64748B] dark:text-slate-500 text-xs mb-0.5 transition-colors">{item.label}</p>
            <p className="text-[#1A1A2E] dark:text-white text-sm font-medium transition-colors">{item.value}</p>
          </div>
        ))}
      </div>

      {/* ── অবস্থা ── */}
      <div className="flex items-center gap-2">
        <span className="text-[#64748B] dark:text-slate-400 text-sm transition-colors">{t("status")}:</span>
        <Badge
          status={cattle.status}
          label={
            cattle.status === "healthy" ? t("healthy")
            : cattle.status === "sick"  ? t("sick")
            : t("forSale")
          }
        />
      </div>

      {/* ── ওজন ট্র্যাকার ── */}
      {cattle.weight?.length > 0 && (
        <div className="bg-[#FFFFFF] dark:bg-slate-700/20 border border-[#E8E6DE] dark:border-transparent rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
          <p className="text-[#1A1A2E] dark:text-white font-semibold text-sm mb-3 transition-colors">📊 ওজন ট্র্যাকার</p>
          <WeightTracker cattle={cattle} />
        </div>
      )}

      {/* ── টিকার ইতিহাস ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#1A1A2E] dark:text-slate-300 text-sm font-semibold transition-colors">💉 টিকার ইতিহাস</p>
          <button
            onClick={openAdd}
            className="text-xs px-3 py-1.5 bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400 border border-[#F59E0B]/20 dark:border-amber-400/20 rounded-lg hover:bg-[#F59E0B]/15 dark:hover:bg-amber-400/15 transition-all"
          >
            + নতুন টিকা
          </button>
        </div>

        {/* টিকা যোগ/এডিট ফর্ম */}
        {showVacForm && (
          <div className="bg-[#F5F4EF] dark:bg-slate-700/30 border border-[#E8E6DE] dark:border-slate-600/40 rounded-xl p-4 mb-3 space-y-3 transition-colors">
            <p className="text-[#1A1A2E] dark:text-white text-xs font-semibold transition-colors">
              {editingIdx !== null ? "✏️ টিকার তথ্য এডিট করুন" : "➕ নতুন টিকা যুক্ত করুন"}
            </p>
            <div>
              <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">টিকার নাম</label>
              <Input
                value={vacForm.name}
                onChange={(e) => setV("name", e.target.value)}
                placeholder="যেমন: FMD, HS, BQ, Anthrax..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">দেওয়ার তারিখ</label>
                <Input
                  type="date"
                  value={vacForm.date}
                  onChange={(e) => setV("date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">পরবর্তী তারিখ</label>
                <Input
                  type="date"
                  value={vacForm.nextDue}
                  onChange={(e) => setV("nextDue", e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowVacForm(false)}
                className="px-3 py-1.5 text-xs text-[#64748B] dark:text-slate-400 hover:text-[#1A1A2E] dark:hover:text-white bg-[#E8E6DE] dark:bg-slate-700/50 rounded-lg transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveVac}
                className="px-3 py-1.5 text-xs font-semibold bg-[#F59E0B] text-white dark:bg-gradient-to-r dark:from-amber-400 dark:to-amber-500 dark:text-slate-900 rounded-lg hover:bg-[#D97706] dark:hover:from-amber-300 transition-all"
              >
                💾 সংরক্ষণ
              </button>
            </div>
          </div>
        )}

        {/* ডিলিট confirm */}
        {deleteIdx !== null && (
          <div className="bg-[#EF4444]/10 dark:bg-red-400/10 border border-[#EF4444]/20 dark:border-red-400/20 rounded-xl p-3 mb-3 flex items-center justify-between gap-3 transition-colors">
            <p className="text-[#EF4444] dark:text-red-300 text-xs font-medium transition-colors">এই টিকার রেকর্ড মুছে ফেলবেন?</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setDeleteIdx(null)}
                className="px-2.5 py-1 text-xs text-[#64748B] dark:text-slate-400 hover:text-[#1A1A2E] dark:hover:text-white bg-[#E8E6DE] dark:bg-slate-700/50 rounded-lg transition-all"
              >
                না
              </button>
              <button
                onClick={() => handleDeleteVac(deleteIdx)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#EF4444] dark:bg-red-500 hover:bg-[#DC2626] dark:hover:bg-red-400 rounded-lg transition-all"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        )}

        {/* টিকার তালিকা */}
        {!cattle.vaccineHistory?.length ? (
          <div className="text-center py-6 bg-[#F5F4EF] dark:bg-slate-700/20 rounded-xl border border-dashed border-[#E8E6DE] dark:border-slate-600/40 transition-colors">
            <p className="text-2xl mb-1">💉</p>
            <p className="text-[#64748B] dark:text-slate-500 text-sm transition-colors">এখনো কোনো টিকার রেকর্ড নেই</p>
            <p className="text-[#94A3B8] dark:text-slate-600 text-xs mt-1 transition-colors">উপরের "+ নতুন টিকা" বাটনে ক্লিক করুন</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cattle.vaccineHistory.map((v, i) => {
              const daysLeft = Math.ceil(
                (new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#FFFFFF] dark:bg-slate-700/20 rounded-lg px-3 py-2.5 border border-[#E8E6DE] dark:border-slate-700/30 hover:border-[#94A3B8] dark:hover:border-slate-600/50 transition-colors group shadow-sm dark:shadow-none"
                >
                  <div>
                    <p className="text-[#1A1A2E] dark:text-white text-sm font-medium transition-colors">{v.name}</p>
                    <p className="text-[#64748B] dark:text-slate-500 text-xs transition-colors">দেওয়া হয়েছে: {v.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[#94A3B8] dark:text-slate-400 text-xs transition-colors">পরবর্তী: {v.nextDue}</p>
                      <span className={`text-xs font-semibold transition-colors ${
                        daysLeft <= 0  ? "text-[#EF4444] dark:text-red-400"
                        : daysLeft <= 7  ? "text-[#EF4444] dark:text-red-400"
                        : daysLeft <= 30 ? "text-[#F59E0B] dark:text-amber-400"
                        : "text-[#10B981] dark:text-emerald-400"
                      }`}>
                        {daysLeft <= 0 ? "মেয়াদ শেষ !" : `${daysLeft} দিন বাকি`}
                      </span>
                    </div>
                    {/* এডিট / ডিলিট — hover এ দেখা যাবে */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all text-xs"
                        title="এডিট"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteIdx(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all text-xs"
                        title="মুছুন"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── নোট ── */}
      {cattle.notes && (
        <div className="bg-[#F59E0B]/5 dark:bg-amber-400/5 border border-[#F59E0B]/20 dark:border-amber-400/15 rounded-lg px-4 py-3 transition-colors">
          <p className="text-[#F59E0B] dark:text-amber-400 text-xs font-semibold mb-1 transition-colors">📝 নোট</p>
          <p className="text-[#1A1A2E] dark:text-slate-300 text-sm transition-colors">{cattle.notes}</p>
        </div>
      )}

      {/* ── ডকুমেন্ট সংরক্ষণ সেকশন ── */}
      <CattleDocuments 
        cattleId={cattle._id || cattle.id} 
        existingDocuments={cattle.documents || []} 
      />

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E8E6DE] dark:border-slate-700/40 transition-colors mt-6">
        {onEdit && (
          <Button variant="secondary" size="sm" onClick={onEdit}>
            ✏️ তথ্য এডিট করুন
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          📄 PDF ডাউনলোড
        </Button>
      </div>

    </div>
  );
}
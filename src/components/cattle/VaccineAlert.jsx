import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useState } from "react";

function urgencyStyle(daysLeft) {
  if (daysLeft <= 3)  return { bar: "bg-red-500", badge: "bg-red-400/15 text-red-400 border-red-400/25", icon: "🚨" };
  if (daysLeft <= 7)  return { bar: "bg-orange-500", badge: "bg-orange-400/15 text-orange-400 border-orange-400/25", icon: "⚠️" };
  if (daysLeft <= 14) return { bar: "bg-amber-400", badge: "bg-amber-400/15 text-amber-400 border-amber-400/25", icon: "💉" };
  return { bar: "bg-emerald-500", badge: "bg-emerald-400/15 text-emerald-400 border-emerald-400/25", icon: "✅" };
}

export default function VaccineAlert({ isOpen, onClose }) {
  const { stats } = useApp();
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");

  const vaccines = stats.upcomingVaccines;

  const filtered = vaccines.filter((v) => {
    const days = Math.ceil((new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24));
    if (filter === "urgent") return days <= 7;
    if (filter === "soon")   return days > 7 && days <= 14;
    if (filter === "later")  return days > 14;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="আসন্ন টিকার সময়সূচি" size="md">
      <div className="space-y-4">
        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all",    label: `সব (${vaccines.length})` },
            { key: "urgent", label: "জরুরি (≤৭ দিন)" },
            { key: "soon",   label: "近জল্দি (৮-১৪)" },
            { key: "later",  label: "পরে (>১৪)" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                filter === f.key
                  ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                  : "bg-slate-700/40 text-slate-400 border-slate-600/40 hover:border-slate-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-slate-400 text-sm">এই ফিল্টারে কোনো টিকা নেই</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((v, i) => {
              const daysLeft = Math.ceil((new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24));
              const { bar, badge, icon } = urgencyStyle(daysLeft);
              const pct = Math.min(100, Math.max(0, ((30 - daysLeft) / 30) * 100));

              return (
                <div
                  key={i}
                  className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/60 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-mono font-semibold text-sm">
                            {v.cattleTag}
                          </span>
                          <span className="text-white text-sm">{v.cattleName}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{v.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge}`}>
                      {daysLeft} দিন বাকি
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                    <span>শেষ: {v.date}</span>
                    <span>পরবর্তী: <span className="text-slate-300">{v.nextDue}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>{t("close")}</Button>
        </div>
      </div>
    </Modal>
  );
}

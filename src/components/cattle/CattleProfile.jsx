import { useState, useEffect } from "react";
import CattleDocuments from "./CattleDocuments";
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
    className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm"
  />
);

export default function CattleProfile({ cattle, onEdit }) {
  const { t, language } = useLanguage();
  const { updateCattle, addToast } = useApp();

  // টিকার স্টেট
  const [showVacForm, setShowVacForm] = useState(false);
  const [editingIdx,  setEditingIdx]  = useState(null);
  const [vacForm,     setVacForm]     = useState(EMPTY_VAC);
  const [deleteIdx,   setDeleteIdx]   = useState(null);

  // প্রজনন ও প্রেগনেন্সি স্টেট
  const [showBreedForm, setShowBreedForm] = useState(false);
  const [breedForm, setBreedForm] = useState({
    breedingDate: cattle.breedingInfo?.breedingDate || "",
    semenBreed: cattle.breedingInfo?.semenBreed || "",
    status: cattle.breedingInfo?.status || "pending", // pending, positive, negative
    expectedDelivery: cattle.breedingInfo?.expectedDelivery || ""
  });

  const setV = (k, v) => setVacForm((p) => ({ ...p, [k]: v }));

  // ── অটোমেটেড ক্যালকুলেশন লজিক ──
  // বীজ দেওয়ার তারিখ ইনপুট দিলে অটোমেটিক বাছুর হওয়ার সম্ভাব্য তারিখ (২৮৩ দিন পর) হিসাব করা
  useEffect(() => {
    if (breedForm.breedingDate && !cattle.breedingInfo?.expectedDelivery) {
      const bDate = new Date(breedForm.breedingDate);
      bDate.setDate(bDate.getDate() + 283); // গরুর গর্ভধারণকাল সাধারণত ২৮৩ দিন
      setBreedForm(p => ({ ...p, expectedDelivery: bDate.toISOString().slice(0, 10) }));
    }
  }, [breedForm.breedingDate]);

  const handleSaveBreed = async () => {
    const cattleId = cattle._id || cattle.id;
    await updateCattle(cattleId, { breedingInfo: breedForm });
    setShowBreedForm(false);
    addToast(language === "bn" ? "প্রজনন তথ্য সংরক্ষিত হয়েছে ✓" : "Breeding info saved ✓");
  };

  const openAdd = () => { setVacForm(EMPTY_VAC); setEditingIdx(null); setShowVacForm(true); };
  const openEdit = (idx) => { setVacForm({ ...cattle.vaccineHistory[idx] }); setEditingIdx(idx); setShowVacForm(true); };

  const handleSaveVac = async () => {
    if (!vacForm.name || !vacForm.date || !vacForm.nextDue) {
      addToast("সব তথ্য পূরণ করুন", "error");
      return;
    }
    const list = [...(cattle.vaccineHistory || [])];
    if (editingIdx !== null) { list[editingIdx] = vacForm; } 
    else { list.push(vacForm); }
    
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

  // QR Code URL
  const appUrl = window.location.origin; 
  const profileLink = `${appUrl}/?viewCattle=${cattle._id || cattle.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileLink)}`;
  
  // ── স্মার্ট প্রেগন্যান্সি ট্র্যাকিং ক্যালকুলেশন ──
  let daysPregnant = 0;
  let daysLeft = null;
  let progressPercentage = 0;

  if (cattle.breedingInfo?.status === "positive" && cattle.breedingInfo?.breedingDate) {
    const bDate = new Date(cattle.breedingInfo.breedingDate);
    const today = new Date();
    
    // কত দিন গর্ভবতী (Current Date - Breeding Date)
    daysPregnant = Math.max(0, Math.floor((today - bDate) / (1000 * 60 * 60 * 24)));
    
    if (cattle.breedingInfo.expectedDelivery) {
      const eDate = new Date(cattle.breedingInfo.expectedDelivery);
      daysLeft = Math.ceil((eDate - today) / (1000 * 60 * 60 * 24));
    } else {
      daysLeft = 283 - daysPregnant;
    }
    
    // প্রোগ্রেস পার্সেন্টেজ (সর্বোচ্চ ১০০%)
    progressPercentage = Math.min(100, Math.max(0, (daysPregnant / 283) * 100));
  }

  return (
    <div className="space-y-5">
      {/* ── ১. স্মার্ট ট্যাগিং (QR Code Card) ── */}
      <div className="bg-[#FAFAF7] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E8E6DE] dark:border-slate-700/50 flex flex-col sm:flex-row items-center gap-4 transition-colors">
        <div className="bg-white p-2 rounded-lg border border-[#E8E6DE] shadow-sm flex-shrink-0">
          <img src={qrCodeUrl} alt="Cattle QR Tag" className="w-28 h-28" />
        </div>
        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <h4 className="text-sm font-bold text-[#1A1A2E] dark:text-white">{language === "bn" ? "ডিজিটাল স্মার্ট ট্যাগ (QR Code)" : "Digital Smart Tag"}</h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            {language === "bn" ? "এই কিউআর কোডটি প্রিন্ট করে গরুর গলার ট্যাগে ব্যবহার করতে পারবেন। যেকোনো মোবাইল দিয়ে স্ক্যান করলেই এই প্রোফাইলটি দেখা যাবে।" : "Print this QR code for the cattle collar tag to quickly access profile data."}
          </p>
          <button onClick={() => window.print()} className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 border border-[#E8E6DE] dark:border-slate-600 rounded-md text-[#1A1A2E] dark:text-slate-200 hover:bg-[#F5F4EF] transition-all">
            🖨️ {language === "bn" ? "ট্যাগ প্রিন্ট করুন" : "Print Tag"}
          </button>
        </div>
      </div>

      {/* ছবি */}
      {cattle.photo && (
        <div className="w-full h-44 rounded-xl overflow-hidden border border-[#E8E6DE] dark:border-slate-700/40">
          <img src={cattle.photo} alt={cattle.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* মূল তথ্য */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t("tagId"),         value: cattle.tagId },
          { label: t("breed"),         value: cattle.breed },
          { label: t("age"),           value: `${cattle.age} বছর` },
          { label: t("purchaseDate"),  value: cattle.purchaseDate },
          { label: t("purchasePrice"), value: `৳${cattle.purchasePrice?.toLocaleString("bn-BD") || "—"}` },
          { label: t("type"),          value: cattle.type === "dairy" ? t("dairy") : t("fattening") },
        ].map((item) => (
          <div key={item.label} className="bg-[#F5F4EF] dark:bg-slate-700/30 rounded-lg px-3 py-2.5">
            <p className="text-[#64748B] dark:text-slate-500 text-xs mb-0.5">{item.label}</p>
            <p className="text-[#1A1A2E] dark:text-white text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {/* অবস্থা */}
      <div className="flex items-center gap-2">
        <span className="text-[#64748B] dark:text-slate-400 text-sm">{t("status")}:</span>
        <Badge status={cattle.status} label={cattle.status === "healthy" ? t("healthy") : cattle.status === "sick" ? t("sick") : t("forSale")} />
      </div>

      {/* ── ২. প্রজনন ও প্রেগনেন্সি ট্র্যাকার সেকশন ── */}
      {cattle.type === "dairy" && (
        <div className="bg-[#FFFFFF] dark:bg-slate-800/30 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#1A1A2E] dark:text-white font-semibold text-sm">🤰 {language === "bn" ? "প্রজনন ও গর্ভধারণ রেকর্ড" : "Breeding & Pregnancy"}</p>
            <button onClick={() => setShowBreedForm(!showBreedForm)} className="text-xs px-2.5 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-lg font-medium transition-colors hover:bg-purple-100">
              {showBreedForm ? t("cancel") : `✏️ ${language === "bn" ? "রেকর্ড আপডেট" : "Edit Record"}`}
            </button>
          </div>

          {showBreedForm ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#64748B] dark:text-slate-400 block mb-1">{language === "bn" ? "বীজ দেওয়ার তারিখ" : "Breeding Date"}</label>
                  <Input type="date" value={breedForm.breedingDate} onChange={(e) => setBreedForm({ ...breedForm, breedingDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#64748B] dark:text-slate-400 block mb-1">{language === "bn" ? "ষাঁড়ের জাত / সিমেন নং" : "Semen Breed/ID"}</label>
                  <Input type="text" placeholder="e.g. HF-100" value={breedForm.semenBreed} onChange={(e) => setBreedForm({ ...breedForm, semenBreed: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#64748B] dark:text-slate-400 block mb-1">{language === "bn" ? "গর্ভধারণের অবস্থা" : "Pregnancy Status"}</label>
                  <select value={breedForm.status} onChange={(e) => setBreedForm({ ...breedForm, status: e.target.value })} className="w-full bg-white dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] dark:text-white focus:outline-none focus:border-[#F59E0B]">
                    <option value="pending">{language === "bn" ? "ফলাফল পেন্ডিং" : "Pending Check"}</option>
                    <option value="positive">{language === "bn" ? "পজিটিভ (গর্ভবতী)" : "Positive (Pregnant)"}</option>
                    <option value="negative">{language === "bn" ? "নেগেটিভ" : "Negative"}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] dark:text-slate-400 block mb-1">{language === "bn" ? "সম্ভাব্য ডেলিভারি (অটোমেটিক)" : "Expected Delivery"}</label>
                  <Input type="date" value={breedForm.expectedDelivery} onChange={(e) => setBreedForm({ ...breedForm, expectedDelivery: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSaveBreed}>💾 {t("save")}</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-[#F5F4EF]/50 dark:bg-slate-900/20 p-2.5 rounded-lg border border-[#E8E6DE] dark:border-slate-700/50">
                <span className="text-[#64748B]">{language === "bn" ? "সর্বশেষ প্রজনন:" : "Last Bred:"}</span>
                <p className="font-semibold text-[#1A1A2E] dark:text-slate-300 mt-1">{cattle.breedingInfo?.breedingDate || "—"}</p>
                {cattle.breedingInfo?.semenBreed && <p className="text-[10px] text-slate-400 mt-0.5">Semen: {cattle.breedingInfo.semenBreed}</p>}
              </div>
              <div className="bg-[#F5F4EF]/50 dark:bg-slate-900/20 p-2.5 rounded-lg border border-[#E8E6DE] dark:border-slate-700/50">
                <span className="text-[#64748B] block mb-1">{language === "bn" ? "অবস্থা:" : "Status:"}</span>
                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-wide ${cattle.breedingInfo?.status === "positive" ? "bg-emerald-100 text-emerald-700" : cattle.breedingInfo?.status === "negative" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {cattle.breedingInfo?.status === "positive" ? (language === "bn" ? "✅ কনফার্মড গর্ভবতী" : "✅ Pregnant") : cattle.breedingInfo?.status === "negative" ? "❌ নেগেটিভ" : (language === "bn" ? "⏳ চেকআপ বাকি" : "⏳ Pending Check")}
                </span>
              </div>
              
              {/* ── নতুন অ্যাডভান্সড প্রেগন্যান্সি প্রোগ্রেস কার্ড ── */}
              {cattle.breedingInfo?.status === "positive" && (
                <div className="col-span-2 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 mt-2 shadow-[inset_0_0_15px_rgba(168,85,247,0.05)]">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-purple-600/80 dark:text-purple-400/80 text-[10px] font-bold uppercase tracking-widest mb-1">
                        {language === "bn" ? "সম্ভাব্য ডেলিভারি (EDD)" : "Expected Delivery (EDD)"}
                      </p>
                      <p className="font-extrabold text-purple-700 dark:text-purple-300 text-xl leading-none">
                        {cattle.breedingInfo.expectedDelivery}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-md shadow-sm ${daysLeft <= 15 ? "bg-red-500 text-white animate-pulse shadow-red-500/30" : "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30"}`}>
                        {daysLeft <= 0 ? (language === "bn" ? "যেকোনো সময় ডেলিভারি!" : "Delivery Due!") : `${daysLeft} ${language === "bn" ? "দিন বাকি" : "days left"}`}
                      </span>
                    </div>
                  </div>

                  {/* প্রোগ্রেস বার */}
                  <div className="relative pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-purple-600/80 dark:text-purple-400/80 mb-1.5">
                      <span>{language === "bn" ? "গর্ভধারণ:" : "Pregnant:"} {daysPregnant} {language === "bn" ? "দিন" : "days"}</span>
                      <span>{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-purple-200/50 dark:bg-purple-900/40 rounded-full h-3 overflow-hidden border border-purple-100 dark:border-purple-800/50">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                        style={{ width: `${progressPercentage}%` }}
                      >
                        {/* Shimmer effect inside the bar */}
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-purple-500/70 dark:text-purple-400/60 mt-1.5 font-bold tracking-wide uppercase">
                      <span>{language === "bn" ? "১ম দিন" : "Day 1"}</span>
                      <span>{language === "bn" ? "২৮৩ দিন (ফুল টার্ম)" : "283 Days (Full Term)"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ওজন ট্র্যাকার */}
      {cattle.weight?.length > 0 && (
        <div className="bg-[#FFFFFF] dark:bg-slate-700/20 border border-[#E8E6DE] dark:border-transparent rounded-xl p-4 shadow-sm">
          <p className="text-[#1A1A2E] dark:text-white font-semibold text-sm mb-3">📊 ওজন ট্র্যাকার</p>
          <WeightTracker cattle={cattle} />
        </div>
      )}

      {/* টিকার ইতিহাস */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#1A1A2E] dark:text-slate-300 text-sm font-semibold">💉 টিকার ইতিহাস</p>
          <button onClick={openAdd} className="text-xs px-3 py-1.5 bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400 border border-[#F59E0B]/20 dark:border-amber-400/20 rounded-lg hover:bg-[#F59E0B]/15 transition-all">+ নতুন টিকা</button>
        </div>

        {showVacForm && (
          <div className="bg-[#F5F4EF] dark:bg-slate-700/30 border border-[#E8E6DE] dark:border-slate-600/40 rounded-xl p-4 mb-3 space-y-3">
            <p className="text-[#1A1A2E] dark:text-white text-xs font-semibold">{editingIdx !== null ? "✏️ টিকার তথ্য এডিট করুন" : "➕ নতুন টিকা যুক্ত করুন"}</p>
            <div>
              <label className="text-[#64748B] text-xs block mb-1">টিকার নাম</label>
              <Input value={vacForm.name} onChange={(e) => setV("name", e.target.value)} placeholder="যেমন: FMD, HS, BQ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#64748B] text-xs block mb-1">দেওয়ার তারিখ</label>
                <Input type="date" value={vacForm.date} onChange={(e) => setV("date", e.target.value)} />
              </div>
              <div>
                <label className="text-[#64748B] text-xs block mb-1">পরবর্তী তারিখ</label>
                <Input type="date" value={vacForm.nextDue} onChange={(e) => setV("nextDue", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowVacForm(false)} className="px-3 py-1.5 text-xs text-[#64748B] bg-[#E8E6DE] dark:bg-slate-700/50 rounded-lg">বাতিল</button>
              <button onClick={handleSaveVac} className="px-3 py-1.5 text-xs font-semibold bg-[#F59E0B] text-white rounded-lg">💾 সংরক্ষণ</button>
            </div>
          </div>
        )}

        {deleteIdx !== null && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-3 mb-3 flex items-center justify-between gap-3">
            <p className="text-[#EF4444] text-xs font-medium">এই টিকার রেকর্ড মুছে ফেলবেন?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteIdx(null)} className="px-2.5 py-1 text-xs text-[#64748B] bg-[#E8E6DE] rounded-lg">না</button>
              <button onClick={() => handleDeleteVac(deleteIdx)} className="px-2.5 py-1 text-xs font-semibold text-white bg-[#EF4444] rounded-lg">হ্যাঁ, মুছুন</button>
            </div>
          </div>
        )}

        {!cattle.vaccineHistory?.length ? (
          <div className="text-center py-6 bg-[#F5F4EF] dark:bg-slate-700/20 rounded-xl border border-dashed border-[#E8E6DE] dark:border-slate-600/40">
            <p className="text-2xl mb-1">💉</p>
            <p className="text-[#64748B] text-sm">এখনো কোনো টিকার রেকর্ড নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cattle.vaccineHistory.map((v, i) => {
              const daysLeftVac = Math.ceil((new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} className="flex items-center justify-between bg-[#FFFFFF] dark:bg-slate-700/20 rounded-lg px-3 py-2.5 border border-[#E8E6DE] dark:border-slate-700/30 hover:border-[#94A3B8] group shadow-sm">
                  <div>
                    <p className="text-[#1A1A2E] dark:text-white text-sm font-medium">{v.name}</p>
                    <p className="text-[#64748B] text-xs">দেওয়া হয়েছে: {v.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[#94A3B8] text-xs">পরবর্তী: {v.nextDue}</p>
                      <span className={`text-xs font-semibold ${daysLeftVac <= 7 ? "text-[#EF4444]" : daysLeftVac <= 30 ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                        {daysLeftVac <= 0 ? "মেয়াদ শেষ !" : `${daysLeftVac} দিন বাকি`}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(i)} className="text-sky-600 text-xs">✏️</button>
                      <button onClick={() => setDeleteIdx(i)} className="text-[#EF4444] text-xs">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* নোট */}
      {cattle.notes && (
        <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg px-4 py-3">
          <p className="text-[#F59E0B] text-xs font-semibold mb-1">📝 নোট</p>
          <p className="text-[#1A1A2E] dark:text-slate-300 text-sm">{cattle.notes}</p>
        </div>
      )}

      {/* ডকুমেন্ট সংরক্ষণ সেকশন */}
      <CattleDocuments cattleId={cattle._id || cattle.id} existingDocuments={cattle.documents || []} />

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E8E6DE] dark:border-slate-700/40 mt-6">
        {onEdit && <Button variant="secondary" size="sm" onClick={onEdit}>✏️ তথ্য এডিট করুন</Button>}
        <Button variant="outline" size="sm" onClick={handleExportPDF}>📄 PDF ডাউনলোড</Button>
      </div>
    </div>
  );
}
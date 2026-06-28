import { useState, useEffect, useMemo } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";
import CattleProfile from "./CattleProfile";
import AddCattleForm from "./AddCattleForm";
import EditCattleForm from "./EditCattleForm";

// ── কাস্টম স্কেলিটন লোডার (Skeleton Loader) ──
function CattleSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((n) => (
        <tr key={n} className="animate-pulse border-b border-[#E8E6DE] dark:border-slate-700/50">
          <td className="px-3 py-3"><div className="w-10 h-10 bg-[#E8E6DE] dark:bg-slate-700/50 rounded-lg"></div></td>
          <td className="px-3 py-3"><div className="h-4 bg-[#E8E6DE] dark:bg-slate-700/50 rounded w-16"></div></td>
          <td className="px-3 py-3"><div className="h-4 bg-[#E8E6DE] dark:bg-slate-700/50 rounded w-24"></div></td>
          <td className="px-3 py-3"><div className="h-4 bg-[#E8E6DE] dark:bg-slate-700/50 rounded w-20"></div></td>
          <td className="px-3 py-3"><div className="h-4 bg-[#E8E6DE] dark:bg-slate-700/50 rounded w-12"></div></td>
          <td className="px-3 py-3"><div className="h-6 bg-[#E8E6DE] dark:bg-slate-700/50 rounded-full w-16"></div></td>
          <td className="px-3 py-3"><div className="h-4 bg-[#E8E6DE] dark:bg-slate-700/50 rounded w-20"></div></td>
        </tr>
      ))}
    </>
  );
}

export default function CattleList() {
  const { cattle, deleteCattle, fetchRealCattleData, sellCattle, markCattleDead } = useApp(); 
  const { t, language } = useLanguage();
  const { hasAccess } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // ফিল্টার ড্রয়ারের স্টেটসমূহ
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterBreed, setFilterBreed] = useState("all");
  const [sortBy, setSortBy] = useState("tagId");

  const [selectedCattle, setSelectedCattle] = useState(null);
  const [editingCattle, setEditingCattle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sellTarget, setSellTarget] = useState(null);
  const [deadTarget, setDeadTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  // ১ সেকেন্ডের আর্টিফিসিয়াল ডিলে সহ স্কেলিটন লোডার
  useEffect(() => {
    if (cattle && cattle.length > 0) {
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    } else if (cattle && cattle.length === 0) {
      setIsLoading(false);
    }
  }, [cattle]);
// QR Code স্ক্যান করে আসলে অটোমেটিক প্রোফাইল ওপেন করার লজিক
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get("viewCattle");
    
    if (viewId && cattle && cattle.length > 0) {
      // আইডি মিলিয়ে গরুটিকে খুঁজে বের করা
      const targetCattle = cattle.find(c => String(c._id) === viewId || String(c.id) === viewId);
      if (targetCattle) {
        setSelectedCattle(targetCattle); // প্রোফাইল ওপেন করা
        // URL থেকে স্ক্যানিং ট্যাগ সরিয়ে ফেলা (যাতে রিফ্রেশ দিলে বারবার ওপেন না হয়)
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [cattle]);
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
  }, [cattle]);

  // ইউনিক ব্রিড (জাত) এর তালিকা বের করা ফিল্টারের জন্য
  const breedsList = useMemo(() => {
    if (!cattle) return [];
    const bSet = new Set(cattle.map(c => c.breed).filter(Boolean));
    return Array.from(bSet);
  }, [cattle]);

  // অ্যাডভান্সড মাল্টি-লেভেল ফিল্টারিং ও সর্টিং লজিক
  const filtered = cattle.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.tagId?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.breed?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchType = filterType === "all" || c.type === filterType;
    const matchBreed = filterBreed === "all" || c.breed === filterBreed;
    return matchSearch && matchStatus && matchType && matchBreed;
  }).sort((a, b) => {
    if (sortBy === "age") return (b.age || 0) - (a.age || 0);
    return a.tagId?.localeCompare(b.tagId);
  });

  const canEdit = hasAccess("worker"); 
  const canDelete = hasAccess("admin"); 

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sellCattle(sellTarget._id || sellTarget.id, { buyerName: fd.get("buyerName"), salePrice: fd.get("salePrice"), saleDate: fd.get("saleDate") });
    setSellTarget(null);
  };

  const handleDeadSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await markCattleDead(deadTarget._id || deadTarget.id, { date: fd.get("date"), reason: fd.get("reason"), lossAmount: fd.get("lossAmount") });
    setDeadTarget(null);
  };

  return (
    <div className="space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white transition-colors">{t("cattle")}</h2>
          <p className="text-[#64748B] dark:text-slate-500 text-sm transition-colors">
            {cattle.length} {language === "bn" ? "টি গরু নিবন্ধিত" : "cattle registered"}
          </p>
        </div>
        {canEdit && <Button onClick={() => setShowAddForm(true)}>+ {t("addCattle")}</Button>}
      </div>

      {/* Search and Filter Trigger */}
      <div className="flex gap-2">
        <input type="text" placeholder={`🔍 ${t("search")}...`} value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#FFFFFF] dark:bg-slate-800/60 border border-[#E8E6DE] dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] shadow-sm transition-colors" />
        
        {/* অ্যাডভান্সড ফিল্টার বাটন */}
        <button onClick={() => setShowFilterDrawer(true)} className="px-4 py-2 bg-[#F5F4EF] dark:bg-slate-800/80 text-sm font-semibold text-[#1A1A2E] dark:text-slate-300 rounded-lg border border-[#E8E6DE] dark:border-slate-700 hover:bg-[#E8E6DE] dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all">
          ⚙️ {language === "bn" ? "ফিল্টার করুন" : "Filter"}
        </button>
      </div>

      {/* ── অ্যাডভান্সড ফিল্টার স্লাইড-আউট ড্রয়ার ── */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#1A1A2E]/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowFilterDrawer(false)} />
          <div className="relative w-80 h-full bg-[#FFFFFF] dark:bg-slate-800 shadow-2xl p-5 flex flex-col space-y-4 animate-slide-in border-l border-[#E8E6DE] dark:border-slate-700/60">
            <div className="flex items-center justify-between border-b pb-3 border-[#E8E6DE] dark:border-slate-700/50">
              <h3 className="font-bold text-base text-[#1A1A2E] dark:text-white">⚙️ {language === "bn" ? "ফিল্টার অপশন" : "Filters"}</h3>
              <button onClick={() => setShowFilterDrawer(false)} className="text-xl text-[#64748B] dark:text-slate-400 hover:text-[#EF4444] transition-colors">✕</button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block mb-1.5">{t("status")}</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#F5F4EF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 p-2.5 text-sm rounded-lg outline-none text-[#1A1A2E] dark:text-white focus:border-[#F59E0B] transition-colors">
                  <option value="all">{t("allStatus")}</option>
                  <option value="healthy">{t("healthy")}</option>
                  <option value="sick">{t("sick")}</option>
                  <option value="forSale">{t("forSale")}</option>
                  <option value="sold">{t("soldOut")}</option>
                  <option value="dead">{language === "bn" ? "মৃত" : "Dead"}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block mb-1.5">{t("type")}</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-[#F5F4EF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 p-2.5 text-sm rounded-lg outline-none text-[#1A1A2E] dark:text-white focus:border-[#F59E0B] transition-colors">
                  <option value="all">{t("allType")}</option>
                  <option value="dairy">{t("dairy")}</option>
                  <option value="fattening">{t("fattening")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block mb-1.5">{language === "bn" ? "জাত (Breed)" : "Breed"}</label>
                <select value={filterBreed} onChange={(e) => setFilterBreed(e.target.value)} className="w-full bg-[#F5F4EF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 p-2.5 text-sm rounded-lg outline-none text-[#1A1A2E] dark:text-white focus:border-[#F59E0B] transition-colors">
                  <option value="all">{language === "bn" ? "সব জাত" : "All Breeds"}</option>
                  {breedsList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block mb-1.5">{language === "bn" ? "ক্রমানুসারে সাজান" : "Sort By"}</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-[#F5F4EF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 p-2.5 text-sm rounded-lg outline-none text-[#1A1A2E] dark:text-white focus:border-[#F59E0B] transition-colors">
                  <option value="tagId">{t("tag")}</option>
                  <option value="age">{t("age")}</option>
                </select>
              </div>
            </div>
            
            <button onClick={() => { setFilterStatus("all"); setFilterType("all"); setFilterBreed("all"); setSortBy("tagId"); }} className="w-full py-2.5 bg-[#E8E6DE] dark:bg-slate-700 hover:bg-[#94A3B8] dark:hover:bg-slate-600 text-sm font-bold rounded-lg text-[#1A1A2E] dark:text-white transition-all">
              {language === "bn" ? "সব ফিল্টার রিসেট করুন" : "Reset All Filters"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                {[t("image"), t("tag"), t("name"), t("breed"), t("age"), t("status"), t("action")].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30 transition-colors">
              {isLoading ? (
                <CattleSkeleton />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#94A3B8] dark:text-slate-500">{t("noData")}</td></tr>
              ) : (
                filtered.map((c) => {
                  const isHighlighted = c._id === highlightedId || c.id === highlightedId;
                  return (
                    <tr key={c._id || c.id} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20 dark:border-amber-400 animate-pulse font-medium text-amber-900 dark:text-amber-200" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
                      <td className="px-3 py-2">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E8E6DE] dark:bg-slate-700/50 flex items-center justify-center transition-colors">
                          {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : "🐄"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[#F59E0B] dark:text-amber-400 font-mono text-sm transition-colors">{c.tagId}</td>
                      <td className="px-3 py-2 text-[#1A1A2E] dark:text-white text-sm transition-colors">{c.name}</td>
                      <td className="px-3 py-2 text-[#64748B] dark:text-slate-400 text-sm transition-colors">{c.breed}</td>
                      <td className="px-3 py-2 text-[#64748B] dark:text-slate-300 text-sm transition-colors">{c.age} {language === "bn" ? "বছর" : "yrs"}</td>
                      <td className="px-3 py-2"><Badge status={c.status} label={c.status} /></td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedCattle(c)} className="px-2 py-1 rounded text-xs text-[#64748B] dark:text-slate-300 hover:bg-[#E8E6DE] dark:hover:bg-slate-600/50 transition-colors" title={t("view")}>👁</button>
                          {canEdit && c.status !== "sold" && c.status !== "dead" && (
                            <>
                              <button onClick={() => setEditingCattle(c)} className="px-2 py-1 rounded text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-colors" title={t("edit")}>✏️</button>
                              <button onClick={() => setSellTarget(c)} className="px-2 py-1 rounded text-xs text-[#10B981] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 transition-colors" title={t("sellCattleTitle")}>🏷️</button>
                              <button onClick={() => setDeadTarget(c)} className="px-2 py-1 rounded text-xs text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors" title={t("addDeathRecord")}>☠️</button>
                            </>
                          )}
                          {canDelete && <button onClick={() => setDeleteTarget(c)} className="px-2 py-1 rounded text-xs text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors" title={t("delete")}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={!!sellTarget} onClose={() => setSellTarget(null)} title={t("sellCattleTitle")} size="sm">
        <form onSubmit={handleSellSubmit} className="space-y-4">
          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{t("buyerName")}</label>
            <input name="buyerName" required className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:border-[#F59E0B] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{t("salePrice")}</label>
            <input type="number" name="salePrice" required className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:border-[#F59E0B] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{t("saleDate")}</label>
            <input type="date" name="saleDate" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:border-[#F59E0B] focus:outline-none transition-colors" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSellTarget(null)}>{t("cancel")}</Button>
            <Button type="submit">{t("confirm")}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deadTarget} onClose={() => setDeadTarget(null)} title={t("addDeathRecord")} size="sm">
        <form onSubmit={handleDeadSubmit} className="space-y-4">
          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{t("deathReason")}</label>
            <input name="reason" required className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:border-[#F59E0B] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{t("estimatedLoss")}</label>
            <input type="number" name="lossAmount" defaultValue={deadTarget?.purchasePrice || 0} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:border-[#F59E0B] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{t("date")}</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:border-[#F59E0B] focus:outline-none transition-colors" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeadTarget(null)}>{t("cancel")}</Button>
            <Button type="submit" className="bg-[#EF4444] hover:bg-red-500 text-white border-none">{t("save")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} message={t("confirm")} onCancel={() => setDeleteTarget(null)} onConfirm={() => { deleteCattle(deleteTarget._id || deleteTarget.id); setDeleteTarget(null); }} />
      <Modal isOpen={!!selectedCattle} onClose={() => setSelectedCattle(null)} title={selectedCattle?.tagId} size="lg">
        {selectedCattle && <CattleProfile cattle={selectedCattle} onEdit={() => { setEditingCattle(selectedCattle); setSelectedCattle(null); }} />}
      </Modal>
      <Modal isOpen={!!editingCattle} onClose={() => setEditingCattle(null)} title={t("edit")} size="md">
        {editingCattle && <EditCattleForm cattle={editingCattle} onClose={() => { setEditingCattle(null); fetchRealCattleData(); }} />}
      </Modal>
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title={t("addCattle")} size="md">
        <AddCattleForm onClose={() => { setShowAddForm(false); fetchRealCattleData(); }} />
      </Modal>
    </div>
  );
}
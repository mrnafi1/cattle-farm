import { useState, useEffect } from "react";
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

export default function CattleList() {
  const { cattle, deleteCattle, fetchRealCattleData, sellCattle, markCattleDead } = useApp(); 
  const { t, language } = useLanguage();
  const { hasAccess } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [editingCattle, setEditingCattle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sellTarget, setSellTarget] = useState(null);
  const [deadTarget, setDeadTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => { if (cattle) setIsLoading(false); }, [cattle]);

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
  }, [cattle]);

  const filtered = cattle.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.tagId?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.breed?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const canEdit = hasAccess("worker"); 
  const canDelete = hasAccess("admin"); 

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sellCattle(sellTarget._id, {
      buyerName: fd.get("buyerName"),
      salePrice: fd.get("salePrice"),
      saleDate: fd.get("saleDate"),
    });
    setSellTarget(null);
  };

  const handleDeadSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await markCattleDead(deadTarget._id, {
      date: fd.get("date"),
      reason: fd.get("reason"),
      lossAmount: fd.get("lossAmount"),
    });
    setDeadTarget(null);
  };

  return (
    <div className="space-y-4">
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder={`🔍 ${t("search")}...`} value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-[#FFFFFF] dark:bg-slate-800/60 border border-[#E8E6DE] dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] dark:text-white placeholder-[#94A3B8] dark:placeholder-slate-500 focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/50 min-w-[180px] shadow-sm transition-colors" />
        
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#FFFFFF] dark:bg-slate-800/60 border border-[#E8E6DE] dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] dark:text-slate-300 focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/50 shadow-sm transition-colors">
          <option value="all">{t("allStatus")}</option>
          <option value="healthy">{t("healthy")}</option>
          <option value="sick">{t("sick")}</option>
          <option value="forSale">{t("forSale")}</option>
          <option value="sold">{t("soldOut")}</option>
          <option value="dead">{t("dead")}</option>
        </select>
        
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#FFFFFF] dark:bg-slate-800/60 border border-[#E8E6DE] dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#1A1A2E] dark:text-slate-300 focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/50 shadow-sm transition-colors">
          <option value="all">{t("allType")}</option>
          <option value="dairy">{t("dairy")}</option>
          <option value="fattening">{t("fattening")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                {[t("image"), t("tag"), t("name"), t("breed"), t("age"), t("status"), t("action")].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase transition-colors">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30 transition-colors">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#F59E0B] dark:text-amber-400/80 transition-colors">{t("loading")}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#94A3B8] dark:text-slate-500 transition-colors">{t("noData")}</td></tr>
              ) : (
                filtered.map((c) => {
                  const isHighlighted = c._id === highlightedId || c.id === highlightedId;
                  return (
                    <tr key={c._id} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20 dark:border-amber-400 animate-pulse font-medium text-amber-900 dark:text-amber-200" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
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
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(c)} className="px-2 py-1 rounded text-xs text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors" title={t("delete")}>🗑️</button>
                          )}
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

      {/* Modals: Sell Target */}
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

      {/* Modals: Dead Target */}
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

      {/* Confirmation and Info Modals */}
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
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

  useEffect(() => { if (cattle) setIsLoading(false); }, [cattle]);

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
          <h2 className="text-xl font-bold text-white">{t("cattle")}</h2>
          <p className="text-slate-500 text-sm">
            {cattle.length} {language === "bn" ? "টি গরু নিবন্ধিত" : "cattle registered"}
          </p>
        </div>
        {canEdit && <Button onClick={() => setShowAddForm(true)}>+ {t("addCattle")}</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder={`🔍 ${t("search")}...`} value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 min-w-[180px]" />
        
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-400/50">
          <option value="all">{t("allStatus")}</option>
          <option value="healthy">{t("healthy")}</option>
          <option value="sick">{t("sick")}</option>
          <option value="forSale">{t("forSale")}</option>
          <option value="sold">{t("soldOut")}</option>
          <option value="dead">{t("dead")}</option>
        </select>
        
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-400/50">
          <option value="all">{t("allType")}</option>
          <option value="dairy">{t("dairy")}</option>
          <option value="fattening">{t("fattening")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {[t("image"), t("tag"), t("name"), t("breed"), t("age"), t("status"), t("action")].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-amber-400/80">{t("loading")}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">{t("noData")}</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center">
                        {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : "🐄"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-amber-400 font-mono text-sm">{c.tagId}</td>
                    <td className="px-3 py-2 text-white text-sm">{c.name}</td>
                    <td className="px-3 py-2 text-slate-400 text-sm">{c.breed}</td>
                    <td className="px-3 py-2 text-slate-300 text-sm">{c.age} {language === "bn" ? "বছর" : "yrs"}</td>
                    <td className="px-3 py-2"><Badge status={c.status} label={c.status} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedCattle(c)} className="px-2 py-1 rounded text-xs text-slate-300 hover:bg-slate-600/50" title={t("view")}>👁</button>
                        {canEdit && c.status !== "sold" && c.status !== "dead" && (
                          <>
                            <button onClick={() => setEditingCattle(c)} className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-sky-400/10" title={t("edit")}>✏️</button>
                            <button onClick={() => setSellTarget(c)} className="px-2 py-1 rounded text-xs text-emerald-400 hover:bg-emerald-400/10" title={t("sellCattleTitle")}>🏷️</button>
                            <button onClick={() => setDeadTarget(c)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10" title={t("addDeathRecord")}>☠️</button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(c)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10" title={t("delete")}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={!!sellTarget} onClose={() => setSellTarget(null)} title={t("sellCattleTitle")} size="sm">
        <form onSubmit={handleSellSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs block mb-1">{t("buyerName")}</label>
            <input name="buyerName" required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">{t("salePrice")}</label>
            <input type="number" name="salePrice" required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">{t("saleDate")}</label>
            <input type="date" name="saleDate" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
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
            <label className="text-slate-400 text-xs block mb-1">{t("deathReason")}</label>
            <input name="reason" required className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">{t("estimatedLoss")}</label>
            <input type="number" name="lossAmount" defaultValue={deadTarget?.purchasePrice || 0} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">{t("date")}</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeadTarget(null)}>{t("cancel")}</Button>
            <Button type="submit" className="bg-red-500 hover:bg-red-400 text-white">{t("save")}</Button>
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
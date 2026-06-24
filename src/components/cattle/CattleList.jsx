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
  // AppContext থেকে cattle, deleteCattle এবং ডাটা রিফ্রেশ করার ফাংশনটি নিয়ে আসলাম
  const { cattle, deleteCattle, fetchRealCattleData } = useApp(); 
  const { t } = useLanguage();
  const { hasAccess } = useAuth();

  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [editingCattle, setEditingCattle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // AppContext থেকে ডেটা চলে এলে লোডিং অবস্থা বন্ধ করে দিব
  useEffect(() => {
    if (cattle) {
      setIsLoading(false);
    }
  }, [cattle]);

  // ডিলিট লজিক এখন অনেক সহজ, কারণ AppContext সব হ্যান্ডেল করছে
  const handleDelete = async (id) => {
    await deleteCattle(id); 
  };

  // সার্চ এবং ফিল্টার লজিক আগের মতোই আছে
  const filtered = cattle.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.tagId?.toLowerCase().includes(q)
      || c.name?.toLowerCase().includes(q)
      || c.breed?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const canEdit = hasAccess("worker");   // worker + admin
  const canDelete = hasAccess("admin");  // only admin

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t("cattle")}</h2>
          <p className="text-slate-500 text-sm">মোট {cattle.length}টি গরু নিবন্ধিত</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAddForm(true)}>+ {t("addCattle")}</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={`🔍 ${t("search")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 min-w-[180px]"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-400/50">
          <option value="all">সব অবস্থা</option>
          <option value="healthy">{t("healthy")}</option>
          <option value="sick">{t("sick")}</option>
          <option value="forSale">{t("forSale")}</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-400/50">
          <option value="all">সব ধরন</option>
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
                {["ছবি", "ট্যাগ আইডি", "নাম", "জাত", "ধরন", "বয়স", "ওজন", "অবস্থা", "অ্যাকশন"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isLoading ? (
                // ডেটা লোড হওয়ার সময় দেখানোর জন্য
                <tr><td colSpan={9} className="text-center py-12 text-amber-400/80">লোড হচ্ছে...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500">{t("noData")}</td></tr>
              ) : (
                filtered.map((c) => {
                  const latestWeight = c.weight?.[c.weight.length - 1]?.value || "—";
                  return (
                    <tr key={c._id} className="hover:bg-slate-700/20 transition-colors">
                      {/* Photo */}
                      <td className="px-3 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700/50 border border-slate-600/40 flex items-center justify-center flex-shrink-0">
                          {c.photo
                            ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                            : <span className="text-xl">🐄</span>
                          }
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-amber-400 font-mono font-semibold text-sm">{c.tagId}</span>
                      </td>
                      <td className="px-3 py-3 text-white text-sm font-medium">{c.name}</td>
                      <td className="px-3 py-3 text-slate-400 text-sm">{c.breed}</td>
                      <td className="px-3 py-3">
                        <Badge status={c.type} label={c.type === "dairy" ? t("dairy") : t("fattening")} />
                      </td>
                      <td className="px-3 py-3 text-slate-300 text-sm">{c.age} বছর</td>
                      <td className="px-3 py-3 text-slate-300 text-sm">{latestWeight} kg</td>
                      <td className="px-3 py-3">
                        <Badge status={c.status} label={
                          c.status === "healthy" ? t("healthy")
                            : c.status === "sick" ? t("sick")
                              : t("forSale")
                        } />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedCattle(c)}
                            className="px-2 py-1 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all">
                            👁 দেখুন
                          </button>
                          {canEdit && (
                            <button onClick={() => setEditingCattle(c)}
                              className="px-2 py-1 rounded text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 transition-all">
                              ✏️ এডিট
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(c)}
                              className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all">
                              🗑️
                            </button>
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

      {/* Profile Modal */}
      <Modal isOpen={!!selectedCattle} onClose={() => setSelectedCattle(null)}
        title={`${selectedCattle?.tagId} — ${selectedCattle?.name}`} size="lg">
        {selectedCattle && <CattleProfile cattle={selectedCattle} onEdit={() => { setEditingCattle(selectedCattle); setSelectedCattle(null); }} />}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCattle} onClose={() => setEditingCattle(null)}
        title={`এডিট করুন: ${editingCattle?.tagId}`} size="md">
        {editingCattle && <EditCattleForm cattle={editingCattle} onClose={() => {
          setEditingCattle(null);
          if (fetchRealCattleData) fetchRealCattleData(); // পেজ রিলোডের বদলে ডাইনামিক আপডেট!
        }} />}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title={t("addCattle")} size="md">
        <AddCattleForm onClose={() => {
          setShowAddForm(false);
          if (fetchRealCattleData) fetchRealCattleData(); // পেজ রিলোডের বদলে ডাইনামিক আপডেট!
        }} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        message={`"${deleteTarget?.name}" (${deleteTarget?.tagId}) মুছে ফেলবেন?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { 
          handleDelete(deleteTarget._id); 
          setDeleteTarget(null); 
        }}
      />
      
    </div>
  );
}
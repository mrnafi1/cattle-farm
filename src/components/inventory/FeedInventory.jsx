import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext"; // ── নতুন যুক্ত করা হলো ──
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const FEED_TYPES = ["ভুসি", "খড়", "সাইলেজ", "কাঁচা ঘাস", "দানাদার মিক্স"];

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

export default function FeedInventory() {
  const { 
    cattle, inventory, feedLogs, 
    addInventoryStock, addFeedLog, 
    updateInventoryStock, deleteInventoryStock, 
    updateFeedLog, deleteFeedLog, 
    addToast 
  } = useApp();
  
  const { t } = useLanguage(); // ── অনুবাদ ফাংশন ──

  const [activeTab, setActiveTab] = useState("stock");
  const [showAddStock, setShowAddStock] = useState(false);
  const [showFeedCattle, setShowFeedCattle] = useState(false);

  const [feedTargetType, setFeedTargetType] = useState("all"); 
  const [selectedCattleId, setSelectedCattleId] = useState("");

  const activeCattle = cattle?.filter(c => c.status !== "sold" && c.status !== "dead") || [];

  const [stockForm, setStockForm] = useState({ type: FEED_TYPES[0], amount: "", cost: "", date: new Date().toISOString().slice(0, 10) });
  const [feedForm, setFeedForm] = useState({ type: FEED_TYPES[0], amount: "", date: new Date().toISOString().slice(0, 10) });

  const [editStockTarget, setEditStockTarget] = useState(null);
  const [deleteStockId, setDeleteStockId] = useState(null);

  const [editFeedTarget, setEditFeedTarget] = useState(null);
  const [deleteFeedTarget, setDeleteFeedTarget] = useState(null);

  const closeFeedModal = () => {
    setShowFeedCattle(false);
    setFeedTargetType("all");
    setSelectedCattleId("");
    setFeedForm({ type: FEED_TYPES[0], amount: "", date: new Date().toISOString().slice(0, 10) });
  };

  const closeStockModal = () => {
    setShowAddStock(false);
    setStockForm({ type: FEED_TYPES[0], amount: "", cost: "", date: new Date().toISOString().slice(0, 10) });
  };

  const handleSaveStock = async () => {
    if (!stockForm.amount || Number(stockForm.amount) <= 0) return addToast(t("noData"), "error"); // Update logic inside Toast if needed
    await addInventoryStock({ type: stockForm.type, amount: Number(stockForm.amount), unit: "kg", date: stockForm.date }, stockForm.cost);
    closeStockModal();
  };

  const handleSaveFeed = async () => {
    if (!feedForm.amount || Number(feedForm.amount) <= 0) return addToast(t("errorOccurred"), "error");
    if (feedTargetType === "single" && !selectedCattleId) return addToast(t("errorOccurred"), "error");

    const currentStock = inventory.find(i => i.type === feedForm.type)?.amount || 0;
    if (currentStock < Number(feedForm.amount)) return addToast(t("errorOccurred"), "error");

    const selectedCow = activeCattle.find(c => c._id === selectedCattleId);
    let note = "সব গরুকে একসাথে";
    if (feedTargetType === "single" && selectedCow) {
      note = `${selectedCow.tagId} - ${selectedCow.name || 'নামহীন'} কে দেওয়া হয়েছে`;
    }

    await addFeedLog({
      date: feedForm.date, category: "out", type: feedForm.type, amount: Number(feedForm.amount),
      targetType: feedTargetType, cattleId: selectedCattleId || null, note: note
    });
    closeFeedModal();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t("inventory")}</h2>
          <p className="text-slate-500 text-sm">ফার্মের খাবার মজুদ এবং দৈনিক খরচের হিসাব</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddStock(true)}>+ খাবার কিনুন</Button>
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => setShowFeedCattle(true)}>
            🥣 গরুকে খাবার দিন
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50 mb-4">
        <button onClick={() => setActiveTab("stock")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "stock" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>গুদামের বর্তমান স্টক</button>
        <button onClick={() => setActiveTab("logs")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>{t("feedLog")}</button>
      </div>

      {/* ── Tab Content: Stock ── */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {inventory.map((item) => (
            <div key={item._id || item.type} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
              {item.amount < 50 && (
                <span className="absolute top-0 right-0 bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">অ্যালার্ট</span>
              )}
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditStockTarget(item)} className="p-1.5 text-xs text-sky-400 bg-sky-400/10 rounded hover:bg-sky-400/20">✏️</button>
                <button onClick={() => setDeleteStockId(item._id)} className="p-1.5 text-xs text-red-400 bg-red-400/10 rounded hover:bg-red-400/20">🗑️</button>
              </div>
              <div className="text-3xl mb-2">🌾</div>
              <p className="text-slate-400 text-sm">{item.type}</p>
              <p className={`text-2xl font-bold ${item.amount < 50 ? "text-red-400" : "text-white"}`}>
                {item.amount} <span className="text-sm font-normal text-slate-500">{item.unit || 'kg'}</span>
              </p>
            </div>
          ))}
          {(!inventory || inventory.length === 0) && (
            <div className="col-span-full text-center py-8 text-slate-500 bg-slate-800/40 rounded-xl border border-slate-700/40">{t("noData")}</div>
          )}
        </div>
      )}

      {/* ── Tab Content: Logs ── */}
      {activeTab === "logs" && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["তারিখ", "ক্যাটাগরি", "খাবারের ধরন", "পরিমাণ", "নোট", t("action")].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {!feedLogs || feedLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">{t("noData")}</td></tr>
                ) : (
                  [...feedLogs].reverse().map((log, idx) => (
                    <tr key={log._id || idx} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3 text-slate-300 text-sm">{log.date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${log.category === "in" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"}`}>
                          {log.category === "in" ? "স্টক ইন (কেনা)" : "খাওয়ানো হয়েছে"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{log.type}</td>
                      <td className="px-4 py-3 text-amber-400 font-medium">{log.amount} kg</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{log.note || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditFeedTarget(log); setFeedForm({ amount: log.amount, date: log.date, type: log.type }); }} className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-sky-400/10">✏️</button>
                          <button onClick={() => setDeleteFeedTarget(log)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals: Add ── */}
      <Modal isOpen={showAddStock} onClose={closeStockModal} title="গুদামে খাবার যুক্ত করুন" size="sm">
        <div className="space-y-4">
          <Field label="খাদ্যের ধরন"><Select value={stockForm.type} onChange={(e) => setStockForm({...stockForm, type: e.target.value})}>{FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</Select></Field>
          <Field label="পরিমাণ (kg)"><Input type="number" placeholder="যেমন: 100" value={stockForm.amount} onChange={(e) => setStockForm({...stockForm, amount: e.target.value})} /></Field>
          <Field label="মোট খরচ (৳) [খরচের হিসাবে যুক্ত হবে]"><Input type="number" placeholder="যেমন: 5000" value={stockForm.cost} onChange={(e) => setStockForm({...stockForm, cost: e.target.value})} /></Field>
          <Field label={t("date")}><Input type="date" value={stockForm.date} onChange={(e) => setStockForm({...stockForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={closeStockModal}>{t("cancel")}</Button><Button onClick={handleSaveStock}>💾 {t("save")}</Button></div>
        </div>
      </Modal>

      <Modal isOpen={showFeedCattle} onClose={closeFeedModal} title="গরুকে খাবার দিন" size="sm">
        <div className="space-y-4">
          <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-lg"><p className="text-xs text-sky-400">এখান থেকে খাবার এন্ট্রি দিলে তা অটোমেটিক গুদাম থেকে কমে যাবে।</p></div>
          <Field label="খাদ্যের ধরন"><Select value={feedForm.type} onChange={(e) => setFeedForm({...feedForm, type: e.target.value})}>{FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</Select></Field>
          <Field label="পরিমাণ (kg)"><Input type="number" placeholder="কত কেজি খাওয়ানো হলো?" value={feedForm.amount} onChange={(e) => setFeedForm({...feedForm, amount: e.target.value})} /></Field>
          <Field label="কাকে খাওয়ানো হলো?"><Select value={feedTargetType} onChange={(e) => setFeedTargetType(e.target.value)}><option value="all">সব গরুকে (একসাথে)</option><option value="single">নির্দিষ্ট গরুকে</option></Select></Field>
          {feedTargetType === "single" && (
            <Field label="গরু নির্বাচন করুন"><Select value={selectedCattleId} onChange={(e) => setSelectedCattleId(e.target.value)}><option value="">-- ট্যাগ আইডি ও নাম বেছে নিন --</option>{activeCattle.map(c => <option key={c._id} value={c._id}>{c.tagId} - {c.name || "নামহীন"}</option>)}</Select></Field>
          )}
          <Field label={t("date")}><Input type="date" value={feedForm.date} onChange={(e) => setFeedForm({...feedForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={closeFeedModal}>{t("cancel")}</Button><Button className="bg-emerald-500 text-white" onClick={handleSaveFeed}>🥣 {t("confirm")}</Button></div>
        </div>
      </Modal>

      {/* ── Modals: Edit ── */}
      <Modal isOpen={!!editStockTarget} onClose={() => setEditStockTarget(null)} title="স্টক আপডেট করুন" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">খাবারের ধরন: <strong className="text-amber-400">{editStockTarget?.type}</strong></p>
          <Field label="নতুন পরিমাণ (kg)"><Input type="number" value={editStockTarget?.amount || ""} onChange={(e) => setEditStockTarget({...editStockTarget, amount: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditStockTarget(null)}>{t("cancel")}</Button>
            <Button onClick={() => { updateInventoryStock(editStockTarget._id, editStockTarget.amount); setEditStockTarget(null); }}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editFeedTarget} onClose={() => setEditFeedTarget(null)} title="খাবারের রেকর্ড আপডেট" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">খাবারের ধরন: <strong className="text-amber-400">{editFeedTarget?.type}</strong></p>
          <Field label="পরিমাণ (kg)"><Input type="number" value={feedForm.amount} onChange={(e) => setFeedForm({...feedForm, amount: e.target.value})} /></Field>
          <Field label={t("date")}><Input type="date" value={feedForm.date} onChange={(e) => setFeedForm({...feedForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditFeedTarget(null)}>{t("cancel")}</Button>
            <Button onClick={() => { updateFeedLog(editFeedTarget._id, { amount: Number(feedForm.amount), date: feedForm.date }); setEditFeedTarget(null); }}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Dialogs for Delete ── */}
      <ConfirmDialog
        isOpen={!!deleteStockId}
        message="এই স্টকটি পুরোপুরি মুছে ফেলতে চান?"
        onCancel={() => setDeleteStockId(null)}
        onConfirm={() => { deleteInventoryStock(deleteStockId); setDeleteStockId(null); }}
      />
      
      <ConfirmDialog
        isOpen={!!deleteFeedTarget}
        message="এই রেকর্ডটি মুছে ফেলতে চান? (খাবারটি গুদামে ফেরত যাবে)"
        onCancel={() => setDeleteFeedTarget(null)}
        onConfirm={() => { deleteFeedLog(deleteFeedTarget); setDeleteFeedTarget(null); }}
      />
    </div>
  );
}
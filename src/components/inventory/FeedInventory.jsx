import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const FEED_TYPES = ["ভুসি", "খড়", "সাইলেজ", "কাঁচা ঘাস", "দানাদার মিক্স"];

// ইনপুট এবং ফিল্ডে নতুন কালার থিম যুক্ত করা হলো
const Field = ({ label, children }) => (
  <div><label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 transition-colors">{label}</label>{children}</div>
);
const Input = (props) => (
  <input {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm dark:shadow-none" />
);
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 transition-colors shadow-sm dark:shadow-none">
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
  
  const { t, language } = useLanguage();

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

  const getFeedTypeName = (type) => {
    if (language === "bn") return type;
    const map = {
      "ভুসি": "Bran",
      "খড়": "Straw",
      "সাইলেজ": "Silage",
      "কাঁচা ঘাস": "Fresh Grass",
      "দানাদার মিক্স": "Grain Mix"
    };
    return map[type] || type;
  };

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
    if (!stockForm.amount || Number(stockForm.amount) <= 0) return addToast(t("noData"), "error");
    await addInventoryStock({ type: stockForm.type, amount: Number(stockForm.amount), unit: "kg", date: stockForm.date }, stockForm.cost);
    closeStockModal();
  };

  const handleSaveFeed = async () => {
    if (!feedForm.amount || Number(feedForm.amount) <= 0) return addToast(t("errorOccurred"), "error");
    if (feedTargetType === "single" && !selectedCattleId) return addToast(t("errorOccurred"), "error");

    const currentStock = inventory.find(i => i.type === feedForm.type)?.amount || 0;
    if (currentStock < Number(feedForm.amount)) return addToast(language === "bn" ? "গুদামে পর্যাপ্ত খাবার নেই!" : "Not enough feed in stock!", "error");

    const selectedCow = activeCattle.find(c => c._id === selectedCattleId);
    let note = language === "bn" ? "সব গরুকে একসাথে" : "All cattle (together)";
    if (feedTargetType === "single" && selectedCow) {
      note = `${selectedCow.tagId} - ${selectedCow.name || (language === "bn" ? "নামহীন" : "Unnamed")}`;
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
          <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white transition-colors">{t("inventory")}</h2>
          <p className="text-[#64748B] dark:text-slate-500 text-sm transition-colors">
            {language === "bn" ? "ফার্মের খাবার মজুদ এবং দৈনিক খরচের হিসাব" : "Farm feed inventory and daily expense logs"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddStock(true)}>
            {language === "bn" ? "+ খাবার কিনুন" : "+ Buy Feed"}
          </Button>
          <Button className="bg-[#10B981] hover:bg-[#059669] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white border-none transition-colors" onClick={() => setShowFeedCattle(true)}>
            🥣 {language === "bn" ? "গরুকে খাবার দিন" : "Feed Cattle"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E6DE] dark:border-slate-700/50 mb-4 transition-colors">
        <button onClick={() => setActiveTab("stock")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "stock" ? "border-[#F59E0B] text-[#F59E0B] dark:border-amber-400 dark:text-amber-400" : "border-transparent text-[#64748B] hover:text-[#1A1A2E] dark:text-slate-400 dark:hover:text-slate-300"}`}>
          {language === "bn" ? "গুদামের বর্তমান স্টক" : "Current Stock"}
        </button>
        <button onClick={() => setActiveTab("logs")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs" ? "border-[#F59E0B] text-[#F59E0B] dark:border-amber-400 dark:text-amber-400" : "border-transparent text-[#64748B] hover:text-[#1A1A2E] dark:text-slate-400 dark:hover:text-slate-300"}`}>
          {t("feedLog")}
        </button>
      </div>

      {/* ── Tab Content: Stock ── */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {inventory.map((item) => (
            <div key={item._id || item.type} className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm dark:shadow-none rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-colors">
              {item.amount < 50 && (
                <span className="absolute top-0 right-0 bg-[#EF4444] dark:bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold transition-colors">
                  {language === "bn" ? "অ্যালার্ট" : "Alert"}
                </span>
              )}
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditStockTarget(item)} className="p-1.5 text-xs text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-400/10 rounded hover:bg-sky-100 dark:hover:bg-sky-400/20 transition-colors">✏️</button>
                <button onClick={() => setDeleteStockId(item._id)} className="p-1.5 text-xs text-[#EF4444] bg-red-50 dark:text-red-400 dark:bg-red-400/10 rounded hover:bg-red-100 dark:hover:bg-red-400/20 transition-colors">🗑️</button>
              </div>
              <div className="text-3xl mb-2">🌾</div>
              <p className="text-[#64748B] dark:text-slate-400 text-sm transition-colors">{getFeedTypeName(item.type)}</p>
              <p className={`text-2xl font-bold transition-colors ${item.amount < 50 ? "text-[#EF4444] dark:text-red-400" : "text-[#1A1A2E] dark:text-white"}`}>
                {item.amount} <span className="text-sm font-normal text-[#94A3B8] dark:text-slate-500">{item.unit || 'kg'}</span>
              </p>
            </div>
          ))}
          {(!inventory || inventory.length === 0) && (
            <div className="col-span-full text-center py-8 text-[#94A3B8] dark:text-slate-500 bg-[#FFFFFF] dark:bg-slate-800/40 rounded-xl border border-[#E8E6DE] dark:border-slate-700/40 transition-colors">{t("noData")}</div>
          )}
        </div>
      )}

      {/* ── Tab Content: Logs ── */}
      {activeTab === "logs" && (
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm dark:shadow-none rounded-xl overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                  {[
                    t("date"), 
                    language === "bn" ? "ক্যাটাগরি" : "Category", 
                    language === "bn" ? "খাবারের ধরন" : "Feed Type", 
                    language === "bn" ? "পরিমাণ" : "Amount", 
                    language === "bn" ? "নোট" : "Note", 
                    t("action")
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider transition-colors">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30">
                {!feedLogs || feedLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-[#94A3B8] dark:text-slate-500 transition-colors">{t("noData")}</td></tr>
                ) : (
                  [...feedLogs].reverse().map((log, idx) => (
                    <tr key={log._id || idx} className="hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-[#64748B] dark:text-slate-300 text-sm transition-colors">{log.date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs transition-colors ${log.category === "in" ? "bg-[#10B981]/10 text-[#10B981] dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"}`}>
                          {log.category === "in" 
                            ? (language === "bn" ? "স্টক ইন (কেনা)" : "Stock In (Purchased)") 
                            : (language === "bn" ? "খাওয়ানো হয়েছে" : "Fed to Cattle")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1A1A2E] dark:text-white text-sm transition-colors">{getFeedTypeName(log.type)}</td>
                      <td className="px-4 py-3 text-[#F59E0B] dark:text-amber-400 font-medium transition-colors">{log.amount} kg</td>
                      <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm transition-colors">{log.note || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditFeedTarget(log); setFeedForm({ amount: log.amount, date: log.date, type: log.type }); }} className="px-2 py-1 rounded text-xs text-sky-600 bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-400/10 transition-colors">✏️</button>
                          <button onClick={() => setDeleteFeedTarget(log)} className="px-2 py-1 rounded text-xs text-[#EF4444] bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 transition-colors">🗑️</button>
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
      <Modal isOpen={showAddStock} onClose={closeStockModal} title={language === "bn" ? "গুদামে খাবার যুক্ত করুন" : "Add Feed to Stock"} size="sm">
        <div className="space-y-4">
          <Field label={language === "bn" ? "খাদ্যের ধরন" : "Feed Type"}>
            <Select value={stockForm.type} onChange={(e) => setStockForm({...stockForm, type: e.target.value})}>
              {FEED_TYPES.map(f => <option key={f} value={f}>{getFeedTypeName(f)}</option>)}
            </Select>
          </Field>
          <Field label={language === "bn" ? "পরিমাণ (kg)" : "Amount (kg)"}>
            <Input type="number" placeholder={language === "bn" ? "যেমন: 100" : "e.g. 100"} value={stockForm.amount} onChange={(e) => setStockForm({...stockForm, amount: e.target.value})} />
          </Field>
          <Field label={language === "bn" ? "মোট খরচ (৳) [খরচের হিসাবে যুক্ত হবে]" : "Total Cost (৳) [Added to expenses]"}>
            <Input type="number" placeholder={language === "bn" ? "যেমন: 5000" : "e.g. 5000"} value={stockForm.cost} onChange={(e) => setStockForm({...stockForm, cost: e.target.value})} />
          </Field>
          <Field label={t("date")}><Input type="date" value={stockForm.date} onChange={(e) => setStockForm({...stockForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeStockModal}>{t("cancel")}</Button>
            <Button onClick={handleSaveStock}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showFeedCattle} onClose={closeFeedModal} title={language === "bn" ? "গরুকে খাবার দিন" : "Feed Cattle"} size="sm">
        <div className="space-y-4">
          <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 p-3 rounded-lg transition-colors">
            <p className="text-xs text-sky-600 dark:text-sky-400 transition-colors">
              {language === "bn" ? "এখান থেকে খাবার এন্ট্রি দিলে তা অটোমেটিক গুদাম থেকে কমে যাবে।" : "Feed entered here will automatically be deducted from inventory."}
            </p>
          </div>
          <Field label={language === "bn" ? "খাদ্যের ধরন" : "Feed Type"}>
            <Select value={feedForm.type} onChange={(e) => setFeedForm({...feedForm, type: e.target.value})}>
              {FEED_TYPES.map(f => <option key={f} value={f}>{getFeedTypeName(f)}</option>)}
            </Select>
          </Field>
          <Field label={language === "bn" ? "পরিমাণ (kg)" : "Amount (kg)"}>
            <Input type="number" placeholder={language === "bn" ? "কত কেজি খাওয়ানো হলো?" : "Amount fed (kg)"} value={feedForm.amount} onChange={(e) => setFeedForm({...feedForm, amount: e.target.value})} />
          </Field>
          <Field label={language === "bn" ? "কাকে খাওয়ানো হলো?" : "Target Cattle"}>
            <Select value={feedTargetType} onChange={(e) => setFeedTargetType(e.target.value)}>
              <option value="all">{language === "bn" ? "সব গরুকে (একসাথে)" : "All Cattle (Together)"}</option>
              <option value="single">{language === "bn" ? "নির্দিষ্ট গরুকে" : "Specific Cattle"}</option>
            </Select>
          </Field>
          {feedTargetType === "single" && (
            <Field label={language === "bn" ? "গরু নির্বাচন করুন" : "Select Cattle"}>
              <Select value={selectedCattleId} onChange={(e) => setSelectedCattleId(e.target.value)}>
                <option value="">{language === "bn" ? "-- ট্যাগ আইডি ও নাম বেছে নিন --" : "-- Select Tag & Name --"}</option>
                {activeCattle.map(c => <option key={c._id} value={c._id}>{c.tagId} - {c.name || (language === "bn" ? "নামহীন" : "Unnamed")}</option>)}
              </Select>
            </Field>
          )}
          <Field label={t("date")}><Input type="date" value={feedForm.date} onChange={(e) => setFeedForm({...feedForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeFeedModal}>{t("cancel")}</Button>
            <Button className="bg-[#10B981] hover:bg-[#059669] dark:bg-emerald-500 text-white border-none transition-colors" onClick={handleSaveFeed}>🥣 {t("confirm")}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modals: Edit ── */}
      <Modal isOpen={!!editStockTarget} onClose={() => setEditStockTarget(null)} title={language === "bn" ? "স্টক আপডেট করুন" : "Update Stock"} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#1A1A2E] dark:text-slate-300 transition-colors">
            {language === "bn" ? "খাবারের ধরন:" : "Feed Type:"} <strong className="text-[#F59E0B] dark:text-amber-400 transition-colors">{getFeedTypeName(editStockTarget?.type)}</strong>
          </p>
          <Field label={language === "bn" ? "নতুন পরিমাণ (kg)" : "New Amount (kg)"}>
            <Input type="number" value={editStockTarget?.amount || ""} onChange={(e) => setEditStockTarget({...editStockTarget, amount: e.target.value})} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditStockTarget(null)}>{t("cancel")}</Button>
            <Button onClick={() => { updateInventoryStock(editStockTarget._id, editStockTarget.amount); setEditStockTarget(null); }}>💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editFeedTarget} onClose={() => setEditFeedTarget(null)} title={language === "bn" ? "খাবারের রেকর্ড আপডেট" : "Update Feed Record"} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#1A1A2E] dark:text-slate-300 transition-colors">
            {language === "bn" ? "খাবারের ধরন:" : "Feed Type:"} <strong className="text-[#F59E0B] dark:text-amber-400 transition-colors">{getFeedTypeName(editFeedTarget?.type)}</strong>
          </p>
          <Field label={language === "bn" ? "পরিমাণ (kg)" : "Amount (kg)"}>
            <Input type="number" value={feedForm.amount} onChange={(e) => setFeedForm({...feedForm, amount: e.target.value})} />
          </Field>
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
        message={language === "bn" ? "এই স্টকটি পুরোপুরি মুছে ফেলতে চান?" : "Do you want to delete this stock entirely?"}
        onCancel={() => setDeleteStockId(null)}
        onConfirm={() => { deleteInventoryStock(deleteStockId); setDeleteStockId(null); }}
      />
      
      <ConfirmDialog
        isOpen={!!deleteFeedTarget}
        message={language === "bn" ? "এই রেকর্ডটি মুছে ফেলতে চান? (খাবারটি গুদামে ফেরত যাবে)" : "Delete this record? (Feed will be returned to stock)"}
        onCancel={() => setDeleteFeedTarget(null)}
        onConfirm={() => { deleteFeedLog(deleteFeedTarget); setDeleteFeedTarget(null); }}
      />
    </div>
  );
}
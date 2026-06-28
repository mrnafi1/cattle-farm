import { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const FEED_TYPES = ["ভুসি", "খড়", "সাইলেজ", "কাঁচা ঘাস", "দানাদার মিক্স"];

const Field = ({ label, children }) => (
  <div><label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 font-medium transition-colors">{label}</label>{children}</div>
);
const Input = (props) => (
  <input {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm" />
);
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 transition-colors shadow-sm">
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
  
  const [highlightedId, setHighlightedId] = useState(null);

  // ── 💡 Smart Feed Calculator State ──
  const [calcWeight, setCalcWeight] = useState("");
  const [calcMilk, setCalcMilk] = useState("");
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    const id = sessionStorage.getItem("searchHighlightId");
    if (id) {
      setHighlightedId(id);
      if (activeTab !== "logs") setActiveTab("logs"); 
      const timer = setTimeout(() => {
        setHighlightedId(null);
        sessionStorage.removeItem("searchHighlightId");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedLogs, activeTab]); 

  const getFeedTypeName = (type) => {
    if (language === "bn") return type;
    const map = {
      "ভুসি": "Bran", "খড়": "Straw", "সাইলেজ": "Silage", "কাঁচা ঘাস": "Fresh Grass", "দানাদার মিক্স": "Grain Mix"
    };
    return map[type] || type;
  };

  const closeFeedModal = () => {
    setShowFeedCattle(false); setFeedTargetType("all"); setSelectedCattleId("");
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

  // ── 💡 Calculate Smart Feed Logic ──
  const handleCalculateFeed = () => {
    const weight = Number(calcWeight);
    const milk = Number(calcMilk);

    if (weight <= 0) {
      return addToast(language === "bn" ? "দয়া করে গরুর সঠিক ওজন দিন!" : "Please enter valid weight!", "error");
    }

    // বৈজ্ঞানিক হিসাব (Rule of thumb for dairy cows in BD context)
    // ১. শুকনো খড়: বডি ওয়েটের ১.৫%
    const dryStraw = (weight * 0.015).toFixed(1); 
    // ২. কাঁচা ঘাস: বডি ওয়েটের ৫%
    const greenGrass = (weight * 0.05).toFixed(1); 
    // ৩. দানাদার: জীবনধারণের জন্য ১.৫ কেজি + প্রতি লিটার দুধের জন্য ৪০০ গ্রাম (০.৪ কেজি)
    const concentrate = (1.5 + (milk * 0.4)).toFixed(1);

    setCalcResult({
      straw: dryStraw,
      grass: greenGrass,
      concentrate: concentrate
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white transition-colors">{t("inventory")}</h2>
          <p className="text-[#64748B] dark:text-slate-500 text-sm transition-colors">
            {language === "bn" ? "খাদ্য গুদাম এবং স্মার্ট ফিড ক্যালকুলেটর" : "Feed Inventory & Smart Calculator"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddStock(true)}>
            {language === "bn" ? "+ খাবার কিনুন" : "+ Buy Feed"}
          </Button>
          <Button className="bg-[#10B981] hover:bg-[#059669] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white border-none transition-colors" onClick={() => setShowFeedCattle(true)}>
            🥣 {language === "bn" ? "গরুকে খাওয়ান" : "Feed Cattle"}
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 bg-[#F5F4EF] dark:bg-slate-800/60 rounded-xl p-1 w-fit transition-colors mb-4">
        <button onClick={() => setActiveTab("stock")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "stock" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-amber-500/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
          🌾 {language === "bn" ? "গুদামের স্টক" : "Current Stock"}
        </button>
        <button onClick={() => setActiveTab("logs")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "logs" ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 shadow-sm border border-sky-200 dark:border-sky-500/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
          📋 {t("feedLog")}
        </button>
        <button onClick={() => setActiveTab("calc")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "calc" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-500/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
          ⚖️ {language === "bn" ? "স্মার্ট ক্যালকুলেটর" : "Smart Calculator"}
        </button>
      </div>

      {/* ── Tab Content: Smart Feed Calculator ── */}
      {activeTab === "calc" && (
        <div className="bg-white dark:bg-slate-800/40 p-6 rounded-xl border border-slate-200 dark:border-slate-700/40 shadow-sm transition-colors animate-fade-in">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">⚖️</span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {language === "bn" ? "স্মার্ট রাশন ক্যালকুলেটর" : "Smart Ration Calculator"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {language === "bn" ? "গরুর ওজন এবং দুধের পরিমাণের ওপর ভিত্তি করে বৈজ্ঞানিক উপায়ে দৈনিক খাবারের পরিমাণ হিসাব করুন।" : "Calculate scientifically accurate daily feed requirements based on cattle weight and milk production."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <Field label={language === "bn" ? "গরুর আনুমানিক ওজন (কেজি)" : "Estimated Body Weight (kg)"}>
                  <Input type="number" placeholder="e.g. 300" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)} />
                </Field>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <Field label={language === "bn" ? "দৈনিক দুধ উৎপাদন (লিটার)" : "Daily Milk Production (Liters)"}>
                  <Input type="number" placeholder={language === "bn" ? "দুধ না দিলে ০ লিখুন" : "Enter 0 if dry"} value={calcMilk} onChange={(e) => setCalcMilk(e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <Button onClick={handleCalculateFeed} className="bg-emerald-600 hover:bg-emerald-700 border-none px-8 py-2.5 text-lg shadow-lg shadow-emerald-500/30">
                ✨ {language === "bn" ? "হিসাব করুন" : "Calculate Feed"}
              </Button>
            </div>

            {calcResult && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-xl animate-fade-in">
                <h4 className="text-center font-bold text-emerald-800 dark:text-emerald-400 mb-4 uppercase tracking-wider text-sm">
                  {language === "bn" ? "দৈনিক প্রয়োজনীয় খাদ্যের পরিমাণ (২৪ ঘণ্টা)" : "Daily Required Feed (24 Hours)"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dry Roughage */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm text-center border border-slate-100 dark:border-slate-700">
                    <div className="text-3xl mb-2">🌾</div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{language === "bn" ? "শুকনো খড়" : "Dry Straw"}</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1">{calcResult.straw} <span className="text-sm font-medium">kg</span></p>
                  </div>
                  {/* Green Fodder */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm text-center border border-slate-100 dark:border-slate-700">
                    <div className="text-3xl mb-2">🌿</div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{language === "bn" ? "কাঁচা ঘাস" : "Green Grass"}</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">{calcResult.grass} <span className="text-sm font-medium">kg</span></p>
                  </div>
                  {/* Concentrate */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm text-center border border-slate-100 dark:border-slate-700">
                    <div className="text-3xl mb-2">🥣</div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{language === "bn" ? "দানাদার মিশ্রণ" : "Concentrate Mix"}</p>
                    <p className="text-2xl font-black text-sky-600 dark:text-sky-500 mt-1">{calcResult.concentrate} <span className="text-sm font-medium">kg</span></p>
                  </div>
                </div>
                <p className="text-center text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-4 font-medium">
                  * {language === "bn" ? "এই হিসাবটি একটি আদর্শ গাইডলাইন। গরুর স্বাস্থ্য ও রুচি অনুযায়ী পরিমাণ সামান্য পরিবর্তন হতে পারে।" : "This calculation is a standard guideline. Adjust slightly based on cattle health and appetite."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: Stock ── */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {inventory.map((item) => (
            <div key={item._id || item.type} className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-colors">
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
              <p className="text-[#64748B] dark:text-slate-400 text-sm transition-colors font-semibold">{getFeedTypeName(item.type)}</p>
              <p className={`text-2xl font-bold transition-colors ${item.amount < 50 ? "text-[#EF4444] dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {item.amount} <span className="text-sm font-normal text-[#94A3B8] dark:text-slate-500">{item.unit || 'kg'}</span>
              </p>
            </div>
          ))}
          {(!inventory || inventory.length === 0) && (
            <div className="col-span-full text-center py-12 text-[#94A3B8] dark:text-slate-500 bg-[#FFFFFF] dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 transition-colors">
              <p className="text-4xl mb-3">🏚️</p>
              <p>{language === "bn" ? "গুদামে কোনো খাবার নেই" : "Inventory is empty"}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Logs ── */}
      {activeTab === "logs" && (
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl overflow-hidden transition-colors animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                  {[ t("date"), language === "bn" ? "ক্যাটাগরি" : "Category", language === "bn" ? "খাবারের ধরন" : "Feed Type", language === "bn" ? "পরিমাণ" : "Amount", language === "bn" ? "নোট" : "Note", t("action") ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider transition-colors">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30 transition-colors">
                {!feedLogs || feedLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-[#94A3B8] dark:text-slate-500 transition-colors">{t("noData")}</td></tr>
                ) : (
                  [...feedLogs].reverse().map((log, idx) => {
                    const isHighlighted = log._id === highlightedId || log.id === highlightedId;
                    return (
                      <tr key={log._id || idx} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
                        <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm transition-colors">{log.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-bold tracking-wide transition-colors ${log.category === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400"}`}>
                            {log.category === "in" ? (language === "bn" ? "স্টক ইন (কেনা)" : "Stock In") : (language === "bn" ? "খাওয়ানো হয়েছে" : "Fed")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#1A1A2E] dark:text-white font-semibold text-sm transition-colors">{getFeedTypeName(log.type)}</td>
                        <td className="px-4 py-3 text-[#F59E0B] dark:text-amber-400 font-bold transition-colors">{log.amount} kg</td>
                        <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm transition-colors">{log.note || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => { setEditFeedTarget(log); setFeedForm({ amount: log.amount, date: log.date, type: log.type }); }} className="px-2 py-1 rounded text-xs text-sky-600 bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-400/10 transition-colors">✏️</button>
                            <button onClick={() => setDeleteFeedTarget(log)} className="px-2 py-1 rounded text-xs text-[#EF4444] bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 transition-colors">🗑️</button>
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
      )}

      {/* ── Modals: Add & Edit (Unchanged) ── */}
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
            <Button onClick={handleSaveStock} className="bg-emerald-600 hover:bg-emerald-700 border-none">💾 {t("save")}</Button>
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

      <ConfirmDialog isOpen={!!deleteStockId} message={language === "bn" ? "এই স্টকটি পুরোপুরি মুছে ফেলতে চান?" : "Do you want to delete this stock entirely?"} onCancel={() => setDeleteStockId(null)} onConfirm={() => { deleteInventoryStock(deleteStockId); setDeleteStockId(null); }} />
      <ConfirmDialog isOpen={!!deleteFeedTarget} message={language === "bn" ? "এই রেকর্ডটি মুছে ফেলতে চান? (খাবারটি গুদামে ফেরত যাবে)" : "Delete this record? (Feed will be returned to stock)"} onCancel={() => setDeleteFeedTarget(null)} onConfirm={() => { deleteFeedLog(deleteFeedTarget); setDeleteFeedTarget(null); }} />
    </div>
  );
}
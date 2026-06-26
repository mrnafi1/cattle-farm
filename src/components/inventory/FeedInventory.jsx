import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

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
  // AppContext থেকে রিয়েল ডাটা এবং ফাংশন নিয়ে আসা হলো
  const { cattle, inventory, feedLogs, addInventoryStock, addFeedLog, addToast } = useApp();
  
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' or 'logs'
  const [showAddStock, setShowAddStock] = useState(false);
  const [showFeedCattle, setShowFeedCattle] = useState(false);

  // ── নির্দিষ্ট গরুকে খাবার দেওয়ার স্টেট ──
  const [feedTargetType, setFeedTargetType] = useState("all"); 
  const [selectedCattleId, setSelectedCattleId] = useState("");

  const activeCattle = cattle?.filter(c => c.status !== "sold" && c.status !== "dead") || [];

  // ── ফর্মের ডাটা স্টেট ──
  const [stockForm, setStockForm] = useState({ type: FEED_TYPES[0], amount: "", cost: "", date: new Date().toISOString().slice(0, 10) });
  const [feedForm, setFeedForm] = useState({ type: FEED_TYPES[0], amount: "", date: new Date().toISOString().slice(0, 10) });

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

  // ── সেভ করার লজিক ──
  const handleSaveStock = async () => {
    if (!stockForm.amount || Number(stockForm.amount) <= 0) return addToast("পরিমাণ দিন", "error");
    
    await addInventoryStock({
      type: stockForm.type,
      amount: Number(stockForm.amount),
      unit: "kg",
      date: stockForm.date
    }, stockForm.cost);
    
    closeStockModal();
  };

  const handleSaveFeed = async () => {
    if (!feedForm.amount || Number(feedForm.amount) <= 0) return addToast("পরিমাণ দিন", "error");
    if (feedTargetType === "single" && !selectedCattleId) return addToast("গরু নির্বাচন করুন", "error");

    // গুদামে পর্যাপ্ত খাবার আছে কি না চেক করা
    const currentStock = inventory.find(i => i.type === feedForm.type)?.amount || 0;
    if (currentStock < Number(feedForm.amount)) {
      return addToast("গুদামে পর্যাপ্ত খাবার নেই!", "error");
    }

    const selectedCow = activeCattle.find(c => c._id === selectedCattleId);
    let note = "সব গরুকে একসাথে";
    if (feedTargetType === "single" && selectedCow) {
      note = `${selectedCow.tagId} - ${selectedCow.name || 'নামহীন'} কে দেওয়া হয়েছে`;
    }

    await addFeedLog({
      date: feedForm.date,
      category: "out",
      type: feedForm.type,
      amount: Number(feedForm.amount),
      targetType: feedTargetType,
      cattleId: selectedCattleId || null,
      note: note
    });

    closeFeedModal();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">খাদ্য ও গুদাম</h2>
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
        <button 
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "stock" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
          গুদামের বর্তমান স্টক
        </button>
        <button 
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
          দৈনিক খরচের হিসাব
        </button>
      </div>

      {/* ── Tab Content: Stock ── */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {inventory.map((item) => (
            <div key={item._id || item.type} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              {item.amount < 50 && (
                <span className="absolute top-0 right-0 bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">অ্যালার্ট</span>
              )}
              <div className="text-3xl mb-2">🌾</div>
              <p className="text-slate-400 text-sm">{item.type}</p>
              <p className={`text-2xl font-bold ${item.amount < 50 ? "text-red-400" : "text-white"}`}>
                {item.amount} <span className="text-sm font-normal text-slate-500">{item.unit || 'kg'}</span>
              </p>
            </div>
          ))}
          {(!inventory || inventory.length === 0) && (
            <div className="col-span-full text-center py-8 text-slate-500 bg-slate-800/40 rounded-xl border border-slate-700/40">গুদামে কোনো খাবার নেই।</div>
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
                  {["তারিখ", "ক্যাটাগরি", "খাবারের ধরন", "পরিমাণ", "নোট"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {!feedLogs || feedLogs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">কোনো রেকর্ড নেই</td></tr>
                ) : (
                  // নতুন রেকর্ডগুলো উপরে দেখানোর জন্য রিভার্স করে ম্যাপ করা হলো (যদি সার্ভার থেকে সাজিয়ে না আসে)
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: গুদামে খাবার যুক্ত করুন ── */}
      <Modal isOpen={showAddStock} onClose={closeStockModal} title="গুদামে খাবার যুক্ত করুন" size="sm">
        <div className="space-y-4">
          <Field label="খাদ্যের ধরন">
            <Select value={stockForm.type} onChange={(e) => setStockForm({...stockForm, type: e.target.value})}>
              {FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="পরিমাণ (kg)"><Input type="number" placeholder="যেমন: 100" value={stockForm.amount} onChange={(e) => setStockForm({...stockForm, amount: e.target.value})} /></Field>
          <Field label="মোট খরচ (৳) [খরচের হিসাবে যুক্ত হবে]"><Input type="number" placeholder="যেমন: 5000" value={stockForm.cost} onChange={(e) => setStockForm({...stockForm, cost: e.target.value})} /></Field>
          <Field label="তারিখ"><Input type="date" value={stockForm.date} onChange={(e) => setStockForm({...stockForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeStockModal}>বাতিল</Button>
            <Button onClick={handleSaveStock}>💾 সংরক্ষণ করুন</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: গরুকে খাবার দিন ── */}
      <Modal isOpen={showFeedCattle} onClose={closeFeedModal} title="গরুকে খাবার দিন" size="sm">
        <div className="space-y-4">
          <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-lg">
            <p className="text-xs text-sky-400">এখান থেকে খাবার এন্ট্রি দিলে তা অটোমেটিক গুদাম থেকে কমে যাবে।</p>
          </div>
          <Field label="খাদ্যের ধরন">
            <Select value={feedForm.type} onChange={(e) => setFeedForm({...feedForm, type: e.target.value})}>
              {FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="পরিমাণ (kg)"><Input type="number" placeholder="কত কেজি খাওয়ানো হলো?" value={feedForm.amount} onChange={(e) => setFeedForm({...feedForm, amount: e.target.value})} /></Field>
          
          <Field label="কাকে খাওয়ানো হলো?">
            <Select value={feedTargetType} onChange={(e) => setFeedTargetType(e.target.value)}>
              <option value="all">সব গরুকে (একসাথে)</option>
              <option value="single">নির্দিষ্ট গরুকে</option>
            </Select>
          </Field>

          {/* ── কন্ডিশনাল ফিল্ড ── */}
          {feedTargetType === "single" && (
            <Field label="গরু নির্বাচন করুন">
              <Select value={selectedCattleId} onChange={(e) => setSelectedCattleId(e.target.value)}>
                <option value="">-- ট্যাগ আইডি ও নাম বেছে নিন --</option>
                {activeCattle.map(c => (
                  <option key={c._id} value={c._id}>{c.tagId} - {c.name || "নামহীন"}</option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="তারিখ"><Input type="date" value={feedForm.date} onChange={(e) => setFeedForm({...feedForm, date: e.target.value})} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeFeedModal}>বাতিল</Button>
            <Button className="bg-emerald-500 text-white" onClick={handleSaveFeed}>🥣 নিশ্চিত করুন</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
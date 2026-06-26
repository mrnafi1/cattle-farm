import { useState } from "react";
import { useApp } from "../../contexts/AppContext"; // গরুর তালিকা আনার জন্য AppContext যুক্ত করা হলো
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
  const { cattle } = useApp(); // ফার্মের গরুর ডাটা নিয়ে আসা হলো
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' or 'logs'
  const [showAddStock, setShowAddStock] = useState(false);
  const [showFeedCattle, setShowFeedCattle] = useState(false);

  // ── নতুন যুক্ত করা স্টেট (নির্দিষ্ট গরুকে খাবার দেওয়ার জন্য) ──
  const [feedTargetType, setFeedTargetType] = useState("all"); 
  const [selectedCattleId, setSelectedCattleId] = useState("");

  // শুধুমাত্র জীবিত এবং ফার্মে উপস্থিত গরু ফিল্টার করা হলো
  const activeCattle = cattle?.filter(c => c.status !== "sold" && c.status !== "dead") || [];

  // আপাতত ডেমো ডাটা (পরে এটি AppContext থেকে আসবে)
  const [inventory, setInventory] = useState([
    { id: 1, type: "ভুসি", amount: 150, unit: "kg" },
    { id: 2, type: "খড়", amount: 300, unit: "kg" },
    { id: 3, type: "সাইলেজ", amount: 500, unit: "kg" },
  ]);

  const [feedLogs, setFeedLogs] = useState([]);

  // ── মোডাল বন্ধ করার ফাংশন (যাতে ড্রপডাউন রিসেট হয়ে যায়) ──
  const closeFeedModal = () => {
    setShowFeedCattle(false);
    setFeedTargetType("all");
    setSelectedCattleId("");
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
            <div key={item.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              {item.amount < 50 && (
                <span className="absolute top-0 right-0 bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">অ্যালার্ট</span>
              )}
              <div className="text-3xl mb-2">🌾</div>
              <p className="text-slate-400 text-sm">{item.type}</p>
              <p className={`text-2xl font-bold ${item.amount < 50 ? "text-red-400" : "text-white"}`}>
                {item.amount} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
              </p>
            </div>
          ))}
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
                {feedLogs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">কোনো রেকর্ড নেই</td></tr>
                ) : (
                  feedLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20">
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

      {/* Modals for Add Stock & Feed Cattle */}
      {/* এগুলো আমরা ডাটাবেস কানেক্ট করার সময় ফাংশনাল করব, আপাতত শুধু ডেমো UI */}
      <Modal isOpen={showAddStock} onClose={() => setShowAddStock(false)} title="গুদামে খাবার যুক্ত করুন" size="sm">
        <div className="space-y-4">
          <Field label="খাদ্যের ধরন">
            <Select>
              {FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="পরিমাণ (kg)"><Input type="number" placeholder="যেমন: 100" /></Field>
          <Field label="মোট খরচ (৳)"><Input type="number" placeholder="যেমন: 5000" /></Field>
          <Field label="তারিখ"><Input type="date" defaultValue={new Date().toISOString().slice(0,10)} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddStock(false)}>বাতিল</Button>
            <Button>💾 সংরক্ষণ করুন</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showFeedCattle} onClose={closeFeedModal} title="গরুকে খাবার দিন" size="sm">
        <div className="space-y-4">
          <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-lg">
            <p className="text-xs text-sky-400">এখান থেকে খাবার এন্ট্রি দিলে তা অটোমেটিক গুদাম থেকে কমে যাবে।</p>
          </div>
          <Field label="খাদ্যের ধরন">
            <Select>
              {FEED_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="পরিমাণ (kg)"><Input type="number" placeholder="কত কেজি খাওয়ানো হলো?" /></Field>
          
          <Field label="কাকে খাওয়ানো হলো?">
            <Select value={feedTargetType} onChange={(e) => setFeedTargetType(e.target.value)}>
              <option value="all">সব গরুকে (একসাথে)</option>
              <option value="single">নির্দিষ্ট গরুকে</option>
            </Select>
          </Field>

          {/* ── কন্ডিশনাল ফিল্ড: 'নির্দিষ্ট গরুকে' সিলেক্ট করলেই এটি আসবে ── */}
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

          <Field label="তারিখ"><Input type="date" defaultValue={new Date().toISOString().slice(0,10)} /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeFeedModal}>বাতিল</Button>
            <Button className="bg-emerald-500 text-white">🥣 নিশ্চিত করুন</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
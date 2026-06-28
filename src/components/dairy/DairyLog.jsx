import { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

const Field = ({ label, children }) => (
  <div><label className="text-[#64748B] dark:text-slate-400 text-xs block mb-1 font-medium">{label}</label>{children}</div>
);
const Input = (props) => (
  <input {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-colors shadow-sm" />
);
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400/60 transition-colors shadow-sm">
    {children}
  </select>
);

const EMPTY = { date: new Date().toISOString().slice(0, 10), cattleId: "", produced: "", sold: "", pricePerLiter: "70" };
const EMPTY_CUST = { name: "", phone: "", rate: "70" };
const EMPTY_CUST_LOG = { date: new Date().toISOString().slice(0, 10), liters: "" };

export default function DairyLog() {
  const { cattle, milkLogs, addMilkLog, updateMilkLog, deleteMilkLog, addToast } = useApp();
  const { t, language } = useLanguage();
  const { hasAccess } = useAuth();

  // ── Tabs State ──
  const [tab, setTab] = useState("daily"); 

  // ── Daily Milk State ──
  const [showForm,      setShowForm]     = useState(false);
  const [editTarget,    setEditTarget]   = useState(null);
  const [deleteTarget,  setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [highlightedId, setHighlightedId] = useState(null);

  // ── 💡 Customer Billing State (Local Storage) ──
  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem("dairy_customers") || "[]"));
  const [custLogs, setCustLogs]   = useState(() => JSON.parse(localStorage.getItem("dairy_cust_logs") || "[]"));
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [showCustForm, setShowCustForm] = useState(false);
  const [custForm, setCustForm] = useState(EMPTY_CUST);
  
  const [showCustLogForm, setShowCustLogForm] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState(null);
  const [custLogForm, setCustLogForm] = useState(EMPTY_CUST_LOG);
  
  const [invoiceData, setInvoiceData] = useState(null); // For printing

  const canEdit   = hasAccess("worker");
  const canDelete = hasAccess("admin");

  // Save billing data to local storage automatically
  useEffect(() => localStorage.setItem("dairy_customers", JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem("dairy_cust_logs", JSON.stringify(custLogs)), [custLogs]);

  useEffect(() => {
    const id = sessionStorage.getItem("searchHighlightId");
    if (id) {
      setHighlightedId(id);
      const timer = setTimeout(() => { setHighlightedId(null); sessionStorage.removeItem("searchHighlightId"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [milkLogs]);

  const dairyCows = cattle?.filter(c => c.type === "dairy" && c.status !== "sold" && c.status !== "dead") || [];
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fmt = (n) => (n || 0).toLocaleString(language === "bn" ? "bn-BD" : "en-BD");

  // ── Daily Log Functions ──
  const openEdit = (log) => { 
    setEditTarget(log); 
    setForm({ date: log.date, cattleId: log.cattleId || "", produced: log.produced, sold: log.sold, pricePerLiter: log.pricePerLiter }); 
  };
  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY); };

  const handleSaveDaily = async () => {
    const selectedCow = dairyCows.find(c => c._id === form.cattleId);
    const data = { 
      date: form.date, 
      cattleId: form.cattleId || null,
      tagId: selectedCow ? selectedCow.tagId : (language === "bn" ? "ফার্মের মোট" : "Total Farm"),
      cowName: selectedCow ? selectedCow.name : (language === "bn" ? "সব গরু" : "All Cattle"),
      produced: Number(form.produced), sold: Number(form.sold) || 0, pricePerLiter: Number(form.pricePerLiter) || 0 
    };
    editTarget ? await updateMilkLog(editTarget._id || editTarget.id, data) : await addMilkLog(data);
    closeForm();
  };

  // ── 💡 Customer Billing Functions ──
  const handleSaveCustomer = () => {
    if(!custForm.name) return addToast("নাম আবশ্যক", "error");
    const newCust = { ...custForm, id: Date.now().toString(), rate: Number(custForm.rate) };
    setCustomers(p => [newCust, ...p]);
    setShowCustForm(false);
    setCustForm(EMPTY_CUST);
    addToast(language === "bn" ? "কাস্টমার যুক্ত হয়েছে" : "Customer Added");
  };

  const handleSaveCustLog = () => {
    if(!custLogForm.liters) return addToast("পরিমাণ দিন", "error");
    const newLog = { ...custLogForm, id: Date.now().toString(), customerId: selectedCustId, liters: Number(custLogForm.liters) };
    setCustLogs(p => [newLog, ...p]);
    setShowCustLogForm(false);
    setCustLogForm(EMPTY_CUST_LOG);
    addToast(language === "bn" ? "হিসাব যুক্ত হয়েছে" : "Log Added");
  };

  const handlePrintInvoice = (customer) => {
    const monthLogs = custLogs.filter(l => l.customerId === customer.id && l.date.startsWith(billingMonth)).sort((a,b) => new Date(a.date) - new Date(b.date));
    setInvoiceData({ customer, logs: monthLogs });
    setTimeout(() => window.print(), 200);
  };

  // Stats
  const totalProduced = milkLogs?.reduce((s, l) => s + (Number(l.produced) || 0), 0) || 0;
  const totalSold     = milkLogs?.reduce((s, l) => s + (Number(l.sold) || 0), 0) || 0;
  const totalRevenue  = milkLogs?.reduce((s, l) => s + (Number(l.sold) * Number(l.pricePerLiter) || 0), 0) || 0;

  return (
    <div className="space-y-4 relative">

      {/* ── 💡 Print CSS for Invoice ── */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #invoice-print, #invoice-print * { visibility: visible; }
            #invoice-print {
              position: absolute; left: 0; top: 0; width: 100%; padding: 30px;
              background: white !important; color: black !important;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* ── 💡 Invoice Printable Template ── */}
      {invoiceData && (
        <div id="invoice-print" className="hidden print:block font-sans">
          <div className="text-center border-b-2 border-slate-200 pb-4 mb-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-wider">BAQARAH AGRO</h1>
            <p className="text-slate-500 text-sm mt-1">Smart Farm Management</p>
            <h2 className="text-xl font-bold mt-4 bg-slate-100 inline-block px-4 py-1 rounded-full uppercase">
              {language === "bn" ? "দুধের মাসিক বিল" : "Monthly Milk Bill"}
            </h2>
          </div>
          
          <div className="flex justify-between mb-8">
            <div>
              <p className="text-sm text-slate-500 uppercase font-bold">{language === "bn" ? "কাস্টমারের তথ্য:" : "Customer Info:"}</p>
              <p className="text-xl font-bold text-slate-800">{invoiceData.customer.name}</p>
              <p className="text-slate-600">📱 {invoiceData.customer.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 uppercase font-bold">{language === "bn" ? "বিলের মাস:" : "Billing Month:"}</p>
              <p className="text-lg font-bold text-slate-800">
                {new Date(billingMonth + "-01").toLocaleString(language === "bn" ? "bn-BD" : "en-US", { month: "long", year: "numeric" })}
              </p>
              <p className="text-slate-600">{language === "bn" ? "দুধের রেট:" : "Rate:"} ৳{invoiceData.customer.rate} / L</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-slate-100">
                <th className="py-3 px-4 border-b-2 border-slate-300 font-bold text-slate-700">{language === "bn" ? "তারিখ" : "Date"}</th>
                <th className="py-3 px-4 border-b-2 border-slate-300 font-bold text-slate-700 text-right">{language === "bn" ? "দুধের পরিমাণ (লিটার)" : "Quantity (Liters)"}</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.logs.map((log, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-2 px-4 text-slate-800">{log.date}</td>
                  <td className="py-2 px-4 text-slate-800 text-right font-medium">{log.liters} L</td>
                </tr>
              ))}
              {invoiceData.logs.length === 0 && (
                <tr><td colSpan="2" className="py-6 text-center text-slate-500">এই মাসে কোনো দুধ নেওয়া হয়নি।</td></tr>
              )}
            </tbody>
          </table>

          {invoiceData.logs.length > 0 && (() => {
            const totalLiters = invoiceData.logs.reduce((sum, l) => sum + Number(l.liters), 0);
            const totalAmount = totalLiters * invoiceData.customer.rate;
            return (
              <div className="flex justify-end">
                <div className="w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600 font-medium">{language === "bn" ? "মোট পরিমাণ:" : "Total Quantity:"}</span>
                    <span className="font-bold text-slate-800">{totalLiters} L</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600 font-medium">{language === "bn" ? "রেট:" : "Rate:"}</span>
                    <span className="font-bold text-slate-800">৳{invoiceData.customer.rate}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-3 mt-2">
                    <span className="text-lg font-bold text-slate-800">{language === "bn" ? "সর্বমোট বিল:" : "Total Due:"}</span>
                    <span className="text-2xl font-black text-slate-900">৳{fmt(totalAmount)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="mt-20 pt-8 border-t border-slate-200 flex justify-between text-slate-500 text-sm">
            <p>Generated by BAQARAH AGRO App</p>
            <p>Signature: ______________________</p>
          </div>
        </div>
      )}

      {/* ── Main UI (Hidden during print) ── */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white transition-colors">{t("dairy")}</h2>
            <p className="text-[#64748B] dark:text-slate-500 text-sm">{language === "bn" ? "দুধের হিসাব ও কাস্টমার বিলিং" : "Milk Records & Billing"}</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-1 bg-[#F5F4EF] dark:bg-slate-800/60 rounded-xl p-1 w-fit transition-colors">
          <button onClick={() => setTab("daily")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "daily" ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 shadow-sm border border-sky-200 dark:border-sky-500/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
            🥛 {language === "bn" ? "দৈনিক প্রোডাকশন" : "Daily Production"}
          </button>
          <button onClick={() => setTab("billing")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "billing" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-amber-500/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
            🧾 {language === "bn" ? "কাস্টমার বিলিং" : "Customer Billing"}
          </button>
        </div>

        {/* ── TAB: DAILY PRODUCTION ── */}
        {tab === "daily" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              {canEdit && <Button onClick={() => setShowForm(true)} className="bg-sky-600 hover:bg-sky-700 border-none">+ {t("addMilkEntry")}</Button>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: `${t("produced")}`, value: `${totalProduced} L`, color: "text-sky-600 dark:text-sky-400" },
                { label: `${t("sold")}`,     value: `${totalSold} L`,     color: "text-[#10B981] dark:text-emerald-400" },
                { label: language === "bn" ? "মোট আয়" : "Total Revenue", value: `৳${fmt(totalRevenue)}`, color: "text-[#F59E0B] dark:text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl p-4 text-center transition-colors">
                  <p className="text-[#64748B] dark:text-slate-400 text-xs mb-1 font-semibold uppercase">{s.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm rounded-xl overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-[#E8E6DE] dark:border-slate-700/50 transition-colors">
                      {[t("date"), language === "bn" ? "উৎস/গাভী" : "Source/Cattle", `${t("produced")} (L)`, `${t("sold")} (L)`, `${t("stock")} (L)`, t("pricePerLiter"), language === "bn" ? "আয়" : "Revenue", t("action")].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/30">
                    {milkLogs?.map((log) => {
                      const isHighlighted = log._id === highlightedId || log.id === highlightedId;
                      return (
                        <tr key={log._id || log.id} className={`transition-all duration-500 ${isHighlighted ? "bg-amber-100/70 border-l-4 border-[#F59E0B] dark:bg-amber-500/20" : "hover:bg-[#F5F4EF] dark:hover:bg-slate-700/20"}`}>
                          <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm">{log.date}</td>
                          <td className="px-4 py-3 text-[#1A1A2E] dark:text-white font-medium text-sm">{log.tagId}</td>
                          <td className="px-4 py-3 text-sky-600 dark:text-sky-400 font-bold">{log.produced}</td>
                          <td className="px-4 py-3 text-[#10B981] dark:text-emerald-400 font-bold">{log.sold}</td>
                          <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 font-medium">{log.produced - log.sold}</td>
                          <td className="px-4 py-3 text-[#64748B] dark:text-slate-400 text-sm">৳{log.pricePerLiter}</td>
                          <td className="px-4 py-3 text-[#F59E0B] dark:text-amber-400 font-bold">৳{fmt(log.sold * log.pricePerLiter)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {canEdit && <button onClick={() => openEdit(log)} className="px-2 py-1 rounded text-xs text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-400/10">✏️</button>}
                              {canDelete && <button onClick={() => setDeleteTarget(log)} className="px-2 py-1 rounded text-xs text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-400/10">🗑️</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!milkLogs || milkLogs.length === 0) && (
                      <tr><td colSpan={8} className="text-center py-10 text-[#94A3B8] dark:text-slate-500">{t("noData")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CUSTOMER BILLING ── */}
        {tab === "billing" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === "bn" ? "বিলের মাস:" : "Billing Month:"}</label>
                <input 
                  type="month" 
                  value={billingMonth} 
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                />
              </div>
              <Button onClick={() => setShowCustForm(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 border-none">+ {language === "bn" ? "নতুন কাস্টমার" : "Add Customer"}</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {customers.map(cust => {
                const monthLogs = custLogs.filter(l => l.customerId === cust.id && l.date.startsWith(billingMonth));
                const monthLiters = monthLogs.reduce((s, l) => s + Number(l.liters), 0);
                const monthBill = monthLiters * cust.rate;

                return (
                  <div key={cust.id} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{cust.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">📱 {cust.phone}</p>
                      </div>
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                        ৳{cust.rate} / L
                      </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{language === "bn" ? "এই মাসে নিয়েছে" : "Taken This Month"}</p>
                        <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{monthLiters} L</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{language === "bn" ? "এই মাসের বিল" : "Current Bill"}</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">৳{fmt(monthBill)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/30 px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 flex gap-2">
                      <button 
                        onClick={() => { setSelectedCustId(cust.id); setShowCustLogForm(true); }}
                        className="flex-1 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold py-2 rounded-lg text-sm transition-colors border border-sky-200 dark:border-sky-500/20"
                      >
                        + {language === "bn" ? "দুধ এন্ট্রি" : "Add Milk"}
                      </button>
                      <button 
                        onClick={() => handlePrintInvoice(cust)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        🖨️ {language === "bn" ? "বিল প্রিন্ট" : "Print Bill"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {customers.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="text-slate-500">{language === "bn" ? "কোনো কাস্টমার যুক্ত করা হয়নি" : "No customers added yet"}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {/* 1. Daily Milk Form */}
      <Modal isOpen={showForm || !!editTarget} onClose={closeForm} title={editTarget ? (language === "bn" ? "এন্ট্রি এডিট করুন" : "Edit Entry") : t("addMilkEntry")}>
        <div className="space-y-4">
          <Field label={t("date")}><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label={language === "bn" ? "কোন গাভীর দুধ? (ঐচ্ছিক)" : "Which Cow? (Optional)"}>
            <Select value={form.cattleId} onChange={(e) => set("cattleId", e.target.value)}>
              <option value="">-- {language === "bn" ? "ফার্মের মোট হিসাব" : "Total Farm"} --</option>
              {dairyCows.map(c => <option key={c._id} value={c._id}>{c.tagId} - {c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("produced")} (L)`}><Input type="number" value={form.produced} onChange={(e) => set("produced", e.target.value)} placeholder="50" /></Field>
            <Field label={`${t("sold")} (L)`}><Input type="number" value={form.sold} onChange={(e) => set("sold", e.target.value)} placeholder="45" /></Field>
          </div>
          <Field label={`${t("pricePerLiter")} (৳)`}><Input type="number" value={form.pricePerLiter} onChange={(e) => set("pricePerLiter", e.target.value)} placeholder="70" /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeForm}>{t("cancel")}</Button>
            <Button onClick={handleSaveDaily} className="bg-sky-600 hover:bg-sky-700 border-none">💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      {/* 2. Add Customer Form */}
      <Modal isOpen={showCustForm} onClose={() => setShowCustForm(false)} title={language === "bn" ? "নতুন কাস্টমার যুক্ত করুন" : "Add New Customer"}>
        <div className="space-y-4">
          <Field label={language === "bn" ? "কাস্টমারের নাম" : "Customer Name"}><Input value={custForm.name} onChange={(e) => setCustForm({...custForm, name: e.target.value})} placeholder="Mr. Rahim" /></Field>
          <Field label={language === "bn" ? "ফোন নাম্বার" : "Phone Number"}><Input type="tel" value={custForm.phone} onChange={(e) => setCustForm({...custForm, phone: e.target.value})} placeholder="01XXX..." /></Field>
          <Field label={language === "bn" ? "দুধের রেট (প্রতি লিটার)" : "Rate (per liter)"}><Input type="number" value={custForm.rate} onChange={(e) => setCustForm({...custForm, rate: e.target.value})} placeholder="70" /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCustForm(false)}>{t("cancel")}</Button>
            <Button onClick={handleSaveCustomer} className="bg-emerald-600 hover:bg-emerald-700 border-none">💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      {/* 3. Add Customer Milk Log */}
      <Modal isOpen={showCustLogForm} onClose={() => setShowCustLogForm(false)} title={language === "bn" ? "দুধ এন্ট্রি করুন" : "Add Milk Entry"}>
        <div className="space-y-4">
          <Field label={t("date")}><Input type="date" value={custLogForm.date} onChange={(e) => setCustLogForm({...custLogForm, date: e.target.value})} /></Field>
          <Field label={language === "bn" ? "দুধের পরিমাণ (লিটার)" : "Milk Quantity (Liters)"}><Input type="number" value={custLogForm.liters} onChange={(e) => setCustLogForm({...custLogForm, liters: e.target.value})} placeholder="2" /></Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCustLogForm(false)}>{t("cancel")}</Button>
            <Button onClick={handleSaveCustLog} className="bg-sky-600 hover:bg-sky-700 border-none">💾 {t("save")}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} message={language === "bn" ? "এই রেকর্ডটি মুছে ফেলবেন?" : "Delete this record?"} onCancel={() => setDeleteTarget(null)} onConfirm={() => { deleteMilkLog(deleteTarget._id || deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
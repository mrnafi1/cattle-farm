import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mockMilkLogs, mockExpenses, mockIncomes } from "../data/mockData";

const AppContext = createContext();

// Safe localStorage helpers
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { console.warn("Storage full?", e); return false; }
}

export function AppProvider({ children }) {
  // গরুর ডেটা এখন আর লোকাল স্টোরেজ থেকে আসবে না, শুরুতে ফাঁকা থাকবে
  const [cattle,   setCattle]   = useState([]); 
  const [milkLogs, setMilkLogs] = useState(() => lsGet("sgf_milk",     mockMilkLogs));
  const [expenses, setExpenses] = useState(() => lsGet("sgf_expenses", mockExpenses));
  const [incomes,  setIncomes]  = useState(() => lsGet("sgf_incomes",  mockIncomes));
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toasts,   setToasts]   = useState([]);

  // ১. মঙ্গোডিবি ডাটাবেস থেকে রিয়েল ডেটা আনার ফাংশন
  const fetchRealCattleData = async () => {
    try {
      const response = await fetch("http://localhost:5000/cattles");
      const data = await response.json();
      setCattle(data); // ডাটাবেস থেকে ডেটা এসে স্টেটে জমা হবে
    } catch (error) {
      console.error("ডাটাবেস থেকে ডেটা আনতে সমস্যা:", error);
    }
  };

  // পেজ লোড হলে একবার ডাটাবেস থেকে সব গরুর তালিকা আনবে
  useEffect(() => { 
    fetchRealCattleData(); 
  }, []);

  // অন্যান্য বিষয়ের জন্য লোকাল স্টোরেজ আপডেট
  useEffect(() => { lsSet("sgf_milk",     milkLogs); }, [milkLogs]);
  useEffect(() => { lsSet("sgf_expenses", expenses); }, [expenses]);
  useEffect(() => { lsSet("sgf_incomes",  incomes);  }, [incomes]);

  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  // ── Toast ─────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Cattle CRUD (রিয়েল ডাটাবেসের সাথে কানেক্টেড) ───────────────────────────────────────────────
  const addCattle = () => {
    // ফর্ম থেকে ডেটা ডাটাবেসে সেভ হওয়ার পর এই ফাংশনটি কল করে লিস্ট আপডেট করা যাবে
    fetchRealCattleData();
  };

  const updateCattle = (id, data) => {
    setCattle((p) => p.map((c) => c._id === id ? { ...c, ...data } : c));
    addToast("গরুর তথ্য আপডেট হয়েছে ✓");
  };

  // এটিই ডাইনামিক কাজ করবে!
  const deleteCattle = async (id) => {
    try {
      // ১. ডাটাবেস থেকে ডিলিট রিকোয়েস্ট পাঠানো
      const res = await fetch(`http://localhost:5000/cattles/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if(data.deletedCount > 0) {
        // ২. ডাটাবেসে ডিলিট হলে সাথে সাথে লোকাল স্টেট থেকেও মুছে ফেলা (c.id এর বদলে c._id)
        setCattle((prev) => prev.filter((c) => c._id !== id));
        addToast("গরু মুছে ফেলা হয়েছে", "error");
      }
    } catch (error) {
      addToast("মুছে ফেলা সম্ভব হয়নি", "error");
    }
  };

  // ── Milk CRUD ─────────────────────────────────────────────────
  const addMilkLog = (data) => {
    setMilkLogs((p) => [{ ...data, id: Date.now().toString() }, ...p]);
    addToast("দুধের হিসাব সংরক্ষিত হয়েছে ✓");
  };
  const updateMilkLog = (id, data) => {
    setMilkLogs((p) => p.map((l) => l.id === id ? { ...l, ...data } : l));
    addToast("আপডেট হয়েছে ✓");
  };
  const deleteMilkLog = (id) => {
    setMilkLogs((p) => p.filter((l) => l.id !== id));
    addToast("এন্ট্রি মুছে ফেলা হয়েছে", "error");
  };

  // ── Expense CRUD ──────────────────────────────────────────────
  const addExpense = (data) => {
    setExpenses((p) => [{ ...data, id: Date.now().toString() }, ...p]);
    addToast("খরচ সংরক্ষিত হয়েছে ✓");
  };
  const updateExpense = (id, data) => {
    setExpenses((p) => p.map((e) => e.id === id ? { ...e, ...data } : e));
    addToast("খরচ আপডেট হয়েছে ✓");
  };
  const deleteExpense = (id) => {
    setExpenses((p) => p.filter((e) => e.id !== id));
    addToast("খরচ মুছে ফেলা হয়েছে", "error");
  };

  // ── Income CRUD ───────────────────────────────────────────────
  const addIncome = (data) => {
    setIncomes((p) => [{ ...data, id: Date.now().toString() }, ...p]);
    addToast("আয় সংরক্ষিত হয়েছে ✓");
  };
  const updateIncome = (id, data) => {
    setIncomes((p) => p.map((i) => i.id === id ? { ...i, ...data } : i));
    addToast("আয় আপডেট হয়েছে ✓");
  };
  const deleteIncome = (id) => {
    setIncomes((p) => p.filter((i) => i.id !== id));
    addToast("আয়ের এন্ট্রি মুছে ফেলা হয়েছে", "error");
  };

  // ── Stats (computed) ──────────────────────────────────────────
  const stats = {
    // এখন cattle ডাটাবেস থেকে আসছে, তাই ডিলিট করলে এটি ডাইনামিকালি কমে যাবে বা ০ হবে
    totalCattle:    cattle.length, 
    healthyCattle:  cattle.filter((c) => c.status === "healthy").length,
    sickCattle:     cattle.filter((c) => c.status === "sick").length,
    forSaleCattle:  cattle.filter((c) => c.status === "forSale").length,
    todayMilk:      milkLogs[0]?.produced || 0,
    monthlyIncome:  incomes.reduce((s, i) => s + (i.amount || 0), 0),
    monthlyExpense: expenses.reduce((s, e) => s + (e.amount || 0), 0),
    get netProfit() { return this.monthlyIncome - this.monthlyExpense; },
    upcomingVaccines: cattle
      .flatMap((c) =>
        (c.vaccineHistory || []).map((v) => ({
          cattleTag: c.tagId, cattleName: c.name, ...v,
        }))
      )
      .filter((v) => {
        const diff = (new Date(v.nextDue) - new Date()) / 864e5;
        return diff >= 0 && diff <= 30;
      })
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue)),
  };

  return (
    <AppContext.Provider value={{
      cattle, milkLogs, expenses, incomes,
      addCattle, updateCattle, deleteCattle, fetchRealCattleData,
      addMilkLog, updateMilkLog, deleteMilkLog,
      addExpense, updateExpense, deleteExpense,
      addIncome,  updateIncome,  deleteIncome,
      stats, toasts, addToast, removeToast, isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
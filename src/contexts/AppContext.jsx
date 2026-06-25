import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mockMilkLogs, mockExpenses, mockIncomes } from "../data/mockData";

const AppContext = createContext();

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { console.warn("Storage full?", e); return false; }
}

export function AppProvider({ children }) {
  const [cattle,   setCattle]   = useState([]);
  const [milkLogs, setMilkLogs] = useState(() => lsGet("sgf_milk",     mockMilkLogs));
  const [expenses, setExpenses] = useState(() => lsGet("sgf_expenses", mockExpenses));
  const [incomes,  setIncomes]  = useState(() => lsGet("sgf_incomes",  mockIncomes));
  const [sales,    setSales]    = useState(() => lsGet("sgf_sales",    []));
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toasts,   setToasts]   = useState([]);

  const fetchRealCattleData = async () => {
    try {
      const response = await fetch("https://cattle-farm-server.onrender.com/cattles");
      const data = await response.json();
      setCattle(data);
    } catch (error) {
      console.error("ডাটাবেস থেকে ডেটা আনতে সমস্যা:", error);
    }
  };

  useEffect(() => { fetchRealCattleData(); }, []);

  useEffect(() => { lsSet("sgf_milk",     milkLogs); }, [milkLogs]);
  useEffect(() => { lsSet("sgf_expenses", expenses); }, [expenses]);
  useEffect(() => { lsSet("sgf_incomes",  incomes);  }, [incomes]);
  useEffect(() => { lsSet("sgf_sales",    sales);    }, [sales]);

  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // ── Toast ─────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Cattle CRUD ───────────────────────────────────────────────
  const addCattle = () => {
    fetchRealCattleData();
  };

  const updateCattle = async (id, data) => {
    try {
      // ১. ডাটাবেসে (Render) তথ্য পাঠানো
      const res = await fetch(`https://cattle-farm-server.onrender.com/cattles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        // ২. ডাটাবেসে সেভ হলে ড্যাশবোর্ডের স্ক্রিন (স্টেট) আপডেট করা
        setCattle((p) => p.map((c) => (c._id === id || c.id === id) ? { ...c, ...data } : c));
        // addToast("তথ্য আপডেট হয়েছে ✓"); // এখানে টোস্ট দিলে ডাবল টোস্ট হতে পারে, তাই বন্ধ রাখলাম।
      }
    } catch (error) {
      console.error("আপডেট এরর:", error);
      addToast("আপডেট করা সম্ভব হয়নি", "error");
    }
  };

  const deleteCattle = async (id) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/cattles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.deletedCount > 0) {
        setCattle((prev) => prev.filter((c) => c._id !== id));
        addToast("গরু মুছে ফেলা হয়েছে", "error");
      }
    } catch (error) {
      addToast("মুছে ফেলা সম্ভব হয়নি", "error");
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

  // ── Sales CRUD ────────────────────────────────────────────────
  const sellCattle = async (cattleId, saleData) => {
    const cow = cattle.find((c) => c._id === cattleId);
    if (!cow) return;

    const record = {
      id:            Date.now().toString(),
      cattleId:      cow._id,
      tagId:         cow.tagId,
      cattleName:    cow.name,
      breed:         cow.breed,
      type:          cow.type,
      purchasePrice: cow.purchasePrice || 0,
      photo:         cow.photo || null,
      ...saleData,
      salePrice:     Number(saleData.salePrice),
      profit:        Number(saleData.salePrice) - (cow.purchasePrice || 0),
    };

    setSales((p) => [record, ...p]);

    try {
      await fetch(`https://cattle-farm-server.onrender.com/cattles/${cattleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold", saleDate: saleData.saleDate }),
      });
    } catch (e) {
      console.error("Status update failed", e);
    }

    setCattle((p) => p.map((c) =>
      c._id === cattleId
        ? { ...c, status: "sold", saleDate: saleData.saleDate }
        : c
    ));

    addIncome({
      date:        saleData.saleDate,
      source:      "cattle_sale",
      amount:      Number(saleData.salePrice),
      description: `${cow.tagId} বিক্রয় — ${saleData.buyerName || "ক্রেতা"}`,
    });

    addToast(`${cow.tagId} সফলভাবে বিক্রি হয়েছে ✓`);
    return record;
  };

  const deleteSale = (id) => {
    setSales((p) => p.filter((s) => s.id !== id));
    addToast("বিক্রির রেকর্ড মুছে ফেলা হয়েছে", "error");
  };

  // ── Stats ─────────────────────────────────────────────────────
  const stats = {
    totalCattle:    cattle.filter((c) => c.status !== "sold").length,
    healthyCattle:  cattle.filter((c) => c.status === "healthy").length,
    sickCattle:     cattle.filter((c) => c.status === "sick").length,
    forSaleCattle:  cattle.filter((c) => c.status === "forSale").length,
    soldCattle:     cattle.filter((c) => c.status === "sold").length,
    todayMilk:      milkLogs[0]?.produced || 0,
    monthlyIncome:  incomes.reduce((s, i) => s + (i.amount || 0), 0),
    monthlyExpense: expenses.reduce((s, e) => s + (e.amount || 0), 0),
    totalSaleProfit: sales.reduce((s, r) => s + (r.profit || 0), 0),
    get netProfit() { return this.monthlyIncome - this.monthlyExpense; },
    upcomingVaccines: cattle
      .filter((c) => c.status !== "sold")
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
      cattle, milkLogs, expenses, incomes, sales,
      addCattle, updateCattle, deleteCattle, fetchRealCattleData,
      addMilkLog, updateMilkLog, deleteMilkLog,
      addExpense, updateExpense, deleteExpense,
      addIncome,  updateIncome,  deleteIncome,
      sellCattle, deleteSale,
      stats, toasts, addToast, removeToast, isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
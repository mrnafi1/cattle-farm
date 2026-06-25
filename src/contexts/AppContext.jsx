import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cattle,   setCattle]   = useState([]);
  const [milkLogs, setMilkLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes,  setIncomes]  = useState([]);
  const [sales,    setSales]    = useState([]);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toasts,   setToasts]   = useState([]);

  // ── ডাটাবেস থেকে সব ডাটা আনার ফাংশন ──
  const fetchAllData = async () => {
    try {
      const urls = ["cattles", "milk_logs", "expenses", "incomes", "sales"];
      const [catRes, milkRes, expRes, incRes, saleRes] = await Promise.all(
        urls.map(url => fetch(`https://cattle-farm-server.onrender.com/${url}`))
      );

      setCattle(await catRes.json());
      setMilkLogs(await milkRes.json());
      setExpenses(await expRes.json());
      setIncomes(await incRes.json());
      setSales(await saleRes.json());
    } catch (error) {
      console.error("ডাটা আনতে সমস্যা:", error);
    }
  };

  const fetchRealCattleData = async () => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/cattles");
      setCattle(await res.json());
    } catch (error) {}
  };

  useEffect(() => { fetchAllData(); }, []);

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

  // ── Toast ──
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Cattle CRUD ──
  const updateCattle = async (id, data) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/cattles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setCattle((p) => p.map((c) => (c._id === id || c.id === id) ? { ...c, ...data } : c));
      }
    } catch (error) {
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

  // ── Milk Logs CRUD (নতুন যুক্ত করা হলো) ──
  const addMilkLog = async (data) => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/milk_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newLog = await res.json();
      // নতুন ডেটা সবার উপরে দেখানোর জন্য
      setMilkLogs((p) => [{ ...data, _id: newLog.insertedId }, ...p]);
      addToast("দুধের হিসাব সংরক্ষিত হয়েছে ✓");
    } catch (error) {
      console.error(error);
      addToast("সংরক্ষণ করতে সমস্যা হয়েছে", "error");
    }
  };

  const updateMilkLog = async (id, data) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/milk_logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMilkLogs((p) => p.map((l) => (l._id === id || l.id === id) ? { ...l, ...data } : l));
        addToast("দুধের হিসাব আপডেট হয়েছে ✓");
      }
    } catch (error) {
      addToast("আপডেট করা সম্ভব হয়নি", "error");
    }
  };

  const deleteMilkLog = async (id) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/milk_logs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.deletedCount > 0) {
        setMilkLogs((prev) => prev.filter((l) => l._id !== id && l.id !== id));
        addToast("এন্ট্রি মুছে ফেলা হয়েছে", "error");
      }
    } catch (error) {
      addToast("মুছে ফেলা সম্ভব হয়নি", "error");
    }
  };

  // ── Expense CRUD ──
  const addExpense = async (data) => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newExp = await res.json();
      setExpenses((p) => [{ ...data, _id: newExp.insertedId }, ...p]);
      addToast("খরচ সংরক্ষিত হয়েছে ✓");
    } catch (error) { console.error(error); }
  };

  // ── Income CRUD ──
  const addIncome = async (data) => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newInc = await res.json();
      setIncomes((p) => [{ ...data, _id: newInc.insertedId }, ...p]);
      addToast("আয় সংরক্ষিত হয়েছে ✓");
    } catch (error) { console.error(error); }
  };

  // ── Sales Logic ──
  const sellCattle = async (cattleId, saleData) => {
    const cow = cattle.find((c) => c._id === cattleId);
    if (!cow) return;

    const profit = Number(saleData.salePrice) - (cow.purchasePrice || 0);
    const saleRecord = {
      cattleId: cow._id, tagId: cow.tagId, cattleName: cow.name, breed: cow.breed,
      purchasePrice: cow.purchasePrice || 0, ...saleData, salePrice: Number(saleData.salePrice), profit
    };

    try {
      await fetch("https://cattle-farm-server.onrender.com/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleRecord),
      });

      await updateCattle(cattleId, { status: "sold", saleDate: saleData.saleDate });
      
      await addIncome({
        date: saleData.saleDate,
        category: "cattle_sale",
        amount: Number(saleData.salePrice),
        description: `${cow.tagId} বিক্রয় — ${saleData.buyerName || "ক্রেতা"}`,
      });
      
      fetchAllData(); // রিফ্রেশ
      addToast(`${cow.tagId} সফলভাবে বিক্রি হয়েছে ✓`);
    } catch (e) { addToast("বিক্রি সম্পন্ন করতে সমস্যা হয়েছে", "error"); }
  };

  // ── Death Logic ──
  const markCattleDead = async (cattleId, deathData) => {
    const cow = cattle.find((c) => c._id === cattleId);
    if (!cow) return;

    try {
      await updateCattle(cattleId, { status: "dead", deathDate: deathData.date, deathReason: deathData.reason });
      
      if (Number(deathData.lossAmount) > 0) {
        await addExpense({
          date: deathData.date,
          category: "cattle_death",
          amount: Number(deathData.lossAmount),
          description: `${cow.tagId} মৃত্যুজনিত ক্ষতি (${deathData.reason})`,
        });
      }
      addToast(`${cow.tagId} মৃত হিসেবে চিহ্নিত হয়েছে`, "error");
    } catch (e) { addToast("আপডেট করতে সমস্যা হয়েছে", "error"); }
  };

  // ── Stats ──
  const stats = {
    totalCattle:    cattle.filter((c) => c.status !== "sold" && c.status !== "dead").length,
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
      .filter((c) => c.status !== "sold" && c.status !== "dead")
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
      updateCattle, deleteCattle, fetchRealCattleData, fetchAllData,
      addMilkLog, updateMilkLog, deleteMilkLog, // <-- নতুন ফাংশনগুলো এখানে এক্সপোর্ট করা হলো
      addExpense, addIncome, sellCattle, markCattleDead,
      stats, toasts, addToast, removeToast, isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
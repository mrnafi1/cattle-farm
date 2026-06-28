import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cattle,    setCattle]    = useState([]);
  const [milkLogs,  setMilkLogs]  = useState([]);
  const [expenses,  setExpenses]  = useState([]);
  const [incomes,   setIncomes]   = useState([]);
  const [sales,     setSales]     = useState([]);
  const [inventory, setInventory] = useState([]);
  const [feedLogs,  setFeedLogs]  = useState([]);
  const [funds,     setFunds]     = useState([]); // ── নতুন: ফান্ডের স্টেট ──
  
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toasts,   setToasts]   = useState([]);

  const fetchAllData = async () => {
    try {
      // ── নতুন: 'funds' URL যুক্ত করা হলো ──
      const urls = ["cattles", "milk_logs", "expenses", "incomes", "sales", "inventory", "feed_logs", "funds"];
      const [catRes, milkRes, expRes, incRes, saleRes, invRes, feedRes, fundRes] = await Promise.all(
        urls.map(url => fetch(`https://cattle-farm-server.onrender.com/${url}`).catch(() => ({ json: () => [] }))) // Fallback added
      );

      setCattle(await catRes.json());
      setMilkLogs(await milkRes.json());
      setExpenses(await expRes.json());
      setIncomes(await incRes.json());
      setSales(await saleRes.json());
      setInventory(await invRes.json());
      setFeedLogs(await feedRes.json());
      
      // ── নতুন: ফান্ড ফেচিং (Error handle সহ) ──
      try {
        const fundsData = await fundRes.json();
        setFunds(Array.isArray(fundsData) ? fundsData : []);
      } catch (e) {
        setFunds([]);
      }

    } catch (error) { console.error("ডাটা আনতে সমস্যা:", error); }
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

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Shareholder Funds CRUD (নতুন যুক্ত করা হলো) ──
  const addFund = async (data) => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newFund = await res.json();
      setFunds((p) => [{ ...data, _id: newFund.insertedId }, ...p]);
      addToast("ফান্ড সংরক্ষিত হয়েছে ✓");
    } catch (error) { addToast("ফান্ড সেভ করতে সমস্যা হয়েছে", "error"); }
  };

  const updateFund = async (id, data) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/funds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setFunds((p) => p.map((f) => (f._id === id || f.id === id) ? { ...f, ...data } : f));
        addToast("ফান্ড আপডেট হয়েছে ✓");
      }
    } catch (error) { addToast("আপডেট করা সম্ভব হয়নি", "error"); }
  };

  const deleteFund = async (id) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/funds/${id}`, { method: "DELETE" });
      setFunds((prev) => prev.filter((f) => f._id !== id && f.id !== id));
      addToast("ফান্ডের রেকর্ড মুছে ফেলা হয়েছে", "error");
    } catch (error) { addToast("মুছে ফেলতে সমস্যা হয়েছে", "error"); }
  };

  // ── Expense & Income CRUD ──
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

  const updateExpense = async (id, data) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setExpenses((p) => p.map((e) => (e._id === id || e.id === id) ? { ...e, ...data } : e));
        addToast("খরচ আপডেট হয়েছে ✓");
      }
    } catch (error) { addToast("আপডেট করা সম্ভব হয়নি", "error"); }
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e._id !== id && e.id !== id));
      addToast("খরচ মুছে ফেলা হয়েছে", "error");
    } catch (error) { addToast("মুছে ফেলতে সমস্যা হয়েছে", "error"); }
  };

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

  const updateIncome = async (id, data) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/incomes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIncomes((p) => p.map((i) => (i._id === id || i.id === id) ? { ...i, ...data } : i));
        addToast("আয় আপডেট হয়েছে ✓");
      }
    } catch (error) { addToast("আপডেট করা সম্ভব হয়নি", "error"); }
  };

  const deleteIncome = async (id) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/incomes/${id}`, { method: "DELETE" });
      setIncomes((prev) => prev.filter((i) => i._id !== id && i.id !== id));
      addToast("আয় মুছে ফেলা হয়েছে", "error");
    } catch (error) { addToast("মুছে ফেলতে সমস্যা হয়েছে", "error"); }
  };

  // ── Cattle CRUD ──
  const addCattle = async (data) => {
    const isDuplicate = cattle.some(c => c.tagId.toLowerCase() === data.tagId.toLowerCase());
    if (isDuplicate) {
      addToast(`"${data.tagId}" ট্যাগটি ইতিমধ্যে ব্যবহৃত হচ্ছে!`, "error");
      return { success: false };
    }

    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/cattles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newCattle = await res.json();
      const cowWithId = { ...data, _id: newCattle.insertedId };
      
      setCattle((prev) => [cowWithId, ...prev]);
      
      if (Number(data.purchasePrice) > 0) {
        await addExpense({
          date: data.purchaseDate || new Date().toISOString().slice(0, 10),
          category: "other", 
          amount: Number(data.purchasePrice),
          description: `নতুন গরু ক্রয় (ট্যাগ: ${data.tagId})`,
        });
      }

      addToast("গরু সফলভাবে যুক্ত হয়েছে ✓");
      return { success: true };
    } catch (error) {
      addToast("সংরক্ষণ করতে সমস্যা হয়েছে", "error");
      return { success: false };
    }
  };

  const updateCattle = async (id, data) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/cattles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setCattle((p) => p.map((c) => (c._id === id || c.id === id) ? { ...c, ...data } : c));
    } catch (error) { addToast("আপডেট করা সম্ভব হয়নি", "error"); }
  };

  const deleteCattle = async (id) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/cattles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.deletedCount > 0) {
        setCattle((prev) => prev.filter((c) => c._id !== id));
        addToast("গরু মুছে ফেলা হয়েছে", "error");
      }
    } catch (error) { addToast("মুছে ফেলা সম্ভব হয়নি", "error"); }
  };

  // ── Milk Logs CRUD ──
  const addMilkLog = async (data) => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/milk_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const newLog = await res.json();
      setMilkLogs((p) => [{ ...data, _id: newLog.insertedId }, ...p]);
      addToast("দুধের হিসাব সংরক্ষিত হয়েছে ✓");
    } catch (error) { addToast("সংরক্ষণ করতে সমস্যা হয়েছে", "error"); }
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
    } catch (error) { addToast("আপডেট করা সম্ভব হয়নি", "error"); }
  };

  const deleteMilkLog = async (id) => {
    try {
      const res = await fetch(`https://cattle-farm-server.onrender.com/milk_logs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.deletedCount > 0) {
        setMilkLogs((prev) => prev.filter((l) => l._id !== id && l.id !== id));
        addToast("এন্ট্রি মুছে ফেলা হয়েছে", "error");
      }
    } catch (error) { addToast("মুছে ফেলা সম্ভব হয়নি", "error"); }
  };

  // ── Sales & Death Logic ──
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
        source: "গরু বিক্রি",
        amount: Number(saleData.salePrice),
        description: `${cow.tagId} বিক্রয় — ${saleData.buyerName || "ক্রেতা"}`,
      });
      fetchAllData();
      addToast(`${cow.tagId} সফলভাবে বিক্রি হয়েছে ✓`);
    } catch (e) { addToast("বিক্রি সম্পন্ন করতে সমস্যা হয়েছে", "error"); }
  };

  const markCattleDead = async (cattleId, deathData) => {
    const cow = cattle.find((c) => c._id === cattleId);
    if (!cow) return;

    try {
      await updateCattle(cattleId, { status: "dead", deathDate: deathData.date, deathReason: deathData.reason });
      if (Number(deathData.lossAmount) > 0) {
        await addExpense({
          date: deathData.date,
          category: "other",
          amount: Number(deathData.lossAmount),
          description: `${cow.tagId} মৃত্যুজনিত ক্ষতি (${deathData.reason})`,
        });
      }
      addToast(`${cow.tagId} মৃত হিসেবে চিহ্নিত হয়েছে`, "error");
    } catch (e) { addToast("আপডেট করতে সমস্যা হয়েছে", "error"); }
  };

  // ── Smart Inventory Logic ──
  const addInventoryStock = async (stockData, costAmount) => {
    try {
      const existingItem = inventory.find(i => i.type === stockData.type);

      if (existingItem) {
        const newAmount = Number(existingItem.amount) + Number(stockData.amount);
        await fetch(`https://cattle-farm-server.onrender.com/inventory/${existingItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: newAmount }),
        });
        setInventory(p => p.map(i => i._id === existingItem._id ? { ...i, amount: newAmount } : i));
      } else {
        const res = await fetch("https://cattle-farm-server.onrender.com/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockData),
        });
        const newInv = await res.json();
        setInventory(p => [...p, { ...stockData, _id: newInv.insertedId }]);
      }

      if (Number(costAmount) > 0) {
        await addExpense({
          date: stockData.date || new Date().toISOString().slice(0, 10),
          category: "feed",
          amount: Number(costAmount),
          description: `${stockData.amount} ${stockData.unit || 'kg'} ${stockData.type} কেনা হয়েছে`,
        });
      }
      addToast(`${stockData.type} গুদামে সফলভাবে যুক্ত হয়েছে 🌾`);
    } catch (error) { addToast("গুদামে যুক্ত করতে সমস্যা হয়েছে", "error"); }
  };

  const updateInventoryStock = async (id, newAmount) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(newAmount) }),
      });
      setInventory(p => p.map(i => i._id === id ? { ...i, amount: Number(newAmount) } : i));
      addToast("স্টক আপডেট হয়েছে ✓");
    } catch (error) { addToast("আপডেট করতে সমস্যা হয়েছে", "error"); }
  };

  const deleteInventoryStock = async (id) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/inventory/${id}`, { method: "DELETE" });
      setInventory(p => p.filter(i => i._id !== id));
      addToast("স্টক মুছে ফেলা হয়েছে", "error");
    } catch (error) { addToast("মুছে ফেলতে সমস্যা হয়েছে", "error"); }
  };

  const addFeedLog = async (logData) => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/feed_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      const newLog = await res.json();
      setFeedLogs(p => [{ ...logData, _id: newLog.insertedId }, ...p]);

      const existingItem = inventory.find(i => i.type === logData.type);
      if (existingItem) {
        const newAmount = Math.max(0, Number(existingItem.amount) - Number(logData.amount));
        await fetch(`https://cattle-farm-server.onrender.com/inventory/${existingItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: newAmount }),
        });
        setInventory(p => p.map(i => i._id === existingItem._id ? { ...i, amount: newAmount } : i));
      }
      addToast("গরুকে খাবার দেওয়া সফল হয়েছে 🥣");
    } catch (error) { addToast("খাবার সেভ করতে সমস্যা হয়েছে", "error"); }
  };

  const updateFeedLog = async (id, data) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/feed_logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setFeedLogs(p => p.map(l => l._id === id ? { ...l, ...data } : l));
      addToast("রেকর্ড আপডেট হয়েছে ✓");
    } catch (error) { addToast("আপডেট করতে সমস্যা হয়েছে", "error"); }
  };

  const deleteFeedLog = async (log) => {
    try {
      await fetch(`https://cattle-farm-server.onrender.com/feed_logs/${log._id}`, { method: "DELETE" });
      setFeedLogs(p => p.filter(l => l._id !== log._id));

      const existingItem = inventory.find(i => i.type === log.type);
      if (existingItem) {
        const newAmount = Number(existingItem.amount) + Number(log.amount);
        await fetch(`https://cattle-farm-server.onrender.com/inventory/${existingItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: newAmount }),
        });
        setInventory(p => p.map(i => i._id === existingItem._id ? { ...i, amount: newAmount } : i));
      }
      addToast("রেকর্ড মুছে ফেলা হয়েছে এবং গুদামে খাবার ফেরত এসেছে", "error");
    } catch (error) { addToast("মুছে ফেলতে সমস্যা হয়েছে", "error"); }
  };

  // ── Stats ──
  const stats = {
    totalCattle:  cattle.filter((c) => c.status !== "sold" && c.status !== "dead").length,
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
      cattle, milkLogs, expenses, incomes, sales, inventory, feedLogs, funds, // ── funds যোগ করা হলো
      addCattle, updateCattle, deleteCattle, fetchRealCattleData, fetchAllData,
      addMilkLog, updateMilkLog, deleteMilkLog,
      addExpense, updateExpense, deleteExpense,
      addIncome, updateIncome, deleteIncome,
      addFund, updateFund, deleteFund, // ── নতুন ফাংশনগুলো যোগ করা হলো
      sellCattle, markCattleDead,
      addInventoryStock, addFeedLog, updateInventoryStock, deleteInventoryStock, updateFeedLog, deleteFeedLog,
      stats, toasts, addToast, removeToast, isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
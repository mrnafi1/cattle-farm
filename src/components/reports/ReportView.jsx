import { useState, useMemo } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";
import { generateMonthlyReport, generateShareholderReport } from "../../utils/pdfGenerator";
import { useAuth } from "../../contexts/AuthContext";

export default function ReportView() {
  const { stats, cattle, milkLogs, expenses, incomes } = useApp();
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  
  const [exporting, setExporting] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  const availableMonths = useMemo(() => {
    const mSet = new Set();
    const addDate = (arr) => arr.forEach(x => { if (x.date) mSet.add(x.date.substring(0, 7)); });
    addDate(incomes);
    addDate(expenses);
    addDate(milkLogs);
    
    const current = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    mSet.add(current);
    
    return Array.from(mSet).sort().reverse(); 
  }, [incomes, expenses, milkLogs]);

  const filteredIncomes = selectedMonth === "ALL" ? incomes : incomes.filter(i => i.date?.startsWith(selectedMonth));
  const filteredExpenses = selectedMonth === "ALL" ? expenses : expenses.filter(e => e.date?.startsWith(selectedMonth));
  const filteredMilkLogs = selectedMonth === "ALL" ? milkLogs : milkLogs.filter(m => m.date?.startsWith(selectedMonth));

  const calcIncome = filteredIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const calcExpense = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const calcNetProfit = calcIncome - calcExpense;

  const totalMilkRevenue = filteredMilkLogs.reduce((s, l) => s + ((Number(l.sold)||0) * (Number(l.pricePerLiter)||0)), 0);
  const totalMilkProduced = filteredMilkLogs.reduce((s, l) => s + (Number(l.produced)||0), 0);
  const totalMilkSold = filteredMilkLogs.reduce((s, l) => s + (Number(l.sold)||0), 0);

  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  const catIcons = { feed: "🌾", feed_purchase: "🌾", cattle_purchase: "🐄", cattle_death: "💀", medical: "💊", labor: "👷", electricity: "⚡", other: "📦" };
  const catNames = { 
    feed: language === "bn" ? "গো-খাদ্য" : "Feed", 
    feed_purchase: language === "bn" ? "খাবার ক্রয়" : "Feed Purchase",
    cattle_purchase: language === "bn" ? "গরু ক্রয়" : "Cattle Purchase",
    cattle_death: language === "bn" ? "গরুর মৃত্যু (ক্ষতি)" : "Cattle Death (Loss)",
    medical: language === "bn" ? "চিকিৎসা" : "Medical", 
    labor: language === "bn" ? "শ্রমিক বেতন" : "Labor", 
    electricity: language === "bn" ? "বিদ্যুৎ" : "Electricity", 
    other: language === "bn" ? "অন্যান্য" : "Other" 
  };

  const fmt = (n) => n.toLocaleString(language === "bn" ? "bn-BD" : "en-US");

  const formatMonthLabel = (yyyy_mm) => {
    if (yyyy_mm === "ALL") return language === "bn" ? "সম্পূর্ণ হিসাব (All Time)" : "All Time Records";
    const [y, m] = yyyy_mm.split("-");
    const d = new Date(y, parseInt(m) - 1, 1);
    return d.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { month: "long", year: "numeric" });
  };

  const handleExport = async (type) => {
    setExporting(type);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const customStats = { ...stats, monthlyIncome: calcIncome, monthlyExpense: calcExpense, netProfit: calcNetProfit };
      
      if (type === "monthly") {
        generateMonthlyReport({ cattle, milkLogs: filteredMilkLogs, expenses: filteredExpenses, incomes: filteredIncomes, stats: customStats, month: selectedMonth });
      } else {
        generateShareholderReport({ stats: customStats, milkLogs: filteredMilkLogs, incomes: filteredIncomes, month: selectedMonth });
      }
    } catch (e) {
      console.error(e);
    }
    setExporting(null);
  };

  return (
    <div className="space-y-5 print:text-black print:bg-white print:p-0">
      {/* Header - print:hidden দিয়ে প্রিন্টের সময় কন্ট্রোল প্যানেল লুকানো হয়েছে */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-[#FFFFFF] dark:bg-slate-800/40 p-4 rounded-xl border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm dark:shadow-none transition-colors">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-2 transition-colors">{t("reports")}</h2>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#F5F4EF] dark:bg-slate-900 border border-[#F59E0B]/30 dark:border-amber-400/30 text-[#F59E0B] dark:text-amber-400 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#F59E0B] dark:focus:border-amber-400 font-medium transition-colors cursor-pointer"
          >
            <option value="ALL">{language === "bn" ? "-- সম্পূর্ণ হিসাব (All Time) --" : "-- All Time Records --"}</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => window.print()} variant="secondary" size="sm">
            🖨️ {language === "bn" ? "প্রিন্ট / PDF সেভ" : "Print / Save PDF"}
          </Button>

          {currentUser?.role !== "shareholder" && (
            <Button onClick={() => handleExport("monthly")} variant="outline" size="sm" disabled={exporting === "monthly"}>
              {exporting === "monthly" ? "..." : "📥 PDF (English)"}
            </Button>
          )}

          <Button onClick={() => handleExport("shareholder")} variant="primary" size="sm" disabled={exporting === "shareholder"}>
            {exporting === "shareholder" ? "..." : "📊 Shareholder PDF"}
          </Button>
        </div>
      </div>

      {/* প্রিন্টের জন্য একটি সুন্দর হেডার যা শুধু প্রিন্ট করার সময় দেখা যাবে */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">{language === "bn" ? "খামার রিপোর্ট" : "Farm Report"}</h1>
        <p className="text-slate-500">{formatMonthLabel(selectedMonth)}</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-4">
        {[
          { label: language === "bn" ? "মোট গরু" : "Total Cattle", value: stats.totalCattle, icon: "🐄", color: "text-[#F59E0B] dark:text-amber-400" },
          { label: language === "bn" ? "মোট আয়" : "Total Income", value: `৳${fmt(calcIncome)}`, icon: "💰", color: "text-[#10B981] dark:text-emerald-400" },
          { label: language === "bn" ? "মোট ব্যয়" : "Total Expense", value: `৳${fmt(calcExpense)}`, icon: "💸", color: "text-[#EF4444] dark:text-red-400" },
          { label: language === "bn" ? "নিট লাভ" : "Net Profit", value: `৳${fmt(calcNetProfit)}`, icon: calcNetProfit >= 0 ? "📈" : "📉", color: calcNetProfit >= 0 ? "text-[#10B981] dark:text-emerald-400" : "text-[#EF4444] dark:text-red-400" },
        ].map((item) => (
          <div key={item.label} className="bg-[#FFFFFF] dark:bg-slate-800/40 print:bg-white print:border-slate-200 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#64748B] dark:text-slate-400 print:text-slate-500 text-xs transition-colors">{item.label}</span>
              <span className="text-lg">{item.icon}</span>
            </div>
            <p className={`text-xl font-bold transition-colors ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:grid-cols-2 print:gap-6">
        {/* Cattle inventory */}
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 print:bg-white print:border-slate-200 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl overflow-hidden print:shadow-none shadow-sm dark:shadow-none transition-colors">
          <div className="px-4 py-3 bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/40 print:border-slate-200 flex items-center justify-between transition-colors">
            <h3 className="text-[#1A1A2E] dark:text-white print:text-slate-800 font-semibold text-sm transition-colors">🐄 {language === "bn" ? "গরুর তালিকা" : "Cattle List"}</h3>
            <div className="flex gap-2 text-xs">
              <span className="text-[#10B981] dark:text-emerald-400 transition-colors">{stats.healthyCattle} {language === "bn" ? "সুস্থ" : "Healthy"}</span>
              <span className="text-[#94A3B8] dark:text-slate-600 transition-colors">·</span>
              <span className="text-[#EF4444] dark:text-red-400 transition-colors">{stats.sickCattle} {language === "bn" ? "অসুস্থ" : "Sick"}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E6DE] dark:border-slate-700/30 print:border-slate-200 transition-colors">
                  {[t("tagId"), language === "bn" ? "নাম" : "Name", t("type"), t("weight"), t("status")].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-[#64748B] dark:text-slate-400 print:text-slate-600 transition-colors">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/20 print:divide-slate-200 transition-colors">
                {cattle.map((c) => (
                  <tr key={c._id || c.id} className="hover:bg-[#F5F4EF] dark:hover:bg-slate-700/15 print:text-slate-700 transition-colors">
                    <td className="px-3 py-2 text-[#F59E0B] dark:text-amber-400 print:text-amber-600 font-mono text-xs font-semibold transition-colors">{c.tagId}</td>
                    <td className="px-3 py-2 text-[#1A1A2E] dark:text-white print:text-slate-800 text-xs transition-colors">{c.name}</td>
                    <td className="px-3 py-2 text-[#64748B] dark:text-slate-400 print:text-slate-600 text-xs transition-colors">{t(c.type)}</td>
                    <td className="px-3 py-2 text-[#64748B] dark:text-slate-300 print:text-slate-600 text-xs transition-colors">{c.weight?.[c.weight.length - 1]?.value || "—"} kg</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium transition-colors ${c.status === "healthy" ? "text-[#10B981] dark:text-emerald-400 print:text-emerald-600" : c.status === "sick" ? "text-[#EF4444] dark:text-red-400 print:text-red-600" : "text-[#F59E0B] dark:text-amber-400 print:text-amber-600"}`}>
                        {t(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="bg-[#FFFFFF] dark:bg-slate-800/40 print:bg-white print:border-slate-200 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl p-5 print:shadow-none shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-[#1A1A2E] dark:text-white print:text-slate-800 font-semibold text-sm mb-4 transition-colors">💸 {language === "bn" ? "খরচের বিভাজন" : "Expense Breakdown"}</h3>
          <div className="space-y-3">
            {Object.entries(expenseByCategory).map(([cat, amt]) => {
              const pct = calcExpense > 0 ? Math.round((amt / calcExpense) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#64748B] dark:text-slate-300 print:text-slate-700 text-sm transition-colors">
                      {catIcons[cat] || "📦"} {catNames[cat] || cat}
                    </span>
                    <div className="text-right">
                      <span className="text-[#1A1A2E] dark:text-white print:text-slate-900 font-medium text-sm transition-colors">৳{fmt(amt)}</span>
                      <span className="text-[#94A3B8] dark:text-slate-500 text-xs ml-1 transition-colors">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#E8E6DE] dark:bg-slate-700 print:bg-slate-200 rounded-full overflow-hidden transition-colors">
                    <div className="h-full bg-[#EF4444] dark:bg-gradient-to-r dark:from-red-500/70 dark:to-red-400/50 print:bg-red-400 rounded-full transition-colors" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            
            {Object.keys(expenseByCategory).length === 0 && (
              <p className="text-[#94A3B8] dark:text-slate-500 text-sm text-center py-4 transition-colors">{language === "bn" ? "এই মাসে কোনো খরচ নেই" : "No expenses for this period"}</p>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-[#E8E6DE] dark:border-slate-700/40 print:border-slate-200 transition-colors">
              <span className="text-[#1A1A2E] dark:text-slate-300 print:text-slate-800 text-sm font-semibold transition-colors">{language === "bn" ? "মোট ব্যয়" : "Total"}</span>
              <span className="text-[#EF4444] dark:text-red-400 print:text-red-600 font-bold transition-colors">৳{fmt(calcExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milk production summary */}
      <div className="bg-[#FFFFFF] dark:bg-slate-800/40 print:bg-white print:border-slate-200 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl p-5 print:shadow-none shadow-sm dark:shadow-none transition-colors">
        <h3 className="text-[#1A1A2E] dark:text-white print:text-slate-800 font-semibold text-sm mb-4 transition-colors">🥛 {language === "bn" ? "দুধ উৎপাদন সারসংক্ষেপ" : "Milk Production Summary"}</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: language === "bn" ? "মোট উৎপাদন" : "Total Produced", value: `${fmt(totalMilkProduced)} L`, color: "text-sky-600 dark:text-sky-400" },
            { label: language === "bn" ? "মোট বিক্রয়" : "Total Sold",     value: `${fmt(totalMilkSold)} L`,     color: "text-[#10B981] dark:text-emerald-400" },
            { label: language === "bn" ? "মোট রাজস্ব" : "Total Revenue",  value: `৳${fmt(totalMilkRevenue)}`,  color: "text-[#F59E0B] dark:text-amber-400" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-[#64748B] dark:text-slate-400 print:text-slate-500 text-xs mb-1 transition-colors">{item.label}</p>
              <p className={`font-bold text-lg transition-colors ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Recent milk log */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F5F4EF] dark:bg-transparent border-b border-[#E8E6DE] dark:border-slate-700/30 print:border-slate-200 text-[#64748B] dark:text-slate-500 print:text-slate-600 transition-colors">
                <th className="text-left px-2 py-2">{t("date")}</th>
                <th className="text-right px-2 py-2">{t("produced")} (L)</th>
                <th className="text-right px-2 py-2">{t("sold")} (L)</th>
                <th className="text-right px-2 py-2">{t("stock")} (L)</th>
                <th className="text-right px-2 py-2">{language === "bn" ? "আয়" : "Revenue"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DE] dark:divide-slate-700/20 print:divide-slate-200 print:text-slate-700 transition-colors">
              {filteredMilkLogs.map((l) => (
                <tr key={l._id || l.id} className="hover:bg-[#F5F4EF] dark:hover:bg-slate-700/15 transition-colors">
                  <td className="px-2 py-2 text-[#64748B] dark:text-slate-400 print:text-slate-600 transition-colors">{l.date}</td>
                  <td className="px-2 py-2 text-right text-sky-600 dark:text-sky-400 print:text-sky-600 transition-colors">{l.produced}</td>
                  <td className="px-2 py-2 text-right text-[#10B981] dark:text-emerald-400 print:text-emerald-600 transition-colors">{l.sold}</td>
                  <td className="px-2 py-2 text-right text-[#64748B] dark:text-slate-400 print:text-slate-600 transition-colors">{l.produced - l.sold}</td>
                  <td className="px-2 py-2 text-right text-[#F59E0B] dark:text-amber-400 print:text-amber-600 font-medium transition-colors">৳{fmt(l.sold * l.pricePerLiter)}</td>
                </tr>
              ))}
              {filteredMilkLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-[#94A3B8] dark:text-slate-500 transition-colors">{t("noData")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
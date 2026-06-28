import { useMemo } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function SmartTrend() {
  const { milkLogs, expenses, incomes } = useApp();
  const { language } = useLanguage();

  // ── ডেটা অ্যানালাইসিস লজিক ──
  const { insights } = useMemo(() => {
    const now = new Date();
    
    // গত ৩ মাস এবং আগামী মাসের (Forecast) কি-জেনারেট করা (YYYY-MM)
    const getMonthKey = (d) => d.toISOString().slice(0, 7);

    const m0 = new Date(now.getFullYear(), now.getMonth(), 1);     // Current Month
    const m1 = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last Month
    const m2 = new Date(now.getFullYear(), now.getMonth() - 2, 1); // 2 Months Ago

    const keys = [getMonthKey(m2), getMonthKey(m1), getMonthKey(m0)];

    // ── ১. দুধের ট্রেন্ড বিশ্লেষণ ──
    const milkByMonth = { [keys[0]]: 0, [keys[1]]: 0, [keys[2]]: 0 };
    milkLogs?.forEach(m => {
      const k = m.date.slice(0, 7);
      if (milkByMonth[k] !== undefined) milkByMonth[k] += (Number(m.produced) || 0);
    });
    
    let milkTrend = 0;
    if (milkByMonth[keys[1]] > 0) {
      milkTrend = ((milkByMonth[keys[2]] - milkByMonth[keys[1]]) / milkByMonth[keys[1]]) * 100;
    }

    // ── ২. খরচের ট্রেন্ড ও মূল কারণ বিশ্লেষণ ──
    const expenseByMonth = { [keys[0]]: 0, [keys[1]]: 0, [keys[2]]: 0 };
    const categoryTotals = {};
    
    expenses?.forEach(e => {
      const k = e.date.slice(0, 7);
      if (expenseByMonth[k] !== undefined) expenseByMonth[k] += (Number(e.amount) || 0);
      
      // চলতি মাসের খরচের ক্যাটাগরি হিসাব
      if (k === keys[2]) {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
      }
    });

    let topExpenseCategory = "অন্যান্য";
    let maxExp = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > maxExp) {
        maxExp = amt;
        topExpenseCategory = cat;
      }
    });

    // ── ৩. আয়ের ট্রেন্ড ও আগামী মাসের ফোরকাস্ট ──
    const incomeByMonth = { [keys[0]]: 0, [keys[1]]: 0, [keys[2]]: 0 };
    incomes?.forEach(i => {
      const k = i.date.slice(0, 7);
      if (incomeByMonth[k] !== undefined) incomeByMonth[k] += (Number(i.amount) || 0);
    });

    milkLogs?.forEach(m => {
      const k = m.date.slice(0, 7);
      if (incomeByMonth[k] !== undefined) incomeByMonth[k] += ((Number(m.sold) || 0) * (Number(m.pricePerLiter) || 0));
    });

    // ফোরকাস্ট লজিক: গত ২ মাসের গড়ের সাথে ৫% সম্ভাব্য বৃদ্ধি
    const avgPastIncome = (incomeByMonth[keys[1]] + incomeByMonth[keys[2]]) / 2;
    const projectedIncome = avgPastIncome > 0 ? avgPastIncome * 1.05 : 0;

    // ক্যাটাগরি নাম অনুবাদ
    const catNames = {
      medical: language === "bn" ? "চিকিৎসা" : "Medical",
      feed: language === "bn" ? "খাবার" : "Feed",
      feed_purchase: language === "bn" ? "খাবার ক্রয়" : "Feed Purchase",
      labor: language === "bn" ? "শ্রমিক" : "Labor"
    };
    const topCatName = catNames[topExpenseCategory] || topExpenseCategory;

    return {
      insights: {
        milk: milkTrend,
        topExpense: topCatName,
        expenseAmount: maxExp,
        projectedIncome: projectedIncome
      }
    };
  }, [milkLogs, expenses, incomes, language]);

  const fmt = (n) => n.toLocaleString(language === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 0 });

  return (
    <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 rounded-xl p-5 shadow-sm transition-colors mt-6">
      
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h3 className="text-[#1A1A2E] dark:text-white font-bold text-lg leading-tight transition-colors">
            {language === "bn" ? "স্মার্ট ট্রেন্ড ও ফোরকাস্ট" : "Smart Trend & Forecast"}
          </h3>
          <p className="text-[#64748B] dark:text-slate-400 text-xs transition-colors">
            {language === "bn" ? "গত ৩ মাসের ডেটা বিশ্লেষণ করে এআই-চালিত পূর্বাভাস" : "AI-driven forecast based on last 3 months data"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Milk */}
        <div className="bg-[#F5F4EF] dark:bg-slate-700/30 rounded-xl p-4 border border-[#E8E6DE] dark:border-transparent transition-colors">
          <p className="text-[#64748B] dark:text-slate-400 text-xs font-medium mb-2">🥛 {language === "bn" ? "দুধ উৎপাদন" : "Milk Production"}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${insights.milk >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {insights.milk > 0 ? "+" : ""}{insights.milk.toFixed(1)}%
            </span>
          </div>
          <p className="text-[#1A1A2E] dark:text-slate-300 text-xs mt-1">
            {language === "bn" ? "গত মাসের তুলনায় উৎপাদন" : "Production compared to last month"}
          </p>
        </div>

        {/* Insight 2: Expense */}
        <div className="bg-[#EF4444]/5 dark:bg-red-400/5 rounded-xl p-4 border border-[#EF4444]/10 dark:border-red-400/10 transition-colors">
          <p className="text-[#EF4444] dark:text-red-400 text-xs font-medium mb-2">💸 {language === "bn" ? "খরচের অ্যালার্ট" : "Expense Alert"}</p>
          <div className="text-[#1A1A2E] dark:text-white text-sm font-semibold">
            {language === "bn" ? "মূল কারণ:" : "Main driver:"} <span className="text-[#EF4444] dark:text-red-400">{insights.topExpense}</span>
          </div>
          <p className="text-[#64748B] dark:text-slate-400 text-xs mt-1">
            {language === "bn" ? `চলতি মাসে সর্বোচ্চ খরচ: ৳${fmt(insights.expenseAmount)}` : `Highest expense this month: ৳${fmt(insights.expenseAmount)}`}
          </p>
        </div>

        {/* Insight 3: Forecast */}
        <div className="bg-[#F59E0B]/5 dark:bg-amber-400/5 rounded-xl p-4 border border-[#F59E0B]/20 dark:border-amber-400/15 transition-colors relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-5xl opacity-10">🔮</div>
          <p className="text-[#F59E0B] dark:text-amber-400 text-xs font-medium mb-2">🔮 {language === "bn" ? "আগামী মাসের ফোরকাস্ট" : "Next Month Forecast"}</p>
          <div className="text-xl font-bold text-[#1A1A2E] dark:text-white">
            ৳{fmt(insights.projectedIncome)}
          </div>
          <p className="text-[#64748B] dark:text-slate-400 text-xs mt-1">
            {language === "bn" ? "আনুমানিক আয় হতে পারে" : "Estimated projected income"}
          </p>
        </div>
      </div>

    </div>
  );
}
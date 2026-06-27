import { useMemo } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function SmartTrend() {
  const { milkLogs, expenses, incomes } = useApp();
  const { language } = useLanguage();

  // ── ডেটা অ্যানালাইসিস লজিক ──
  const { insights, chartData } = useMemo(() => {
    const now = new Date();
    
    // গত ৩ মাস এবং আগামী মাসের (Forecast) কি-জেনারেট করা (YYYY-MM)
    const getMonthKey = (d) => d.toISOString().slice(0, 7);
    const getMonthName = (d) => d.toLocaleString(language === "bn" ? "bn-BD" : "en-US", { month: "short" });

    const m0 = new Date(now.getFullYear(), now.getMonth(), 1);     // Current Month
    const m1 = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Last Month
    const m2 = new Date(now.getFullYear(), now.getMonth() - 2, 1); // 2 Months Ago
    const mNext = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Next Month

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
      if (amount > maxExp) {
        maxExp = amt;
        topExpenseCategory = cat;
      }
    });

    // ── ৩. আয়ের ট্রেন্ড ও আগামী মাসের ফোরকাস্ট ──
    const incomeByMonth = { [keys[0]]: 0, [keys[1]]: 0, [keys[2]]: 0 };
    incomes?.forEach(i => {
      const k = i.date.slice(0, 7);
      if (incomeByMonth[k] !== undefined) incomeByMonth[k] += (Number(i.amount) || 0);
    });

    milkLogs?.forEach(m => {
      const k = m.date.slice(0, 7);
      if (incomeByMonth[k] !== undefined) incomeByMonth[k] += ((Number(m.sold) || 0) * (Number(m.pricePerLiter) || 0));
    });

    // ফোরকাস্ট লজিক: গত ২ মাসের গড়ের সাথে ৫% সম্ভাব্য বৃদ্ধি
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

    // চার্টের জন্য ডেটা প্রস্তুত
    const cData = [
      { label: getMonthName(m2), value: incomeByMonth[keys[0]], isProjected: false },
      { label: getMonthName(m1), value: incomeByMonth[keys[1]], isProjected: false },
      { label: getMonthName(m0), value: incomeByMonth[keys[2]], isProjected: false },
      { label: getMonthName(mNext), value: projectedIncome, isProjected: true },
    ];

    return {
      insights: {
        milk: milkTrend,
        topExpense: topCatName,
        expenseAmount: maxExp,
        projectedIncome: projectedIncome
      },
      chartData: cData
    };
  }, [milkLogs, expenses, incomes, language]);

  const fmt = (n) => n.toLocaleString(language === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 0 });

  // ── SVG Chart Drawing Logic ──
  const maxVal = Math.max(...chartData.map(d => d.value), 100); // 0 এড়ানোর জন্য মিনিমাম 100
  const chartHeight = 120;
  const getY = (val) => chartHeight - ((val / maxVal) * chartHeight * 0.8) - 10; // 20% padding
  
  const points = chartData.map((d, i) => `${i * 33.33}%,${getY(d.value)}`);
  
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Insight 1: Milk */}
        <div className="bg-[#F5F4EF] dark:bg-slate-700/30 rounded-xl p-4 border border-[#E8E6DE] dark:border-transparent transition-colors">
          <p className="text-[#64748B] dark:text-slate-400 text-xs font-medium mb-2">🥛 {language === "bn" ? "দুধ উৎপাদন" : "Milk Production"}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${insights.milk >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {insights.milk > 0 ? "+" : ""}{insights.milk.toFixed(1)}%
            </span>
          </div>
          <p className="text-[#1A1A2E] dark:text-slate-300 text-xs mt-1">
            {language === "bn" ? "গত মাসের তুলনায় উৎপাদন" : "Production compared to last month"}
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
            {language === "bn" ? "আনুমানিক আয় হতে পারে" : "Estimated projected income"}
          </p>
        </div>
      </div>

      {/* ── Custom SVG Trend Graph ── */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-4">{language === "bn" ? "আয়ের ট্রেন্ড (বিগত ৩ মাস + আগামী মাস)" : "Income Trend (Last 3 + Next Month)"}</p>
        
        <div className="relative w-full" style={{ height: chartHeight }}>
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="currentColor" className="text-[#E8E6DE] dark:text-slate-700" strokeWidth="1" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" className="text-[#E8E6DE] dark:text-slate-700/50" strokeWidth="1" strokeDasharray="4,4" />
            
            {/* Solid Line (Past 3 months) */}
            <polyline 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="3" 
              points={`${points[0]} ${points[1]} ${points[2]}`} 
              className="drop-shadow-sm"
            />
            
            {/* Dashed Line (Forecast Next month) */}
            <polyline 
              fill="none" 
              stroke="#F59E0B" 
              strokeWidth="3" 
              strokeDasharray="6,6"
              points={`${points[2]} ${points[3]}`} 
            />

            {/* Data Points */}
            {chartData.map((d, i) => (
              <g key={i}>
                <circle 
                  cx={`${i * 33.33}%`} 
                  cy={getY(d.value)} 
                  r="5" 
                  fill={d.isProjected ? "#F59E0B" : "#10B981"} 
                  stroke="#FFFFFF" 
                  strokeWidth="2" 
                  className="dark:stroke-slate-800"
                />
                {/* Tooltip-like Values */}
                <text 
                  x={`${i * 33.33}%`} 
                  y={getY(d.value) - 15} 
                  textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"} 
                  className="text-[10px] fill-[#64748B] dark:fill-slate-400 font-medium"
                >
                  ৳{fmt(d.value)}
                </text>
              </g>
            ))}
          </svg>
          
          {/* X-Axis Labels */}
          <div className="flex justify-between mt-2 text-[10px] font-semibold text-[#94A3B8] dark:text-slate-500">
            {chartData.map((d, i) => (
              <span key={i} className={d.isProjected ? "text-[#F59E0B] dark:text-amber-400" : ""}>
                {d.label} {d.isProjected && (language === "bn" ? "(আনুমানিক)" : "(Est.)")}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
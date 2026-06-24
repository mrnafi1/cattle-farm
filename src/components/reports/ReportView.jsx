import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";
import { generateMonthlyReport, generateShareholderReport } from "../../utils/pdfGenerator";
import { useAuth } from "../../contexts/AuthContext";

export default function ReportView() {
  const { stats, cattle, milkLogs, expenses, incomes } = useApp();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    setExporting(type);
    // small delay so spinner shows
    await new Promise((r) => setTimeout(r, 200));
    try {
      if (type === "monthly") {
        generateMonthlyReport({ cattle, milkLogs, expenses, incomes, stats });
      } else {
        generateShareholderReport({ stats, milkLogs, incomes });
      }
    } catch (e) {
      console.error(e);
    }
    setExporting(null);
  };

  const totalMilkRevenue = milkLogs.reduce((s, l) => s + l.sold * l.pricePerLiter, 0);
  const totalMilkProduced = milkLogs.reduce((s, l) => s + l.produced, 0);
  const totalMilkSold    = milkLogs.reduce((s, l) => s + l.sold, 0);

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const catIcons = { feed: "🌾", medical: "💊", labor: "👷", electricity: "⚡", other: "📦" };
  const catNames = { feed: "গো-খাদ্য", medical: "চিকিৎসা", labor: "শ্রমিক বেতন", electricity: "বিদ্যুৎ", other: "অন্যান্য" };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{t("reports")}</h2>
          <p className="text-slate-500 text-sm">
            {new Date().toLocaleDateString("bn-BD", { year: "numeric", month: "long" })} — মাসিক রিপোর্ট
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => window.print()}
            variant="secondary"
            size="sm"
          >
            🖨️ প্রিন্ট
          </Button>

          {currentUser?.role !== "shareholder" && (
            <Button
              onClick={() => handleExport("monthly")}
              variant="outline"
              size="sm"
              disabled={exporting === "monthly"}
            >
              {exporting === "monthly" ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  তৈরি হচ্ছে...
                </span>
              ) : (
                "📥 মাসিক PDF"
              )}
            </Button>
          )}

          <Button
            onClick={() => handleExport("shareholder")}
            variant="primary"
            size="sm"
            disabled={exporting === "shareholder"}
          >
            {exporting === "shareholder" ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                তৈরি হচ্ছে...
              </span>
            ) : (
              "📊 শেয়ারহোল্ডার PDF"
            )}
          </Button>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট গরু",    value: stats.totalCattle,                               icon: "🐄", color: "text-amber-400" },
          { label: "মোট আয়",     value: `৳${stats.monthlyIncome.toLocaleString("bn-BD")}`, icon: "💰", color: "text-emerald-400" },
          { label: "মোট ব্যয়",    value: `৳${stats.monthlyExpense.toLocaleString("bn-BD")}`,icon: "💸", color: "text-red-400" },
          { label: "নিট লাভ",    value: `৳${stats.netProfit.toLocaleString("bn-BD")}`,    icon: stats.netProfit >= 0 ? "📈" : "📉", color: stats.netProfit >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">{item.label}</span>
              <span className="text-lg">{item.icon}</span>
            </div>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cattle inventory */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">🐄 গরুর তালিকা</h3>
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-400">{stats.healthyCattle} সুস্থ</span>
              <span className="text-slate-600">·</span>
              <span className="text-red-400">{stats.sickCattle} অসুস্থ</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400">{stats.forSaleCattle} বিক্রয়যোগ্য</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/30">
                  {["ট্যাগ", "নাম", "ধরন", "ওজন", "অবস্থা"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {cattle.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/15">
                    <td className="px-3 py-2 text-amber-400 font-mono text-xs font-semibold">{c.tagId}</td>
                    <td className="px-3 py-2 text-white text-xs">{c.name}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{c.type === "dairy" ? "ডেইরি" : "মোটাতাজা"}</td>
                    <td className="px-3 py-2 text-slate-300 text-xs">{c.weight?.[c.weight.length - 1]?.value || "—"} kg</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${
                        c.status === "healthy" ? "text-emerald-400"
                        : c.status === "sick" ? "text-red-400"
                        : "text-amber-400"
                      }`}>
                        {c.status === "healthy" ? "সুস্থ" : c.status === "sick" ? "অসুস্থ" : "বিক্রয়যোগ্য"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">💸 খরচের বিভাজন</h3>
          <div className="space-y-3">
            {Object.entries(expenseByCategory).map(([cat, amt]) => {
              const pct = stats.monthlyExpense > 0
                ? Math.round((amt / stats.monthlyExpense) * 100)
                : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 text-sm">
                      {catIcons[cat]} {catNames[cat] || cat}
                    </span>
                    <div className="text-right">
                      <span className="text-white font-medium text-sm">
                        ৳{amt.toLocaleString("bn-BD")}
                      </span>
                      <span className="text-slate-500 text-xs ml-1">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500/70 to-red-400/50 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700/40">
              <span className="text-slate-300 text-sm font-semibold">মোট ব্যয়</span>
              <span className="text-red-400 font-bold">
                ৳{stats.monthlyExpense.toLocaleString("bn-BD")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Milk production summary */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">🥛 দুধ উৎপাদন সারসংক্ষেপ</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "মোট উৎপাদন", value: `${totalMilkProduced} L`, color: "text-sky-400" },
            { label: "মোট বিক্রয়",  value: `${totalMilkSold} L`,    color: "text-emerald-400" },
            { label: "মোট রাজস্ব",  value: `৳${totalMilkRevenue.toLocaleString("bn-BD")}`, color: "text-amber-400" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-slate-400 text-xs mb-1">{item.label}</p>
              <p className={`font-bold text-lg ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Recent milk log */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/30 text-slate-500">
                <th className="text-left py-1.5">তারিখ</th>
                <th className="text-right py-1.5">উৎপাদন (L)</th>
                <th className="text-right py-1.5">বিক্রয় (L)</th>
                <th className="text-right py-1.5">মজুত (L)</th>
                <th className="text-right py-1.5">আয়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {milkLogs.slice(0, 7).map((l) => (
                <tr key={l.id} className="hover:bg-slate-700/15">
                  <td className="py-1.5 text-slate-400">{l.date}</td>
                  <td className="py-1.5 text-right text-sky-400">{l.produced}</td>
                  <td className="py-1.5 text-right text-emerald-400">{l.sold}</td>
                  <td className="py-1.5 text-right text-slate-400">{l.produced - l.sold}</td>
                  <td className="py-1.5 text-right text-amber-400 font-medium">
                    ৳{(l.sold * l.pricePerLiter).toLocaleString("bn-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming vaccines summary */}
      {stats.upcomingVaccines.length > 0 && (
        <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-5">
          <h3 className="text-amber-400 font-semibold text-sm mb-3">
            💉 আসন্ন টিকা ({stats.upcomingVaccines.length}টি)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.upcomingVaccines.map((v, i) => {
              const days = Math.ceil((new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-amber-400 font-mono text-xs font-semibold">{v.cattleTag}</span>
                    <span className="text-slate-300 text-xs ml-1.5">{v.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${days <= 7 ? "text-red-400" : "text-amber-400"}`}>
                    {days} দিন
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

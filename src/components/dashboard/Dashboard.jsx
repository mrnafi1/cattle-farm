import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import StatCard from "./StatCard";
import { MonthlyIncomeExpenseChart, MilkTrendChart } from "./Charts";
import VaccineAlert from "../cattle/VaccineAlert";
import PWAInstallBanner from "../ui/PWAInstallBanner";

export default function Dashboard() {
  const { stats, milkLogs } = useApp();
  const { t, language } = useLanguage();
  const [showVaccineModal, setShowVaccineModal] = useState(false);

  const fmt = (n) => n.toLocaleString(language === "bn" ? "bn-BD" : "en-BD");

  return (
    <div className="space-y-5">
      {/* PWA install banner */}
      <PWAInstallBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("totalCattle")}    value={fmt(stats.totalCattle)}                    icon="🐄" color="amber" />
        <StatCard label={t("todayMilk")}      value={`${fmt(stats.todayMilk)} L`}               icon="🥛" color="sky" />
        <StatCard label={t("monthlyIncome")}  value={`৳${fmt(stats.monthlyIncome)}`}             icon="💰" color="emerald" trend={1} trendLabel={language === "bn" ? "গত মাসের চেয়ে বেশি" : "More than last month"} />
        <StatCard label={t("netProfit")}      value={`৳${fmt(stats.netProfit)}`}                 icon={stats.netProfit >= 0 ? "📈" : "📉"} color={stats.netProfit >= 0 ? "emerald" : "red"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyIncomeExpenseChart />
        <MilkTrendChart data={milkLogs.slice(0, 7)} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cattle status */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">{language === "bn" ? "গরুর অবস্থা" : "Cattle Status"}</h3>
          <div className="space-y-3">
            {[
              { label: t("healthy"), count: stats.healthyCattle, dot: "bg-emerald-400", bg: "bg-emerald-400/8" },
              { label: t("sick"),    count: stats.sickCattle,    dot: "bg-red-400",     bg: "bg-red-400/8" },
              { label: t("forSale"), count: stats.forSaleCattle, dot: "bg-amber-400",   bg: "bg-amber-400/8" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${item.bg} border border-white/5`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  <span className="text-slate-300 text-sm">{item.label}</span>
                </div>
                <span className="text-white font-bold text-sm">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Vaccines */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">
              {t("upcomingVaccines")}
              {stats.upcomingVaccines.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-400/10 text-amber-400 text-xs rounded-full border border-amber-400/20">
                  {stats.upcomingVaccines.length}
                </span>
              )}
            </h3>
            {stats.upcomingVaccines.length > 0 && (
              <button
                onClick={() => setShowVaccineModal(true)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors border border-amber-400/20 hover:border-amber-400/40 px-2.5 py-1 rounded-lg"
              >
                {language === "bn" ? "সব দেখুন →" : "View All →"}
              </button>
            )}
          </div>

          {stats.upcomingVaccines.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">✅</span>
              <p className="text-slate-400 text-sm">{language === "bn" ? "আগামী ৩০ দিনে কোনো টিকা নেই" : "No vaccines scheduled for the next 30 days"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.upcomingVaccines.slice(0, 4).map((v, i) => {
                const daysLeft = Math.ceil(
                  (new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 7;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? "bg-red-400 animate-pulse" : "bg-amber-400"}`} />
                      <div>
                        <span className="text-amber-400 font-medium text-sm">{v.cattleTag}</span>
                        <span className="text-slate-400 text-sm ml-1.5">{v.cattleName}</span>
                        <span className="text-slate-500 text-xs ml-1.5">— {v.name}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                      isUrgent
                        ? "bg-red-400/15 text-red-400 border-red-400/25"
                        : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                    }`}>
                      {daysLeft} {language === "bn" ? "দিন" : "Days"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vaccine Modal */}
      <VaccineAlert
        isOpen={showVaccineModal}
        onClose={() => setShowVaccineModal(false)}
      />
    </div>
  );
}
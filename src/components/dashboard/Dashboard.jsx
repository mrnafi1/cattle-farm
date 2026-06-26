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

  const currentMonth = new Date().toLocaleString(language === "bn" ? "bn-BD" : "en-US", { month: "long" });
  const incomeTrendText = language === "bn" ? "গত মাসের তুলনায়" : "vs Last month";

  return (
    <div className="space-y-5">
      {/* PWA install banner */}
      <PWAInstallBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={t("totalCattle")}    
          value={fmt(stats.totalCattle)}                    
          icon="🐄" color="amber" 
        />
        
        <StatCard 
          label={t("todayMilk")}      
          value={`${fmt(stats.todayMilk)} L`}               
          icon="🥛" color="sky" 
        />
        
        <StatCard 
          label={`${currentMonth} ${language === "bn" ? "মাসের আয়" : "Income"}`} 
          value={`৳${fmt(stats.monthlyIncome)}`}             
          icon="💰" color="emerald" 
          trend={1} trendLabel={incomeTrendText} 
        />
        
        {/* নিট লাভের জন্য বিশেষ ডিজাইন (Light/Dark mode supported) */}
        <div className={`relative overflow-hidden rounded-xl border p-5 transition-colors duration-300 min-w-0 shadow-sm dark:shadow-none
          ${stats.netProfit >= 0 
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-400/10 dark:border-emerald-500/30" 
            : "bg-red-50 border-red-200 dark:bg-red-400/10 dark:border-red-500/30"}`}>
          
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 relative z-10">
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mb-1 truncate transition-colors" title={t("netProfit")}>
                {t("netProfit")}
              </p>
              <h3 className={`text-2xl font-bold truncate transition-colors ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`} title={`৳${fmt(stats.netProfit)}`}>
                ৳{fmt(stats.netProfit)}
              </h3>
            </div>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white/60 dark:bg-slate-800/50 shadow-sm dark:shadow-inner flex-shrink-0 transition-colors relative z-10`}>
              {stats.netProfit >= 0 ? "📈" : "📉"}
            </div>
          </div>
          {/* Decorative glow */}
          <div className={`absolute -right-6 -bottom-6 w-24 h-24 blur-2xl rounded-full opacity-40 dark:opacity-20 transition-colors ${stats.netProfit >= 0 ? "bg-emerald-300 dark:bg-emerald-500" : "bg-red-300 dark:bg-red-500"}`}></div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyIncomeExpenseChart />
        <MilkTrendChart data={milkLogs.slice(0, 7)} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Cattle status */}
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-slate-800 dark:text-white font-semibold text-sm mb-4 transition-colors">{language === "bn" ? "গরুর অবস্থা" : "Cattle Status"}</h3>
          <div className="space-y-3">
            {[
              { label: t("healthy"), count: stats.healthyCattle, dot: "bg-emerald-500 dark:bg-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-400/10" },
              { label: t("sick"),    count: stats.sickCattle,    dot: "bg-red-500 dark:bg-red-400",     bg: "bg-red-50 dark:bg-red-400/10" },
              { label: t("forSale"), count: stats.forSaleCattle, dot: "bg-amber-500 dark:bg-amber-400",   bg: "bg-amber-50 dark:bg-amber-400/10" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${item.bg} border border-slate-100 dark:border-white/5 transition-colors`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dot} transition-colors`} />
                  <span className="text-slate-600 dark:text-slate-300 text-sm transition-colors">{item.label}</span>
                </div>
                <span className="text-slate-800 dark:text-white font-bold text-sm transition-colors">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Vaccines */}
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl p-5 lg:col-span-2 shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800 dark:text-white font-semibold text-sm transition-colors">
              {t("upcomingVaccines")}
              {stats.upcomingVaccines.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 text-xs rounded-full border border-amber-200 dark:border-amber-400/20 transition-colors">
                  {stats.upcomingVaccines.length}
                </span>
              )}
            </h3>
            {stats.upcomingVaccines.length > 0 && (
              <button
                onClick={() => setShowVaccineModal(true)}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-transparent transition-colors border border-amber-200 dark:border-amber-400/20 hover:border-amber-300 dark:hover:border-amber-400/40 px-2.5 py-1 rounded-lg"
              >
                {language === "bn" ? "সব দেখুন →" : "View All →"}
              </button>
            )}
          </div>

          {stats.upcomingVaccines.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">✅</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">{language === "bn" ? "আগামী ৩০ দিনে কোনো টিকা নেই" : "No vaccines scheduled for the next 30 days"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.upcomingVaccines.slice(0, 4).map((v, i) => {
                const daysLeft = Math.ceil(
                  (new Date(v.nextDue) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 7;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/30 last:border-0 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isUrgent ? "bg-red-500 dark:bg-red-400 animate-pulse" : "bg-amber-500 dark:bg-amber-400"}`} />
                      <div>
                        <span className="text-amber-600 dark:text-amber-400 font-medium text-sm transition-colors">{v.cattleTag}</span>
                        <span className="text-slate-600 dark:text-slate-400 text-sm ml-1.5 transition-colors">{v.cattleName}</span>
                        <span className="text-slate-500 dark:text-slate-500 text-xs ml-1.5 transition-colors">— {v.name}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border transition-colors ${
                      isUrgent
                        ? "bg-red-50 dark:bg-red-400/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-400/25"
                        : "bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/20"
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

      <VaccineAlert
        isOpen={showVaccineModal}
        onClose={() => setShowVaccineModal(false)}
      />
    </div>
  );
}
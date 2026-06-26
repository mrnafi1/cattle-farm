export default function StatCard({ label, value, icon, trend, trendLabel, color = "amber" }) {
  // লাইট মোডে সাদা কার্ড (bg-white) এবং ডার্ক মোডে আগের সেই গ্রেডিয়েন্ট কালার দেওয়া হলো
  const colorMap = {
    amber: "bg-white border-slate-200 shadow-sm dark:bg-transparent dark:bg-gradient-to-br dark:from-amber-500/10 dark:to-amber-600/5 dark:border-amber-500/20 dark:shadow-none",
    emerald: "bg-white border-slate-200 shadow-sm dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-500/10 dark:to-emerald-600/5 dark:border-emerald-500/20 dark:shadow-none",
    sky: "bg-white border-slate-200 shadow-sm dark:bg-transparent dark:bg-gradient-to-br dark:from-sky-500/10 dark:to-sky-600/5 dark:border-sky-500/20 dark:shadow-none",
    red: "bg-white border-slate-200 shadow-sm dark:bg-transparent dark:bg-gradient-to-br dark:from-red-500/10 dark:to-red-600/5 dark:border-red-500/20 dark:shadow-none",
    purple: "bg-white border-slate-200 shadow-sm dark:bg-transparent dark:bg-gradient-to-br dark:from-purple-500/10 dark:to-purple-600/5 dark:border-purple-500/20 dark:shadow-none",
  };

  return (
    <div
      className={`relative rounded-xl p-5 border transition-colors duration-300 ${colorMap[color]}
        hover:scale-[1.02] hover:shadow-md cursor-default min-w-0`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* লাইট মোডে গাঢ় ছাই রঙ এবং ডার্ক মোডে হালকা ছাই রঙ */}
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 truncate transition-colors" title={label}>
            {label}
          </p>
          {/* লাইট মোডে কালচে লেখা এবং ডার্ক মোডে সাদা লেখা */}
          <p className="text-slate-800 dark:text-white text-2xl font-bold truncate transition-colors" title={value}>
            {value}
          </p>
          {trendLabel && (
            <p className={`text-xs mt-1 truncate transition-colors ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`} title={trendLabel}>
              {trend >= 0 ? "▲" : "▼"} {trendLabel}
            </p>
          )}
        </div>

        <div className={`text-2xl opacity-80 flex-shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}
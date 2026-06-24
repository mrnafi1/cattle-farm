export default function StatCard({ label, value, icon, trend, trendLabel, color = "amber" }) {
  const colorMap = {
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    sky: "from-sky-500/10 to-sky-600/5 border-sky-500/20 text-sky-400",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-400",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
  };

  return (
    <div
      className={`relative rounded-xl p-5 border bg-gradient-to-br ${colorMap[color]}
        hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {trendLabel && (
            <p className={`text-xs mt-1 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? "▲" : "▼"} {trendLabel}
            </p>
          )}
        </div>
        <div className={`text-2xl opacity-80`}>{icon}</div>
      </div>
    </div>
  );
}

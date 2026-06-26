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
        hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default min-w-0`}
    >
      {/* gap-2 যোগ করা হয়েছে যাতে আইকন এবং টেক্সটের মাঝে একটু ফাঁকা থাকে */}
      <div className="flex items-start justify-between gap-2">
        
        {/* min-w-0 এবং flex-1 দিয়ে টেক্সটকে স্ক্রিনের বাইরে যেতে বাধা দেওয়া হয়েছে */}
        <div className="min-w-0 flex-1">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 truncate" title={label}>
            {label}
          </p>
          <p className="text-white text-2xl font-bold truncate" title={value}>
            {value}
          </p>
          {trendLabel && (
            <p className={`text-xs mt-1 truncate ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`} title={trendLabel}>
              {trend >= 0 ? "▲" : "▼"} {trendLabel}
            </p>
          )}
        </div>

        {/* flex-shrink-0 দেওয়া হয়েছে যাতে আইকনের জায়গা কমে না যায় */}
        <div className={`text-2xl opacity-80 flex-shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}
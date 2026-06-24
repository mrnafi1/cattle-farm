export default function Badge({ status, label }) {
  const styles = {
    healthy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    sick: "bg-red-500/15 text-red-400 border border-red-500/30",
    forSale: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    dairy: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    fattening: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  };

  const dots = {
    healthy: "bg-emerald-400",
    sick: "bg-red-400",
    forSale: "bg-amber-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-slate-700 text-slate-300"
      }`}
    >
      {dots[status] && (
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status]} animate-pulse`} />
      )}
      {label}
    </span>
  );
}

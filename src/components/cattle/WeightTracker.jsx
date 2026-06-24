import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-amber-400 font-bold">{payload[0].value} kg</p>
        {payload[1] && (
          <p className="text-sky-400">+{payload[1].value.toFixed(1)} kg বৃদ্ধি</p>
        )}
      </div>
    );
  }
  return null;
};

export default function WeightTracker({ cattle }) {
  const { language } = useLanguage();

  if (!cattle?.weight?.length) return null;

  const data = cattle.weight.map((w, i) => ({
    date: w.date.slice(5),
    weight: w.value,
    gain: i > 0 ? parseFloat((w.value - cattle.weight[i - 1].value).toFixed(1)) : 0,
  }));

  const firstWeight = data[0]?.weight || 0;
  const lastWeight = data[data.length - 1]?.weight || 0;
  const totalGain = lastWeight - firstWeight;
  const avgGain = data.length > 1
    ? (totalGain / (data.length - 1)).toFixed(1)
    : 0;

  const isGood = avgGain > 0;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "শুরুর ওজন", value: `${firstWeight} kg`, color: "text-slate-300" },
          { label: "বর্তমান ওজন", value: `${lastWeight} kg`, color: "text-amber-400" },
          { label: "মোট বৃদ্ধি", value: `+${totalGain} kg`, color: isGood ? "text-emerald-400" : "text-red-400" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-700/30 rounded-lg px-3 py-2.5 text-center">
            <p className="text-slate-500 text-xs mb-0.5">{item.label}</p>
            <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div>
        <p className="text-slate-400 text-xs mb-2">ওজনের গতিপথ (kg)</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#weightGrad)"
              dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#fbbf24" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly gain bars */}
      {data.length > 1 && (
        <div>
          <p className="text-slate-400 text-xs mb-2">
            মাসিক ওজন বৃদ্ধি — গড় <span className="text-amber-400 font-semibold">{avgGain} kg/মাস</span>
          </p>
          <div className="flex items-end gap-1 h-12">
            {data.slice(1).map((d, i) => {
              const maxGain = Math.max(...data.slice(1).map((x) => Math.abs(x.gain)));
              const height = maxGain > 0 ? Math.max(4, (Math.abs(d.gain) / maxGain) * 44) : 4;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5 group relative"
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      d.gain >= 0 ? "bg-emerald-500/60 group-hover:bg-emerald-400" : "bg-red-500/60 group-hover:bg-red-400"
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 border border-slate-600 text-xs text-white rounded px-2 py-0.5 whitespace-nowrap z-10">
                    {d.gain >= 0 ? "+" : ""}{d.gain} kg
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {data.slice(1).map((d, i) => (
              <span key={i} className="flex-1 text-center text-slate-600 text-xs">{d.date}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

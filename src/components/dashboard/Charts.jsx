import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { mockMonthlyChart } from "../../data/mockData";
import { useLanguage } from "../../contexts/LanguageContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
        <p className="text-slate-300 mb-1 font-medium">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: ৳{p.value.toLocaleString("bn-BD")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyIncomeExpenseChart() {
  const { t, language } = useLanguage();
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4">{t("overview")}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={mockMonthlyChart} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
          <Bar dataKey="income" name={t("income")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name={t("expense")} fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MilkTrendChart({ data }) {
  const { t } = useLanguage();
  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4">{t("todayMilk")} — ৭ দিন</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={[...data].reverse()}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="produced" name={t("produced")} stroke="#38bdf8" strokeWidth={2} dot={{ fill: "#38bdf8", r: 3 }} />
          <Line type="monotone" dataKey="sold" name={t("sold")} stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

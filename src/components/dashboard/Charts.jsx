import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { mockMonthlyChart } from "../../data/mockData";
import { useLanguage } from "../../contexts/LanguageContext";

// ── কাস্টম টুলটিপ (আয়-ব্যয়ের জন্য) ──
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-slate-800 border border-[#E8E6DE] dark:border-slate-600 rounded-lg p-3 shadow-xl text-xs transition-colors">
        <p className="text-[#1A1A2E] dark:text-slate-300 mb-2 font-medium border-b border-[#E8E6DE] dark:border-slate-600 pb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: ৳{p.value.toLocaleString("bn-BD")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── কাস্টম টুলটিপ (দুধের হিসাবের জন্য) ──
const CustomMilkTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-slate-800 border border-[#E8E6DE] dark:border-slate-600 rounded-lg p-3 shadow-xl text-xs transition-colors">
        <p className="text-[#1A1A2E] dark:text-slate-300 mb-2 font-medium border-b border-[#E8E6DE] dark:border-slate-600 pb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value} L
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyIncomeExpenseChart() {
  const { t } = useLanguage();
  return (
    <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm dark:shadow-none rounded-xl p-5 transition-colors">
      <h3 className="text-[#1A1A2E] dark:text-white font-semibold text-sm mb-4 transition-colors">{t("overview")}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={mockMonthlyChart} barCategoryGap="30%">
          {/* গ্রিড লাইন দুই মোডেই মানানসই করা হয়েছে */}
          <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
          
          <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#94A3B8', opacity: 0.1 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#64748B", paddingTop: 8 }} />
          
          {/* ইনকাম = সবুজ/গোল্ডেন, এক্সপেন্স = লাল */}
          <Bar dataKey="income" name={t("income")} fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name={t("expense")} fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MilkTrendChart({ data }) {
  const { t } = useLanguage();
  return (
    <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm dark:shadow-none rounded-xl p-5 transition-colors">
      <h3 className="text-[#1A1A2E] dark:text-white font-semibold text-sm mb-4 transition-colors">{t("todayMilk")} — ৭ দিন</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={[...data].reverse()}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.25} vertical={false} />
          
          <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
          
          <Tooltip content={<CustomMilkTooltip />} cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '3 3' }} />
          
          {/* উৎপাদিত = গোল্ডেন, বিক্রিত = সবুজ */}
          <Line type="monotone" dataKey="produced" name={t("produced")} stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: "#FFFFFF", stroke: "#F59E0B", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="sold" name={t("sold")} stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#FFFFFF", stroke: "#10B981", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
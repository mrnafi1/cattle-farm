import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./components/dashboard/Dashboard";
import CattleList from "./components/cattle/CattleList";
import DairyLog from "./components/dairy/DairyLog";
import ExpenseTracker from "./components/finance/ExpenseTracker";
import ReportView from "./components/reports/ReportView";
import UserManagement from "./components/settings/UserManagement";
import Modal from "./components/ui/Modal";
import AddCattleForm from "./components/cattle/AddCattleForm";
// নতুন ইনভেন্টরি পেজ ইমপোর্ট করা হলো
import FeedInventory from "./components/inventory/FeedInventory";

// ── Login Screen ─────────────────────────────────────────────────
function LoginScreen() {
  const { login, authError } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const [loginType, setLoginType] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginType === "admin") {
      login({ email, password }, "admin");
    } else {
      login({ phone, pin }, "staff");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080c18] p-4 relative overflow-hidden">
      {/* ambient glow / background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl z-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-amber-500/25">
            🐄
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{t("appName")}</h2>
          <p className="text-sm text-slate-400">{t("appSubtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-6 border border-slate-700/50">
          <button
            type="button"
            onClick={() => setLoginType("admin")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              loginType === "admin" ? "bg-amber-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            অ্যাডমিন
          </button>
          <button
            type="button"
            onClick={() => setLoginType("staff")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              loginType === "staff" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            কর্মী / শেয়ারহোল্ডার
          </button>
        </div>

        {/* Error Message */}
        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-center text-red-400 text-sm animate-pulse">
            ⚠ {authError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {loginType === "admin" ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@farm.com"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">ফোন নাম্বার</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">গোপন পিন (PIN)</label>
                <input
                  type="password"
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all tracking-widest text-center text-lg font-bold"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-[0.98] shadow-lg ${
              loginType === "admin"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 shadow-amber-500/20"
                : "bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 shadow-sky-500/20"
            }`}
          >
            প্রবেশ করুন →
          </button>
        </form>
      </div>

      {/* Language Switcher */}
      <div className="text-center mt-6 z-10">
        <button onClick={toggleLanguage} className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
          {language === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
        </button>
      </div>
    </div>
  );
}

// ── Main App Shell ───────────────────────────────────────────────
function AppShell() {
  const { currentUser, hasAccess } = useAuth();
  const [activePage,    setActivePage]    = useState("dashboard");
  const [showAddCattle, setShowAddCattle] = useState(false);
  const [showAddMilk,   setShowAddMilk]   = useState(false);
  const [showAddExp,    setShowAddExp]    = useState(false);

  if (!currentUser) return <LoginScreen />;

  const pages = {
    dashboard:  <Dashboard />,
    cattle:     <CattleList />,
    dairy:      <DairyLog showAddModal={showAddMilk}   onCloseAddModal={() => setShowAddMilk(false)} />,
    feeds:      <FeedInventory />, // নতুন পেজটি এখানে যুক্ত করা হলো
    finance:    <ExpenseTracker showAddModal={showAddExp} onCloseAddModal={() => setShowAddExp(false)} />,
    reports:    <ReportView />,
    settings:   hasAccess("admin") ? <UserManagement /> : <Dashboard />,
  };

  return (
    <MainLayout
      activePage={activePage}
      onNavigate={setActivePage}
      onFABActions={{
        onAddCattle:  () => setShowAddCattle(true),
        onAddMilk:    () => { setActivePage("dairy");   setShowAddMilk(true); },
        onAddExpense: () => { setActivePage("finance"); setShowAddExp(true); },
      }}
    >
      {pages[activePage] || <Dashboard />}

      <Modal isOpen={showAddCattle} onClose={() => setShowAddCattle(false)} title="নতুন গরু যুক্ত করুন" size="md">
        <AddCattleForm onClose={() => setShowAddCattle(false)} />
      </Modal>
    </MainLayout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppProvider, useApp } from "./contexts/AppContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./components/dashboard/Dashboard";
import CattleList from "./components/cattle/CattleList";
import DairyLog from "./components/dairy/DairyLog";
import ExpenseTracker from "./components/finance/ExpenseTracker";
import ReportView from "./components/reports/ReportView";
import UserManagement from "./components/settings/UserManagement";
import Settings from "./components/settings/Settings";
import Modal from "./components/ui/Modal";
import AddCattleForm from "./components/cattle/AddCattleForm";
import FeedInventory from "./components/inventory/FeedInventory";
import PWAInstallBanner from "./components/ui/PWAInstallBanner";

// ── নতুন ফিচার: পাবলিক ডিজিটাল আইডি কার্ড (বর্তমান ওজন সহ) ──
function PublicCattleView({ scanId }) {
  const { cattle } = useApp();
  const { currentUser } = useAuth();
  const { language } = useLanguage();

  if (!cattle || cattle.length === 0) {
    return (
      <div className="min-h-screen bg-[#080c18] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">খামারের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  const c = cattle.find(cat => cat._id === scanId || cat.id === scanId || cat.tagId === scanId);

  if (!c) {
    return (
      <div className="min-h-screen bg-[#080c18] flex flex-col items-center justify-center p-4 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl text-white font-bold mb-2">গরুটি খুঁজে পাওয়া যায়নি</h2>
        <p className="text-slate-400 mb-6 text-sm">এই কিউআর কোডের কোনো তথ্য ডাটাবেজে নেই。</p>
        <button onClick={() => window.location.href='/'} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all">
          লগিন পেজে যান
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c18] p-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl z-10 animate-fade-in">
        {/* Cover & Profile Image */}
        <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-700 relative">
          <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <p className="text-white text-xs font-bold tracking-widest uppercase">Smart Tag</p>
          </div>
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-28 h-28 bg-slate-900 p-1.5 rounded-full border-4 border-slate-800 shadow-xl">
            <img 
              src={c.photo || "https://cdn-icons-png.flaticon.com/512/1998/1998610.png"} 
              alt={c.name} 
              className="w-full h-full object-cover rounded-full bg-white" 
            />
          </div>
        </div>

        {/* Details Section */}
        <div className="pt-16 pb-6 px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-1">{c.name || "নামহীন গরু"}</h2>
          <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-4 py-1 rounded-full mb-6">
            <p className="text-amber-400 font-mono font-bold text-sm">TAG ID: {c.tagId}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left mb-8">
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">জাত (Breed)</p>
              <p className="text-white font-semibold text-sm">{c.breed || "N/A"}</p>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">বয়স (Age)</p>
              <p className="text-white font-semibold text-sm">{c.age ? `${c.age} বছর` : "N/A"}</p>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">ধরন (Type)</p>
              <p className="text-white font-semibold text-sm capitalize">{c.type === "dairy" ? "দুগ্ধবতী (Dairy)" : "মোটাতাজাকরণ (Fattening)"}</p>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">অবস্থা (Status)</p>
              <p className="text-white font-semibold text-sm capitalize flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${c.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : c.status === 'sick' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></span>
                {c.status === "healthy" ? "সুস্থ" : c.status === "sick" ? "অসুস্থ" : "বিক্রির জন্য"}
              </p>
            </div>
            
            {/* ── বর্তমান ওজন সেকশন (Fixed Object Issue) ── */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-amber-500/30 col-span-2 flex justify-between items-center shadow-[inset_0_0_15px_rgba(245,158,11,0.05)]">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">বর্তমান ওজন (Current Weight)</p>
                <p className="text-amber-400 font-bold text-lg">
                  {c.weight 
                    ? `${typeof c.weight === 'object' ? (c.weight.value || c.weight.current || c.weight.weight || 'N/A') : c.weight} কেজি` 
                    : "N/A"}
                </p>
              </div>
              <div className="text-3xl opacity-90">⚖️</div>
            </div>
          </div>

          <button onClick={() => window.location.href='/'} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-bold uppercase tracking-widest">
            {currentUser ? "🔙 ড্যাশবোর্ডে ফিরে যান" : "🔒 Admin / Staff Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    if (loginType === "admin") login({ email, password }, "admin");
    else login({ phone, pin }, "staff");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080c18] p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-amber-500/25">🐄</div>
          <h2 className="text-2xl font-bold text-white mb-1">{t("appName")}</h2>
          <p className="text-sm text-slate-400">{t("appSubtitle")}</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-6 border border-slate-700/50">
          <button type="button" onClick={() => setLoginType("admin")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${loginType === "admin" ? "bg-amber-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"}`}>{language === "bn" ? "অ্যাডমিন" : "Admin"}</button>
          <button type="button" onClick={() => setLoginType("staff")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${loginType === "staff" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>{language === "bn" ? "কর্মী / শেয়ারহোল্ডার" : "Staff / Shareholder"}</button>
        </div>
        {authError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-center text-red-400 text-sm animate-pulse">⚠ {authError}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          {loginType === "admin" ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === "bn" ? "ইমেইল ঠিকানা" : "Email Address"}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@farm.com" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === "bn" ? "পাসওয়ার্ড" : "Password"}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" required />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === "bn" ? "ফোন নাম্বার" : "Phone Number"}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{language === "bn" ? "গোপন পিন (PIN)" : "Secret PIN"}</label>
                <input type="password" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="1234" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all tracking-widest text-center text-lg font-bold" required />
              </div>
            </div>
          )}
          <button type="submit" className={`w-full py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-[0.98] shadow-lg ${loginType === "admin" ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 shadow-amber-500/20" : "bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-400 hover:to-sky-500 shadow-sky-500/20"}`}>
            {language === "bn" ? "প্রবেশ করুন →" : "Login →"}
          </button>
        </form>
      </div>
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
  const { language } = useLanguage();
  
  const params = new URLSearchParams(window.location.search);
  const scanId = params.get("viewCattle");

  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("cattleFarmActivePage") || "dashboard";
  });

  useEffect(() => {
    localStorage.setItem("cattleFarmActivePage", activePage);
    document.body.style.overscrollBehaviorY = 'none';
    return () => { document.body.style.overscrollBehaviorY = 'auto'; };
  }, [activePage]);

  const [showAddCattle, setShowAddCattle] = useState(false);
  const [showAddMilk,   setShowAddMilk]   = useState(false);
  const [showAddExp,    setShowAddExp]    = useState(false);

  // ── স্মার্ট লজিক: স্ক্যান করলে সবসময় আগে পাব্লিক আইডি কার্ড দেখাবে ──
  if (scanId) {
    return <PublicCattleView scanId={scanId} />;
  }

  if (!currentUser) return <LoginScreen />;

  const pages = {
    dashboard:  <Dashboard />,
    cattle:     <CattleList />,
    dairy:      <DairyLog showAddModal={showAddMilk}   onCloseAddModal={() => setShowAddMilk(false)} />,
    feed:       <FeedInventory />, 
    finance:    <ExpenseTracker showAddModal={showAddExp} onCloseAddModal={() => setShowAddExp(false)} />,
    reports:    <ReportView />,
    users:      hasAccess("admin") ? <UserManagement /> : <Dashboard />, 
    settings:   hasAccess("admin") ? <Settings /> : <Dashboard />, 
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
      <div className="pb-28 lg:pb-8 h-full">
        {pages[activePage] || <Dashboard />}
      </div>

      <Modal isOpen={showAddCattle} onClose={() => setShowAddCattle(false)} title={language === "bn" ? "নতুন গরু যুক্ত করুন" : "Add New Cattle"} size="md">
        <AddCattleForm onClose={() => setShowAddCattle(false)} />
      </Modal>

      <PWAInstallBanner />
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
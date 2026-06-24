import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext"; // পাথটি আপনার ফোল্ডার অনুযায়ী ঠিক করে নিবেন

export default function Login() {
  const { login, authError } = useAuth();
  
  // 'admin' অথবা 'staff' ট্যাব সিলেক্ট করার স্টেট
  const [loginType, setLoginType] = useState("admin"); 

  // ইনপুট ফিল্ডের স্টেটগুলো
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    
    // AuthContext এর login ফাংশনে ডেটা পাঠানো হচ্ছে
    if (loginType === "admin") {
      login({ email, password }, "admin");
    } else {
      login({ phone, pin }, "staff");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* ব্যাকগ্রাউন্ড ডেকোরেশন */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/20 rounded-full blur-3xl"></div>

      {/* মূল লগইন কার্ড */}
      <div className="relative w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-amber-500/20">
            🐄
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">খামার ব্যবস্থাপনা</h2>
          <p className="text-sm text-slate-400">নিরাপদে আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>

        {/* ট্যাব বাটন */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-6 border border-slate-700/50">
          <button
            onClick={() => { setLoginType("admin"); setAuthError(""); }} // ট্যাব বদলালে এরর মুছে যাবে
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              loginType === "admin" ? "bg-amber-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            অ্যাডমিন
          </button>
          <button
            onClick={() => { setLoginType("staff"); setAuthError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              loginType === "staff" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            কর্মী / শেয়ারহোল্ডার
          </button>
        </div>

        {/* এরর মেসেজ দেখানোর জায়গা */}
        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-center text-red-400 text-sm animate-pulse">
            {authError}
          </div>
        )}

        {/* লগইন ফর্ম */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* অ্যাডমিন ফর্ম */}
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
            /* স্টাফ ফর্ম */
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

          {/* সাবমিট বাটন */}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-[1.02] ${
              loginType === "admin" 
              ? "bg-amber-500 hover:bg-amber-600" 
              : "bg-sky-500 hover:bg-sky-600"
            }`}
          >
            লগইন করুন
          </button>
        </form>
      </div>
    </div>
  );
}
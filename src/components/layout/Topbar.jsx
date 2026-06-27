import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useApp } from "../../contexts/AppContext";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import GlobalSearch from "./GlobalSearch"; // <-- পাথটি আপনার ফোল্ডার অনুযায়ী ঠিক করে নেবেন

export default function Topbar({ activePage, onMenuToggle, onNavigate }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { isOnline } = useApp();
  const { syncQueue, isSyncing, triggerSync } = useOfflineSync();

  const [isDark, setIsDark] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // <-- সার্চ মডালের স্টেট

  // Keyboard shortcut (Ctrl+K বা Cmd+K) দিয়ে সার্চ ওপেন করার জন্য
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = savedTheme !== "light"; 
    setIsDark(prefersDark);
    
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const pageTitles = {
    dashboard: t("dashboard"),
    cattle:    t("cattle"),
    dairy:     t("dairy"),
    feed:      t("feedInventory"),
    finance:   t("finance"),
    reports:   t("reports"),
    settings:  t("settings"),
  };

  return (
    <>
      <header className="h-16 bg-[#F5F4EF]/90 dark:bg-[#080c18]/80 backdrop-blur-md border-b border-[#E8E6DE] dark:border-slate-700/40 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 transition-colors duration-300">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-[#E8E6DE] dark:hover:bg-slate-700/50 transition-colors"
            aria-label="মেনু খুলুন"
          >
            <span className="w-5 h-0.5 bg-[#64748B] dark:bg-slate-300 rounded transition-colors" />
            <span className="w-5 h-0.5 bg-[#64748B] dark:bg-slate-300 rounded transition-colors" />
            <span className="w-3.5 h-0.5 bg-[#64748B] dark:bg-slate-300 rounded self-start ml-0.5 transition-colors" />
          </button>
          <div>
            <h1 className="text-[#1A1A2E] dark:text-white font-bold text-base leading-tight transition-colors">
              {pageTitles[activePage] || t("dashboard")}
            </h1>
            <p className="text-[#64748B] dark:text-slate-400 text-xs hidden sm:block transition-colors">
              {new Date().toLocaleDateString(
                language === "bn" ? "bn-BD" : "en-US",
                { weekday: "long", year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* ── Search Button ── */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#FFFFFF] dark:bg-slate-800 border border-[#E8E6DE] dark:border-slate-600/50 hover:bg-[#E8E6DE] dark:hover:bg-slate-700 text-[#64748B] dark:text-slate-300 transition-all text-sm shadow-sm dark:shadow-none"
            title="Search (Ctrl + K)"
          >
            <span>🔍</span>
            <span className="hidden lg:inline-block text-xs border border-[#E8E6DE] dark:border-slate-600 px-1.5 rounded text-[#94A3B8]">Ctrl K</span>
          </button>

          {syncQueue.length > 0 && (
            <button
              onClick={triggerSync}
              disabled={!isOnline || isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/20 hover:bg-amber-200 dark:hover:bg-amber-400/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="পেন্ডিং সিঙ্ক"
            >
              {isSyncing ? (
                <span className="w-3 h-3 border-2 border-amber-500 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-3 h-3 border-2 border-amber-500/60 dark:border-amber-400/60 rounded-full" />
              )}
              <span className="text-amber-600 dark:text-amber-400 text-xs font-medium hidden sm:block">
                {isSyncing ? "সিঙ্ক হচ্ছে..." : `${syncQueue.length} পেন্ডিং`}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-[#10B981] dark:bg-emerald-400 animate-pulse" : "bg-[#EF4444] dark:bg-red-400"}`} />
            <span className="text-xs text-[#64748B] dark:text-slate-400 hidden sm:block transition-colors">
              {isOnline
                ? (language === "bn" ? "অনলাইন" : "Online")
                : (language === "bn" ? "অফলাইন" : "Offline")}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#FFFFFF] dark:bg-slate-700/60 border border-[#E8E6DE] dark:border-slate-600/50 hover:bg-[#E8E6DE] dark:hover:bg-slate-700 transition-all text-sm shadow-sm dark:shadow-none"
            title={isDark ? "লাইট থিম" : "ডার্ক থিম"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-slate-700/60 border border-[#E8E6DE] dark:border-slate-600/50 hover:bg-[#E8E6DE] dark:hover:bg-slate-700 transition-all text-sm font-medium shadow-sm dark:shadow-none"
          >
            <span className={language === "bn" ? "text-[#F59E0B] dark:text-amber-400 font-bold" : "text-[#64748B] dark:text-slate-400"}>বাং</span>
            <span className="text-[#E8E6DE] dark:text-slate-600 mx-0.5">|</span>
            <span className={language === "en" ? "text-[#F59E0B] dark:text-amber-400 font-bold" : "text-[#64748B] dark:text-slate-400"}>EN</span>
          </button>
        </div>
      </header>

      {/* Global Search Component */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={onNavigate} 
      />
    </>
  );
}
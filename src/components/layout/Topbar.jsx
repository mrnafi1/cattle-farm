import { useLanguage } from "../../contexts/LanguageContext";
import { useApp } from "../../contexts/AppContext";
import { useOfflineSync } from "../../hooks/useOfflineSync";

export default function Topbar({ activePage, onMenuToggle }) {
  const { t, language, toggleLanguage } = useLanguage();
  const { isOnline } = useApp();
  const { syncQueue, isSyncing, triggerSync } = useOfflineSync();

  const pageTitles = {
    dashboard: t("dashboard"),
    cattle:    t("cattle"),
    dairy:     t("dairy"),
    finance:   t("finance"),
    reports:   t("reports"),
  };

  return (
    <header className="h-16 bg-[#080c18]/80 backdrop-blur-md border-b border-slate-700/40 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          aria-label="মেনু খুলুন"
        >
          <span className="w-5 h-0.5 bg-slate-300 rounded" />
          <span className="w-5 h-0.5 bg-slate-300 rounded" />
          <span className="w-3.5 h-0.5 bg-slate-300 rounded self-start ml-0.5" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">
            {pageTitles[activePage] || t("dashboard")}
          </h1>
          <p className="text-slate-500 text-xs hidden sm:block">
            {new Date().toLocaleDateString(
              language === "bn" ? "bn-BD" : "en-US",
              { weekday: "long", year: "numeric", month: "long", day: "numeric" }
            )}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Offline sync queue indicator */}
        {syncQueue.length > 0 && (
          <button
            onClick={triggerSync}
            disabled={!isOnline || isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="পেন্ডিং সিঙ্ক"
          >
            {isSyncing ? (
              <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="w-3 h-3 border-2 border-amber-400/60 rounded-full" />
            )}
            <span className="text-amber-400 text-xs font-medium hidden sm:block">
              {isSyncing ? "সিঙ্ক হচ্ছে..." : `${syncQueue.length} পেন্ডিং`}
            </span>
          </button>
        )}

        {/* Online/Offline indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-xs text-slate-400 hidden sm:block">
            {isOnline
              ? (language === "bn" ? "অনলাইন" : "Online")
              : (language === "bn" ? "অফলাইন" : "Offline")}
          </span>
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 hover:bg-slate-700 transition-all text-sm font-medium"
        >
          <span className={language === "bn" ? "text-amber-400 font-bold" : "text-slate-400"}>বাং</span>
          <span className="text-slate-600 mx-0.5">|</span>
          <span className={language === "en" ? "text-amber-400 font-bold" : "text-slate-400"}>EN</span>
        </button>
      </div>
    </header>
  );
}

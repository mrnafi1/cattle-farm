import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { key: "dashboard", icon: "⊞",  page: "dashboard",   minRole: "shareholder" },
  { key: "cattle",    icon: "🐄", page: "cattle",     minRole: "worker" },
  { key: "dairy",     icon: "🥛", page: "dairy",      minRole: "worker" },
  { key: "feed",      icon: "🌾", page: "feed",       minRole: "worker" },
  { key: "finance",   icon: "💰", page: "finance",    minRole: "worker" },
  { key: "reports",   icon: "📊", page: "reports",    minRole: "shareholder" },
  { key: "settings",  icon: "⚙️",  page: "settings",   minRole: "admin" },
];

// লাইট এবং ডার্ক মোডের জন্য আলাদা কালার স্টাইল যোগ করা হলো
const ROLE_STYLES = {
  admin:       "text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
  worker:      "text-sky-600 bg-sky-100 border-sky-200 dark:text-sky-400 dark:bg-sky-400/10 dark:border-sky-400/20",
  shareholder: "text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-400/10 dark:border-purple-400/20",
};

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  const { t } = useLanguage();
  const { currentUser, logout, hasAccess } = useAuth();

  const visibleNav = NAV.filter((item) => hasAccess(item.minRole));

  const navLabels = {
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
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 flex flex-col
        bg-white dark:bg-gradient-to-b dark:from-[#0a0e1a] dark:to-[#0d1225]
        border-r border-slate-200 dark:border-slate-700/40
        transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-700/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-400 dark:to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30 dark:shadow-amber-500/20 flex-shrink-0">
              🐄
            </div>
            <div>
              <p className="text-slate-800 dark:text-white font-bold text-sm leading-tight transition-colors">{t("appName")}</p>
              <p className="text-slate-500 dark:text-slate-500 text-xs transition-colors">{t("appSubtitle")}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = activePage === item.page;
            return (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.page); onClose(); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-sm font-medium transition-all duration-150 text-left
                  ${active
                    ? "bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-400/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 border border-transparent"
                  }
                `}
              >
                <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                <span>{navLabels[item.key]}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />}
              </button>
            );
          })}
        </nav>

        {/* User card + logout */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700/40 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-slate-700 dark:text-white font-bold text-sm flex-shrink-0 transition-colors">
              {currentUser?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 dark:text-white text-sm font-medium truncate transition-colors">{currentUser?.name}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-0.5 transition-colors ${ROLE_STYLES[currentUser?.role]}`}>
                {t(currentUser?.role)}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all text-sm"
          >
            <span>⎋</span>
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
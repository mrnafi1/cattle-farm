import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { key: "dashboard", icon: "⊞",  page: "dashboard",  minRole: "shareholder" },
  { key: "cattle",    icon: "🐄", page: "cattle",     minRole: "worker" },
  { key: "dairy",     icon: "🥛", page: "dairy",      minRole: "worker" },
  { key: "feed",      icon: "🌾", page: "feed",       minRole: "worker" },
  { key: "finance",   icon: "💰", page: "finance",    minRole: "worker" },
  { key: "reports",   icon: "📊", page: "reports",    minRole: "shareholder" },
  { key: "settings",  icon: "⚙️",  page: "settings",   minRole: "admin" },
];

const ROLE_STYLES = {
  admin:       "text-amber-400 bg-amber-400/10 border-amber-400/20",
  worker:      "text-sky-400   bg-sky-400/10   border-sky-400/20",
  shareholder: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  const { t } = useLanguage();
  const { currentUser, logout, hasAccess } = useAuth();

  const visibleNav = NAV.filter((item) => hasAccess(item.minRole));

  const navLabels = {
    dashboard: t("dashboard"),
    cattle:    t("cattle"),
    dairy:     t("dairy"),
    feed:      "খাবার ও গুদাম",
    finance:   t("finance"),
    reports:   t("reports"),
    settings:  "সেটিংস",
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 flex flex-col
        bg-gradient-to-b from-[#0a0e1a] to-[#0d1225]
        border-r border-slate-700/40
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 flex-shrink-0">
              🐄
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{t("appName")}</p>
              <p className="text-slate-500 text-xs">{t("appSubtitle")}</p>
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
                    ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 border border-transparent"
                  }
                `}
              >
                <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                <span>{navLabels[item.key]}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </nav>

        {/* User card + logout */}
        <div className="px-4 py-4 border-t border-slate-700/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentUser?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.name}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-0.5 ${ROLE_STYLES[currentUser?.role]}`}>
                {currentUser?.role === "admin" ? "অ্যাডমিন" : currentUser?.role === "worker" ? "কর্মী" : "শেয়ারহোল্ডার"}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
          >
            <span>⎋</span>
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
import { useState, useEffect, useMemo } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function GlobalSearch({ isOpen, onClose, onNavigate }) {
  const { cattle, expenses, milkLogs } = useApp();
  const { t, language } = useLanguage();
  
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // স্মার্ট ফ্লেক্সিবল সার্চ লজিক
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchWords = query.toLowerCase().split(" ").filter(Boolean);
    const isMatch = (...fields) => {
      const combinedText = fields.join(" ").toLowerCase();
      return searchWords.every(word => combinedText.includes(word));
    };

    const res = [];

    cattle?.forEach((c) => {
      if (isMatch(c.name, c.tagId, c.breed)) {
        res.push({
          id: c._id || c.id, type: "cattle", title: `${c.tagId} — ${c.name}`,
          desc: c.breed, icon: "🐄", path: "cattle",
        });
      }
    });

    expenses?.forEach((e) => {
      if (isMatch(e.description, e.category, e.amount?.toString())) {
        res.push({
          id: e._id || e.id, type: "expense", title: e.description || (language === "bn" ? "খরচ" : "Expense"),
          desc: `৳${e.amount} — ${e.date}`, icon: "💸", path: "finance",
        });
      }
    });

    milkLogs?.forEach((m) => {
      if (isMatch(m.date, m.produced?.toString(), m.sold?.toString())) {
        res.push({
          id: m._id || m.id, type: "dairy", title: language === "bn" ? `দুধের রেকর্ড: ${m.date}` : `Milk Log: ${m.date}`,
          desc: `${m.produced} L ${language === "bn" ? "উৎপাদিত" : "produced"}`, icon: "🥛", path: "dairy",
        });
      }
    });

    return res;
  }, [query, cattle, expenses, milkLogs, language]);

  // কীবোর্ড হ্যান্ডলার এবং আইডি সেশন মেমরিতে সেভ
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } 
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } 
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } 
      else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          if (results[selectedIndex].id) {
            sessionStorage.setItem("searchHighlightId", results[selectedIndex].id);
          }
          onNavigate(results[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, onNavigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-[#1A1A2E]/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] dark:bg-slate-800 rounded-2xl shadow-2xl border border-[#E8E6DE] dark:border-slate-700/60 overflow-hidden flex flex-col max-h-[70vh] transition-colors duration-200">
        
        <div className="flex items-center px-4 py-3 border-b border-[#E8E6DE] dark:border-slate-700/50 bg-[#F5F4EF] dark:bg-slate-900/50">
          <span className="text-xl mr-3 opacity-60">🔍</span>
          <input
            autoFocus
            type="text"
            placeholder={language === "bn" ? "গরুর নাম, ট্যাগ, খরচের পরিমাণ বা তারিখ..." : "Search cattle, expenses, dates..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[#1A1A2E] dark:text-white placeholder-[#94A3B8] dark:placeholder-slate-500 text-sm sm:text-base"
          />
          <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-[#E8E6DE] dark:bg-slate-700 text-[#64748B] dark:text-slate-300">
            ESC
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="py-12 text-center text-[#94A3B8] dark:text-slate-500">
              <span className="text-4xl block mb-3 opacity-50">👀</span>
              <p>{language === "bn" ? "কী খুঁজতে চান টাইপ করুন..." : "Start typing to search..."}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] dark:text-slate-500">
              <span className="text-3xl block mb-2 opacity-50">🤷‍♂️</span>
              <p>{language === "bn" ? "কোনো ফলাফল পাওয়া যায়নি!" : "No results found!"}</p>
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {results.map((res, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${res.type}-${res.id}-${idx}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      if (res.id) {
                        sessionStorage.setItem("searchHighlightId", res.id);
                      }
                      onNavigate(res.path);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group
                      ${isSelected 
                        ? "bg-[#F5F4EF] border border-[#F59E0B]/40 dark:bg-slate-700/80 dark:border-amber-400/30 shadow-sm" 
                        : "bg-transparent border border-transparent hover:bg-[#FAFAF7] dark:hover:bg-slate-700/40"
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-transform ${isSelected ? "bg-[#FFFFFF] dark:bg-slate-600 scale-110 shadow-sm" : "bg-[#E8E6DE] dark:bg-slate-700/50"}`}>
                      {res.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isSelected ? "text-[#F59E0B] dark:text-amber-400" : "text-[#1A1A2E] dark:text-white"}`}>
                        {res.title}
                      </p>
                      <p className="text-[#64748B] dark:text-slate-400 text-xs truncate mt-0.5">{res.desc}</p>
                    </div>
                    <span className={`text-xs flex items-center gap-1 ${isSelected ? "text-[#F59E0B] dark:text-amber-400 opacity-100" : "opacity-0"}`}>
                      <span className="border border-current rounded px-1 text-[10px]">↵</span> 
                      {language === "bn" ? "প্রবেশ" : "Enter"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";

export default function Settings() {
  const { cattle, milkLogs, expenses, incomes, addToast } = useApp();
  const { t, language } = useLanguage();

  const [sheetUrl, setSheetUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem("googleSheetSyncUrl");
    if (savedUrl) setSheetUrl(savedUrl);
  }, []);

  const handleSaveUrl = () => {
    localStorage.setItem("googleSheetSyncUrl", sheetUrl);
    addToast(language === "bn" ? "লিংক সেভ হয়েছে!" : "URL Saved successfully!", "success");
  };

  const handleSyncToSheets = async () => {
    if (!sheetUrl) {
      addToast(language === "bn" ? "আগে Google Web App URL দিন!" : "Please provide URL first!", "error");
      return;
    }

    setIsSyncing(true);

    const allFinances = [
      ...incomes.map(i => ({ ...i, type: "Income", category: i.source })),
      ...expenses.map(e => ({ ...e, type: "Expense", category: e.category }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const payload = {
      cattle: cattle,
      milkLogs: milkLogs,
      finances: allFinances
    };

    try {
      const response = await fetch(sheetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === "success") {
        addToast(language === "bn" ? "ডেটা গুগল শিটে সিঙ্ক হয়েছে!" : "Data synced to Sheets!", "success");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Sheet Sync Error:", error);
      addToast(language === "bn" ? "সিঙ্ক ফেইল হয়েছে। লিংক চেক করুন।" : "Sync failed. Check URL.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white transition-colors">{t("settings")}</h2>
        <p className="text-[#64748B] dark:text-slate-400 text-sm transition-colors">
          {language === "bn" ? "অ্যাপের বিভিন্ন কনফিগারেশন" : "App configurations"}
        </p>
      </div>

      <div className="bg-[#FFFFFF] dark:bg-slate-800/40 border border-[#E8E6DE] dark:border-slate-700/40 shadow-sm dark:shadow-none rounded-xl overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 border-b border-[#E8E6DE] dark:border-slate-700/50 flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] text-xl transition-colors">
            📊
          </div>
          <div>
            <h3 className="text-[#1A1A2E] dark:text-white font-semibold transition-colors">
              {language === "bn" ? "Google Sheets সংযোগ" : "Google Sheets Sync"}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 transition-colors">
              {language === "bn" ? "আপনার ডেটা সরাসরি গুগল শিটে পাঠান" : "Export your data directly to Google Sheets"}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-[#F5F4EF] dark:bg-slate-900/50 border border-[#E8E6DE] dark:border-slate-700/50 p-3 rounded-lg text-sm text-[#64748B] dark:text-slate-400 transition-colors">
            {language === "bn" ? (
              <ul className="list-disc pl-5 space-y-1">
                <li>Google Sheet-এ একটি নতুন ফাইল খুলে Apps Script-এ কোড ডেপ্লয় করুন।</li>
                <li>যে Web App URL টি পাবেন, সেটি নিচের বক্সে পেস্ট করে সেভ করুন।</li>
                <li>এরপর <b>Sync Now</b> চাপলে সব ডেটা শিটে আলাদা ট্যাবে চলে যাবে।</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                <li>Deploy the Apps Script in your Google Sheet.</li>
                <li>Paste the generated Web App URL below and save.</li>
                <li>Click <b>Sync Now</b> to push all data to sheets.</li>
              </ul>
            )}
          </div>

          <div>
            <label className="text-[#64748B] dark:text-slate-400 text-xs font-semibold block mb-1.5 transition-colors">
              Web App URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="flex-1 bg-[#FFFFFF] dark:bg-slate-700/50 border border-[#E8E6DE] dark:border-slate-600 rounded-lg px-3 py-2 text-[#1A1A2E] dark:text-white text-sm focus:outline-none focus:border-[#10B981] dark:focus:border-emerald-500 transition-colors shadow-sm dark:shadow-none"
              />
              <Button onClick={handleSaveUrl} variant="secondary" className="whitespace-nowrap">
                {t("save")}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSyncToSheets}
              disabled={isSyncing || !sheetUrl}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 ${
                isSyncing ? "bg-[#94A3B8] cursor-not-allowed" : "bg-[#10B981] hover:bg-[#059669] text-white border-none"
              }`}
            >
              {isSyncing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {language === "bn" ? "সিঙ্ক হচ্ছে..." : "Syncing..."}
                </>
              ) : (
                <>
                  🔄 {language === "bn" ? "এখনি Sync করুন" : "Sync Now"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
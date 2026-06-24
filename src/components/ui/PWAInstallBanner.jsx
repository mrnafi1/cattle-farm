import { useState, useEffect } from "react";

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("pwa_banner_dismissed") === "true"
  );
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Capture the browser's install prompt
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      if (!dismissed) {
        setTimeout(() => setVisible(true), 1500); // slight delay on load
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detect if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
      setVisible(false);
    }
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      localStorage.setItem("pwa_banner_dismissed", "true");
    }, 300);
  };

  // Don't show if: already installed, dismissed, or no prompt captured
  if (installed || dismissed || !prompt) return null;

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden border
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-y-0 max-h-28" : "opacity-0 -translate-y-2 max-h-0"}
        bg-gradient-to-r from-amber-500/10 to-amber-600/5
        border-amber-500/20
      `}
    >
      {/* amber glow line top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-amber-500/20">
            🐄
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              অ্যাপটি ইনস্টল করুন
            </p>
            <p className="text-slate-400 text-xs">
              অফলাইনেও ব্যবহার করুন — হোম স্ক্রিনে যুক্ত করুন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-bold rounded-lg
              hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            ইনস্টল
          </button>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors rounded"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

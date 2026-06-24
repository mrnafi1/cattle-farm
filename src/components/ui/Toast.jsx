import { useEffect, useState } from "react";
import { useApp } from "../../contexts/AppContext";

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const typeStyles = {
    success: "border-l-4 border-emerald-400 bg-emerald-900/30",
    error: "border-l-4 border-red-400 bg-red-900/30",
    warning: "border-l-4 border-amber-400 bg-amber-900/30",
    info: "border-l-4 border-blue-400 bg-blue-900/30",
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const iconColor = {
    success: "text-emerald-400",
    error: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-sm
        shadow-2xl text-white text-sm max-w-xs w-full
        transition-all duration-300
        ${typeStyles[toast.type] || typeStyles.success}
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <span className={`font-bold text-lg ${iconColor[toast.type] || iconColor.success}`}>
        {iconMap[toast.type] || iconMap.success}
      </span>
      <span className="flex-1 text-slate-100">{toast.message}</span>
      <button
        onClick={handleClose}
        className="text-slate-400 hover:text-white transition-colors ml-1"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

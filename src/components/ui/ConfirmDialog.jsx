import Button from "./Button";

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl max-w-sm w-full">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🗑️</span>
          </div>
          <p className="text-white font-semibold">নিশ্চিত করুন</p>
          <p className="text-slate-400 text-sm mt-1">{message || "আপনি কি এটি মুছে ফেলতে চান?"}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">বাতিল</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1 !bg-red-500/20 !text-red-400 !border-red-500/30 hover:!bg-red-500/30">হ্যাঁ, মুছুন</Button>
        </div>
      </div>
    </div>
  );
}

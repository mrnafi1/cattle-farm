import { useState, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";

const STEPS = ["মূল তথ্য", "শারীরিক তথ্য", "ক্রয় ও ছবি"];

const Input  = (p) => <input  {...p} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500" />;
const Select = ({ children, ...p }) => <select {...p} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60">{children}</select>;
const Field  = ({ label, children }) => <div><label className="text-slate-400 text-xs block mb-1">{label}</label>{children}</div>;

export default function AddCattleForm({ onClose }) {
  const { addCattle } = useApp();
  const { t } = useLanguage();
  const photoRef = useRef();
  const [step, setStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [form, setForm] = useState({
    tagId: "", name: "", type: "dairy", breed: "",
    age: "", weight: "", purchaseDate: "", purchasePrice: "",
    status: "healthy", notes: "", photo: null,
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("সর্বোচ্চ ২MB ছবি দিন"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      set("photo", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => { // ফাংশনটিকে async করা হলো
    // ১. ডাটাবেসে পাঠানোর জন্য ডেটা প্রস্তুত করা
    const newCattleData = {
      ...form,
      age: Number(form.age),
      purchasePrice: Number(form.purchasePrice),
      weight: form.weight
        ? [{ date: new Date().toISOString().slice(0, 10), value: Number(form.weight) }]
        : [],
      vaccineHistory: [],
    };

    try {
      // ২. ব্যাকএন্ড এপিআই-তে POST রিকোয়েস্ট পাঠানো
      const response = await fetch("https://cattle-farm-server.onrender.com/cattles", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(newCattleData), // ডেটাকে JSON ফরম্যাটে রূপান্তর
      });

      const data = await response.json();

      if (data.acknowledged) {
        // ৩. ডাটাবেসে সফলভাবে সেভ হলে লোকাল UI আপডেট করা
        addCattle({ ...newCattleData, _id: data.insertedId });
        alert("সফলভাবে ডাটাবেসে সেভ হয়েছে!");
        onClose();
      }
    } catch (error) {
      console.error("Error saving cattle:", error);
      alert("ডাটাবেসে সেভ করতে সমস্যা হয়েছে!");
    }
  };

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-xs font-medium ${i <= step ? "text-amber-400" : "text-slate-600"}`}>{s}</span>
          ))}
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Step 0 — মূল তথ্য */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("tagId")}>
              <Input value={form.tagId} onChange={(e) => set("tagId", e.target.value)} placeholder="TAG-005" />
            </Field>
            <Field label="নাম">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="গরুর নাম" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("type")}>
              <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="dairy">{t("dairy")}</option>
                <option value="fattening">{t("fattening")}</option>
              </Select>
            </Field>
            <Field label={t("status")}>
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="healthy">{t("healthy")}</option>
                <option value="sick">{t("sick")}</option>
                <option value="forSale">{t("forSale")}</option>
              </Select>
            </Field>
          </div>
        </div>
      )}

      {/* Step 1 — শারীরিক তথ্য */}
      {step === 1 && (
        <div className="space-y-3">
          <Field label={t("breed")}>
            <Input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="শাহীওয়াল, হলস্টেইন, দেশি..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("age")} (বছর)`}>
              <Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="৩" />
            </Field>
            <Field label={`${t("weight")} (kg)`}>
              <Input type="number" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="২৮০" />
            </Field>
          </div>
          <Field label="নোট (ঐচ্ছিক)">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500 resize-none"
              placeholder="অতিরিক্ত তথ্য..." />
          </Field>
        </div>
      )}

      {/* Step 2 — ক্রয় ও ছবি */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("purchaseDate")}>
              <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
            </Field>
            <Field label={`${t("purchasePrice")} (৳)`}>
              <Input type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="৬০০০০" />
            </Field>
          </div>

          {/* Photo upload */}
          <Field label="গরুর ছবি (ঐচ্ছিক)">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700/50 border-2 border-dashed border-slate-600 flex items-center justify-center flex-shrink-0">
                {photoPreview
                  ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  : <span className="text-3xl">🐄</span>
                }
              </div>
              <div>
                <input type="file" accept="image/*" ref={photoRef} onChange={handlePhoto} className="hidden" />
                <Button variant="secondary" size="sm" onClick={() => photoRef.current?.click()}>
                  📷 ছবি বেছে নিন
                </Button>
                {photoPreview && (
                  <button onClick={() => { setPhotoPreview(null); set("photo", null); }}
                    className="ml-2 text-xs text-red-400 hover:text-red-300 transition-colors">মুছুন</button>
                )}
                <p className="text-slate-500 text-xs mt-1.5">JPG/PNG, সর্বোচ্চ ২MB</p>
                <p className="text-slate-600 text-xs">ছবি ডিভাইসেই সেভ হবে (নেট লাগবে না)</p>
              </div>
            </div>
          </Field>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-1 border-t border-slate-700/40">
        <Button variant="secondary" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>
          {step === 0 ? "বাতিল" : "← পূর্ববর্তী"}
        </Button>
        {step < STEPS.length - 1
          ? <Button onClick={() => setStep((s) => s + 1)}>পরবর্তী →</Button>
          : <Button onClick={handleSubmit}>💾 সংরক্ষণ করুন</Button>
        }
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useApp } from "../../contexts/AppContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Button from "../ui/Button";

const Field = ({ label, children }) => (
  <div>
    <label className="text-slate-400 text-xs block mb-1">{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props}
    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500" />
);

const Select = ({ children, ...props }) => (
  <select {...props}
    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60">
    {children}
  </select>
);

export default function EditCattleForm({ cattle, onClose }) {
  const { updateCattle } = useApp();
  const { t } = useLanguage();
  const photoRef = useRef();

  const [form, setForm] = useState({
    name:          cattle.name || "",
    breed:         cattle.breed || "",
    type:          cattle.type || "dairy",
    age:           cattle.age || "",
    status:        cattle.status || "healthy",
    purchaseDate:  cattle.purchaseDate || "",
    purchasePrice: cattle.purchasePrice || "",
    notes:         cattle.notes || "",
    photo:         cattle.photo || null,
  });

  const [newWeight, setNewWeight] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(cattle.photo || null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Photo upload → base64
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("ছবির সাইজ সর্বোচ্চ ২ MB হতে হবে");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewPhoto(ev.target.result);
      set("photo", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // এখানে async যুক্ত করা হয়েছে
  const handleSave = async () => {
    const updated = {
      ...form,
      age:           Number(form.age),
      purchasePrice: Number(form.purchasePrice),
      photo:         form.photo,
    };

    // Add new weight entry if provided
    if (newWeight) {
      const today = new Date().toISOString().slice(0, 10);
      updated.weight = [
        ...(cattle.weight || []),
        { date: today, value: Number(newWeight) },
      ];
    }

    // cattle.id এর বদলে cattle._id ব্যবহার করা হলো এবং await যুক্ত করা হলো
    const cattleId = cattle._id || cattle.id;
    await updateCattle(cattleId, updated);
    
    // ডাটা সফলভাবে সার্ভারে যাওয়ার পর ফর্মটি বন্ধ হবে
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Photo upload */}
      <Field label="গরুর ছবি">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700/50 border border-slate-600/40 flex items-center justify-center flex-shrink-0">
            {previewPhoto
              ? <img src={previewPhoto} alt="preview" className="w-full h-full object-cover" />
              : <span className="text-3xl">🐄</span>
            }
          </div>
          <div className="flex-1">
            <input type="file" accept="image/*" ref={photoRef} onChange={handlePhoto} className="hidden" />
            <Button variant="secondary" size="sm" onClick={() => photoRef.current?.click()}>
              📷 ছবি বেছে নিন
            </Button>
            {previewPhoto && (
              <button onClick={() => { setPreviewPhoto(null); set("photo", null); }}
                className="ml-2 text-xs text-red-400 hover:text-red-300">মুছুন</button>
            )}
            <p className="text-slate-500 text-xs mt-1">JPG/PNG, সর্বোচ্চ ২MB</p>
          </div>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="নাম">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="গরুর নাম" />
        </Field>
        <Field label={t("breed")}>
          <Input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="জাত" />
        </Field>
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
        <Field label={`${t("age")} (বছর)`}>
          <Input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} />
        </Field>
        <Field label="নতুন ওজন যুক্ত করুন (kg)">
          <Input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="আজকের ওজন" />
        </Field>
        <Field label={t("purchaseDate")}>
          <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
        </Field>
        <Field label={`${t("purchasePrice")} (৳)`}>
          <Input type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
        </Field>
      </div>

      <Field label="নোট">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500 resize-none"
          placeholder="অতিরিক্ত তথ্য..." />
      </Field>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-700/40">
        <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
        <Button onClick={handleSave}>💾 {t("save")}</Button>
      </div>
    </div>
  );
}
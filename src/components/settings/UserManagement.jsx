import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";

const ROLE_STYLES = {
  admin:       "bg-amber-400/10  text-amber-400  border-amber-400/20",
  worker:      "bg-sky-400/10   text-sky-400   border-sky-400/20",
  shareholder: "bg-purple-400/10 text-purple-400 border-purple-400/20",
};
const ROLE_LABELS = { admin: "অ্যাডমিন", worker: "কর্মী", shareholder: "শেয়ারহোল্ডার" };

const ROLE_PERMISSIONS = {
  admin:       ["ড্যাশবোর্ড", "গরুর তালিকা (পড়া+লেখা)", "দুধের হিসাব (পড়া+লেখা)", "আয়-ব্যয় (পড়া+লেখা)", "রিপোর্ট", "ব্যবহারকারী ব্যবস্থাপনা"],
  worker:      ["ড্যাশবোর্ড", "গরুর তালিকা (পড়া+লেখা)", "দুধের হিসাব (পড়া+লেখা)", "আয়-ব্যয় (পড়া+লেখা)"],
  shareholder: ["ড্যাশবোর্ড (সারসংক্ষেপ)", "রিপোর্ট দেখা", "PDF ডাউনলোড"],
};

const Input  = (p) => <input  {...p} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60 placeholder-slate-500" />;
const Select = ({ children, ...p }) => <select {...p} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/60">{children}</select>;
const Field  = ({ label, children }) => <div><label className="text-slate-400 text-xs block mb-1">{label}</label>{children}</div>;

const EMPTY = { name: "", role: "worker", pin: "", phone: "" };

export default function UserManagement() {
  const { users, currentUser, addUser, updateUser, deleteUser, toggleUserActive } = useAuth();
  const { addToast } = useApp();

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showPerms,    setShowPerms]    = useState(null); 
  const [form,         setForm]         = useState(EMPTY);
  const [formErr,      setFormErr]      = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd  = () => { setForm(EMPTY); setFormErr(""); setShowForm(true); };
  const openEdit = (u) => { setEditTarget(u); setForm({ name: u.name, role: u.role, pin: u.pin, phone: u.phone || "" }); setFormErr(""); };
  const closeAll = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY); setFormErr(""); };

  useEffect(() => {
    if (!editTarget && form.phone && form.phone.length >= 4) {
      const autoPin = form.phone.slice(-4);
      set("pin", autoPin);
    } else if (!editTarget && form.phone.length < 4) {
       set("pin", "");
    }
  }, [form.phone, editTarget]);

  const handleSave = async () => {
    if (!form.name.trim()) return setFormErr("নাম দিতে হবে");
    
    if ((form.role === "worker" || form.role === "shareholder") && !form.phone.trim()) {
      return setFormErr("কর্মী বা শেয়ারহোল্ডারদের জন্য ফোন নাম্বার দেওয়া বাধ্যতামূলক");
    }

    if (form.pin.length < 4) return setFormErr("পিন কমপক্ষে ৪ সংখ্যার হতে হবে");

    if (editTarget) {
      const res = await updateUser(editTarget._id || editTarget.id, form);
      if (res && !res.ok) return setFormErr(res.msg);
      addToast("ব্যবহারকারীর তথ্য আপডেট হয়েছে");
    } else {
      const res = await addUser(form);
      if (res && !res.ok) return setFormErr(res.msg);
      addToast("নতুন ব্যবহারকারী যুক্ত হয়েছে");
    }
    closeAll();
  };

  const handleDelete = async () => {
    const res = await deleteUser(deleteTarget._id || deleteTarget.id);
    if (res && !res.ok) { 
      addToast(res.msg, "error"); 
    } else { 
      addToast("ব্যবহারকারী মুছে ফেলা হয়েছে", "error"); 
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">ব্যবহারকারী ব্যবস্থাপনা</h2>
          <p className="text-slate-500 text-sm">মোট {users.length} জন ব্যবহারকারী নিবন্ধিত</p>
        </div>
        <Button onClick={openAdd}>+ নতুন ব্যবহারকারী</Button>
      </div>

      {/* Role permissions guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["admin", "worker", "shareholder"]).map((role) => (
          <div key={role} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors" onClick={() => setShowPerms(role)}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_STYLES[role]}`}>{ROLE_LABELS[role]}</span>
              <span className="text-slate-500 text-xs">{users.filter((u) => u.role === role && u.active !== false).length} জন সক্রিয়</span>
            </div>
            <p className="text-slate-400 text-xs">{ROLE_PERMISSIONS[role][0]}...</p>
            <p className="text-amber-400/60 text-xs mt-1">বিস্তারিত দেখুন →</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/40">
          <p className="text-white font-semibold text-sm">সকল ব্যবহারকারী</p>
        </div>
        <div className="divide-y divide-slate-700/30">
          {users.map((u) => {
            // ── বাগ ফিক্স: কে আসল ইউজার তা সঠিকভাবে যাচাই করা ──
            const isMe = (u._id && currentUser?._id && u._id === currentUser._id) || (u.id && currentUser?.id && u.id === currentUser.id);

            return (
              <div key={u._id || u.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/15 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${u.active === false ? "bg-slate-700 text-slate-500" : "bg-gradient-to-br from-slate-600 to-slate-700 text-white"}`}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${u.active === false ? "text-slate-500 line-through" : "text-white"}`}>{u.name}</span>
                      {/* শুধুমাত্র নিজের নামের পাশে "আপনি" দেখাবে */}
                      {isMe && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-400/10 text-amber-400 rounded border border-amber-400/20">আপনি</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_STYLES[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                      {u.phone && <span className="text-slate-500 text-xs">📞 {u.phone}</span>}
                      {u.createdAt && <span className="text-slate-600 text-xs">যোগ: {u.createdAt}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions কলাম */}
                <div className="flex items-center gap-1.5">
                  {!isMe && (
                    <button onClick={() => toggleUserActive(u._id || u.id)} className={`px-2 py-1 rounded text-xs transition-all ${u.active === false ? "text-emerald-400 hover:bg-emerald-400/10" : "text-slate-400 hover:bg-slate-700/50"}`} title={u.active === false ? "সक्रिय করুন" : "নিষ্ক্রিয় করুন"}>
                      {u.active === false ? "✓ সক্রিয়" : "⏸ নিষ্ক্রিয়"}
                    </button>
                  )}
                  <button onClick={() => openEdit(u)} className="px-2 py-1 rounded text-xs text-sky-400 hover:bg-sky-400/10 transition-all">✏️ এডিট</button>
                  
                  {/* নিজেকে ছাড়া অন্য সবাইকে ডিলিট করা যাবে */}
                  {!isMe && (
                    <button onClick={() => setDeleteTarget(u)} className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10 transition-all" title="মুছে ফেলুন">🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm || !!editTarget} onClose={closeAll} title={editTarget ? `এডিট: ${editTarget.name}` : "নতুন ব্যবহারকারী যুক্ত করুন"}>
        <div className="space-y-4">
          <Field label="পূর্ণ নাম *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="যেমন: করিম মিয়া" /></Field>
          <Field label={form.role === "admin" ? "ফোন নম্বর (ঐচ্ছিক)" : "ফোন নম্বর (লগইনের জন্য বাধ্যতামূলক) *"}>
            <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ভূমিকা *">
              <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="admin">অ্যাডমিন</option>
                <option value="worker">কর্মী</option>
                <option value="shareholder">শেয়ারহোল্ডার</option>
              </Select>
            </Field>
            <Field label="গোপন পিন / পাসওয়ার্ড (রিসেট করুন) *">
              <Input type="text" value={form.pin} onChange={(e) => set("pin", e.target.value)} placeholder={editTarget ? "নতুন পিন দিন" : "অটোমেটিক তৈরি হবে"} maxLength={6} />
            </Field>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3 mt-4">
            <p className="text-slate-400 text-xs font-semibold mb-2">{ROLE_LABELS[form.role]} — অ্যাক্সেস পাবে:</p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[form.role].map((p) => <li key={p} className="text-slate-300 text-xs flex items-center gap-1.5"><span className="text-emerald-400">✓</span> {p}</li>)}
            </ul>
          </div>
          {formErr && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">⚠ {formErr}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/40 mt-4">
            <Button variant="secondary" onClick={closeAll}>বাতিল</Button>
            <Button onClick={handleSave}>💾 সংরক্ষণ করুন</Button>
          </div>
        </div>
      </Modal>

      {/* Permissions info modal */}
      <Modal isOpen={!!showPerms} onClose={() => setShowPerms(null)} title={`${ROLE_LABELS[showPerms] || ""} — অ্যাক্সেস বিবরণী`}>
        {showPerms && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm"><span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold mr-2 ${ROLE_STYLES[showPerms]}`}>{ROLE_LABELS[showPerms]}</span>ভূমিকার সুবিধাসমূহ:</p>
            <ul className="space-y-2 mb-4">
              {ROLE_PERMISSIONS[showPerms].map((p) => <li key={p} className="flex items-start gap-2 text-slate-300 text-sm"><span className="text-emerald-400 mt-0.5">✓</span>{p}</li>)}
            </ul>
            {showPerms === "shareholder" && <div className="bg-amber-400/5 border border-amber-400/15 rounded-lg p-3 text-xs text-slate-400">💡 শেয়ারহোল্ডার শুধু রিপোর্ট দেখতে ও PDF নামাতে পারবে।</div>}
            <div className="flex justify-end pt-2 mt-4"><Button variant="secondary" onClick={() => setShowPerms(null)}>বন্ধ করুন</Button></div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog isOpen={!!deleteTarget} message={`"${deleteTarget?.name}" কে মুছে ফেলবেন?`} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
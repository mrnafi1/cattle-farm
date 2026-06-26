import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Role access levels
const HIERARCHY = { admin: 3, worker: 2, shareholder: 1 };

export function AuthProvider({ children }) {
  // অ্যাপ লোড হওয়ার সময় লোকাল স্টোরেজ চেক করা
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("cattleFarmUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ডাটাবেস থেকে রিয়েল ইউজার ডেটা আনা
  const fetchUsers = async () => {
    try {
      const res = await fetch("https://cattle-farm-server.onrender.com/users");
      const data = await res.json();

      // যদি ডাটাবেস একদম খালি থাকে, তবে ডিফল্ট অ্যাডমিন তৈরি করা
      if (data.length === 0) {
        const defaultAdmin = {
          name: "Admin",
          role: "admin",
          email: "admin@farm.com",
          password: "admin",
          phone: "01700000000",
          pin: "1234",
          active: true,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const postRes = await fetch("https://cattle-farm-server.onrender.com/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(defaultAdmin)
        });
        const postData = await postRes.json();
        setUsers([{ ...defaultAdmin, _id: postData.insertedId }]);
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error("ইউজার লোড করতে সমস্যা:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Auth ──────────────────────────────────────────────────────
  // লগইন ফাংশন 
  const login = (credentials, type = "old") => {
    let user;

    if (type === "admin") {
      user = users.find(u => u.role === "admin" && u.email === credentials.email && u.password === credentials.password && u.active !== false);
    } else if (type === "staff") {
      user = users.find(u => (u.role === "worker" || u.role === "shareholder") && u.phone === credentials.phone && u.pin === credentials.pin && u.active !== false);
    } else {
      user = users.find(u => u.name.trim() === credentials.trim() && arguments[1] === u.pin && u.active !== false);
    }

    if (user) {
      setCurrentUser(user);
      // লগইন সফল হলে ইউজারের তথ্য লোকাল স্টোরেজে সেভ করা
      localStorage.setItem("cattleFarmUser", JSON.stringify(user));
      setAuthError("");
      return true;
    }
    
    setAuthError("তথ্য সঠিক নয়, অথবা একাউন্ট নিষ্ক্রিয়!");
    return false;
  };

  // লগআউট করলে লোকাল স্টোরেজ থেকে ডাটা মুছে ফেলা
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("cattleFarmUser");
  };

  const hasAccess = (required) => {
    if (!currentUser) return false;
    return (HIERARCHY[currentUser.role] || 0) >= (HIERARCHY[required] || 99);
  };

  // ── User CRUD (admin only) ────────────────────────────────────
  const addUser = async (data) => {
    // শুধুমাত্র ফোন নাম্বার দেওয়া থাকলেই ডুপ্লিকেট চেক করবে
    if (data.phone && users.find((u) => u.phone === data.phone)) {
      return { ok: false, msg: "এই ফোন নাম্বারে ইতিমধ্যে একজন ব্যবহারকারী আছে" };
    }
    const newUser = {
      ...data,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    try {
      await fetch("https://cattle-farm-server.onrender.com/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      fetchUsers(); 
      return { ok: true };
    } catch (error) {
      return { ok: false, msg: "সার্ভার এরর" };
    }
  };

  const updateUser = async (id, data) => {
    try {
      // ডাটাবেসে _id আপডেট করা যায় না, তাই ডাটা থেকে _id সরিয়ে নেওয়া হলো
      const updatePayload = { ...data };
      delete updatePayload._id;

      const res = await fetch(`https://cattle-farm-server.onrender.com/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        fetchUsers(); 
        
        // যদি নিজের প্রোফাইল আপডেট হয়, তবে লোকাল স্টোরেজও আপডেট করা
        if (currentUser?._id === id || currentUser?.id === id) {
          setCurrentUser((prev) => {
            const updatedUser = { ...prev, ...updatePayload };
            localStorage.setItem("cattleFarmUser", JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
        return { ok: true };
      }
      return { ok: false, msg: "আপডেট সফল হয়নি" };
    } catch (error) {
      console.error("আপডেট করতে সমস্যা:", error);
      return { ok: false, msg: "সার্ভার এরর" };
    }
  };

  const deleteUser = async (id) => {
    if (currentUser?._id === id || currentUser?.id === id) return { ok: false, msg: "নিজেকে মুছতে পারবেন না" };
    try {
      await fetch(`https://cattle-farm-server.onrender.com/users/${id}`, { method: "DELETE" });
      fetchUsers();
      return { ok: true };
    } catch (error) {
      return { ok: false, msg: "ডিলিট করা যায়নি" };
    }
  };

  // ── নতুন আপডেট: ডাটাবেসে স্ট্যাটাস সেভ করা ──
  const toggleUserActive = async (id) => {
    if (currentUser?._id === id || currentUser?.id === id) return;
    
    // নির্দিষ্ট ইউজারকে খুঁজে বের করা
    const userToToggle = users.find((u) => u._id === id || u.id === id);
    if (!userToToggle) return;

    const newStatus = !userToToggle.active;

    // তাৎক্ষণিক UI আপডেটের জন্য
    setUsers(users.map((u) => u._id === id || u.id === id ? { ...u, active: newStatus } : u));

    try {
      const updatePayload = { ...userToToggle, active: newStatus };
      delete updatePayload._id; // _id বাদ দেওয়া হলো

      // ডাটাবেসে স্ট্যাটাস আপডেট পাঠানো
      await fetch(`https://cattle-farm-server.onrender.com/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
    } catch (error) {
      console.error("স্ট্যাটাস আপডেট করতে সমস্যা:", error);
      // এরর হলে আবার আগের স্ট্যাটাসে ফেরত নেওয়া
      setUsers(users.map((u) => u._id === id || u.id === id ? { ...u, active: !newStatus } : u));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser, users, isLoading,
        login, logout, hasAccess, authError,
        addUser, updateUser, deleteUser, toggleUserActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
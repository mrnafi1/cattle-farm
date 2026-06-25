import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Role access levels
const HIERARCHY = { admin: 3, worker: 2, shareholder: 1 };

export function AuthProvider({ children }) {
  // ১. পরিবর্তন: অ্যাপ লোড হওয়ার সময় লোকাল স্টোরেজ চেক করা
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
      // ২. পরিবর্তন: লগইন সফল হলে ইউজারের তথ্য লোকাল স্টোরেজে সেভ করা
      localStorage.setItem("cattleFarmUser", JSON.stringify(user));
      setAuthError("");
      return true;
    }
    
    setAuthError("তথ্য সঠিক নয়, অথবা একাউন্ট নিষ্ক্রিয়!");
    return false;
  };

  // ৩. পরিবর্তন: লগআউট করলে লোকাল স্টোরেজ থেকে ডাটা মুছে ফেলা
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
    if (users.find((u) => u.phone === data.phone)) {
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
      const res = await fetch(`https://cattle-farm-server.onrender.com/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        fetchUsers(); 
        
        // ৪. পরিবর্তন: যদি নিজের প্রোফাইল আপডেট হয়, তবে লোকাল স্টোরেজও আপডেট করা
        if (currentUser?._id === id || currentUser?.id === id) {
          setCurrentUser((prev) => {
            const updatedUser = { ...prev, ...data };
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

  const toggleUserActive = (id) => {
    if (currentUser?._id === id || currentUser?.id === id) return;
    const updated = users.map((u) => u._id === id || u.id === id ? { ...u, active: !u.active } : u);
    setUsers(updated);
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
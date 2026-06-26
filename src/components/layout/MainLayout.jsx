import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ToastContainer from "../ui/Toast";
import FAB from "../ui/FAB";
import { useAuth } from "../../contexts/AuthContext";

export default function MainLayout({ children, activePage, onNavigate, onFABActions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // সরাসরি currentUser নিয়ে আসছি
  const { currentUser } = useAuth(); 

  // ইউজার শেয়ারহোল্ডার কি না, তা ডিরেক্ট চেক করছি
  const isShareholder = currentUser?.role === "shareholder" || currentUser?.role === "Shareholder";

  return (
    <div className="flex h-screen bg-[#080c18] text-white overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col min-h-full relative">
            <div className="flex-1">
              {children}
            </div>
            
            <div className="h-28 shrink-0 w-full pointer-events-none"></div>
          </div>
        </main>
      </div>

      <ToastContainer />
      
      {/* ── ম্যাজিক লজিক: যদি ইউজার শেয়ারহোল্ডার "না" হয়, তবেই বাটন দেখাবে ── */}
      {!isShareholder && (
        <FAB
          onAddCattle={onFABActions?.onAddCattle || (() => {})}
          onAddMilk={onFABActions?.onAddMilk || (() => {})}
          onAddExpense={onFABActions?.onAddExpense || (() => {})}
        />
      )}
    </div>
  );
}
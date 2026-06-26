import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ToastContainer from "../ui/Toast";
import FAB from "../ui/FAB";

export default function MainLayout({ children, activePage, onNavigate, onFABActions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          {/* এখানে pb-28 যোগ করা হয়েছে যাতে মোবাইলে FAB এর নিচে কন্টেন্ট ঢাকা না পড়ে */}
          <div className="p-4 pb-28 lg:p-6 lg:pb-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <ToastContainer />
      <FAB
        onAddCattle={onFABActions?.onAddCattle || (() => {})}
        onAddMilk={onFABActions?.onAddMilk || (() => {})}
        onAddExpense={onFABActions?.onAddExpense || (() => {})}
      />
    </div>
  );
}
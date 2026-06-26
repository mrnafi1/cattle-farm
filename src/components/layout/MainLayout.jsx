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
          {/* flex এবং min-h-full যোগ করা হলো */}
          <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col min-h-full relative">
            
            {/* আপনার মূল কন্টেন্ট */}
            <div className="flex-1">
              {children}
            </div>
            
            {/* এই খালি div-টি বাটনের নিচে নিশ্চিত ফাঁকা জায়গা (Spacer) তৈরি করবে */}
            <div className="h-28 shrink-0 w-full pointer-events-none"></div>
            
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
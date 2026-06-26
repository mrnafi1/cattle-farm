import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ToastContainer from "../ui/Toast";
import FAB from "../ui/FAB";
import { useAuth } from "../../contexts/AuthContext";

export default function MainLayout({ children, activePage, onNavigate, onFABActions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth(); 
  const isShareholder = currentUser?.role === "shareholder" || currentUser?.role === "Shareholder";

  return (
    <div className="flex h-screen bg-[#FAFAF7] dark:bg-[#080c18] text-[#1A1A2E] dark:text-white overflow-hidden transition-colors duration-300">
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
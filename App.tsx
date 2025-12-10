import React from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Menu } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { RegionManager } from './pages/RegionManager';

const SidebarLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 text-primary font-bold shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-gray-50 text-right" dir="rtl">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Ali Miziry</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="لوحة التحكم" />
              <SidebarLink to="/customers" icon={<Users size={20} />} label="العملاء والزيارات" />
              <SidebarLink to="/regions" icon={<Map size={20} />} label="إدارة المناطق" />
            </nav>

            <div className="p-4 border-t border-gray-100">
              <div className="text-xs text-gray-400 text-center">
                &copy; 2024 Ali Miziry System
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="bg-white border-b border-gray-200 p-4 lg:hidden flex items-center justify-between">
            <h1 className="font-bold text-gray-800">Ali Miziry</h1>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/regions" element={<RegionManager />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  User,
  LayoutDashboard,
  History,
  Settings,
  Bell
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'DASHBOARD', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'HISTÓRICO', path: '/services', icon: <History size={18} /> },
    { label: 'CONFIGURAÇÕES', path: '/clients', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Fixed Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 z-50 px-6 sm:px-12 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter text-indigo-600">ConciliaFacil</span>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-[11px] font-black tracking-[0.2em] transition-all relative py-2 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full animate-fade-in" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-indigo-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden sm:block" />
          <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all shadow-sm group">
            <User size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* Page Container */}
      <main className="pt-28 pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto print:pt-0 print:px-0">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          main { padding-top: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;

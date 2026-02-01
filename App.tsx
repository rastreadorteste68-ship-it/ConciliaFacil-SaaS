import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileUp, Settings, ShieldCheck, User } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';

// Fix: Explicitly type Layout as React.FC with children to resolve TypeScript prop validation error
// This ensures that when Layout is used as a wrapper, the nested elements are correctly treated as children.
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { label: 'DASHBOARD', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'HISTÓRICO / IMPORTAR', path: '/import', icon: <FileUp size={18} /> },
    { label: 'CONFIGURAÇÕES', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
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

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shadow-sm">
            <User size={20} />
          </button>
        </div>
      </header>

      <main className="pt-28 pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto print:pt-0 print:px-0">
        {children}
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

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<div className="p-10 text-center text-slate-400">Configurações em breve...</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
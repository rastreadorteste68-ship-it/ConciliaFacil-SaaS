
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  CalendarRange, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Filter,
  Users
} from 'lucide-react';
import { storage } from '../services/storage';
import { Client, PaymentStatus } from '../types';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500';
      case 'pending': return 'bg-rose-500';
      case 'manual_paid': return 'bg-amber-400';
      default: return 'bg-slate-300';
    }
  };

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Carteira de Clientes</h2>
          <p className="text-slate-500 font-medium mt-2 uppercase text-[10px] tracking-[0.4em]">Gestão de Recorrência e Histórico</p>
        </div>
        <button className="bg-indigo-600 text-white p-5 rounded-[2rem] shadow-xl shadow-indigo-100 active:scale-95 transition-all"><UserPlus size={32}/></button>
      </header>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou razão social..."
          className="w-full bg-white border-none rounded-[2.5rem] py-6 pl-16 pr-8 text-slate-800 placeholder:text-slate-400 shadow-sm focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-lg"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-xl text-slate-400 cursor-pointer hover:bg-slate-100"><Filter size={20}/></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedClient(client)}
            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{client.name.charAt(0)}</div>
                <div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none">{client.name}</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">Cota: R$ {client.expectedAmount}</span>
                </div>
              </div>
              <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-all" size={24} />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between gap-1 overflow-x-auto scrollbar-hide">
               {months.map((m, idx) => (
                 <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${idx < 3 ? 'bg-emerald-400' : 'bg-slate-100'}`}></div>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">{m}</span>
                 </div>
               ))}
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
             {/* Correctly imported Users icon from lucide-react */}
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300"><Users size={40}/></div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aguardando Importação de Clientes</p>
          </div>
        )}
      </div>

      {/* Detail Modal / Slide-over */}
      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-md p-4">
           <div className="bg-[#f8fafc] w-full max-w-2xl rounded-t-[4rem] sm:rounded-[4rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl space-y-8 animate-in slide-in-from-bottom duration-300">
              <header className="flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-100">{selectedClient.name.charAt(0)}</div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{selectedClient.name}</h3>
                       <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mt-1"><CheckCircle2 size={12}/> Cliente em Dia</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedClient(null)} className="p-4 bg-white text-slate-400 rounded-2xl shadow-sm hover:text-rose-500"><XCircle size={28}/></button>
              </header>

              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                 <div className="flex items-center justify-between"><h4 className="font-black text-slate-400 text-[11px] uppercase tracking-[0.3em]">Linha do Tempo 2024</h4><CalendarRange size={18} className="text-indigo-500"/></div>
                 <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                   {months.map((m, i) => (
                     <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 shadow-lg ${i < 3 ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}>
                           {i < 3 ? <CheckCircle2 size={24}/> : <HelpCircle size={24}/>}
                        </div>
                        <span className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{m}</span>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <button className="w-full h-20 rounded-[2.5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                    <CalendarRange size={24}/> Abrir Calendário Detalhado
                 </button>
                 <button className="w-full h-16 rounded-[2rem] bg-white border border-slate-100 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all">
                    Editar Dados Cadastrais
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Clients;

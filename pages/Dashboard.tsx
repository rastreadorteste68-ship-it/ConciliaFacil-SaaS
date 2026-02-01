
import React, { useState, useEffect } from 'react';
import { Plus, FileDown, CheckCircle2, MoreVertical, X, Calendar, DollarSign, ArrowRight, Check, UserPlus } from 'lucide-react';
import { storage } from '../storage';
import { Client, MonthStatus } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', startDate: '2025-01', expectedAmount: 0 });

  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  // Window fixed for UI consistency: Feb 2026 backwards to 14 months ago
  const BASE_DATE = new Date(2026, 1, 1);
  const WINDOW_MONTHS = 14;

  const getAuditTimeline = (client: Client) => {
    const timeline = [];
    const clientStart = new Date(client.startDate + "-01");

    for (let i = 0; i < WINDOW_MONTHS; i++) {
      const d = new Date(BASE_DATE);
      d.setMonth(BASE_DATE.getMonth() - i);
      
      // Skip months before client started
      if (d < clientStart) continue;

      const monthNum = d.getMonth() + 1;
      const year = d.getFullYear();
      
      const stored = client.months.find(m => m.month === monthNum && m.year === year);
      
      const monthShort = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      const label = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);

      timeline.push({
        label,
        year: year.toString(),
        monthNum,
        yearNum: year,
        status: stored?.status || 'UNPAID',
        paymentDates: stored?.paymentDates || [],
        amount: stored?.amount
      });
    }
    return timeline;
  };

  const calculateProgress = (client: Client) => {
    const timeline = getAuditTimeline(client);
    if (timeline.length === 0) return 0;
    const paid = timeline.filter(t => t.status !== 'UNPAID').length;
    return Math.round((paid / timeline.length) * 100);
  };

  const stats = {
    totalClients: clients.length,
    totalPaid: clients.reduce((acc, c) => acc + c.months.filter(m => m.status !== 'UNPAID').reduce((sum, m) => sum + (m.amount || 0), 0), 0),
    openMonths: clients.reduce((acc, c) => {
      const timeline = getAuditTimeline(c);
      return acc + timeline.filter(t => t.status === 'UNPAID').length;
    }, 0)
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    const added = storage.addClient(newClient.name, newClient.startDate, newClient.expectedAmount);
    setClients([...clients, added]);
    setShowAddModal(false);
    setNewClient({ name: '', startDate: '2025-01', expectedAmount: 0 });
  };

  const handleTogglePayment = (clientId: string, monthNum: number, year: number) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const newMonths = [...c.months];
        const existingIdx = newMonths.findIndex(m => m.month === monthNum && m.year === year);
        
        if (existingIdx !== -1) {
          const current = newMonths[existingIdx];
          if (current.status === 'UNPAID') {
            newMonths[existingIdx] = { ...current, status: 'MANUAL_PAID', source: 'manual', paymentDates: [new Date().toISOString().split('T')[0]] };
          } else {
            newMonths[existingIdx] = { ...current, status: 'UNPAID', source: 'manual', paymentDates: [] };
          }
        } else {
          newMonths.push({
            month: monthNum,
            year: year,
            status: 'MANUAL_PAID',
            source: 'manual',
            paymentDates: [new Date().toISOString().split('T')[0]],
            amount: c.expectedAmount
          });
        }
        
        const progress = calculateProgress({ ...c, months: newMonths });
        return { ...c, months: newMonths, progress };
      }
      return c;
    });
    setClients(updated);
    storage.saveClients(updated);
    if (selectedClient && selectedClient.id === clientId) {
      setSelectedClient(updated.find(c => c.id === clientId) || null);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Relatório de Auditoria Mensal - ConciliaFacil", 15, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Cliente', 'Início', 'Progresso', 'Status']],
      body: clients.map(c => [
        c.name,
        c.startDate,
        `${calculateProgress(c)}%`,
        `${getAuditTimeline(c).filter(t => t.status !== 'UNPAID').length}/${getAuditTimeline(c).length} Pagos`
      ]),
    });
    doc.save("auditoria_geral.pdf");
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Top Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 transition-all hover:shadow-md">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Clientes Auditados</span>
          <span className="text-6xl font-black text-slate-900 leading-none">{stats.totalClients}</span>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 transition-all hover:shadow-md">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Total Pago</span>
          <span className="text-4xl font-black text-emerald-500">R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 transition-all hover:shadow-md">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Meses em Aberto</span>
          <span className="text-6xl font-black text-rose-500 leading-none">{stats.openMonths}</span>
        </div>
      </section>

      {/* Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Auditoria Mensal</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Gestão da carteira de clientes e status de conciliação.</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-white border border-slate-200 text-slate-800 px-8 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <UserPlus size={16} /> Novo Cliente
          </button>
          <button 
            onClick={exportPDF}
            className="bg-[#1a1c1e] text-white px-8 py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all"
          >
            <FileDown size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((client) => {
          const timeline = getAuditTimeline(client);
          const paidCount = timeline.filter(t => t.status !== 'UNPAID').length;
          const progress = calculateProgress(client);
          
          return (
            <div 
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="p-8 pb-4 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">{client.name}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Iniciado em {client.startDate}</p>
                  </div>
                  <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {paidCount}/{timeline.length} Pagos
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-y-4 gap-x-2">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[9px] font-black transition-all shadow-sm ${
                        item.status === 'PAID' ? 'bg-[#10b981] text-white shadow-emerald-100' : 
                        item.status === 'MANUAL_PAID' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                        'bg-rose-100 text-[#f43f5e]'
                      }`}>
                        {item.status === 'MANUAL_PAID' ? <Check size={12} strokeWidth={4} /> : item.label}
                      </div>
                      <span className="text-[8px] font-bold text-slate-300">{item.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-4 bg-white border-t border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso Real</span>
                  <span className="text-[10px] font-black text-slate-900">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleAddClient} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-6">
            <header className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black text-slate-900">Novo Cliente</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-rose-500"><X size={24}/></button>
            </header>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome / Razão Social</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newClient.name} 
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 placeholder:text-slate-300" 
                  placeholder="Ex: Amós Silva..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Início Cobrança</label>
                  <input 
                    required
                    type="month" 
                    value={newClient.startDate} 
                    onChange={(e) => setNewClient({...newClient, startDate: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor Mensal (R$)</label>
                  <input 
                    required
                    type="number" 
                    value={newClient.expectedAmount} 
                    onChange={(e) => setNewClient({...newClient, expectedAmount: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all">
              Salvar Cliente
            </button>
          </form>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-[#f8fafc] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <header className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{selectedClient.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contrato iniciado em {selectedClient.startDate}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl">
                <X size={24} />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {getAuditTimeline(selectedClient).map((item, idx) => {
                const isPaid = item.status !== 'UNPAID';
                return (
                  <div key={idx} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${isPaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] ${
                        item.status === 'PAID' ? 'bg-emerald-500 text-white' : 
                        item.status === 'MANUAL_PAID' ? 'bg-amber-400 text-white' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {item.status === 'MANUAL_PAID' ? <Check size={16} strokeWidth={3} /> : item.label}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{item.label} {item.year}</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {item.status === 'PAID' ? `Detectado: ${item.paymentDates[0] || '-'}` : 
                           item.status === 'MANUAL_PAID' ? `Confirmado em: ${item.paymentDates[0] || '-'}` :
                           'Dívida em aberto'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTogglePayment(selectedClient.id, item.monthNum, item.yearNum); }}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${isPaid ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                      >
                        {isPaid ? 'Remover' : 'Marcar ✔'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="p-8 bg-white border-t border-slate-50">
              <button onClick={() => setSelectedClient(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                Fechar Detalhamento
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

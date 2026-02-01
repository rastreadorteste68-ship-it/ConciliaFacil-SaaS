
import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Building, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { storage } from '../services/storage';
import { reconcileData } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { ReconciliationResult } from '../types';

const Services: React.FC = () => {
  const [billingText, setBillingText] = useState("");
  const [bankText, setBankText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const billingInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (txt: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setter(JSON.stringify(data));
      };
      reader.readAsBinaryString(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setter(evt.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = async () => {
    if (!billingText || !bankText) return alert("Por favor, carregue os dois arquivos para continuar.");
    
    setIsProcessing(true);
    try {
      const reconciliation = await reconcileData(billingText, bankText);
      if (reconciliation) {
        setResult(reconciliation);
      }
    } catch (err) {
      alert("Erro ao processar com IA. Verifique sua chave de API.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveResults = () => {
    if (!result) return;
    
    const existingClients = storage.getClients();
    
    // Process matches
    result.matches.forEach((match: any) => {
      let client = existingClients.find(c => 
        c.name.toLowerCase().includes(match.clientName.toLowerCase()) || 
        match.clientName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (!client) {
        client = {
          id: crypto.randomUUID(),
          name: match.clientName,
          expectedAmount: match.amount,
          payments: []
        };
        existingClients.push(client);
      }
      
      // Competence month
      const month = match.month || match.transactionDate?.substring(0, 7) || new Date().toISOString().substring(0, 7);
      
      // Check for duplication
      const alreadyPaid = client.payments.some(p => p.month === month);
      
      if (!alreadyPaid) {
        client.payments.push({
          month,
          day: match.transactionDate || new Date().toISOString(),
          status: 'paid',
          amount: match.amount
        });
      }
    });

    // Process unmatched billing (to ensure they exist in DB even if unpaid)
    result.unmatchedBilling.forEach((name: string) => {
      let client = existingClients.find(c => 
        c.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(c.name.toLowerCase())
      );
      if (!client) {
        existingClients.push({
          id: crypto.randomUUID(),
          name: name,
          expectedAmount: 0,
          payments: []
        });
      }
    });

    storage.saveClients(existingClients);
    alert("Dados conciliados salvos com sucesso! Vá ao Dashboard para ver as bolhas de status.");
    setResult(null);
    setBillingText("");
    setBankText("");
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Novo Relatório</h2>
        <p className="text-slate-400 text-sm font-medium mt-1">Carregue sua base de faturamento e extrato bancário para auditoria instantânea.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Billing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">01. Faturamento Esperado</span>
            {billingText && <button onClick={() => setBillingText("")} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={16}/></button>}
          </div>
          <div 
            onClick={() => billingInputRef.current?.click()}
            className={`p-12 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-5 group ${billingText ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-50/50' : 'border-slate-200 bg-white/50 hover:bg-white hover:border-indigo-300'}`}
          >
            <div className={`p-6 rounded-[1.8rem] transition-all group-hover:scale-110 ${billingText ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
              <FileText size={40} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">Base de Clientes</h3>
              <p className="text-slate-400 text-xs mt-1">PDF, Excel ou CSV com cobranças</p>
            </div>
            {billingText && (
              <div className="bg-emerald-50 px-4 py-1.5 rounded-full text-emerald-600 font-bold text-[10px] flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={12} /> Carregado
              </div>
            )}
            <input type="file" ref={billingInputRef} className="hidden" onChange={(e) => handleFileUpload(e, setBillingText)} />
          </div>
        </div>

        {/* Upload Bank */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">02. Extrato Bancário</span>
            {bankText && <button onClick={() => setBankText("")} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={16}/></button>}
          </div>
          <div 
            onClick={() => bankInputRef.current?.click()}
            className={`p-12 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-5 group ${bankText ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-50/50' : 'border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-300'}`}
          >
            <div className={`p-6 rounded-[1.8rem] transition-all group-hover:scale-110 ${bankText ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
              <Building size={40} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">Movimentação Bancária</h3>
              <p className="text-slate-400 text-xs mt-1">Extrato consolidado do mês</p>
            </div>
            {bankText && (
              <div className="bg-emerald-50 px-4 py-1.5 rounded-full text-emerald-600 font-bold text-[10px] flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={12} /> Carregado
              </div>
            )}
            <input type="file" ref={bankInputRef} className="hidden" onChange={(e) => handleFileUpload(e, setBankText)} />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={handleProcess}
          disabled={!billingText || !bankText || isProcessing}
          className="bg-[#1a1c1e] text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 shadow-2xl hover:bg-black active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} className="group-hover:animate-pulse text-amber-400" />}
          {isProcessing ? 'Auditoria em Curso...' : 'Conciliar com Gemini AI'}
        </button>
      </div>

      {result && (
        <section className="animate-fade-in pt-10">
           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-10">
              <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-8 gap-6">
                 <div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tighter">Resultado da Auditoria</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Dados processados via inteligência artificial</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={saveResults} className="flex-1 sm:flex-none flex items-center justify-center gap-3 text-white bg-indigo-600 font-black text-[11px] uppercase tracking-widest px-8 py-5 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                      <FileSpreadsheet size={18}/> Salvar e Ir para Dashboard
                    </button>
                    <button onClick={() => setResult(null)} className="p-5 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-500 transition-all">
                      <Trash2 size={24}/>
                    </button>
                 </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={18} /> Conciliados ({result.matches.length})
                    </span>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                      {result.matches.map((m: any, i: number) => (
                        <div key={i} className="p-6 bg-emerald-50/40 rounded-3xl border border-emerald-100 flex items-center justify-between hover:bg-emerald-50 transition-all group">
                          <div className="min-w-0 flex-1">
                            <span className="block font-black text-emerald-900 text-base truncate">{m.clientName}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{m.transactionDate}</span>
                               <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">Ref: {m.month}</span>
                            </div>
                          </div>
                          <div className="text-right pl-4">
                            <span className="block font-black text-emerald-600 text-xl leading-none mb-1">R$ {m.amount.toLocaleString('pt-BR')}</span>
                            <div className="w-full h-1 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                               <div className="h-full bg-emerald-500" style={{ width: `${Math.round(m.confidence * 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={18} /> Inadimplentes ({result.unmatchedBilling.length})
                    </span>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                      {result.unmatchedBilling.map((name: string, i: number) => (
                        <div key={i} className="p-6 bg-rose-50/40 rounded-3xl border border-rose-100 flex items-center justify-between hover:bg-rose-50 transition-all group">
                          <span className="font-black text-rose-900 text-base truncate pr-4">{name}</span>
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-rose-300 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {result.unmatchedBank?.length > 0 && (
                <div className="pt-10 border-t border-slate-50">
                  <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Info size={18} /> Recebimentos Avulsos ({result.unmatchedBank.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.unmatchedBank.map((bank: any, i: number) => (
                      <div key={i} className="p-6 bg-amber-50/40 rounded-[2rem] border border-amber-100 text-[10px] hover:bg-amber-50 transition-all">
                        <p className="font-bold text-amber-900 truncate mb-3">{bank.description}</p>
                        <div className="flex justify-between items-center font-black">
                           <span className="text-amber-400 uppercase tracking-widest">{bank.date}</span>
                           <span className="text-base text-amber-600">R$ {bank.amount.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </section>
      )}
    </div>
  );
};

export default Services;

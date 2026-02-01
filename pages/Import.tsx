
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Building, Zap, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { processReconciliation } from '../conciliationService';
import { storage } from '../storage';

const Import: React.FC = () => {
  const navigate = useNavigate();
  const [billingFile, setBillingFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billingInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods')) {
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          resolve(XLSX.utils.sheet_to_csv(worksheet));
        };
      } else {
        reader.onload = (e) => resolve(e.target?.result as string);
      }
      reader.onerror = reject;
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleConciliate = async () => {
    if (!billingFile || !bankFile) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const billingTxt = await readFileAsText(billingFile);
      const bankTxt = await readFileAsText(bankFile);
      
      const reconciledClients = await processReconciliation(billingTxt, bankTxt);
      storage.saveClients(reconciledClients);
      
      navigate('/');
    } catch (err) {
      setError("Falha no processamento. Verifique se os arquivos são válidos e sua chave de API.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-10">
      <header className="text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Conciliação Inteligente</h2>
        <p className="text-slate-400 font-medium mt-2">Carregue seus documentos para auditoria instantânea via IA.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Billing Upload */}
        <div className="space-y-4">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-2">01. Lista de Cobrança / Clientes</span>
          <div 
            onClick={() => billingInputRef.current?.click()}
            className={`p-10 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 group ${billingFile ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-50/50' : 'border-slate-200 bg-white/50 hover:bg-white hover:border-indigo-300'}`}
          >
            <div className={`p-6 rounded-[1.8rem] transition-all group-hover:scale-110 ${billingFile ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
              <FileText size={40} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">{billingFile ? billingFile.name : 'Base de Faturamento'}</h3>
              <p className="text-slate-400 text-xs mt-1">Excel, CSV ou TXT</p>
            </div>
            <input 
              type="file" 
              ref={billingInputRef} 
              className="hidden" 
              onChange={(e) => setBillingFile(e.target.files?.[0] || null)} 
              accept=".xlsx,.xls,.csv,.txt"
            />
          </div>
        </div>

        {/* Bank Upload */}
        <div className="space-y-4">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2">02. Extrato Bancário</span>
          <div 
            onClick={() => bankInputRef.current?.click()}
            className={`p-10 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 group ${bankFile ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-50/50' : 'border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-300'}`}
          >
            <div className={`p-6 rounded-[1.8rem] transition-all group-hover:scale-110 ${bankFile ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
              <Building size={40} />
            </div>
            <div>
              <h3 className="font-black text-slate-800">{bankFile ? bankFile.name : 'Movimentação do Banco'}</h3>
              <p className="text-slate-400 text-xs mt-1">Extrato consolidado</p>
            </div>
            <input 
              type="file" 
              ref={bankInputRef} 
              className="hidden" 
              onChange={(e) => setBankFile(e.target.files?.[0] || null)} 
              accept=".xlsx,.xls,.csv,.txt"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-600">
          <AlertCircle size={24} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-center pt-10">
        <button 
          onClick={handleConciliate}
          disabled={!billingFile || !bankFile || isProcessing}
          className="bg-[#1a1c1e] text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 shadow-2xl hover:bg-black active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} className="group-hover:animate-pulse text-amber-400" />}
          {isProcessing ? 'Auditando...' : 'Iniciar Conciliação IA'}
        </button>
      </div>
    </div>
  );
};

export default Import;

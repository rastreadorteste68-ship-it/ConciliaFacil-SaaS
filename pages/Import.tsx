
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Building, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  X, 
  AlertCircle, 
  Users, 
  ListOrdered,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { processReconciliation } from '../conciliationService';
import { storage } from '../storage';

interface PreviewData {
  headers: string[];
  rows: any[][];
  totalCount: number;
}

const Import: React.FC = () => {
  const navigate = useNavigate();
  const [billingFile, setBillingFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [billingPreview, setBillingPreview] = useState<PreviewData | null>(null);
  const [bankPreview, setBankPreview] = useState<PreviewData | null>(null);
  const [showAllBilling, setShowAllBilling] = useState(false);
  const [showAllBank, setShowAllBank] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billingInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  const parseFileForPreview = async (file: File): Promise<PreviewData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length > 0) {
            resolve({
              headers: (jsonData[0] || []).map(h => String(h)),
              rows: jsonData.slice(1),
              totalCount: jsonData.length - 1
            });
          } else {
            resolve({ headers: [], rows: [], totalCount: 0 });
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleBillingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBillingFile(file);
    if (file) {
      try {
        const preview = await parseFileForPreview(file);
        setBillingPreview(preview);
        setShowAllBilling(false);
      } catch (err) {
        console.error("Error parsing billing file", err);
        setError("Erro ao ler o arquivo de faturamento.");
      }
    } else {
      setBillingPreview(null);
    }
  };

  const handleBankUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBankFile(file);
    if (file) {
      try {
        const preview = await parseFileForPreview(file);
        setBankPreview(preview);
        setShowAllBank(false);
      } catch (err) {
        console.error("Error parsing bank file", err);
        setError("Erro ao ler o arquivo de extrato.");
      }
    } else {
      setBankPreview(null);
    }
  };

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
      console.error(err);
      setError("Falha no processamento de conciliação.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-10 animate-fade-in px-4">
      <header className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Preparar Conciliação</h2>
        <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
          Importe seus arquivos lado a lado para conferência antes do processamento inteligente.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lado Esquerdo: Faturamento */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">01. Base de Faturamento</span>
            {billingFile && (
              <button 
                onClick={() => { setBillingFile(null); setBillingPreview(null); }}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 font-bold text-xs"
              >
                <X size={14} /> Remover
              </button>
            )}
          </div>
          
          <div 
            onClick={() => billingInputRef.current?.click()}
            className={`p-10 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 group min-h-[220px] ${
              billingFile 
                ? 'border-indigo-500 bg-white shadow-lg shadow-indigo-100/50' 
                : 'border-slate-200 bg-white/50 hover:bg-white hover:border-indigo-300'
            }`}
          >
            <div className={`p-6 rounded-2xl transition-all group-hover:scale-110 ${billingFile ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}>
              <FileText size={32} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">{billingFile ? billingFile.name : 'Importar Faturamento'}</h3>
              <p className="text-slate-400 text-xs mt-1">Lista completa de clientes e valores esperados</p>
            </div>
            <input 
              type="file" 
              ref={billingInputRef} 
              className="hidden" 
              onChange={handleBillingUpload} 
              accept=".xlsx,.xls,.csv,.txt"
            />
          </div>

          {billingPreview && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col animate-slide-up">
              <div className="px-8 py-5 border-b border-slate-50 bg-indigo-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-indigo-600" />
                  <span className="font-black text-indigo-900 text-[10px] uppercase tracking-widest">Registros ({billingPreview.totalCount})</span>
                </div>
                <button 
                  onClick={() => setShowAllBilling(!showAllBilling)}
                  className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-white px-3 py-1.5 rounded-lg transition-all"
                >
                  {showAllBilling ? <><ChevronUp size={14}/> Recolher</> : <><Eye size={14}/> Ver Todos</>}
                </button>
              </div>
              <div className={`overflow-x-auto transition-all ${showAllBilling ? 'max-h-[500px]' : 'max-h-[300px]'}`}>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 sticky top-0 z-10">
                    <tr>
                      {billingPreview.headers.slice(0, 3).map((h, i) => (
                        <th key={i} className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllBilling ? billingPreview.rows : billingPreview.rows.slice(0, 10)).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                        {row.slice(0, 3).map((cell, j) => (
                          <td key={j} className="px-8 py-4 text-xs font-bold text-slate-700">{String(cell || '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Extrato */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">02. Extrato Bancário</span>
            {bankFile && (
              <button 
                onClick={() => { setBankFile(null); setBankPreview(null); }}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 font-bold text-xs"
              >
                <X size={14} /> Remover
              </button>
            )}
          </div>
          
          <div 
            onClick={() => bankInputRef.current?.click()}
            className={`p-10 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 group min-h-[220px] ${
              bankFile 
                ? 'border-emerald-500 bg-white shadow-lg shadow-emerald-100/50' 
                : 'border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-300'
            }`}
          >
            <div className={`p-6 rounded-2xl transition-all group-hover:scale-110 ${bankFile ? 'bg-emerald-600 text-white shadow-xl' : 'bg-slate-50 text-slate-300'}`}>
              <Building size={32} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">{bankFile ? bankFile.name : 'Importar Extrato'}</h3>
              <p className="text-slate-400 text-xs mt-1">Movimentações reais da conta bancária</p>
            </div>
            <input 
              type="file" 
              ref={bankInputRef} 
              className="hidden" 
              onChange={handleBankUpload} 
              accept=".xlsx,.xls,.csv,.txt"
            />
          </div>

          {bankPreview && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col animate-slide-up">
              <div className="px-8 py-5 border-b border-slate-50 bg-emerald-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ListOrdered size={18} className="text-emerald-600" />
                  <span className="font-black text-emerald-900 text-[10px] uppercase tracking-widest">Movimentações ({bankPreview.totalCount})</span>
                </div>
                <button 
                  onClick={() => setShowAllBank(!showAllBank)}
                  className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:bg-white px-3 py-1.5 rounded-lg transition-all"
                >
                  {showAllBank ? <><ChevronUp size={14}/> Recolher</> : <><Eye size={14}/> Ver Todos</>}
                </button>
              </div>
              <div className={`overflow-x-auto transition-all ${showAllBank ? 'max-h-[500px]' : 'max-h-[300px]'}`}>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 sticky top-0 z-10">
                    <tr>
                      {bankPreview.headers.slice(0, 3).map((h, i) => (
                        <th key={i} className="px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllBank ? bankPreview.rows : bankPreview.rows.slice(0, 10)).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                        {row.slice(0, 3).map((cell, j) => (
                          <td key={j} className="px-8 py-4 text-xs font-bold text-slate-700">{String(cell || '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] flex items-center gap-6 text-rose-600 animate-slide-up max-w-3xl mx-auto">
          <div className="p-4 bg-rose-100 rounded-2xl">
            <AlertCircle size={32} />
          </div>
          <div>
            <h4 className="font-black text-lg">Atenção</h4>
            <p className="font-bold text-sm opacity-80">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center pt-10 space-y-6">
        <button 
          onClick={handleConciliate}
          disabled={!billingFile || !bankFile || isProcessing}
          className="relative overflow-hidden bg-slate-900 text-white px-20 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.25em] text-sm flex items-center gap-6 shadow-2xl hover:bg-black active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          {isProcessing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Cruzando Dados...</span>
            </>
          ) : (
            <>
              <Zap size={24} className="group-hover:animate-pulse text-amber-400" />
              <span>Iniciar Conciliação IA</span>
            </>
          )}
          
          {isProcessing && (
            <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 animate-[progress_10s_ease-in-out_infinite]" style={{ width: '100%' }} />
          )}
        </button>
        
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <ArrowRightLeft size={12} />
          A IA cruzará nomes e valores para identificar pagamentos
        </p>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Import;

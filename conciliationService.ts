
import { GoogleGenAI, Type } from "@google/genai";
import { Client, MonthStatus } from './types';
import { storage } from './storage';
import * as XLSX from 'xlsx';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extrai nomes únicos do texto de faturamento para garantir que nenhum cliente seja esquecido.
 * Refinado para lidar com cabeçalhos e formatação CSV/Tabular de forma robusta.
 */
function extractAllClientNamesFromBilling(billingText: string): string[] {
  const lines = billingText.split(/\r?\n/);
  const names = new Set<string>();
  
  // Lista de palavras reservadas que não devem ser tratadas como clientes
  const blacklist = ['nome', 'cliente', 'razão social', 'billing', 'faturamento', 'total', 'valor', 'empresa'];
  
  lines.forEach(line => {
    // Tenta diferentes delimitadores comuns
    const parts = line.split(/[;,|\t]/);
    const candidate = parts[0]?.trim();
    
    if (candidate && 
        candidate.length > 2 && 
        !blacklist.includes(candidate.toLowerCase()) &&
        !/^\d+$/.test(candidate)) { // Ignora se for apenas números (ex: IDs sozinhos)
      names.add(candidate);
    }
  });
  
  const finalNames = Array.from(names);
  console.log(`Clientes extraídos do faturamento: ${finalNames.length}`);
  return finalNames;
}

export async function processReconciliation(billingText: string, bankText: string): Promise<Client[]> {
  const existingClients = storage.getClients();
  const allBillingNames = extractAllClientNamesFromBilling(billingText);
  
  const prompt = `
    ATUE COMO AUDITOR FINANCEIRO IA.
    
    TAREFA:
    Analise o EXTRATO BANCÁRIO e identifique pagamentos para os clientes listados na COBRANÇA.
    
    REGRAS CRÍTICAS:
    1. Se houver match entre um nome no extrato e um cliente, retorne os detalhes do pagamento.
    2. Realize match semântico (ex: "J. Silva" no banco = "João Silva" na cobrança).
    3. Retorne APENAS os matches encontrados. 
    4. NÃO ignore clientes, mas foque em encontrar os créditos no extrato.

    FORMATO DE RETORNO (JSON):
    [
      {
        "nameInBilling": "Nome Exato como aparece na lista de cobrança",
        "months": [
          { "month": 2, "year": 2026, "status": "PAID", "paymentDates": ["2026-02-05"], "amount": 450.0 }
        ]
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: prompt },
        { text: `LISTA DE COBRANÇA:\n${billingText}` },
        { text: `EXTRATO BANCÁRIO:\n${bankText}` }
      ],
      config: { responseMimeType: "application/json" }
    });

    const matches = JSON.parse(response.text || "[]");
    
    // CONSTRUÇÃO DA LISTA FINAL (REGRA DE ENRIQUECIMENTO)
    // Usamos allBillingNames como base para garantir que TODOS os 47+ apareçam
    const finalClients: Client[] = allBillingNames.map(name => {
      // 1. Procura se já existia na base local
      const original = existingClients.find(c => c.name.toLowerCase() === name.toLowerCase());
      
      // 2. Procura se a IA achou pagamento agora
      const aiMatch = matches.find((m: any) => m.nameInBilling.toLowerCase() === name.toLowerCase());
      
      // 3. Mescla meses (Mantém manuais, atualiza com novos da IA)
      const currentMonths: MonthStatus[] = original?.months || [];
      const newAiMonths: MonthStatus[] = aiMatch?.months || [];
      
      const mergedMonths = [...currentMonths];
      
      newAiMonths.forEach(newM => {
        const idx = mergedMonths.findIndex(m => m.month === newM.month && m.year === newM.year);
        if (idx !== -1) {
          // Só sobrescreve se não for marcação manual
          if (mergedMonths[idx].status !== 'MANUAL_PAID') {
            mergedMonths[idx] = { ...newM, source: 'ai' };
          }
        } else {
          mergedMonths.push({ ...newM, source: 'ai' });
        }
      });

      return {
        id: original?.id || crypto.randomUUID(),
        name: name,
        startDate: original?.startDate || "2025-01",
        expectedAmount: original?.expectedAmount || 450,
        months: mergedMonths,
        progress: 0
      };
    });

    return finalClients;
  } catch (error) {
    console.error("Erro na conciliação:", error);
    // Em caso de erro na IA, retornamos a lista de nomes apenas (sem novos pagamentos) 
    return allBillingNames.map(name => {
      const original = existingClients.find(c => c.name.toLowerCase() === name.toLowerCase());
      return {
        id: original?.id || crypto.randomUUID(),
        name: name,
        startDate: original?.startDate || "2025-01",
        expectedAmount: original?.expectedAmount || 450,
        months: original?.months || [],
        progress: 0
      };
    });
  }
}

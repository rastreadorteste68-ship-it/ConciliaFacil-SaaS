
import { GoogleGenAI, Type } from "@google/genai";
import { Client, MonthStatus } from './types';
import { storage } from './storage';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function processReconciliation(billingText: string, bankText: string): Promise<Client[]> {
  const existingClients = storage.getClients();
  const clientsContext = existingClients.map(c => ({ id: c.id, name: c.name, startDate: c.startDate }));

  const prompt = `
    Atue como Especialista em Auditoria de Fluxo de Caixa.
    
    DADOS DO CONTEXTO (CLIENTES JÁ EXISTENTES):
    ${JSON.stringify(clientsContext)}

    TAREFA:
    Conciliar faturamento esperado com extrato bancário.
    
    REGRAS:
    1. EXTRATO: Analise APENAS entradas de crédito (depósitos, PIX recebidos). IGNORE débitos.
    2. MATCH: Use similaridade para associar entradas do extrato aos clientes da lista acima.
    3. DATA INÍCIO: Se um pagamento for detectado ANTES da 'startDate' do cliente, ignore-o para este relatório de auditoria.
    4. COMPETÊNCIA: Gere os status apenas para os meses em que o cliente já estava ativo (mês/ano >= startDate).
    
    RETORNE UM ARRAY JSON contendo os dados conciliados apenas para os clientes identificados:
    {
      "clientId": "id do contexto",
      "months": [
        { "month": 1-12, "year": 2024-2026, "status": "PAID", "paymentDates": ["YYYY-MM-DD"], "amount": 0.0 }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: prompt },
        { text: `EXTRATO BANCÁRIO:\n${bankText}` }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiMatches = JSON.parse(response.text || "[]");
    
    // Merge AI results with storage
    const updatedClients = existingClients.map(client => {
      const match = aiMatches.find((m: any) => m.clientId === client.id);
      if (match) {
        // Only update months that are NOT manually paid and satisfy startDate
        const newMonths = [...client.months];
        match.months.forEach((aiMonth: MonthStatus) => {
          const existingIdx = newMonths.findIndex(m => m.month === aiMonth.month && m.year === aiMonth.year);
          if (existingIdx !== -1) {
            if (newMonths[existingIdx].status !== 'MANUAL_PAID') {
              newMonths[existingIdx] = { ...aiMonth, source: 'ai' };
            }
          } else {
             newMonths.push({ ...aiMonth, source: 'ai' });
          }
        });
        return { ...client, months: newMonths };
      }
      return client;
    });

    return updatedClients;
  } catch (error) {
    console.error("Erro na conciliação estratégica:", error);
    throw error;
  }
}

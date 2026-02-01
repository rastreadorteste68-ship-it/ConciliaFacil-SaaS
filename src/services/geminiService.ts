
import { GoogleGenAI, Type } from "@google/genai";

export const reconcileData = async (billingText: string, bankText: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    Você é um Auditor Financeiro Sênior e Especialista em Conciliação IA.
    SUA TAREFA: Comparar duas listas:
    1. FATURAMENTO ESPERADO (Clientes que deveriam pagar).
    2. EXTRATO BANCÁRIO (Depósitos reais recebidos).

    REGRAS DE CONCILIAÇÃO SEMÂNTICA:
    - Ignore erros de digitação, abreviações (LTDA vs Limitada) e nomes invertidos.
    - Se encontrar um pagamento no extrato para um cliente do faturamento, marque como 'matches'.
    - Extraia a competência (mês/ano) do pagamento.
    - Se um cliente do faturamento não tiver depósito correspondente, liste em 'unmatchedBilling'.

    IMPORTANTE: 
    Para cada match, identifique o mês (formato YYYY-MM) ao qual o pagamento se refere.
    Retorne estritamente o JSON seguindo o schema fornecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        DADOS DE FATURAMENTO:
        ${billingText}

        DADOS DE EXTRATO BANCÁRIO:
        ${bankText}
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clientName: { type: Type.STRING },
                  transactionDate: { type: Type.STRING, description: "Data do depósito no extrato" },
                  month: { type: Type.STRING, description: "Mês de competência YYYY-MM" },
                  amount: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER }
                },
                required: ["clientName", "transactionDate", "month", "amount", "confidence"]
              }
            },
            unmatchedBilling: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            unmatchedBank: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  date: { type: Type.STRING }
                },
                required: ["description", "amount", "date"]
              }
            }
          },
          required: ["matches", "unmatchedBilling", "unmatchedBank"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Reconciliation Error:", error);
    return null;
  }
};

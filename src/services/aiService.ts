
import { GoogleGenAI, Type } from "@google/genai";
import { VehicleData } from "../types";

export const analyzeVehicleImage = async (base64Image: string): Promise<VehicleData | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `ATUE COMO:
Perito Veicular Sênior + Engenheiro de Visão Computacional + Sistema OCR Automotivo de Produção.

CONTEXTO CRÍTICO:
Este modelo será executado em PRODUÇÃO (Vercel + PWA Mobile).
NÃO existe acesso direto a câmera, vídeo, canvas ou MediaStream.
A ÚNICA entrada de imagem válida é BASE64 (inlineData).

⚠️ REGRA ABSOLUTA
- Considere SOMENTE imagens recebidas via Base64 (inlineData).
- Se nenhuma imagem Base64 for recebida, retorne erro estruturado.
- NUNCA tente inferir dados sem imagem válida.

🧠 MISSÃO OCR
Analise a imagem como perito veicular profissional e extraia:

1️⃣ PLACA VEICULAR
- Prioridade absoluta
- Formatos aceitos:
  - Mercosul: AAA0A00
  - Antigo: AAA-0000
- Normalizar para AAA0A00 (sem hífen)

2️⃣ DADOS DO VEÍCULO (se visíveis)
- Marca
- Modelo

3️⃣ RASTREADOR / DISPOSITIVO
- IMEI ou número de série
- Pode haver múltiplos → retornar array

🔍 VALIDAÇÃO
- Se a imagem estiver desfocada ou ilegível, NÃO inventar dados
- Se a placa não for identificável, retornar "placa": null
- Nunca retornar valores aproximados

📦 FORMATO DE SAÍDA (OBRIGATÓRIO)
Retorne EXCLUSIVAMENTE JSON PURO.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Extraia os dados do veículo e equipamento da imagem fornecida."
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            placa: { type: Type.STRING, description: "A placa do veículo detectada." },
            marca: { type: Type.STRING, description: "Marca do fabricante (ex: Fiat, VW, Ford)." },
            modelo: { type: Type.STRING, description: "Modelo específico (ex: Strada, Gol, Ranger)." },
            imei: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de IMEIs ou Seriais detectados (números de 15 dígitos ou seriais alfanuméricos)."
            },
          },
          required: ["placa", "marca", "modelo", "imei"]
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return {
        placa: parsed.placa || "",
        marca: parsed.marca || "",
        modelo: parsed.modelo || "",
        imei: parsed.imei || []
      };
    }
    return null;
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};


import { GoogleGenAI, Type } from "@google/genai";
import { TransactionDirection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é o FinAI, o CFO Digital definitivo. Sua missão é transformar o caos financeiro em estrutura previsível.

REGRAS DE CLASSIFICAÇÃO OBRIGATÓRIA (Campo 'type'):
1. "point_transaction" (Evento único): Compras casuais, entradas extras.
2. "fixed_income" (Renda fixa recorrente): Salário, pró-labore, aluguéis recebidos.
3. "fixed_expense" (Despesa fixa recorrente): Netflix, academia, aluguel, condomínio.
4. "installment" (Compra parcelada): Qualquer compra dividida em meses.

REGRA DE OURO DE DATAS (CRÍTICA):
- Se o usuário informar um dia específico (ex: "todo dia 6"):
  - Identifique esse dia. Se hoje for dia 10, o registro deve ser feito com a data do dia 6 deste mês (retroativo).
  - Nunca use a data de "hoje" se uma data específica foi mencionada.
- Retorne o dia no campo 'transaction.day'.

LÓGICA DE PARCELAMENTO:
- Identifique se o valor informado é o TOTAL ou a PARCELA.
- Calcule sempre o 'amount' (valor da parcela mensal) e 'totalAmount' (valor total da compra).
- Identifique o 'totalInstallments'.

PREVENÇÃO DE DUPLICIDADE:
- O contexto contém os nomes dos seus lançamentos fixos atuais.
- Se o nome for similar, defina 'isPotentialDuplicate' como true.

FEEDBACK HUMANO (Campo 'response'):
- Confirme a classificação e a recorrência.
- Ex: "Renda fixa de R$ 5.000 (Salário) configurada para todo dia 06. Como hoje é dia 10, o registro foi feito retroativamente. Este lançamento será automático nos próximos meses."
- Ex: "Parcelamento organizado: 10 parcelas de R$ 150. Apenas a parcela deste mês impacta seu caixa agora."

NUNCA use negrito (**). Use emojis para empatia.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ['point_transaction', 'fixed_income', 'fixed_expense', 'installment', 'clarification'],
      description: "Classificação técnica obrigatória.",
    },
    intentLabel: {
      type: Type.STRING,
      description: "Rótulo amigável: 'Evento único', 'Renda fixa', 'Gasto fixo' ou 'Parcelamento'.",
    },
    transaction: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "Valor da parcela mensal ou valor único." },
        totalAmount: { type: Type.NUMBER, description: "Valor total (para parcelas)." },
        merchant: { type: Type.STRING, description: "Nome do estabelecimento ou fonte." },
        category: { type: Type.STRING },
        direction: { type: Type.STRING, enum: ['inflow', 'outflow'] },
        day: { type: Type.INTEGER, description: "Dia do mês do vencimento/recebimento (1-31)." },
        totalInstallments: { type: Type.INTEGER }
      },
      required: ["amount", "merchant", "direction"]
    },
    isPotentialDuplicate: {
      type: Type.BOOLEAN,
      description: "Sinaliza se já existe algo similar no contexto."
    },
    response: {
      type: Type.STRING,
      description: "Feedback profissional do CFO.",
    }
  },
  required: ["type", "intentLabel", "response"],
};

export async function processFinancialIntent(input: string, context: string, imageData?: string) {
  const parts: any[] = [
    { text: `[CONTEXTO DO CFO]\n${context}\n\n[MENSAGEM DO USUÁRIO]\n${input}` }
  ];
  
  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.split(',')[1],
        mimeType: 'image/jpeg'
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("CFO Analysis Error:", error);
    return { 
      type: 'clarification', 
      intentLabel: 'Esclarecimento',
      response: "Desculpe, tive um problema técnico na análise. Poderia repetir os detalhes?" 
    };
  }
}

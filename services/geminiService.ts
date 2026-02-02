
import { GoogleGenAI, Type } from "@google/genai";
import { TransactionDirection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

const SYSTEM_INSTRUCTION = `
VocÃª Ã© o FinAI, o CFO Digital definitivo. Sua missÃ£o Ã© transformar o caos financeiro em estrutura previsÃ­vel.

REGRAS DE CLASSIFICAÃÃO OBRIGATÃRIA (Campo 'type'):
1. "point_transaction" (Evento Ãºnico): Compras casuais, entradas extras.
2. "fixed_income" (Renda fixa recorrente): SalÃ¡rio, prÃ³-labore, aluguÃ©is recebidos.
3. "fixed_expense" (Despesa fixa recorrente): Netflix, academia, aluguel, condomÃ­nio.
4. "installment" (Compra parcelada): Qualquer compra dividida em meses.

REGRA DE OURO DE DATAS (CRÃTICA):
- Se o usuÃ¡rio informar um dia especÃ­fico (ex: "todo dia 6"):
  - Identifique esse dia. Se hoje for dia 10, o registro deve ser feito com a data do dia 6 deste mÃªs (retroativo).
  - Nunca use a data de "hoje" se uma data especÃ­fica foi mencionada.
- Retorne o dia no campo 'transaction.day'.

LÃGICA DE PARCELAMENTO:
- Identifique se o valor informado Ã© o TOTAL ou a PARCELA.
- Calcule sempre o 'amount' (valor da parcela mensal) e 'totalAmount' (valor total da compra).
- Identifique o 'totalInstallments'.

PREVENÃÃO DE DUPLICIDADE:
- O contexto contÃ©m os nomes dos seus lanÃ§amentos fixos atuais.
- Se o nome for similar, defina 'isPotentialDuplicate' como true.

FEEDBACK HUMANO (Campo 'response'):
- Confirme a classificaÃ§Ã£o e a recorrÃªncia.
- Ex: "Renda fixa de R$ 5.000 (SalÃ¡rio) configurada para todo dia 06. Como hoje Ã© dia 10, o registro foi feito retroativamente. Este lanÃ§amento serÃ¡ automÃ¡tico nos prÃ³ximos meses."
- Ex: "Parcelamento organizado: 10 parcelas de R$ 150. Apenas a parcela deste mÃªs impacta seu caixa agora."

NUNCA use negrito (**). Use emojis para empatia.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ['point_transaction', 'fixed_income', 'fixed_expense', 'installment', 'clarification'],
      description: "ClassificaÃ§Ã£o tÃ©cnica obrigatÃ³ria.",
    },
    intentLabel: {
      type: Type.STRING,
      description: "RÃ³tulo amigÃ¡vel: 'Evento Ãºnico', 'Renda fixa', 'Gasto fixo' ou 'Parcelamento'.",
    },
    transaction: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: "Valor da parcela mensal ou valor Ãºnico." },
        totalAmount: { type: Type.NUMBER, description: "Valor total (para parcelas)." },
        merchant: { type: Type.STRING, description: "Nome do estabelecimento ou fonte." },
        category: { type: Type.STRING },
        direction: { type: Type.STRING, enum: ['inflow', 'outflow'] },
        day: { type: Type.INTEGER, description: "Dia do mÃªs do vencimento/recebimento (1-31)." },
        totalInstallments: { type: Type.INTEGER }
      },
      required: ["amount", "merchant", "direction"]
    },
    isPotentialDuplicate: {
      type: Type.BOOLEAN,
      description: "Sinaliza se jÃ¡ existe algo similar no contexto."
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
    { text: `[CONTEXTO DO CFO]\n${context}\n\n[MENSAGEM DO USUÃRIO]\n${input}` }
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
      response: "Desculpe, tive um problema tÃ©cnico na anÃ¡lise. Poderia repetir os detalhes?" 
    };
  }
}

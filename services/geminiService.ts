
import { GoogleGenAI } from "@google/genai";
import { PayrollData, CompanyData } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um assistente especialista em Folha de Pagamento, Gestão de RH e Análise Gerencial.
Sua tarefa é analisar os dados de custos e headcount fornecidos e gerar um relatório estratégico para a diretoria.
Identifique tendências, anomalias, oportunidades de otimização de custos e eficiência operacional.
Fale diretamente sobre a empresa mencionada.
Use um tom executivo, objetivo e baseado em dados.
Aponte variações significativas entre os meses e sugira ações práticas como:
- Alinhamento de turnover.
- Impacto de encargos e provisões.
- Proporção entre CLT e contratos externos (PJ/Comissões).
- Tendências de aumento de custo per capita.
`;

export const analyzePayroll = async (data: PayrollData[], company: CompanyData): Promise<string> => {
  try {
    // Inicialização utilizando a variável de ambiente process.env.API_KEY conforme diretriz
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Formatação rica dos dados para o prompt
    const formattedData = data.map(d => 
      `Competência: ${d.monthYear} | Custo Total: R$ ${d.totalValue.toLocaleString('pt-BR')} | Efetivos: ${d.effectiveCount} (Custo: R$ ${d.effectiveValue.toLocaleString('pt-BR')}) | PJ: ${d.contractedCount} (Custo: R$ ${d.contractedValue.toLocaleString('pt-BR')}) | Comissionados: ${d.commissionedCount} (Custo: R$ ${d.commissionedValue.toLocaleString('pt-BR')})`
    ).join('\n');

    const prompt = `
      EMPRESA: ${company.name}
      CNPJ: ${company.cnpj}
      
      DADOS HISTÓRICOS PARA ANÁLISE:
      ${formattedData}
      
      POR FAVOR, ELABORE UMA ANÁLISE ESTRATÉGICA DETALHADA EM FORMATO MARKDOWN.
    `;

    // Utilizando o modelo Gemini 3 Pro para análise de alta qualidade
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 2000 } // Permite que o modelo realize raciocínio complexo
      },
    });

    return response.text || "A IA processou os dados, mas não retornou um relatório válido. Tente novamente.";
  } catch (error: any) {
    console.error("Erro na análise Gemini:", error);
    
    // Mensagem amigável para erro de API Key
    if (error.message?.toLowerCase().includes('api key') || error.message?.toLowerCase().includes('api_key')) {
      return "⚠️ Configuração Pendente: A chave de acesso à IA não foi localizada ou não está ativa no projeto.";
    }

    // Erro de Cota
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return "⚠️ Limite de Uso: O volume de requisições de IA foi excedido. Por favor, aguarde um minuto e tente novamente.";
    }

    throw new Error(`Erro técnico na IA: ${error.message}`);
  }
};

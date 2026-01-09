
import { GoogleGenAI } from "@google/genai";
import { PayrollData } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um assistente especialista em Folha de Pagamento, Gestão de RH e Análise Gerencial Estratégica.
O usuário fornecerá dados detalhados por tipo de vínculo: Efetivos, Contratados e Comissionados.

DADOS QUE SERÃO FORNECIDOS
Para cada mês: Mês/Ano, Quantidade e Custo Total por categoria (Efetivos, Contratados, Comissionados).

SUA FUNÇÃO: Análise Profunda
1. Calcular custo médio por colaborador GERAL e por CATEGORIA.
2. Analisar o Mix de Vínculos: Quem custa mais proporcionalmente? Onde está o maior peso da folha?
3. Evolução e Tendências: Comparar o crescimento dos custos vs. crescimento do headcount.
4. Sugerir otimizações: (Ex: Se o custo de comissionados subir sem aumento de receita - inferido, ou se o custo de contratados externos estiver superando o de efetivos).

FORMATO DA RESPOSTA (Markdown Profissional)
- Resumo Executivo Financeiro.
- Análise de Eficiência por Vínculo (Custo Médio Segmentado).
- Evolução e Tendência da Folha.
- Conclusão Gerencial Estratégica (Insights de ROI e sugestões de gestão).

REGRAS:
- Linguagem executiva, clara e focada em resultados.
- Não invente dados.
- Foco em gestão financeira de RH.
`;

export const analyzePayroll = async (data: PayrollData[]): Promise<string> => {
  // Use process.env.API_KEY directly as required by guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const formattedData = data.map(d => 
    `Mês/Ano: ${d.monthYear}
    - Efetivos: ${d.effectiveCount} colab. | Custo: R$ ${d.effectiveValue.toLocaleString('pt-BR')}
    - Contratados: ${d.contractedCount} colab. | Custo: R$ ${d.contractedValue.toLocaleString('pt-BR')}
    - Comissionados: ${d.commissionedCount} colab. | Custo: R$ ${d.commissionedValue.toLocaleString('pt-BR')}
    - TOTAL: R$ ${d.totalValue.toLocaleString('pt-BR')}`
  ).join('\n\n');

  const prompt = `Analise detalhadamente os seguintes dados de folha segmentada por vínculo:\n\n${formattedData}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    // Access .text property directly
    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    throw new Error("Falha na comunicação com o especialista de IA.");
  }
};

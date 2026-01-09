
import { GoogleGenAI } from "@google/genai";
import { PayrollData, CompanyData } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um assistente especialista em Folha de Pagamento, Gestão de RH e Análise Gerencial Estratégica.
O usuário fornecerá dados detalhados por tipo de vínculo: Efetivos, Contratados e Comissionados de uma empresa específica.

SUA FUNÇÃO: Análise Profunda Vinculada ao Perfil da Empresa
1. Analisar os custos considerando o nome e contexto (CNPJ) fornecido.
2. Calcular custo médio por colaborador GERAL e por CATEGORIA.
3. Analisar o Mix de Vínculos: Quem custa mais proporcionalmente? Onde está o maior peso da folha?
4. Evolução e Tendências: Comparar o crescimento dos custos vs. crescimento do headcount entre os meses.
5. Sugerir otimizações personalizadas para o contexto gerencial da empresa em questão.

FORMATO DA RESPOSTA (Markdown Profissional)
- # Análise Estratégica: [Nome da Empresa]
- Resumo Executivo Financeiro.
- Análise de Eficiência por Vínculo (Custo Médio Segmentado).
- Evolução e Tendência da Folha.
- Conclusão Gerencial Estratégica (Insights de ROI e sugestões de gestão).

REGRAS:
- Linguagem executiva, clara e focada em resultados.
- Não invente dados.
- Refira-se à empresa pelo nome quando apropriado para gerar proximidade gerencial.
`;

export const analyzePayroll = async (data: PayrollData[], company: CompanyData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const formattedData = data.map(d => 
    `Mês/Ano: ${d.monthYear}
    - Efetivos: ${d.effectiveCount} colab. | Custo: R$ ${d.effectiveValue.toLocaleString('pt-BR')}
    - Contratados: ${d.contractedCount} colab. | Custo: R$ ${d.contractedValue.toLocaleString('pt-BR')}
    - Comissionados: ${d.commissionedCount} colab. | Custo: R$ ${d.commissionedValue.toLocaleString('pt-BR')}
    - TOTAL: R$ ${d.totalValue.toLocaleString('pt-BR')}`
  ).join('\n\n');

  const prompt = `
  EMPRESA: ${company.name}
  CNPJ: ${company.cnpj}

  DADOS HISTÓRICOS:
  ${formattedData}
  
  Por favor, realize a análise gerencial para esta empresa específica.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    throw new Error("Falha na comunicação com o especialista de IA.");
  }
};


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LabelList } from 'recharts';
import { PayrollData, CompanyData } from '../types';
import { FileText, TrendingUp, AlertCircle, Loader2, ArrowRightLeft, BrainCircuit, Users, DollarSign, Image as ImageIcon, FileDown, Building2, Sparkles, RefreshCw, Table as TableIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalysisViewProps {
  data: PayrollData[];
  analysis: string;
  isGenerating: boolean;
  error?: string;
  activeCompany?: CompanyData | null;
  onGenerateAnalysis: () => void;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b']; 

const AnalysisView: React.FC<AnalysisViewProps> = ({ data, analysis, isGenerating, error, activeCompany, onGenerateAnalysis }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [monthAId, setMonthAId] = useState<string>('');
  const [monthBId, setMonthBId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Ordenação cronológica para a planilha
  const sortedData = useMemo(() => {
    const monthOrder: { [key: string]: number } = {
      'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
      'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12, '13º': 13
    };

    return [...data].sort((a, b) => {
      const [mA, yA] = a.monthYear.split('/');
      const [mB, yB] = b.monthYear.split('/');
      if (yA !== yB) return Number(yA) - Number(yB);
      return (monthOrder[mA] || 0) - (monthOrder[mB] || 0);
    });
  }, [data]);

  // Cálculos de Totais para a Planilha
  const grandTotals = useMemo(() => {
    return sortedData.reduce((acc, curr) => {
      const count = (curr.effectiveCount || 0) + (curr.contractedCount || 0) + (curr.commissionedCount || 0);
      return {
        count: acc.count + count,
        value: acc.value + (curr.totalValue || 0)
      };
    }, { count: 0, value: 0 });
  }, [sortedData]);

  useEffect(() => {
    if (data.length >= 2) {
      setMonthAId(data[data.length - 2].id);
      setMonthBId(data[data.length - 1].id);
    } else if (data.length === 1) {
      setMonthBId(data[0].id);
    }
  }, [data]);

  const exportAsImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `dashboard_${activeCompany?.name || 'empresa'}.jpg`;
      link.click();
    } catch (err) {} finally { setIsExporting(false); }
  };

  const exportAsPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard_${activeCompany?.name || 'empresa'}.pdf`);
    } catch (err) {} finally { setIsExporting(false); }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
        <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-2xl font-black text-slate-900">Seu Dashboard Estratégico</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2 font-medium">Lance os dados da folha para visualizar indicadores e IA.</p>
      </div>
    );
  }

  const monthA = data.find(d => d.id === monthAId);
  const monthB = data.find(d => d.id === monthBId);
  const getDiff = (valA: number, valB: number) => valA ? ((valB - valA) / valA) * 100 : 0;
  const labelA = monthA?.monthYear || 'A';
  const labelB = monthB?.monthYear || 'B';

  const compData = [
    { name: 'Efetivos', [labelA]: monthA?.effectiveValue || 0, [labelB]: monthB?.effectiveValue || 0 },
    { name: 'Contratados', [labelA]: monthA?.contractedValue || 0, [labelB]: monthB?.contractedValue || 0 },
    { name: 'Comissionados', [labelA]: monthA?.commissionedValue || 0, [labelB]: monthB?.commissionedValue || 0 },
  ];

  const pieData = monthB ? [
    { name: 'Efetivos', value: monthB.effectiveValue },
    { name: 'Contratados', value: monthB.contractedValue },
    { name: 'Comissionados', value: monthB.commissionedValue },
  ] : [];

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Controles do Dashboard */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6 justify-between no-print">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Estratégia & BI</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comparativo de Períodos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <select value={monthAId} onChange={(e) => setMonthAId(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none cursor-pointer">
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
            <span className="text-slate-400 font-black text-sm italic">vs</span>
            <select value={monthBId} onChange={(e) => setMonthBId(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none cursor-pointer">
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
          </div>
          <div className="flex gap-2 border-l border-slate-200 pl-4">
            <button onClick={exportAsImage} title="Exportar Imagem" className="p-2.5 text-slate-500 hover:text-blue-600 transition-all"><ImageIcon className="w-5 h-5" /></button>
            <button onClick={exportAsPDF} title="Exportar PDF" className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all"><FileDown className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      {monthA && monthB && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-8 border-l-blue-600">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <DollarSign className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Folha Total</span>
            </div>
            <p className="text-2xl lg:text-3xl font-black text-slate-900">R$ {monthB.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black mt-3 ${getDiff(monthA.totalValue, monthB.totalValue) > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {getDiff(monthA.totalValue, monthB.totalValue) > 0 ? '↑' : '↓'} {Math.abs(getDiff(monthA.totalValue, monthB.totalValue)).toFixed(2)}% 
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-8 border-l-emerald-500">
            <div className="flex items-center gap-3 text-emerald-500 mb-4">
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Headcount</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount}</p>
            <div className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Δ {(monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) - (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount)} PESSOAS
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-8 border-l-amber-500">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ticket Médio</span>
            </div>
            <p className="text-3xl font-black text-slate-900">R$ {(monthB.totalValue / (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest">Investimento p/ Pessoa</p>
          </div>
        </div>
      )}

      {/* Gráficos e Mix de Investimento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase mb-6 tracking-widest border-b border-slate-100 pb-3">Comparativo Selecionado</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="800" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Bar dataKey={labelA} fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={40}>
                   <LabelList dataKey={labelA} position="top" formatter={(val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} style={{ fontSize: '10px', fontWeight: '800', fill: '#64748b' }} />
                </Bar>
                <Bar dataKey={labelB} fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40}>
                   <LabelList dataKey={labelB} position="top" formatter={(val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} style={{ fontSize: '10px', fontWeight: '800', fill: '#1e40af' }} />
                </Bar>
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase mb-6 tracking-widest border-b border-slate-100 pb-3 text-center">Mix de Investimento Atual</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Planilha de Análise Evolutiva (Agora abaixo dos gráficos) */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TableIcon className="w-6 h-6 text-blue-400" />
            <h3 className="font-black text-sm uppercase tracking-[0.2em]">Planilha de Performance Evolutiva</h3>
          </div>
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Análise Longitudinal de Fluxo</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Competência</th>
                <th className="px-8 py-5 text-center">Qtd Total</th>
                <th className="px-8 py-5 text-center">Var. Qtd (%)</th>
                <th className="px-8 py-5 text-right">Valor Total (R$)</th>
                <th className="px-8 py-5 text-right">Var. Valor (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map((item, index) => {
                const prevItem = index > 0 ? sortedData[index - 1] : null;
                const totalCount = (item.effectiveCount || 0) + (item.contractedCount || 0) + (item.commissionedCount || 0);
                const prevTotalCount = prevItem ? (prevItem.effectiveCount || 0) + (prevItem.contractedCount || 0) + (prevItem.commissionedCount || 0) : 0;
                
                const varQty = prevTotalCount ? ((totalCount - prevTotalCount) / prevTotalCount) * 100 : 0;
                const varVal = prevItem ? ((item.totalValue - prevItem.totalValue) / prevItem.totalValue) * 100 : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-black text-slate-900 uppercase italic tracking-tighter">{item.monthYear}</td>
                    <td className="px-8 py-5 text-center font-bold text-slate-700">{totalCount}</td>
                    <td className={`px-8 py-5 text-center font-black text-xs ${varQty > 0 ? 'text-red-600' : varQty < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {index > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {varQty > 0 ? <ArrowUpRight className="w-3 h-3" /> : varQty < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {varQty.toFixed(2)}%
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={`px-8 py-5 text-right font-black text-xs ${varVal > 0 ? 'text-red-600' : varVal < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {index > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          {varVal > 0 ? <ArrowUpRight className="w-3 h-3" /> : varVal < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          {varVal.toFixed(2)}%
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-900">
                <td className="px-8 py-5 font-black text-slate-900 uppercase">TOTAL</td>
                <td className="px-8 py-5 text-center font-black text-slate-900">{grandTotals.count}</td>
                <td className="px-8 py-5 text-center"></td>
                <td className="px-8 py-5 text-right font-black text-slate-900">R$ {grandTotals.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-8 py-5 text-right"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Seção de Análise IA */}
      <div className="space-y-6">
        {!analysis && !isGenerating && (
          <div className="bg-slate-900 p-12 rounded-[2.5rem] border border-slate-800 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-600 p-5 rounded-3xl mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Análise Estratégica AI</h3>
              <p className="text-slate-400 mt-2 max-w-lg mx-auto font-medium text-lg">Clique no botão abaixo para que nossa inteligência artificial processe os dados da folha e gere um relatório executivo detalhado.</p>
              <button 
                onClick={onGenerateAnalysis}
                className="mt-10 px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl flex items-center gap-3 transition-all shadow-xl shadow-blue-600/30 active:scale-95"
              >
                <Sparkles className="w-6 h-6" /> GERAR ANÁLISE COMPLETA
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="bg-white p-16 rounded-[2.5rem] border border-slate-200 text-center shadow-sm flex flex-col items-center">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 uppercase">Processando Inteligência de RH</h3>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-2 animate-pulse">Cruzando dados e tendências do mercado...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-8 rounded-2xl flex items-start gap-4 text-red-700 border border-red-200">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div><h3 className="font-black text-lg uppercase">Falha na Análise</h3><p className="text-sm font-medium opacity-90">{error}</p></div>
          </div>
        )}

        {analysis && (
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="bg-slate-900 p-4 rounded-2xl shadow-lg">
                  <BrainCircuit className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Relatório IA de RH</h2>
                  <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.3em] mt-1">Gestão Estratégica de Capital Humano</p>
                </div>
              </div>
              <button 
                onClick={onGenerateAnalysis}
                className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg hover:bg-blue-50 transition-all no-print"
              >
                <RefreshCw className="w-3 h-3" /> Atualizar Análise
              </button>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 relative z-10 text-sm md:text-base leading-relaxed font-medium">
              {analysis.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed === '') return <div key={i} className="h-4" />;
                if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-slate-900 mt-10 mb-6 border-l-8 border-blue-700 pl-4 uppercase tracking-tight">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-black text-slate-800 mt-8 mb-4 flex items-center gap-3"><span className="w-2 h-6 bg-blue-600 rounded-full" />{line.replace('## ', '')}</h2>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-6 list-disc mb-3 marker:text-blue-600 font-bold">{line.substring(2)}</li>;
                if (line.startsWith('🔹') || line.startsWith('✅') || line.startsWith('🚀') || line.startsWith('💡')) return <div key={i} className="my-6 p-6 bg-slate-900 text-white rounded-2xl border-l-8 border-l-blue-600 font-black text-sm leading-relaxed">{line}</div>;
                return <p key={i} className="mb-4">{line}</p>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;

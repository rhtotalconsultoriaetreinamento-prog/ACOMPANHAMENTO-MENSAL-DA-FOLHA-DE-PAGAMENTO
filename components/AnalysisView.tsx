
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LabelList } from 'recharts';
import { PayrollData, CompanyData } from '../types';
import { FileText, TrendingUp, AlertCircle, Loader2, ArrowRightLeft, BrainCircuit, Users, DollarSign, Image as ImageIcon, FileDown, Building2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalysisViewProps {
  data: PayrollData[];
  analysis: string;
  isGenerating: boolean;
  error?: string;
  activeCompany?: CompanyData | null;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b']; 

const AnalysisView: React.FC<AnalysisViewProps> = ({ data, analysis, isGenerating, error, activeCompany }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [monthAId, setMonthAId] = useState<string>('');
  const [monthBId, setMonthBId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

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
    } catch (err) {
      console.error("Erro ao exportar imagem:", err);
    } finally {
      setIsExporting(false);
    }
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
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-xl font-black text-slate-900 tracking-tight">Processando Análise de IA...</p>
        <p className="text-slate-400 mt-1 font-bold uppercase text-[10px] tracking-widest">Gerando relatório estratégico</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-2xl flex items-start gap-4 text-red-700 border border-red-200">
        <AlertCircle className="w-8 h-8 shrink-0" />
        <div>
          <h3 className="font-black text-lg uppercase">Falha na Análise</h3>
          <p className="text-sm font-medium opacity-90">{error}</p>
        </div>
      </div>
    );
  }

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

  const getDiff = (valA: number, valB: number) => {
    if (!valA) return 0;
    return ((valB - valA) / valA) * 100;
  };

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

  const totalQtdA = monthA ? (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount) : 0;
  const totalQtdB = monthB ? (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) : 0;
  const totalValA = monthA ? monthA.totalValue : 0;
  const totalValB = monthB ? monthB.totalValue : 0;
  const totalVarPercent = getDiff(totalValA, totalValB);

  const formatCurrencyLabel = (value: number) => {
    return `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toLocaleString('pt-BR')}`;
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Controles de Comparação e Exportação */}
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
            <select 
              value={monthAId} 
              onChange={(e) => setMonthAId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none cursor-pointer"
            >
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
            <span className="text-slate-400 font-black text-sm italic">vs</span>
            <select 
              value={monthBId} 
              onChange={(e) => setMonthBId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black outline-none cursor-pointer"
            >
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
          </div>

          <div className="flex gap-2 border-l border-slate-200 pl-4">
            <button onClick={exportAsImage} className="p-2.5 text-slate-500 hover:text-blue-600 transition-all"><ImageIcon className="w-5 h-5" /></button>
            <button onClick={exportAsPDF} className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all"><FileDown className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {monthA && monthB && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-8 border-l-blue-600">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <DollarSign className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Folha Total</span>
            </div>
            <p className="text-3xl font-black text-slate-900">R$ {monthB.totalValue.toLocaleString('pt-BR')}</p>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black mt-3 ${getDiff(monthA.totalValue, monthB.totalValue) > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {getDiff(monthA.totalValue, monthB.totalValue) > 0 ? '↑' : '↓'} {Math.abs(getDiff(monthA.totalValue, monthB.totalValue)).toFixed(1)}% 
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
            <p className="text-3xl font-black text-slate-900">R$ {(monthB.totalValue / (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest">Investimento p/ Pessoa</p>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase mb-6 tracking-widest border-b border-slate-100 pb-3">Distribuição por Vínculo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="800" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '800' }}
                />
                <Bar dataKey={labelA} fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30}>
                   <LabelList dataKey={labelA} position="top" formatter={formatCurrencyLabel} style={{ fontSize: '9px', fontWeight: '800', fill: '#94a3b8' }} />
                </Bar>
                <Bar dataKey={labelB} fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30}>
                   <LabelList dataKey={labelB} position="top" formatter={formatCurrencyLabel} style={{ fontSize: '9px', fontWeight: '800', fill: '#1e40af' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase mb-6 tracking-widest border-b border-slate-100 pb-3 text-center">Mix de Custos Atual</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada */}
      {monthA && monthB && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-slate-900 text-white">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Detalhamento Operacional: {monthA.monthYear} vs {monthB.monthYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr className="text-[9px] font-black uppercase tracking-widest">
                  <th className="py-4 px-6">Vínculo</th>
                  <th className="py-4 px-6 text-right">Qtd (Δ)</th>
                  <th className="py-4 px-6 text-right">Anterior (R$)</th>
                  <th className="py-4 px-6 text-right">Atual (R$)</th>
                  <th className="py-4 px-6 text-right">Var %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'Efetivos', qA: monthA.effectiveCount, qB: monthB.effectiveCount, vA: monthA.effectiveValue, vB: monthB.effectiveValue, color: 'text-blue-600' },
                  { label: 'Contratados', qA: monthA.contractedCount, qB: monthB.contractedCount, vA: monthA.contractedValue, vB: monthB.contractedValue, color: 'text-emerald-500' },
                  { label: 'Comissionados', qA: monthA.commissionedCount, qB: monthB.commissionedCount, vA: monthA.commissionedValue, vB: monthB.commissionedValue, color: 'text-amber-500' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors text-xs font-bold">
                    <td className={`py-4 px-6 font-black ${row.color} uppercase`}>{row.label}</td>
                    <td className="py-4 px-6 text-right text-slate-900">
                      {row.qB} <span className="text-[9px] text-slate-400 font-bold">({row.qB - row.qA >= 0 ? '+' : ''}{row.qB - row.qA})</span>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-400">R$ {row.vA.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 text-right text-slate-900 font-black">R$ {row.vB.toLocaleString('pt-BR')}</td>
                    <td className={`py-4 px-6 text-right font-black ${getDiff(row.vA, row.vB) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {getDiff(row.vA, row.vB) > 0 ? '+' : ''}{getDiff(row.vA, row.vB).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Análise IA */}
      {analysis && (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center gap-6 mb-8 border-b border-slate-50 pb-6 relative z-10">
            <div className="bg-blue-700 p-4 rounded-2xl shadow-lg">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Análise Estratégica AI</h2>
              <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.3em] mt-1">Gestão de Capital Humano • Gemini 3 Pro</p>
            </div>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 relative z-10 text-sm md:text-base leading-relaxed font-medium">
            {analysis.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (trimmed === '') return <div key={i} className="h-4" />;
              
              if (line.startsWith('# ')) return (
                <h1 key={i} className="text-3xl font-black text-slate-900 mt-10 mb-6 border-l-8 border-blue-700 pl-4 uppercase tracking-tight">
                  {line.replace('# ', '')}
                </h1>
              );
              
              if (line.startsWith('## ')) return (
                <h2 key={i} className="text-xl font-black text-slate-800 mt-8 mb-4 flex items-center gap-3">
                  <span className="w-2 h-6 bg-blue-600 rounded-full" />
                  {line.replace('## ', '')}
                </h2>
              );
              
              if (line.startsWith('- ') || line.startsWith('* ')) return (
                <li key={i} className="ml-6 list-disc mb-3 marker:text-blue-600 font-bold">
                  {line.substring(2)}
                </li>
              );
              
              if (line.startsWith('🔹') || line.startsWith('✅') || line.startsWith('🚀') || line.startsWith('💡')) return (
                <div key={i} className="my-6 p-6 bg-slate-900 text-white rounded-2xl border-l-8 border-l-blue-600 font-black text-sm leading-relaxed">
                   {line}
                </div>
              );
              
              return <p key={i} className="mb-4">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;

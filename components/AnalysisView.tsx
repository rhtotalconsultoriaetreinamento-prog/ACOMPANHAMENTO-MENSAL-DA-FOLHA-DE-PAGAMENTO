
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

// Cores ligeiramente mais vibrantes e profissionais
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
      link.download = `dashboard_gestorpro_${activeCompany?.name || 'empresa'}_${new Date().getTime()}.jpg`;
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
      pdf.save(`dashboard_gestorpro_${activeCompany?.name || 'empresa'}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-xl">
        <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6" />
        <p className="text-3xl font-black text-slate-900 tracking-tight">Processando Comparativos de IA...</p>
        <p className="text-slate-400 mt-2 font-bold uppercase text-xs tracking-widest">Aguarde enquanto analisamos sua folha</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-10 rounded-3xl flex items-start gap-6 text-red-700 border border-red-200 shadow-lg">
        <AlertCircle className="w-10 h-10 shrink-0" />
        <div>
          <h3 className="font-black text-2xl uppercase tracking-tight">Falha na Análise</h3>
          <p className="text-lg font-medium opacity-90 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white p-20 rounded-3xl border border-slate-200 text-center shadow-lg border-b-8 border-b-blue-600">
        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
          <TrendingUp className="w-12 h-12 text-blue-400" />
        </div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tight">Seu Dashboard Estratégico</h3>
        <p className="text-xl text-slate-500 max-w-xl mx-auto mt-6 font-medium leading-relaxed">Insira os dados na aba de <b>Lançamentos</b> para desbloquear insights de BI e análises de IA em tempo real.</p>
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
  const totalVarValue = totalValB - totalValA;

  const formatCurrencyLabel = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-10" ref={dashboardRef}>
      {/* Header para Exportação */}
      <div className="hidden block-on-export border-b-4 border-slate-900 pb-10 mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center overflow-hidden bg-white border border-slate-200 shadow-sm">
              {activeCompany?.logo ? (
                <img src={activeCompany.logo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-12 h-12 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">{activeCompany?.name}</h1>
              <p className="text-slate-500 font-bold uppercase text-sm tracking-widest mt-2">CNPJ: {activeCompany?.cnpj}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dashboard Estratégico de Pessoas</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .block-on-export { display: none; }
        @media screen { .block-on-export { display: none !important; } }
      ` }} />

      {/* Controles de Comparação e Exportação */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-lg flex flex-col xl:flex-row items-center gap-8 justify-between no-print">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-600/20">
            <ArrowRightLeft className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Estratégia & BI</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Comparação de Competências</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <div className="flex items-center gap-4 no-print bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <select 
              value={monthAId} 
              onChange={(e) => setMonthAId(e.target.value)}
              className="px-6 py-4 bg-white border border-slate-200 rounded-xl text-lg font-black outline-none focus:ring-4 focus:ring-blue-600/10 cursor-pointer shadow-sm min-w-[160px]"
            >
              <option value="">Selecione...</option>
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
            <span className="text-slate-300 font-black text-2xl uppercase italic">vs</span>
            <select 
              value={monthBId} 
              onChange={(e) => setMonthBId(e.target.value)}
              className="px-6 py-4 bg-white border border-slate-200 rounded-xl text-lg font-black outline-none focus:ring-4 focus:ring-blue-600/10 cursor-pointer shadow-sm min-w-[160px]"
            >
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
          </div>

          <div className="flex gap-3 no-print border-l border-slate-200 pl-6 h-12 items-center">
            <button 
              onClick={exportAsImage}
              disabled={isExporting}
              title="Exportar como JPEG"
              className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 p-4 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={exportAsPDF}
              disabled={isExporting}
              title="Exportar como PDF"
              className="bg-slate-900 border border-slate-800 hover:bg-black text-white p-4 rounded-xl transition-all shadow-xl active:scale-95"
            >
              <FileDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Comparativos */}
      {monthA && monthB && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl border-l-[12px] border-l-blue-600 transition-all hover:-translate-y-2 group">
            <div className="flex items-center gap-4 text-blue-600 mb-6">
              <DollarSign className="w-8 h-8" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Custo Total da Folha</span>
            </div>
            <p className="text-5xl font-black text-slate-900 tracking-tight">R$ {monthB.totalValue.toLocaleString('pt-BR')}</p>
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black mt-6 ${getDiff(monthA.totalValue, monthB.totalValue) > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {getDiff(monthA.totalValue, monthB.totalValue) > 0 ? '↑' : '↓'} {Math.abs(getDiff(monthA.totalValue, monthB.totalValue)).toFixed(1)}% 
              <span className="ml-2 font-black uppercase text-[10px] opacity-60 tracking-widest">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl border-l-[12px] border-l-emerald-500 transition-all hover:-translate-y-2 group">
            <div className="flex items-center gap-4 text-emerald-500 mb-6">
              <Users className="w-8 h-8" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Quadro de Colaboradores</span>
            </div>
            <p className="text-5xl font-black text-slate-900 tracking-tight">{monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount}</p>
            <div className="mt-6 flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700 uppercase tracking-widest">
                Δ {(monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) - (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount)} PESSOAS
              </span>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl border-l-[12px] border-l-amber-500 transition-all hover:-translate-y-2 group">
            <div className="flex items-center gap-4 text-amber-500 mb-6">
              <TrendingUp className="w-8 h-8" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Ticket Médio p/ Pessoa</span>
            </div>
            <p className="text-5xl font-black text-slate-900 tracking-tight">R$ {(monthB.totalValue / (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-slate-400 font-black uppercase mt-6 tracking-widest">Investimento Percapita Atual</p>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 uppercase mb-10 tracking-[0.2em] border-b-2 border-slate-100 pb-5">Evolução Financeira Segmentada</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 50, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={14} fontWeight="900" tickLine={false} axisLine={false} />
                <YAxis hide stroke="#64748b" fontSize={12} fontWeight="900" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', fontSize: '14px', padding: '16px' }}
                />
                <Legend iconType="circle" iconSize={12} wrapperStyle={{ fontSize: '14px', fontWeight: '900', paddingTop: '30px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Bar dataKey={labelA} fill="#cbd5e1" radius={[10, 10, 0, 0]} barSize={45}>
                  <LabelList 
                    dataKey={labelA} 
                    position="top" 
                    formatter={formatCurrencyLabel}
                    style={{ fontSize: '11px', fontWeight: '900', fill: '#94a3b8' }}
                    offset={15}
                  />
                </Bar>
                <Bar dataKey={labelB} fill="#2563eb" radius={[10, 10, 0, 0]} barSize={45}>
                  <LabelList 
                    dataKey={labelB} 
                    position="top" 
                    formatter={formatCurrencyLabel}
                    style={{ fontSize: '11px', fontWeight: '900', fill: '#1e40af' }}
                    offset={15}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 uppercase mb-10 tracking-[0.2em] text-center border-b-2 border-slate-100 pb-5">Mix de Vínculos ({monthB?.monthYear})</h3>
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={10}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 3 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', padding: '16px' }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={12} wrapperStyle={{ fontSize: '14px', fontWeight: '900', paddingTop: '20px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Detalhamento */}
      {monthA && monthB && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden border-t-[12px] border-t-slate-900">
          <div className="px-10 py-6 bg-slate-900 text-white">
            <h3 className="text-sm font-black uppercase tracking-[0.4em]">Detalhamento Operacional: {monthA.monthYear} vs {monthB.monthYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200">
                <tr>
                  <th className="py-6 px-10 font-black uppercase text-xs tracking-widest">Tipo de Vínculo</th>
                  <th className="py-6 px-10 font-black text-right uppercase text-xs tracking-widest">Headcount (Δ)</th>
                  <th className="py-6 px-10 font-black text-right uppercase text-xs tracking-widest">Anterior (R$)</th>
                  <th className="py-6 px-10 font-black text-right uppercase text-xs tracking-widest">Atual (R$)</th>
                  <th className="py-6 px-10 font-black text-right uppercase text-xs tracking-widest">Var. Valor</th>
                  <th className="py-6 px-10 font-black text-right uppercase text-xs tracking-widest">Var. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'Efetivos', qA: monthA.effectiveCount, qB: monthB.effectiveCount, vA: monthA.effectiveValue, vB: monthB.effectiveValue, color: 'text-blue-600' },
                  { label: 'Contratados', qA: monthA.contractedCount, qB: monthB.contractedCount, vA: monthA.contractedValue, vB: monthB.contractedValue, color: 'text-emerald-500' },
                  { label: 'Comissionados', qA: monthA.commissionedCount, qB: monthB.commissionedCount, vA: monthA.commissionedValue, vB: monthB.commissionedValue, color: 'text-amber-500' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                    <td className={`py-8 px-10 text-xl font-black ${row.color} uppercase tracking-tight`}>{row.label}</td>
                    <td className="py-8 px-10 text-right font-black text-slate-900 text-lg">
                      {row.qB} <span className="text-xs text-slate-400 ml-1 font-bold">({row.qB - row.qA >= 0 ? '+' : ''}{row.qB - row.qA})</span>
                    </td>
                    <td className="py-8 px-10 text-right text-slate-400 font-bold">R$ {row.vA.toLocaleString('pt-BR')}</td>
                    <td className="py-8 px-10 text-right font-black text-slate-900 text-2xl tracking-tighter">R$ {row.vB.toLocaleString('pt-BR')}</td>
                    <td className={`py-8 px-10 text-right font-black text-lg ${(row.vB - row.vA) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {row.vB - row.vA > 0 ? '+' : ''} R$ {(row.vB - row.vA).toLocaleString('pt-BR')}
                    </td>
                    <td className={`py-8 px-10 text-right font-black text-xl ${getDiff(row.vA, row.vB) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {getDiff(row.vA, row.vB) > 0 ? '+' : ''}{getDiff(row.vA, row.vB).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/60 border-t-4 border-slate-300">
                  <td className="py-10 px-10 font-black text-slate-900 uppercase text-sm tracking-[0.3em]">CONSOLIDADO GERAL</td>
                  <td className="py-10 px-10 text-right font-black text-slate-900 text-2xl">
                    {totalQtdB} <span className="text-xs text-slate-500 ml-1 font-black">({totalQtdB - totalQtdA >= 0 ? '+' : ''}{totalQtdB - totalQtdA})</span>
                  </td>
                  <td className="py-10 px-10 text-right font-black text-slate-400 text-lg">R$ {totalValA.toLocaleString('pt-BR')}</td>
                  <td className="py-10 px-10 text-right font-black text-blue-800 text-3xl tracking-tighter underline decoration-blue-500/30 decoration-4">R$ {totalValB.toLocaleString('pt-BR')}</td>
                  <td className={`py-10 px-10 text-right font-black text-xl ${totalVarValue > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                    {totalVarValue > 0 ? '+' : ''} R$ {totalVarValue.toLocaleString('pt-BR')}
                  </td>
                  <td className={`py-10 px-10 text-right font-black text-2xl ${totalVarPercent > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                    {totalVarPercent > 0 ? '+' : ''}{totalVarPercent.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Análise de IA */}
      {analysis && (
        <div className="bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
            <BrainCircuit className="w-[500px] h-[500px] -mr-40 -mt-40" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-16 border-b-4 border-slate-50 pb-12 relative z-10 text-center sm:text-left">
            <div className="bg-blue-700 p-6 rounded-3xl shadow-2xl shadow-blue-700/30 animate-pulse">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Insights Gemini AI</h2>
              <p className="text-xs text-blue-600 font-black uppercase tracking-[0.5em] mt-4">Inteligência Estratégica Aplicada ao Capital Humano</p>
            </div>
          </div>
          <div className="prose prose-slate max-w-none text-slate-800 relative z-10">
            {analysis.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (trimmed === '') return <div key={i} className="h-6" />;
              
              if (line.startsWith('# ')) return (
                <h1 key={i} className="text-5xl font-black text-slate-900 mt-16 mb-8 border-l-[16px] border-blue-700 pl-8 leading-tight uppercase tracking-tighter">
                  {line.replace('# ', '')}
                </h1>
              );
              
              if (line.startsWith('## ')) return (
                <h2 key={i} className="text-3xl font-black text-slate-800 mt-12 mb-8 flex items-center gap-4">
                  <span className="w-3 h-12 bg-blue-600 rounded-full shrink-0" />
                  {line.replace('## ', '')}
                </h2>
              );
              
              if (line.startsWith('- ') || line.startsWith('* ')) return (
                <li key={i} className="ml-10 list-disc mb-5 marker:text-blue-600 text-xl font-bold text-slate-700 pl-2 leading-relaxed">
                  {line.substring(2)}
                </li>
              );
              
              if (line.startsWith('🔹') || line.startsWith('✅') || line.startsWith('🚀') || line.startsWith('💡')) return (
                <div key={i} className="flex gap-8 items-start my-12 p-10 bg-slate-900 text-white rounded-[2rem] shadow-2xl border-l-[12px] border-l-blue-600 font-black text-xl leading-relaxed group hover:bg-black transition-all">
                  <span className="text-4xl flex-shrink-0 bg-blue-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                    {line.charAt(0)}
                  </span>
                  <span className="mt-1">{line.substring(1).trim()}</span>
                </div>
              );
              
              return <p key={i} className="text-2xl leading-relaxed text-slate-700 font-bold mb-6 opacity-90">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;


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

const COLORS = ['#2563eb', '#059669', '#d97706']; 

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
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-2xl font-black text-slate-800">Processando Comparativos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-2xl flex items-start gap-4 text-red-700 border border-red-100">
        <AlertCircle className="w-8 h-8" />
        <div><h3 className="font-bold text-xl">Erro</h3><p className="text-lg">{error}</p></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
        <TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-6" />
        <h3 className="text-3xl font-black text-slate-800">Seu Dashboard Estratégico</h3>
        <p className="text-xl text-slate-500 max-w-md mx-auto mt-4">Insira os dados na aba de Lançamentos para visualizar os comparativos e análises de IA aqui.</p>
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
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8" ref={dashboardRef}>
      {/* Header para Exportação */}
      <div className="hidden block-on-export border-b-2 border-slate-900 pb-6 mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden bg-white border border-slate-100">
              {activeCompany?.logo ? (
                <img src={activeCompany.logo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">{activeCompany?.name}</h1>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">CNPJ: {activeCompany?.cnpj}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dashboard Estratégico</p>
            <p className="text-xl font-black text-slate-900 mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .block-on-export { display: none; }
        @media screen { .block-on-export { display: none !important; } }
      ` }} />

      {/* Controles de Comparação e Exportação */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between no-print">
        <div className="flex items-center gap-4">
          <ArrowRightLeft className="w-6 h-6 text-blue-700" />
          <h3 className="text-xl font-black text-slate-900">Estratégia & BI</h3>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-2 no-print">
            <select 
              value={monthAId} 
              onChange={(e) => setMonthAId(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-sm"
            >
              <option value="">Selecione...</option>
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
            <span className="text-slate-400 font-black text-xl">vs</span>
            <select 
              value={monthBId} 
              onChange={(e) => setMonthBId(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-sm"
            >
              {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
            </select>
          </div>

          <div className="flex gap-2 no-print border-l border-slate-100 pl-4 ml-2">
            <button 
              onClick={exportAsImage}
              disabled={isExporting}
              title="Exportar como JPEG"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-3 rounded-xl transition-all shadow-sm"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={exportAsPDF}
              disabled={isExporting}
              title="Exportar como PDF"
              className="bg-slate-800 border border-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl transition-all shadow-sm"
            >
              <FileDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Comparativos */}
      {monthA && monthB && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md border-l-8 border-l-blue-600 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-3 text-blue-700 mb-4">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm font-black uppercase tracking-widest text-slate-500">Total da Folha</span>
            </div>
            <p className="text-4xl font-black text-slate-900">R$ {monthB.totalValue.toLocaleString('pt-BR')}</p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-black mt-4 ${getDiff(monthA.totalValue, monthB.totalValue) > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {getDiff(monthA.totalValue, monthB.totalValue) > 0 ? '↑' : '↓'} {Math.abs(getDiff(monthA.totalValue, monthB.totalValue)).toFixed(1)}% <span className="ml-1 font-medium opacity-80">vs anterior</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md border-l-8 border-l-emerald-600 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-3 text-emerald-700 mb-4">
              <Users className="w-6 h-6" />
              <span className="text-sm font-black uppercase tracking-widest text-slate-500">QTD Servidores</span>
            </div>
            <p className="text-4xl font-black text-slate-900">{monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount}</p>
            <p className="text-sm text-slate-600 font-bold mt-4 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded bg-slate-100`}>
                Variação: {(monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) - (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount)} colaboradores
              </span>
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md border-l-8 border-l-amber-600 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-3 text-amber-700 mb-4">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm font-black uppercase tracking-widest text-slate-500">Custo Médio</span>
            </div>
            <p className="text-4xl font-black text-slate-900">R$ {(monthB.totalValue / (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-slate-600 font-bold mt-4 italic opacity-80">Investimento médio por colaborador</p>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-800 uppercase mb-8 tracking-widest border-b border-slate-100 pb-4">Investimento por Vínculo (Comparativo)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 40, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={13} fontWeight="700" tickLine={false} axisLine={false} />
                <YAxis hide stroke="#64748b" fontSize={12} fontWeight="700" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" iconSize={12} wrapperStyle={{ fontSize: '13px', fontWeight: '800', paddingTop: '20px' }} />
                <Bar dataKey={labelA} fill="#94a3b8" radius={[6, 6, 0, 0]}>
                  <LabelList 
                    dataKey={labelA} 
                    position="top" 
                    formatter={formatCurrencyLabel}
                    style={{ fontSize: '10px', fontWeight: '900', fill: '#64748b' }}
                  />
                </Bar>
                <Bar dataKey={labelB} fill="#2563eb" radius={[6, 6, 0, 0]}>
                  <LabelList 
                    dataKey={labelB} 
                    position="top" 
                    formatter={formatCurrencyLabel}
                    style={{ fontSize: '10px', fontWeight: '900', fill: '#1e40af' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-800 uppercase mb-8 tracking-widest text-center border-b border-slate-100 pb-4">Distribuição Financeira ({monthB?.monthYear})</h3>
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 2 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '13px', fontWeight: '800' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Detalhamento */}
      {monthA && monthB && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-slate-800">
          <div className="px-8 py-5 bg-slate-900 text-white">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Detalhamento Gerencial: {monthA.monthYear} vs {monthB.monthYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-5 px-8 font-black uppercase text-xs tracking-widest">Vínculo</th>
                  <th className="py-5 px-8 font-black text-right uppercase text-xs tracking-widest">Qtd (Δ)</th>
                  <th className="py-5 px-8 font-black text-right uppercase text-xs tracking-widest">Custo Ant.</th>
                  <th className="py-5 px-8 font-black text-right uppercase text-xs tracking-widest">Custo Atual</th>
                  <th className="py-5 px-8 font-black text-right uppercase text-xs tracking-widest">Var. R$</th>
                  <th className="py-5 px-8 font-black text-right uppercase text-xs tracking-widest">Var. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'Efetivos', qA: monthA.effectiveCount, qB: monthB.effectiveCount, vA: monthA.effectiveValue, vB: monthB.effectiveValue, color: 'text-blue-700' },
                  { label: 'Contratados', qA: monthA.contractedCount, qB: monthB.contractedCount, vA: monthA.contractedValue, vB: monthB.contractedValue, color: 'text-emerald-700' },
                  { label: 'Comissionados', qA: monthA.commissionedCount, qB: monthB.commissionedCount, vA: monthA.commissionedValue, vB: monthB.commissionedValue, color: 'text-amber-700' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className={`py-6 px-8 text-lg font-black ${row.color}`}>{row.label}</td>
                    <td className="py-6 px-8 text-right font-bold text-slate-700 text-base">
                      {row.qB} <span className="text-sm text-slate-400 ml-1 font-medium">({row.qB - row.qA >= 0 ? '+' : ''}{row.qB - row.qA})</span>
                    </td>
                    <td className="py-6 px-8 text-right text-slate-500 font-medium">R$ {row.vA.toLocaleString('pt-BR')}</td>
                    <td className="py-6 px-8 text-right font-black text-slate-900 text-lg">R$ {row.vB.toLocaleString('pt-BR')}</td>
                    <td className={`py-6 px-8 text-right font-black text-base ${(row.vB - row.vA) > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {row.vB - row.vA > 0 ? '+' : ''} R$ {(row.vB - row.vA).toLocaleString('pt-BR')}
                    </td>
                    <td className={`py-6 px-8 text-right font-black text-base ${getDiff(row.vA, row.vB) > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {getDiff(row.vA, row.vB) > 0 ? '+' : ''}{getDiff(row.vA, row.vB).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/80 border-t-2 border-slate-200">
                  <td className="py-6 px-8 font-black text-slate-900 uppercase text-sm tracking-widest">TOTAL GERAL</td>
                  <td className="py-6 px-8 text-right font-black text-slate-900 text-lg">
                    {totalQtdB} <span className="text-sm text-slate-500 ml-1 font-bold">({totalQtdB - totalQtdA >= 0 ? '+' : ''}{totalQtdB - totalQtdA})</span>
                  </td>
                  <td className="py-6 px-8 text-right font-bold text-slate-500">R$ {totalValA.toLocaleString('pt-BR')}</td>
                  <td className="py-6 px-8 text-right font-black text-blue-800 text-xl underline decoration-blue-600/30">R$ {totalValB.toLocaleString('pt-BR')}</td>
                  <td className={`py-6 px-8 text-right font-black text-lg ${totalVarValue > 0 ? 'text-red-700' : 'text-emerald-800'}`}>
                    {totalVarValue > 0 ? '+' : ''} R$ {totalVarValue.toLocaleString('pt-BR')}
                  </td>
                  <td className={`py-6 px-8 text-right font-black text-lg ${totalVarPercent > 0 ? 'text-red-700' : 'text-emerald-800'}`}>
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
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
            <BrainCircuit className="w-80 h-80 -mr-24 -mt-24" />
          </div>
          <div className="flex items-center gap-5 mb-10 border-b-2 border-slate-100 pb-8 relative z-10">
            <div className="bg-blue-700 p-3 rounded-2xl shadow-xl shadow-blue-700/20">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análise Estratégica Gemini</h2>
              <p className="text-xs text-blue-600 font-black uppercase tracking-[0.3em] mt-2">Inteligência Artificial Aplicada ao RH</p>
            </div>
          </div>
          <div className="prose prose-slate max-w-none text-slate-800 relative z-10">
            {analysis.split('\n').map((line, i) => {
              if (line.trim() === '') return <div key={i} className="h-4" />;
              if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-black text-slate-900 mt-12 mb-6 border-l-8 border-blue-700 pl-6 leading-tight">{line.replace('# ', '')}</h1>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black text-slate-800 mt-10 mb-6 flex items-center gap-3"><span className="w-2 h-8 bg-blue-600 rounded-full shrink-0" />{line.replace('## ', '')}</h2>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-8 list-disc mb-3 marker:text-blue-600 text-lg font-medium text-slate-700">{line.substring(2)}</li>;
              if (line.startsWith('🔹') || line.startsWith('✅') || line.startsWith('🚀')) return (
                <div key={i} className="flex gap-6 items-start my-8 p-8 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-700/20 font-bold text-lg leading-relaxed">
                  <span className="text-3xl flex-shrink-0 bg-white/20 p-2 rounded-xl">{line.charAt(0)}</span>
                  <span>{line.substring(1).trim()}</span>
                </div>
              );
              return <p key={i} className="text-lg leading-relaxed text-slate-700 font-medium mb-4">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;

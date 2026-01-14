
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LabelList } from 'recharts';
import { PayrollData, CompanyData } from '../types';
import { FileText, TrendingUp, AlertCircle, Loader2, ArrowRightLeft, BrainCircuit, Users, DollarSign, Image as ImageIcon, FileDown, Building2, Sparkles, RefreshCw, Table as TableIcon, ArrowUpRight, ArrowDownRight, ArrowUp, ArrowDown, X } from 'lucide-react';
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

  const sortedData = useMemo(() => {
    const monthOrder: { [key: string]: number } = {
      'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
      'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12, '13': 13
    };

    return [...data].sort((a, b) => {
      const [mA, yA] = a.monthYear.split('/');
      const [mB, yB] = b.monthYear.split('/');
      if (yA !== yB) return Number(yA) - Number(yB);
      const mAName = mA.replace('º', '');
      const mBName = mB.replace('º', '');
      return (monthOrder[mAName] || 0) - (monthOrder[mBName] || 0);
    });
  }, [data]);

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

  const monthA = data.find(d => d.id === monthAId);
  const monthB = data.find(d => d.id === monthBId);

  const operationalTotals = useMemo(() => {
    if (!monthA || !monthB) return null;
    
    const qtyA = (monthA.effectiveCount || 0) + (monthA.contractedCount || 0) + (monthA.commissionedCount || 0);
    const qtyB = (monthB.effectiveCount || 0) + (monthB.contractedCount || 0) + (monthB.commissionedCount || 0);
    const valA = (monthA.effectiveValue || 0) + (monthA.contractedValue || 0) + (monthA.commissionedValue || 0);
    const valB = (monthB.effectiveValue || 0) + (monthB.contractedValue || 0) + (monthB.commissionedValue || 0);
    
    return {
      qtyA,
      qtyB,
      valA,
      valB,
      deltaQty: qtyB - qtyA,
      varPct: valA ? ((valB - valA) / valA) * 100 : 0
    };
  }, [monthA, monthB]);

  const exportAsImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList.contains('no-print'),
        onclone: (clonedDoc) => {
          const headers = clonedDoc.querySelectorAll('header');
          headers.forEach(h => h.style.position = 'static');
        }
      });
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `dashboard_${activeCompany?.name || 'empresa'}.jpg`;
      link.click();
    } catch (err) {
      console.error(err);
    } finally { setIsExporting(false); }
  };

  const exportAsPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList.contains('no-print'),
        onclone: (clonedDoc) => {
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((el: any) => {
            const style = window.getComputedStyle(el);
            if (style.position === 'sticky' || style.position === 'fixed') {
              el.style.position = 'static';
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // MARGENS SOLICITADAS: Sup: 2,5cm, Inf: 2,5cm, Esq: 3cm, Dir: 3cm
      const marginTop = 25;
      const marginBottom = 25;
      const marginLeft = 30;
      const marginRight = 30;
      
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Largura e altura útil dentro da folha
      const contentWidth = pageWidth - marginLeft - marginRight; // 150mm
      const contentHeightPerPage = pageHeight - marginTop - marginBottom; // 247mm
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgScaledHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = imgScaledHeight;
      let position = marginTop;

      // Adiciona primeira página com as margens configuradas
      pdf.addImage(imgData, 'PNG', marginLeft, position, contentWidth, imgScaledHeight);
      heightLeft -= contentHeightPerPage;

      // Fatiamento preciso para as próximas páginas mantendo as margens
      while (heightLeft > 0) {
        // O cálculo da posição vertical subtrai a altura útil para "rolar" a imagem do canvas
        position = (heightLeft - imgScaledHeight) + marginTop;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginLeft, position, contentWidth, imgScaledHeight);
        heightLeft -= contentHeightPerPage;
      }

      pdf.save(`Relatorio_Estrategico_${activeCompany?.name || 'RH_TOTAL'}.pdf`);
    } catch (err) {
      console.error("Erro na exportação PDF:", err);
      alert("Erro ao gerar o documento. Verifique os dados e tente novamente.");
    } finally { setIsExporting(false); }
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
      {/* Cabeçalho do Relatório - Sempre visível na exportação */}
      <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-[0.4em] italic mb-2">
          {activeCompany?.name || 'NOME DA EMPRESA'}
        </h1>
        <div className="h-1.5 w-32 bg-blue-600 mx-auto rounded-full mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-1">
          Relatório Executivo de Inteligência de Negócio
        </p>
        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">
          BI & Gestão de Capital Humano
        </p>
      </div>

      {/* Controles de BI - Ocultos na Exportação */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-6 justify-between no-print">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3.5 rounded-2xl shadow-lg">
            <ArrowRightLeft className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Módulo Comparativo</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecione os períodos para cruzamento</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center w-full lg:w-auto gap-3">
          <div className="flex justify-center w-full">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] bg-orange-50 px-5 py-1.5 rounded-full border border-orange-100">
              MESES EM ANÁLISE
            </span>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-3 bg-slate-100/50 p-2 rounded-2xl border border-slate-100">
              <select value={monthAId} onChange={(e) => setMonthAId(e.target.value)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none cursor-pointer focus:ring-2 focus:ring-blue-600 shadow-sm transition-all hover:border-blue-300">
                {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
              </select>
              <span className="text-orange-500 font-black text-2xl italic px-1">vs</span>
              <select value={monthBId} onChange={(e) => setMonthBId(e.target.value)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none cursor-pointer focus:ring-2 focus:ring-blue-600 shadow-sm transition-all hover:border-blue-300">
                {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
              </select>
            </div>
            <div className="flex gap-3 border-l border-slate-200 pl-4">
              <button onClick={exportAsImage} title="Exportar JPG" className="p-3.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all"><ImageIcon className="w-6 h-6" /></button>
              <button 
                onClick={exportAsPDF} 
                title="Exportar PDF A4 Profissional" 
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em]"
              >
                <FileDown className="w-5 h-5 text-blue-400" />
                {isExporting ? 'PROCESSANDO...' : 'RELATÓRIO PDF'}
                {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Chave (KPIs) */}
      {monthA && monthB && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-600" />
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <DollarSign className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Folha Atual</span>
            </div>
            <p className="text-3xl font-black text-slate-900">R$ {monthB.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black mt-5 border ${getDiff(monthA.totalValue, monthB.totalValue) > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              <span className="mr-1.5">
                {getDiff(monthA.totalValue, monthB.totalValue) > 0 ? <ArrowUp className="w-3.5 h-3.5 inline" /> : <ArrowDown className="w-3.5 h-3.5 inline" />}
              </span>
              {Math.abs(getDiff(monthA.totalValue, monthB.totalValue)).toFixed(2)}% de variação
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2.5 h-full bg-emerald-500" />
            <div className="flex items-center gap-3 text-emerald-500 mb-4">
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Headcount Total</span>
            </div>
            <p className="text-4xl font-black text-slate-900">{monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount}</p>
            <div className="mt-5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 py-1.5 px-4 rounded-xl w-fit border border-slate-100">
              Saldo: {(monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) - (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount)} vagas
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-amber-500" />
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Investimento Médio</span>
            </div>
            <p className="text-3xl font-black text-slate-900">R$ {(monthB.totalValue / (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-5 tracking-widest border-t border-slate-50 pt-4">Custo per capita mensal</p>
          </div>
        </div>
      )}

      {/* Visões Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase mb-8 tracking-[0.2em] border-b border-slate-50 pb-5 italic">Tendência de Alocação</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Bar dataKey={labelA} fill="#f59e0b" radius={[10, 10, 0, 0]} barSize={35}>
                   <LabelList dataKey={labelA} position="top" formatter={(val: number) => val.toLocaleString('pt-BR', { notation: 'compact' })} style={{ fontSize: '10px', fontWeight: '900', fill: '#b45309' }} />
                </Bar>
                <Bar dataKey={labelB} fill="#2563eb" radius={[10, 10, 0, 0]} barSize={35}>
                   <LabelList dataKey={labelB} position="top" formatter={(val: number) => val.toLocaleString('pt-BR', { notation: 'compact' })} style={{ fontSize: '10px', fontWeight: '900', fill: '#1e40af' }} />
                </Bar>
                <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase mb-8 tracking-[0.2em] border-b border-slate-50 pb-5 italic text-center">Mix Operacional Atual</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={75} outerRadius={115} paddingAngle={12} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '25px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Auditoria Operacional */}
      {monthA && monthB && operationalTotals && (
        <div className="bg-white rounded-[3rem] border-2 border-slate-900 shadow-2xl overflow-hidden">
          <div className="px-12 py-10 bg-slate-900 text-white flex justify-between items-center border-b border-blue-900">
             <div>
               <h3 className="font-black text-lg uppercase tracking-[0.3em] italic">Auditoria de Custo Operacional</h3>
               <p className="text-xs text-blue-400 font-bold uppercase mt-2 tracking-widest">Base de Comparação: {monthA.monthYear} vs {monthB.monthYear}</p>
             </div>
             <div className="bg-blue-600/20 p-4 rounded-3xl border border-blue-600/30">
                <TableIcon className="w-10 h-10 text-blue-500" />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-12 py-7">Modalidade de Vínculo</th>
                  <th className="px-12 py-7 text-center">Headcount (Δ)</th>
                  <th className="px-12 py-7 text-center">Competência Anterior</th>
                  <th className="px-12 py-7 text-center bg-blue-50/50">Mês Atual (R$)</th>
                  <th className="px-12 py-7 text-right">Impacto %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'QUADRO EFETIVO (CLT)', key: 'effective', color: 'text-blue-700' },
                  { label: 'SERVIÇOS TERCEIRIZADOS (PJ)', key: 'contracted', color: 'text-emerald-700' },
                  { label: 'FORÇA COMISSIONADA', key: 'commissioned', color: 'text-amber-600' }
                ].map((item) => {
                  const countA = (monthA as any)[`${item.key}Count`] || 0;
                  const countB = (monthB as any)[`${item.key}Count`] || 0;
                  const valA = (monthA as any)[`${item.key}Value`] || 0;
                  const valB = (monthB as any)[`${item.key}Value`] || 0;
                  const deltaQty = countB - countA;
                  const varPct = valA ? ((valB - valA) / valA) * 100 : 0;

                  return (
                    <tr key={item.key} className="hover:bg-slate-50 transition-all group">
                      <td className={`px-12 py-8 font-black ${item.color} uppercase italic tracking-tighter text-sm`}>{item.label}</td>
                      <td className="px-12 py-8 text-center font-black text-slate-800">
                        {countB} <span className={`text-[10px] font-black ml-3 px-3 py-1 rounded-xl shadow-sm ${deltaQty > 0 ? 'bg-red-50 text-red-600 border border-red-100' : deltaQty < 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-300'}`}>
                          {deltaQty >= 0 ? '+' : ''}{deltaQty}
                        </span>
                      </td>
                      <td className="px-12 py-8 text-center font-bold text-slate-400 italic">R$ {valA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-12 py-8 text-center font-black text-slate-900 bg-blue-50/20">R$ {valB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className={`px-12 py-8 text-right font-black text-xs ${varPct > 0 ? 'text-red-600' : varPct < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {varPct >= 0 ? '+' : ''}{varPct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900 text-white border-t-4 border-blue-600">
                <tr>
                  <td className="px-12 py-8 font-black uppercase italic tracking-widest text-sm">TOTAL CONSOLIDADO</td>
                  <td className="px-12 py-8 text-center font-black text-xl">
                    {operationalTotals.qtyB} <span className={`text-[10px] font-black ml-3 ${operationalTotals.deltaQty > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ({operationalTotals.deltaQty >= 0 ? '+' : ''}{operationalTotals.deltaQty})
                    </span>
                  </td>
                  <td className="px-12 py-8 text-center font-black text-slate-400 italic">R$ {operationalTotals.valA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-12 py-8 text-center font-black text-blue-400 text-2xl">R$ {operationalTotals.valB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className={`px-12 py-8 text-right font-black text-sm ${operationalTotals.varPct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {operationalTotals.varPct >= 0 ? '+' : ''}{operationalTotals.varPct.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Histórico Evolutivo */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <TableIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-black text-sm uppercase text-slate-900 tracking-[0.2em] italic">Análise de Performance Histórica</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BI Longitudinal Engine</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-10 py-6">Competência</th>
                <th className="px-10 py-6 text-center">Headcount</th>
                <th className="px-10 py-6 text-center">Fluxo (Δ%)</th>
                <th className="px-10 py-6 text-right">Investimento (R$)</th>
                <th className="px-10 py-6 text-right">Diferencial %</th>
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
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-all">
                    <td className="px-10 py-6 font-black text-slate-900 uppercase italic text-sm">{item.monthYear}</td>
                    <td className="px-10 py-6 text-center font-bold text-slate-700">{totalCount}</td>
                    <td className={`px-10 py-6 text-center font-black text-xs ${varQty > 0 ? 'text-red-600' : varQty < 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {index > 0 ? `${varQty >= 0 ? '+' : ''}${varQty.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-900">R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={`px-10 py-6 text-right font-black text-xs ${varVal > 0 ? 'text-red-600' : varVal < 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {index > 0 ? `${varVal >= 0 ? '+' : ''}${varVal.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatório Estratégico IA */}
      <div className="space-y-6">
        {!analysis && !isGenerating && (
          <div className="bg-slate-900 p-20 rounded-[4rem] border border-slate-800 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-teal-500/10"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-600 p-8 rounded-[2.5rem] mb-10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <BrainCircuit className="w-20 h-20 text-white" />
              </div>
              <h3 className="text-5xl font-black text-white uppercase tracking-tighter italic mb-6">Master Intelligence IA</h3>
              <p className="text-slate-400 max-w-2xl mx-auto font-medium text-xl leading-relaxed">
                Nossa inteligência avançada cruzará sua base histórica para gerar recomendações imediatas de redução de custos e otimização do quadro.
              </p>
              <button 
                onClick={onGenerateAnalysis}
                className="mt-14 px-20 py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-5 transition-all shadow-2xl shadow-blue-600/50 active:scale-95 group/btn"
              >
                <Sparkles className="w-10 h-10 group-hover/btn:animate-pulse text-cyan-200" /> GERAR RELATÓRIO EXECUTIVO
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="bg-white p-24 rounded-[4rem] border border-slate-200 text-center shadow-lg flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 overflow-hidden">
                <div className="w-1/2 h-full bg-blue-600 animate-[slide_1.5s_infinite_linear]" />
            </div>
            <Loader2 className="w-24 h-24 animate-spin text-blue-600 mb-10" />
            <h3 className="text-4xl font-black text-slate-900 uppercase italic">Refinando Algoritmos</h3>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.5em] mt-5 animate-pulse">Cruzando indicadores setoriais e análise de variância...</p>
          </div>
        )}

        {analysis && (
          <div className="bg-white p-14 md:p-20 rounded-[4rem] shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 border-b border-slate-50 pb-12 gap-10">
              <div className="flex items-center gap-10">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/15">
                  <BrainCircuit className="w-14 h-14 text-blue-400" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Análise de IA</h2>
                  <p className="text-xs text-blue-600 font-black uppercase tracking-[0.5em] mt-3">Advanced Strategy Report</p>
                </div>
              </div>
              <button 
                onClick={onGenerateAnalysis}
                className="text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-4 px-8 py-4 bg-slate-50 rounded-[1.5rem] hover:bg-white hover:shadow-md transition-all no-print border border-slate-100"
              >
                <RefreshCw className="w-5 h-5" /> Atualizar Análise
              </button>
            </div>
            
            <div className="prose prose-slate max-w-none text-slate-700 text-lg md:text-xl leading-relaxed font-medium">
              {analysis.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed === '') return <div key={i} className="h-8" />;
                if (line.startsWith('# ')) return (
                   <h1 key={i} className="text-5xl font-black text-slate-900 mt-16 mb-10 border-l-[12px] border-blue-600 pl-8 uppercase tracking-tighter bg-slate-50/70 py-6 rounded-r-3xl shadow-sm">
                     {line.replace('# ', '')}
                   </h1>
                );
                if (line.startsWith('## ')) return (
                   <h2 key={i} className="text-3xl font-black text-slate-800 mt-14 mb-8 flex items-center gap-5 italic border-b-2 border-slate-100 pb-3">
                     <span className="w-4 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20" />
                     {line.replace('## ', '')}
                   </h2>
                );
                if (line.startsWith('- ') || line.startsWith('* ')) return (
                   <li key={i} className="ml-10 list-none mb-5 relative pl-10 font-bold text-slate-800 border-l-2 border-blue-100">
                     <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-50" />
                     {line.substring(2)}
                   </li>
                );
                if (line.startsWith('>') || line.startsWith('INFO:')) return (
                   <div key={i} className="my-14 p-10 bg-slate-900 text-white rounded-[2.5rem] border-l-[15px] border-l-blue-600 font-black text-base md:text-lg leading-relaxed shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-6 right-8 text-blue-400/20 group-hover:scale-150 transition-transform duration-1000"><Sparkles className="w-16 h-16" /></div>
                     <span className="relative z-10 italic tracking-tight">{line.replace('>', '').replace('INFO:', '')}</span>
                   </div>
                );
                return <p key={i} className="mb-8">{line}</p>;
              })}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes slide {
          from { transform: translateX(-100%); }
          to { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default AnalysisView;

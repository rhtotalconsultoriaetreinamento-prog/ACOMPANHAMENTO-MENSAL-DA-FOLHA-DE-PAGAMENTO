
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { PayrollData } from '../types';
import { FileText, TrendingUp, AlertCircle, Loader2, ArrowRightLeft, BrainCircuit, Users, DollarSign } from 'lucide-react';

interface AnalysisViewProps {
  data: PayrollData[];
  analysis: string;
  isGenerating: boolean;
  error?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const AnalysisView: React.FC<AnalysisViewProps> = ({ data, analysis, isGenerating, error }) => {
  const [monthAId, setMonthAId] = useState<string>('');
  const [monthBId, setMonthBId] = useState<string>('');

  useEffect(() => {
    if (data.length >= 2) {
      setMonthAId(data[data.length - 2].id);
      setMonthBId(data[data.length - 1].id);
    } else if (data.length === 1) {
      setMonthBId(data[0].id);
    }
  }, [data]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-xl font-bold text-slate-800">Processando Comparativos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-2xl flex items-start gap-4 text-red-700 border border-red-100">
        <AlertCircle className="w-8 h-8" />
        <div><h3 className="font-bold">Erro</h3><p>{error}</p></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm">
        <TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-slate-800">Seu Dashboard Estratégico</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">Insira os dados na aba de Lançamentos para visualizar os comparativos e análises de IA aqui.</p>
      </div>
    );
  }

  const monthA = data.find(d => d.id === monthAId);
  const monthB = data.find(d => d.id === monthBId);

  const getDiff = (valA: number, valB: number) => {
    if (!valA) return 0;
    return ((valB - valA) / valA) * 100;
  };

  const compData = [
    { name: 'Efetivos', [monthA?.monthYear || 'A']: monthA?.effectiveValue || 0, [monthB?.monthYear || 'B']: monthB?.effectiveValue || 0 },
    { name: 'Contratados', [monthA?.monthYear || 'A']: monthA?.contractedValue || 0, [monthB?.monthYear || 'B']: monthB?.contractedValue || 0 },
    { name: 'Comissionados', [monthA?.monthYear || 'A']: monthA?.commissionedValue || 0, [monthB?.monthYear || 'B']: monthB?.commissionedValue || 0 },
  ];

  const pieData = monthB ? [
    { name: 'Efetivos', value: monthB.effectiveValue },
    { name: 'Contratados', value: monthB.contractedValue },
    { name: 'Comissionados', value: monthB.commissionedValue },
  ] : [];

  // Cálculos de Totais para a Tabela
  const totalQtdA = monthA ? (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount) : 0;
  const totalQtdB = monthB ? (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) : 0;
  const totalValA = monthA ? monthA.totalValue : 0;
  const totalValB = monthB ? monthB.totalValue : 0;
  const totalVarPercent = getDiff(totalValA, totalValB);
  const totalVarValue = totalValB - totalValA;

  return (
    <div className="space-y-6">
      {/* Controles de Comparação */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800">Comparação Dinâmica</h3>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={monthAId} 
            onChange={(e) => setMonthAId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
          </select>
          <span className="text-slate-400 font-bold">vs</span>
          <select 
            value={monthBId} 
            onChange={(e) => setMonthBId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            {data.map(d => <option key={d.id} value={d.id}>{d.monthYear}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs Comparativos - Valores e Quantidades */}
      {monthA && monthB && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Folha</span>
            </div>
            <p className="text-xl font-black text-slate-800">R$ {monthB.totalValue.toLocaleString('pt-BR')}</p>
            <div className={`text-xs font-bold mt-1 ${getDiff(monthA.totalValue, monthB.totalValue) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {getDiff(monthA.totalValue, monthB.totalValue) > 0 ? '↑' : '↓'} {Math.abs(getDiff(monthA.totalValue, monthB.totalValue)).toFixed(1)}% vs anterior
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">QTD SERVIDORES</span>
            </div>
            <p className="text-xl font-black text-slate-800">{monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Variação: {(monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount) - (monthA.effectiveCount + monthA.contractedCount + monthA.commissionedCount)} pessoas
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comissionados</span>
            </div>
            <p className="text-xl font-black text-slate-800">{monthB.commissionedCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">R$ {monthB.commissionedValue.toLocaleString('pt-BR')}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Custo Médio</span>
            </div>
            <p className="text-xl font-black text-slate-800">R$ {(monthB.totalValue / (monthB.effectiveCount + monthB.contractedCount + monthB.commissionedCount || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Por colaborador</p>
          </div>
        </div>
      )}

      {/* Gráficos em Linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras: Investimento por Vínculo (Comparativo) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-wide">Investimento por Vínculo (Comparativo)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey={monthA?.monthYear || 'A'} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey={monthB?.monthYear || 'B'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza: Gasto de cada vínculo (Mês B) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-wide text-center">Distribuição Financeira ({monthB?.monthYear})</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR')}`} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Comparação de Quantidade e Valor por Vínculo */}
      {monthA && monthB && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalhamento Comparativo: {monthA.monthYear} vs {monthB.monthYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6 font-semibold uppercase tracking-tighter text-[10px]">Vínculo</th>
                  <th className="py-3 px-6 font-semibold text-right uppercase tracking-tighter text-[10px]">Qtd (Δ)</th>
                  <th className="py-3 px-6 font-semibold text-right uppercase tracking-tighter text-[10px]">Custo {monthA.monthYear}</th>
                  <th className="py-3 px-6 font-semibold text-right uppercase tracking-tighter text-[10px]">Custo {monthB.monthYear}</th>
                  <th className="py-3 px-6 font-semibold text-right uppercase tracking-tighter text-[10px]">Variação R$</th>
                  <th className="py-3 px-6 font-semibold text-right uppercase tracking-tighter text-[10px]">Variação %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { label: 'Efetivos', qA: monthA.effectiveCount, qB: monthB.effectiveCount, vA: monthA.effectiveValue, vB: monthB.effectiveValue, color: 'text-blue-600' },
                  { label: 'Contratados', qA: monthA.contractedCount, qB: monthB.contractedCount, vA: monthA.contractedValue, vB: monthB.contractedValue, color: 'text-emerald-600' },
                  { label: 'Comissionados', qA: monthA.commissionedCount, qB: monthB.commissionedCount, vA: monthA.commissionedValue, vB: monthB.commissionedValue, color: 'text-amber-600' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className={`py-4 px-6 font-bold ${row.color}`}>{row.label}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-700">
                      {row.qB} <span className="text-[10px] text-slate-400 ml-1">({row.qB - row.qA >= 0 ? '+' : ''}{row.qB - row.qA})</span>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-500">R$ {row.vA.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-800">R$ {row.vB.toLocaleString('pt-BR')}</td>
                    <td className={`py-4 px-6 text-right font-bold ${(row.vB - row.vA) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      R$ {(row.vB - row.vA).toLocaleString('pt-BR')}
                    </td>
                    <td className={`py-4 px-6 text-right font-bold ${getDiff(row.vA, row.vB) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {getDiff(row.vA, row.vB).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {/* Linha de Total */}
                <tr className="bg-slate-50/50 border-t border-slate-200">
                  <td className="py-4 px-6 font-black text-slate-900 uppercase text-xs">TOTAL</td>
                  <td className="py-4 px-6 text-right font-black text-slate-900">
                    {totalQtdB} <span className="text-[10px] text-slate-500 ml-1">({totalQtdB - totalQtdA >= 0 ? '+' : ''}{totalQtdB - totalQtdA})</span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-slate-500">R$ {totalValA.toLocaleString('pt-BR')}</td>
                  <td className="py-4 px-6 text-right font-black text-blue-800">R$ {totalValB.toLocaleString('pt-BR')}</td>
                  <td className={`py-4 px-6 text-right font-black ${totalVarValue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    R$ {totalVarValue.toLocaleString('pt-BR')}
                  </td>
                  <td className={`py-4 px-6 text-right font-black ${totalVarPercent > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {totalVarPercent.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Análise de IA */}
      {analysis && (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <BrainCircuit className="w-64 h-64 -mr-20 -mt-20" />
          </div>
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6 relative z-10">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Análise Estratégica Gemini</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inteligência Artificial Aplicada ao RH</p>
            </div>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 space-y-5 relative z-10">
            {analysis.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-slate-900 mt-8 mb-4">{line.replace('# ', '')}</h1>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 rounded-full" />{line.replace('## ', '')}</h2>;
              if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-6 list-disc mb-1 marker:text-blue-500">{line.substring(2)}</li>;
              if (line.startsWith('🔹') || line.startsWith('✅') || line.startsWith('🚀')) return (
                <div key={i} className="flex gap-4 items-start my-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100/50 text-blue-900 font-medium">
                  <span className="text-xl flex-shrink-0">{line.charAt(0)}</span>
                  <span>{line.substring(1).trim()}</span>
                </div>
              );
              return <p key={i} className="text-slate-600">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;

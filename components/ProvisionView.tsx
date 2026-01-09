
import React from 'react';
import { PayrollData } from '../types';
import { ShieldCheck, CalendarClock, TrendingUp, Info } from 'lucide-react';

interface ProvisionViewProps {
  data: PayrollData[];
}

const ProvisionView: React.FC<ProvisionViewProps> = ({ data }) => {
  const lastMonth = data[data.length - 1];

  if (!lastMonth) {
    return (
      <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
        <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Aguardando dados da folha</h3>
        <p className="text-slate-500 mt-2">Lance o primeiro mês para visualizar as provisões de Férias e 13º.</p>
      </div>
    );
  }

  // Cálculos de Provisão
  // 13º: 8.33% (1/12)
  // Férias: 8.33% (1/12) + 1/3 sobre isso (2.77%) = 11.11%
  const prov13 = lastMonth.effectiveValue * 0.0833;
  const provFerias = lastMonth.effectiveValue * 0.1111;
  const totalProvision = prov13 + provFerias;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            Provisão de Encargos: {lastMonth.monthYear}
          </h2>
          <p className="text-slate-300 mt-1">Cálculo baseado apenas no vínculo de Efetivos (CLT).</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Provisão 13º Salário</p>
              <p className="text-3xl font-black mt-2">R$ {prov13.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] mt-2 text-slate-400 italic">Reserva mensal sugerida (1/12)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Provisão Férias + 1/3</p>
              <p className="text-3xl font-black mt-2">R$ {provFerias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] mt-2 text-slate-400 italic">Reserva mensal sugerida (1/12 + 1/3)</p>
            </div>
            <div className="bg-blue-600 p-6 rounded-xl shadow-lg border border-blue-500">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">Total Provisão Mensal</p>
              <p className="text-3xl font-black mt-2">R$ {totalProvision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] mt-2 text-blue-100 italic">Impacto no custo real da folha</p>
            </div>
          </div>
        </div>
        <TrendingUp className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 pointer-events-none" />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-blue-500" />
          Análise de Passivo Trabalhista
        </h3>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            Para uma gestão financeira saudável, recomendamos a reserva mensal de <b>R$ {totalProvision.toLocaleString('pt-BR')}</b> para cobrir os custos de Férias e 13º salário dos seus {lastMonth.effectiveCount} colaboradores efetivos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Impacto no Custo Efetivo</h4>
              <p className="text-sm">A provisão aumenta o custo do colaborador efetivo em aproximadamente <b>19.44%</b> além do salário nominal.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Recomendação de Caixa</h4>
              <p className="text-sm">Mantenha esses valores em uma conta de liquidez diária para evitar surpresas no final do ano ou períodos de descanso.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisionView;

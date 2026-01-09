
import React, { useState, useEffect } from 'react';
import { PayrollData } from '../types';
import { Plus, Trash2, Calendar, Users, DollarSign, Calculator, Briefcase } from 'lucide-react';

interface DataFormProps {
  onDataChange: (data: PayrollData[]) => void;
  data: PayrollData[];
}

const DataForm: React.FC<DataFormProps> = ({ onDataChange, data }) => {
  const [selectedMonth, setSelectedMonth] = useState('Janeiro');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [newEntry, setNewEntry] = useState<Omit<PayrollData, 'id'>>({
    monthYear: '',
    totalValue: 0,
    effectiveCount: 0,
    effectiveValue: 0,
    contractedCount: 0,
    contractedValue: 0,
    commissionedCount: 0,
    commissionedValue: 0,
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', '13º Salário'
  ];

  const years = Array.from({ length: 2040 - 2000 + 1 }, (_, i) => (2000 + i).toString());

  // Auto-calculate totalValue whenever individual values change
  useEffect(() => {
    const total = newEntry.effectiveValue + newEntry.contractedValue + newEntry.commissionedValue;
    setNewEntry(prev => ({ ...prev, totalValue: total }));
  }, [newEntry.effectiveValue, newEntry.contractedValue, newEntry.commissionedValue]);

  // Update monthYear string based on selections
  useEffect(() => {
    const label = selectedMonth === '13º Salário' ? '13º' : selectedMonth;
    setNewEntry(prev => ({ ...prev, monthYear: `${label}/${selectedYear}` }));
  }, [selectedMonth, selectedYear]);

  const handleAdd = () => {
    if (newEntry.totalValue <= 0) return;
    
    const entry: PayrollData = {
      ...newEntry,
      id: Math.random().toString(36).substr(2, 9),
    };
    onDataChange([...data, entry]);
    setNewEntry({
      ...newEntry,
      totalValue: 0,
      effectiveCount: 0,
      effectiveValue: 0,
      contractedCount: 0,
      contractedValue: 0,
      commissionedCount: 0,
      commissionedValue: 0,
    });
  };

  const removeEntry = (id: string) => {
    onDataChange(data.filter(d => d.id !== id));
  };

  // Cálculo dos Totais Gerais para o rodapé da tabela
  const totals = data.reduce((acc, curr) => ({
    effectiveValue: acc.effectiveValue + curr.effectiveValue,
    contractedValue: acc.contractedValue + curr.contractedValue,
    commissionedValue: acc.commissionedValue + curr.commissionedValue,
    totalValue: acc.totalValue + curr.totalValue,
    totalCount: acc.totalCount + (curr.effectiveCount + curr.contractedCount + curr.commissionedCount)
  }), { effectiveValue: 0, contractedValue: 0, commissionedValue: 0, totalValue: 0, totalCount: 0 });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            Lançamento Mensal
          </h2>
          <p className="text-base text-slate-500 mt-1 font-medium">Detalhe quantidades e valores por vínculo.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Estimado</p>
          <p className="text-3xl font-black text-blue-600">R$ {newEntry.totalValue.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Mês / Competência</label>
              <select 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white cursor-pointer shadow-sm"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Ano</label>
              <select 
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white cursor-pointer shadow-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Efetivos */}
          <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-4 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-sm font-black text-blue-800 uppercase flex items-center gap-2">
              <Users className="w-4 h-4" /> Efetivos (CLT)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase mb-1 block ml-1">Qtd</span>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newEntry.effectiveCount || ''}
                  onChange={e => setNewEntry({...newEntry, effectiveCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase mb-1 block ml-1">Valor R$</span>
                <input 
                  type="number" 
                  placeholder="0,00"
                  value={newEntry.effectiveValue || ''}
                  onChange={e => setNewEntry({...newEntry, effectiveValue: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contratados */}
          <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-4 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-sm font-black text-emerald-800 uppercase flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Contratados / PJ
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">Qtd</span>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newEntry.contractedCount || ''}
                  onChange={e => setNewEntry({...newEntry, contractedCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">Valor R$</span>
                <input 
                  type="number" 
                  placeholder="0,00"
                  value={newEntry.contractedValue || ''}
                  onChange={e => setNewEntry({...newEntry, contractedValue: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Comissionados */}
          <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-100 space-y-4 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-sm font-black text-amber-800 uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Comissionados
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase mb-1 block ml-1">Qtd</span>
                <input 
                  type="number" 
                  placeholder="0"
                  value={newEntry.commissionedCount || ''}
                  onChange={e => setNewEntry({...newEntry, commissionedCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase mb-1 block ml-1">Valor R$</span>
                <input 
                  type="number" 
                  placeholder="0,00"
                  value={newEntry.commissionedValue || ''}
                  onChange={e => setNewEntry({...newEntry, commissionedValue: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-base font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleAdd}
              disabled={newEntry.totalValue <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 text-lg"
            >
              <Plus className="w-6 h-6" />
              Adicionar Competência
            </button>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-sm font-black text-slate-400 uppercase mb-5 flex items-center gap-3 tracking-[0.2em]">
            <Calendar className="w-5 h-5 text-blue-500" /> Histórico Lançado
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 font-black text-xs uppercase tracking-widest">Período</th>
                  <th className="py-4 px-4 font-black text-xs uppercase tracking-widest text-center text-red-400">Qtd</th>
                  <th className="py-4 px-4 font-black text-xs uppercase tracking-widest text-right">Efet. (R$)</th>
                  <th className="py-4 px-4 font-black text-xs uppercase tracking-widest text-right">Cont. (R$)</th>
                  <th className="py-4 px-4 font-black text-xs uppercase tracking-widest text-right">Comis. (R$)</th>
                  <th className="py-4 px-4 font-black text-xs uppercase tracking-widest text-right">Total</th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800 text-base">{item.monthYear}</td>
                    <td className="py-4 px-4 text-center font-black text-slate-700 text-base">{item.effectiveCount + item.contractedCount + item.commissionedCount}</td>
                    <td className="py-4 px-4 text-right text-slate-600 font-bold">R$ {item.effectiveValue.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-4 text-right text-slate-600 font-bold">R$ {item.contractedValue.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-4 text-right text-slate-600 font-bold">R$ {item.commissionedValue.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-4 text-right font-black text-blue-700 text-lg">R$ {item.totalValue.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => removeEntry(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {data.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="py-5 px-4 font-black text-red-600 text-base uppercase tracking-widest">TOTAL</td>
                    <td className="py-5 px-4 text-center font-black text-slate-900 text-lg underline decoration-red-500 decoration-2">{totals.totalCount}</td>
                    <td className="py-5 px-4 text-right font-black text-slate-800 text-base">R$ {totals.effectiveValue.toLocaleString('pt-BR')}</td>
                    <td className="py-5 px-4 text-right font-black text-slate-800 text-base">R$ {totals.contractedValue.toLocaleString('pt-BR')}</td>
                    <td className="py-5 px-4 text-right font-black text-slate-800 text-base">R$ {totals.commissionedValue.toLocaleString('pt-BR')}</td>
                    <td className="py-5 px-4 text-right font-black text-blue-800 text-xl">R$ {totals.totalValue.toLocaleString('pt-BR')}</td>
                    <td className="py-5 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataForm;

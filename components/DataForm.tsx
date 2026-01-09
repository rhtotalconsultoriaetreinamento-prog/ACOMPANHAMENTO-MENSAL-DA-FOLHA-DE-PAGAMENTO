
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Lançamento Mensal
          </h2>
          <p className="text-sm text-slate-500 mt-1">Detalhe quantidades e valores por vínculo.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Estimado</p>
          <p className="text-xl font-bold text-blue-600">R$ {newEntry.totalValue.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mês / Competência</label>
              <select 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano</label>
              <select 
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Efetivos */}
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
            <h4 className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
              <Users className="w-3 h-3" /> Efetivos (CLT)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Qtd"
                title="Quantidade de Efetivos"
                value={newEntry.effectiveCount || ''}
                onChange={e => setNewEntry({...newEntry, effectiveCount: Number(e.target.value)})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
              />
              <input 
                type="number" 
                placeholder="Valor R$"
                title="Valor Total Efetivos"
                value={newEntry.effectiveValue || ''}
                onChange={e => setNewEntry({...newEntry, effectiveValue: Number(e.target.value)})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contratados */}
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-3">
            <h4 className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Contratados / PJ
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Qtd"
                title="Quantidade de Contratados"
                value={newEntry.contractedCount || ''}
                onChange={e => setNewEntry({...newEntry, contractedCount: Number(e.target.value)})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-emerald-500"
              />
              <input 
                type="number" 
                placeholder="Valor R$"
                title="Valor Total Contratados"
                value={newEntry.contractedValue || ''}
                onChange={e => setNewEntry({...newEntry, contractedValue: Number(e.target.value)})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Comissionados */}
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 space-y-3">
            <h4 className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Comissionados
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Qtd"
                title="Quantidade de Comissionados"
                value={newEntry.commissionedCount || ''}
                onChange={e => setNewEntry({...newEntry, commissionedCount: Number(e.target.value)})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-amber-500"
              />
              <input 
                type="number" 
                placeholder="Valor R$"
                title="Valor Total Comissionados"
                value={newEntry.commissionedValue || ''}
                onChange={e => setNewEntry({...newEntry, commissionedValue: Number(e.target.value)})}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleAdd}
              disabled={newEntry.totalValue <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Adicionar Mês
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Histórico Lançado
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                <tr>
                  <th className="py-2 px-2 font-semibold">Período</th>
                  <th className="py-2 px-2 font-semibold text-right">Efet. (R$)</th>
                  <th className="py-2 px-2 font-semibold text-right">Cont. (R$)</th>
                  <th className="py-2 px-2 font-semibold text-right">Comis. (R$)</th>
                  <th className="py-2 px-2 font-semibold text-right">Total</th>
                  <th className="py-2 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{item.monthYear}</td>
                    <td className="py-3 px-2 text-right text-slate-600">{(item.effectiveValue / 1000).toFixed(1)}k</td>
                    <td className="py-3 px-2 text-right text-slate-600">{(item.contractedValue / 1000).toFixed(1)}k</td>
                    <td className="py-3 px-2 text-right text-slate-600">{(item.commissionedValue / 1000).toFixed(1)}k</td>
                    <td className="py-3 px-2 text-right font-bold text-blue-700">R$ {item.totalValue.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => removeEntry(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataForm;

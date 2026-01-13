
import React, { useState, useEffect, useRef } from 'react';
import { PayrollData, CompanyData } from '../types';
import { Plus, Trash2, Calendar, Users, DollarSign, Calculator, Briefcase, Edit3, CheckCircle, FileDown, Image as ImageIcon, FileText, Building2, Upload } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface DataFormProps {
  onDataChange: (data: PayrollData[]) => void;
  onDeleteEntry?: (id: string) => void;
  data: PayrollData[];
  activeCompany?: CompanyData | null;
}

const DataForm: React.FC<DataFormProps> = ({ onDataChange, onDeleteEntry, data, activeCompany }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState('Janeiro');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  useEffect(() => {
    const total = (newEntry.effectiveValue || 0) + (newEntry.contractedValue || 0) + (newEntry.commissionedValue || 0);
    setNewEntry(prev => ({ ...prev, totalValue: total }));
  }, [newEntry.effectiveValue, newEntry.contractedValue, newEntry.commissionedValue]);

  useEffect(() => {
    const label = selectedMonth === '13º Salário' ? '13º' : selectedMonth;
    setNewEntry(prev => ({ ...prev, monthYear: `${label}/${selectedYear}` }));
  }, [selectedMonth, selectedYear]);

  const handleAddOrUpdate = () => {
    if (newEntry.totalValue <= 0 && (newEntry.effectiveCount + newEntry.contractedCount + newEntry.commissionedCount) <= 0) {
      alert("Por favor, preencha ao menos uma quantidade ou valor.");
      return;
    }
    
    if (editingId) {
      onDataChange(data.map(d => d.id === editingId ? { ...newEntry, id: editingId } : d));
      setEditingId(null);
    } else {
      if (data.some(d => d.monthYear === newEntry.monthYear)) {
        if (!window.confirm(`Já existe um lançamento para ${newEntry.monthYear}. Deseja adicionar mesmo assim?`)) return;
      }

      const entry: PayrollData = {
        ...newEntry,
        id: Math.random().toString(36).substr(2, 9),
      };
      onDataChange([...data, entry]);
    }

    setNewEntry({
      monthYear: `${selectedMonth === '13º Salário' ? '13º' : selectedMonth}/${selectedYear}`,
      totalValue: 0,
      effectiveCount: 0,
      effectiveValue: 0,
      contractedCount: 0,
      contractedValue: 0,
      commissionedCount: 0,
      commissionedValue: 0,
    });
  };

  const handleEdit = (item: PayrollData) => {
    setEditingId(item.id);
    const [month, year] = item.monthYear.split('/');
    setSelectedMonth(month === '13º' ? '13º Salário' : month);
    setSelectedYear(year);
    setNewEntry({
      monthYear: item.monthYear,
      totalValue: item.totalValue,
      effectiveCount: item.effectiveCount,
      effectiveValue: item.effectiveValue,
      contractedCount: item.contractedCount,
      contractedValue: item.contractedValue,
      commissionedCount: item.commissionedCount,
      commissionedValue: item.commissionedValue,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeEntry = (id: string) => {
    if (window.confirm('Deseja excluir este lançamento permanentemente?')) {
      if (onDeleteEntry) {
        onDeleteEntry(id);
      } else {
        onDataChange(data.filter(d => d.id !== id));
      }
      if (editingId === id) setEditingId(null);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importedData = Array.isArray(json) ? json : [json];
        
        const validatedData: PayrollData[] = importedData.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          monthYear: item.monthYear || 'N/A',
          totalValue: Number(item.totalValue) || 0,
          effectiveCount: Number(item.effectiveCount) || 0,
          effectiveValue: Number(item.effectiveValue) || 0,
          contractedCount: Number(item.contractedCount) || 0,
          contractedValue: Number(item.contractedValue) || 0,
          commissionedCount: Number(item.commissionedCount) || 0,
          commissionedValue: Number(item.commissionedValue) || 0,
        }));

        if (window.confirm(`Deseja importar ${validatedData.length} registros?`)) {
          onDataChange(validatedData);
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportAsImage = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `lancamentos_folha_${activeCompany?.name || 'empresa'}.jpg`;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`lancamentos_folha_${activeCompany?.name || 'empresa'}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const totals = data.reduce((acc, curr) => ({
    effectiveValue: acc.effectiveValue + (curr.effectiveValue || 0),
    contractedValue: acc.contractedValue + (curr.contractedValue || 0),
    commissionedValue: acc.commissionedValue + (curr.commissionedValue || 0),
    totalValue: acc.totalValue + (curr.totalValue || 0),
    totalCount: acc.totalCount + ((curr.effectiveCount || 0) + (curr.contractedCount || 0) + (curr.commissionedCount || 0))
  }), { effectiveValue: 0, contractedValue: 0, commissionedValue: 0, totalValue: 0, totalCount: 0 });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            {editingId ? 'Editando Lançamento' : 'Lançamento Mensal'}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Custo Total</p>
          <p className="text-3xl font-black text-blue-600">R$ {newEntry.totalValue.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Competência</label>
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

          <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-4 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-sm font-black text-blue-800 uppercase flex items-center gap-2">
              <Users className="w-4 h-4" /> Efetivos (CLT)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase mb-1 block ml-1">QTD</span>
                <input 
                  type="number" 
                  value={newEntry.effectiveCount || ''}
                  onChange={e => setNewEntry({...newEntry, effectiveCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-base font-bold outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase mb-1 block ml-1">VALOR R$</span>
                <input 
                  type="number" 
                  value={newEntry.effectiveValue || ''}
                  onChange={e => setNewEntry({...newEntry, effectiveValue: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-base font-bold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-4 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-sm font-black text-emerald-800 uppercase flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Contratados / PJ
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">QTD</span>
                <input 
                  type="number" 
                  value={newEntry.contractedCount || ''}
                  onChange={e => setNewEntry({...newEntry, contractedCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-base font-bold outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block ml-1">VALOR R$</span>
                <input 
                  type="number" 
                  value={newEntry.contractedValue || ''}
                  onChange={e => setNewEntry({...newEntry, contractedValue: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-base font-bold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-100 space-y-4 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-sm font-black text-amber-800 uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Comissionados
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase mb-1 block ml-1">QTD</span>
                <input 
                  type="number" 
                  value={newEntry.commissionedCount || ''}
                  onChange={e => setNewEntry({...newEntry, commissionedCount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-base font-bold outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase mb-1 block ml-1">VALOR R$</span>
                <input 
                  type="number" 
                  value={newEntry.commissionedValue || ''}
                  onChange={e => setNewEntry({...newEntry, commissionedValue: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-base font-bold outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <button 
              onClick={handleAddOrUpdate}
              className={`flex-1 ${editingId ? 'bg-emerald-600' : 'bg-blue-600'} text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-lg`}
            >
              {editingId ? 'Salvar Alterações' : 'Adicionar Competência'}
            </button>
          </div>
        </div>

        <div className="mt-12" ref={tableRef}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-black text-slate-400 uppercase flex items-center gap-3 tracking-[0.2em]">
              <Calendar className="w-5 h-5 text-blue-500" /> HISTÓRICO DE LANÇAMENTOS
            </h3>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white border-b border-slate-800">
                <tr>
                  <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest">PERÍODO</th>
                  <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-center text-blue-400">COLABORADORES</th>
                  <th className="py-5 px-6 font-black text-[10px] uppercase tracking-widest text-right">TOTAL (R$)</th>
                  <th className="py-5 px-6 text-right no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum lançamento registrado</td>
                  </tr>
                ) : data.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 text-base">{item.monthYear}</td>
                    <td className="py-4 px-6 text-center font-black text-slate-700 text-base">
                      {(item.effectiveCount || 0) + (item.contractedCount || 0) + (item.commissionedCount || 0)}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-blue-700 text-lg">R$ {(item.totalValue || 0).toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-2 no-print">
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 className="w-5 h-5" /></button>
                      <button onClick={() => removeEntry(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
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

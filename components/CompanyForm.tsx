
import React, { useState, useRef } from 'react';
import { CompanyData } from '../types';
import { Building2, Plus, CheckCircle2, FileText, Trash2, ArrowRight, Upload, X } from 'lucide-react';

interface CompanyFormProps {
  companies: CompanyData[];
  activeCompanyId: string | null;
  onSave: (data: CompanyData) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ companies, activeCompanyId, onSave, onSelect, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<CompanyData, 'id' | 'payrollEntries'>>({
    name: '',
    cnpj: '',
    logo: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCompany: CompanyData = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      cnpj: formData.cnpj,
      logo: formData.logo,
      payrollEntries: []
    };
    onSave(newCompany);
    setIsAdding(false);
    setFormData({ name: '', cnpj: '', logo: '' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Botão de Nova Empresa */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestão de Carteira</h2>
          <p className="text-slate-500 text-sm font-medium">Selecione ou cadastre uma empresa para realizar os lançamentos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${isAdding ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}
        >
          {isAdding ? 'Cancelar' : <><Plus className="w-5 h-5" /> Nova Empresa</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Novo Cadastro</h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Identificação para Análise Gerencial</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    <Building2 className="w-4 h-4 text-blue-500" /> Nome da Empresa
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Minha Empresa LTDA"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    <FileText className="w-4 h-4 text-blue-500" /> CNPJ
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.cnpj}
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Upload className="w-4 h-4 text-blue-500" /> Logo da Empresa
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[180px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden group relative"
                >
                  {formData.logo ? (
                    <>
                      <img src={formData.logo} alt="Preview Logo" className="w-full h-full object-contain p-4" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, logo: '' })); }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                      <p className="text-slate-400 font-bold text-sm">Clique para upload</p>
                      <p className="text-[10px] text-slate-300 font-black uppercase mt-1">PNG ou JPG (Sugerido 200x200)</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-center">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-black text-xl flex items-center gap-3 transition-all shadow-2xl shadow-blue-600/30 active:scale-95"
              >
                Salvar e Ativar Empresa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listagem de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.length === 0 && !isAdding && (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-400">Nenhuma empresa cadastrada</h3>
            <p className="text-slate-400 font-medium">Clique no botão acima para iniciar.</p>
          </div>
        )}
        
        {companies.map(company => (
          <div 
            key={company.id}
            className={`bg-white p-6 rounded-3xl border-2 transition-all cursor-pointer group ${activeCompanyId === company.id ? 'border-blue-600 ring-4 ring-blue-600/10 shadow-xl' : 'border-slate-100 hover:border-slate-300 shadow-sm'}`}
            onClick={() => onSelect(company.id)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 ${activeCompanyId === company.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-50 text-slate-400'}`}>
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 className="w-8 h-8" />
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(company.id); }}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 line-clamp-1">{company.name}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">CNPJ: {company.cnpj}</p>
            
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamentos</p>
                <p className="text-lg font-black text-slate-700">{company.payrollEntries.length}</p>
              </div>
              {activeCompanyId === company.id ? (
                <div className="flex items-center gap-1 text-blue-600 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4" /> ATIVA
                </div>
              ) : (
                <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyForm;

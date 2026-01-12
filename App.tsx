
import React, { useState, useEffect, useMemo } from 'react';
import DataForm from './components/DataForm';
import AnalysisView from './components/AnalysisView';
import UserManagement from './components/UserManagement';
import CompanyForm from './components/CompanyForm';
import Login from './components/Login';
import { PayrollData, AppTab, AuthState, CompanyData } from './types';
import { analyzePayroll } from './services/geminiService';
import { supabaseService } from './services/supabase';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  PlusCircle, 
  Menu,
  X,
  Users,
  Building2,
  Cloud,
  RefreshCw,
  Globe,
  Database
} from 'lucide-react';

const STORAGE_KEYS = {
  COMPANIES: 'gestorpro_companies_data',
  ACTIVE_ID: 'gestorpro_active_company_id',
  AUTH: 'gestorpro_auth_state',
  TAB: 'gestorpro_active_tab'
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null };
  });

  const [allCompanies, setAllCompanies] = useState<CompanyData[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(localStorage.getItem(STORAGE_KEYS.ACTIVE_ID));
  const [activeTab, setActiveTab] = useState<AppTab>((localStorage.getItem(STORAGE_KEYS.TAB) as AppTab) || 'empresa');
  const [analysis, setAnalysis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await supabaseService.getCompanies();
        setAllCompanies(data);
      } catch (err) {
        console.warn("Supabase não configurado. Usando modo Local-First.");
        const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
        if (saved) setAllCompanies(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };
    if (auth.isAuthenticated) loadData();
  }, [auth.isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(allCompanies));
  }, [allCompanies]);

  useEffect(() => {
    if (activeCompanyId) localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeCompanyId);
  }, [activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
  }, [auth]);

  const visibleCompanies = useMemo(() => {
    if (!auth.user) return [];
    if (auth.user.role === 'admin') return allCompanies;
    if (auth.user.role === 'reseller' && auth.user.linkedCompanyId) {
      return allCompanies.filter(c => c.id === auth.user?.linkedCompanyId);
    }
    return [];
  }, [allCompanies, auth.user]);

  const activeCompany = useMemo(() => 
    visibleCompanies.find(c => c.id === activeCompanyId) || null
  , [visibleCompanies, activeCompanyId]);

  const handleLogin = (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => {
    setAuth({ isAuthenticated: true, user: { name, role, linkedCompanyId } });
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
    setActiveCompanyId(null);
    localStorage.clear();
    window.location.reload();
  };

  const handleAddCompany = async (data: CompanyData) => {
    try {
      await supabaseService.saveCompany(data);
    } catch (e) {}
    setAllCompanies(prev => [...prev, data]);
    setActiveCompanyId(data.id);
    setActiveTab('lancamento');
  };

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Excluir empresa permanentemente da nuvem?')) {
      try {
        await supabaseService.deleteCompany(id);
      } catch (e) {}
      setAllCompanies(prev => prev.filter(c => c.id !== id));
      if (activeCompanyId === id) setActiveCompanyId(null);
    }
  };

  const handleUpdatePayroll = async (entries: PayrollData[]) => {
    if (!activeCompanyId) return;
    
    // Identificar qual entrada mudou para salvar no Supabase
    const currentCompany = allCompanies.find(c => c.id === activeCompanyId);
    if (currentCompany) {
       // Se aumentou, salvar a nova
       if (entries.length > currentCompany.payrollEntries.length) {
         const newEntry = entries[entries.length - 1];
         try { await supabaseService.savePayrollEntry(activeCompanyId, newEntry); } catch(e){}
       }
    }

    setAllCompanies(prev => prev.map(c => 
      c.id === activeCompanyId ? { ...c, payrollEntries: entries } : c
    ));
  };

  const handleGenerateAnalysis = async () => {
    if (!activeCompany || activeCompany.payrollEntries.length === 0) return;
    setActiveTab('dashboard');
    setIsGenerating(true);
    setError(undefined);
    try {
      const result = await analyzePayroll(activeCompany.payrollEntries, activeCompany);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-4 border-b border-slate-800">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-black">GestorPro</h1>
          </div>

          <nav className="flex-1 p-5 space-y-2 mt-4">
            {auth.user?.role === 'admin' && (
              <button onClick={() => setActiveTab('empresa')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'empresa' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Building2 className="w-5 h-5" /> Empresas
              </button>
            )}
            <button onClick={() => setActiveTab('lancamento')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'lancamento' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <PlusCircle className="w-5 h-5" /> Dados
            </button>
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            {auth.user?.role === 'admin' && (
              <button onClick={() => setActiveTab('usuarios')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Users className="w-5 h-5" /> Revendas
              </button>
            )}
          </nav>

          <div className="p-6 border-t border-slate-800 space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Sincronizado na Nuvem</span>
              </div>
              <p className="text-xs font-black text-slate-200 truncate">{auth.user?.name}</p>
              <button onClick={handleLogout} className="mt-3 w-full text-[10px] text-red-400 font-black py-2 hover:bg-red-500/10 rounded-lg transition-all uppercase">Encerrar Sessão</button>
            </div>
            <button 
              onClick={handleGenerateAnalysis} 
              disabled={isGenerating || !activeCompany} 
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'GERAR INSIGHTS AI'}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white border-b border-slate-200 p-6 md:px-12 md:py-8 flex justify-between items-center sticky top-0 z-40">
           <div className="flex items-center gap-6">
             <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-xl"><Menu /></button>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'empresa' && 'Empresas'}
                {activeTab === 'lancamento' && 'Lançamentos'}
                {activeTab === 'dashboard' && 'Estratégia'}
                {activeTab === 'usuarios' && 'Acessos'}
             </h2>
           </div>
           
           <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Empresa Selecionada</p>
                <p className="text-sm font-black text-slate-800">{activeCompany?.name || '---'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                {activeCompany?.name?.charAt(0) || <Database className="w-5 h-5" />}
              </div>
           </div>
        </header>

        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="font-black text-slate-500 uppercase text-xs tracking-widest">Acessando Nuvem...</p>
            </div>
          ) : (
            <>
              {activeTab === 'empresa' && <CompanyForm companies={visibleCompanies} activeCompanyId={activeCompanyId} onSave={handleAddCompany} onSelect={(id) => {setActiveCompanyId(id); setActiveTab('lancamento');}} onDelete={handleDeleteCompany} />}
              {activeTab === 'lancamento' && activeCompany && <DataForm onDataChange={handleUpdatePayroll} data={activeCompany.payrollEntries} activeCompany={activeCompany} />}
              {activeTab === 'dashboard' && activeCompany && <AnalysisView data={activeCompany.payrollEntries} analysis={analysis} isGenerating={isGenerating} error={error} activeCompany={activeCompany} />}
              {activeTab === 'usuarios' && auth.user?.role === 'admin' && <UserManagement companies={allCompanies} />}
            </>
          )}
        </div>
      </main>

      {/* Menu Mobile Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-slate-900/60 z-[45] md:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
};

export default App;

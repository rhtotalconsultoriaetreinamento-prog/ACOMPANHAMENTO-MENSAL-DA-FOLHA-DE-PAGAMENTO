
import React, { useState, useEffect, useMemo } from 'react';
import DataForm from './components/DataForm';
import AnalysisView from './components/AnalysisView';
import UserManagement from './components/UserManagement';
import CompanyForm from './components/CompanyForm';
import Login from './components/Login';
import { PayrollData, AppTab, AuthState, CompanyData } from './types';
import { analyzePayroll } from './services/geminiService';
import { GLOBAL_COMPANIES_DATA } from './services/authService';
import { 
  BrainCircuit, 
  ChevronRight, 
  LayoutDashboard, 
  PlusCircle, 
  Menu,
  X,
  Users,
  LogOut,
  Building2,
  ChevronDown,
  CloudCog,
  Copy,
  Download,
  Upload,
  RefreshCcw,
  Check,
  Globe
} from 'lucide-react';

const STORAGE_KEYS = {
  COMPANIES: 'gestorpro_companies_data',
  ACTIVE_ID: 'gestorpro_active_company_id',
  AUTH: 'gestorpro_auth_state',
  ANALYSIS: 'gestorpro_last_analysis',
  TAB: 'gestorpro_active_tab',
  USERS: 'gestorpro_users_data'
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null };
  });

  const [allCompanies, setAllCompanies] = useState<CompanyData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  });

  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TAB);
    return (saved as AppTab) || 'empresa';
  });

  const [analysis, setAnalysis] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ANALYSIS) || '';
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCode, setSyncCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // LOGICA PARA AUTO-CARREGAR EMPRESA DO USUARIO GLOBAL
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.linkedCompanyId) {
      const exists = allCompanies.some(c => c.id === auth.user?.linkedCompanyId);
      if (!exists) {
        const globalCompany = GLOBAL_COMPANIES_DATA.find(c => c.id === auth.user?.linkedCompanyId);
        if (globalCompany) {
          setAllCompanies(prev => [...prev, globalCompany]);
          setActiveCompanyId(globalCompany.id);
        }
      }
    }
  }, [auth.isAuthenticated, auth.user, allCompanies]);

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

  useEffect(() => {
    if (auth.user?.role === 'reseller' && auth.user.linkedCompanyId) {
      setActiveCompanyId(auth.user.linkedCompanyId);
      if (activeTab === 'empresa') setActiveTab('lancamento');
    }
  }, [auth.user]);

  const activeCompany = useMemo(() => 
    visibleCompanies.find(c => c.id === activeCompanyId) || null
  , [visibleCompanies, activeCompanyId]);

  const handleLogin = (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => {
    setAuth({ isAuthenticated: true, user: { name, role, linkedCompanyId } });
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
    setActiveCompanyId(null);
    setAnalysis('');
    setActiveTab('empresa');
    localStorage.clear(); // Limpa para garantir segurança em acessos públicos
    window.location.reload();
  };

  const handleAddCompany = (data: CompanyData) => {
    setAllCompanies(prev => [...prev, data]);
    setActiveCompanyId(data.id);
    setActiveTab('lancamento');
  };

  const handleDeleteCompany = (id: string) => {
    if (window.confirm('Excluir empresa?')) {
      setAllCompanies(prev => prev.filter(c => c.id !== id));
      if (activeCompanyId === id) setActiveCompanyId(null);
    }
  };

  const handleSelectCompany = (id: string) => {
    setActiveCompanyId(id);
    setActiveTab('lancamento');
    setAnalysis('');
  };

  const handleUpdatePayroll = (entries: PayrollData[]) => {
    if (!activeCompanyId) return;
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
      setError(err.message || 'Erro inesperado.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-slate-800">GestorPro</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-4 border-b border-slate-800">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-black">GestorPro</h1>
          </div>

          <nav className="flex-1 p-5 space-y-2 mt-4">
            {auth.user?.role === 'admin' && (
              <button onClick={() => {setActiveTab('empresa'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'empresa' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Building2 className="w-6 h-6" /> Empresas
              </button>
            )}
            <button onClick={() => setActiveTab('lancamento')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'lancamento' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              <PlusCircle className="w-6 h-6" /> Lançamento
            </button>
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'dashboard' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-6 h-6" /> Dashboard
            </button>
            {auth.user?.role === 'admin' && (
              <button onClick={() => setActiveTab('usuarios')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${activeTab === 'usuarios' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Users className="w-6 h-6" /> Revendas
              </button>
            )}
          </nav>

          <div className="p-6 border-t border-slate-800 space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Acesso em Nuvem</span>
              </div>
              <p className="text-xs font-black text-slate-200 truncate">{auth.user?.name}</p>
              <button onClick={handleLogout} className="mt-3 w-full text-[10px] text-red-400 font-black py-2 bg-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-all">SAIR</button>
            </div>
            <button onClick={handleGenerateAnalysis} disabled={isGenerating} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20">{isGenerating ? 'Analisando...' : 'Atualizar Análise'}</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {activeTab === 'empresa' && 'Gestão'}
            {activeTab === 'lancamento' && 'Dados'}
            {activeTab === 'dashboard' && 'Insights'}
            {activeTab === 'usuarios' && 'Acessos'}
          </h2>
          <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 flex items-center gap-4 text-slate-800 shadow-sm">
             <div className="bg-slate-50 p-2 rounded-xl w-12 h-12 flex items-center justify-center border border-slate-100">
                {activeCompany?.logo ? <img src={activeCompany.logo} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="text-blue-600" />}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase">Contexto Ativo</p>
                <p className="font-black text-lg truncate">{activeCompany?.name || 'Selecione...'}</p>
              </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'empresa' && <CompanyForm companies={visibleCompanies} activeCompanyId={activeCompanyId} onSave={handleAddCompany} onSelect={handleSelectCompany} onDelete={handleDeleteCompany} />}
          {activeTab === 'lancamento' && activeCompany && <DataForm onDataChange={handleUpdatePayroll} data={activeCompany.payrollEntries} activeCompany={activeCompany} />}
          {activeTab === 'dashboard' && activeCompany && <AnalysisView data={activeCompany.payrollEntries} analysis={analysis} isGenerating={isGenerating} error={error} activeCompany={activeCompany} />}
          {activeTab === 'usuarios' && auth.user?.role === 'admin' && <UserManagement companies={allCompanies} />}
        </div>
      </main>
    </div>
  );
};

export default App;

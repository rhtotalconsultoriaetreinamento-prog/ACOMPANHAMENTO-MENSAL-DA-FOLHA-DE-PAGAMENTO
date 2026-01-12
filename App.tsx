
import React, { useState, useEffect, useMemo } from 'react';
import DataForm from './components/DataForm';
import AnalysisView from './components/AnalysisView';
import UserManagement from './components/UserManagement';
import CompanyForm from './components/CompanyForm';
import Login from './components/Login';
import { PayrollData, AppTab, AuthState, CompanyData } from './types';
import { analyzePayroll } from './services/geminiService';
import { supabaseService } from './services/supabase';
import { GLOBAL_COMPANIES_DATA } from './services/authService';
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
  Database,
  ShieldCheck,
  LogOut
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

  // Carregar dados iniciais com merge de dados globais (importante para rhtotal@gmail.com)
  useEffect(() => {
    const loadData = async () => {
      let loadedCompanies: CompanyData[] = [];
      
      try {
        const cloudData = await supabaseService.getCompanies();
        if (cloudData && cloudData.length > 0) {
          loadedCompanies = cloudData;
        } else {
          const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
          loadedCompanies = saved ? JSON.parse(saved) : [];
        }
      } catch (err) {
        console.warn("Supabase Offline, usando cache local.");
        const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
        loadedCompanies = saved ? JSON.parse(saved) : [];
      }

      // Merge Garantido: Se as empresas globais não estiverem na lista, adiciona-as
      // Isso garante que os dados do rhtotal sempre apareçam na primeira vez
      const finalCompanies = [...loadedCompanies];
      GLOBAL_COMPANIES_DATA.forEach(global => {
        if (!finalCompanies.some(c => c.id === global.id)) {
          finalCompanies.push(global);
        }
      });

      setAllCompanies(finalCompanies);
      setIsLoading(false);
    };

    if (auth.isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  // Persistência de Dados
  useEffect(() => {
    if (allCompanies.length > 0) {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(allCompanies));
    }
  }, [allCompanies]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeCompanyId);
    }
  }, [activeCompanyId]);

  // Filtro de visibilidade de empresas
  const visibleCompanies = useMemo(() => {
    if (!auth.user) return [];
    if (auth.user.role === 'admin') return allCompanies;
    if (auth.user.linkedCompanyId) {
      return allCompanies.filter(c => c.id === auth.user?.linkedCompanyId);
    }
    return [];
  }, [allCompanies, auth.user]);

  // AUTO-SELEÇÃO DE EMPRESA (Evita o "Unexpected Error")
  useEffect(() => {
    if (auth.isAuthenticated && !activeCompanyId) {
      if (auth.user?.linkedCompanyId) {
        setActiveCompanyId(auth.user.linkedCompanyId);
      } else if (visibleCompanies.length > 0) {
        setActiveCompanyId(visibleCompanies[0].id);
      }
    }
  }, [auth.isAuthenticated, auth.user, activeCompanyId, visibleCompanies]);

  const activeCompany = useMemo(() => 
    visibleCompanies.find(c => c.id === activeCompanyId) || null
  , [visibleCompanies, activeCompanyId]);

  const handleLogin = (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => {
    const newState = { isAuthenticated: true, user: { name, role, linkedCompanyId } };
    setAuth(newState);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newState));
    
    // Se for usuário vinculado, já ativa a empresa dele
    if (linkedCompanyId) {
      setActiveCompanyId(linkedCompanyId);
      setActiveTab('lancamento');
    } else {
      setActiveTab('empresa');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    localStorage.removeItem(STORAGE_KEYS.TAB);
    window.location.href = window.location.origin;
  };

  const handleUpdatePayroll = async (entries: PayrollData[]) => {
    if (!activeCompanyId) return;
    setAllCompanies(prev => prev.map(c => 
      c.id === activeCompanyId ? { ...c, payrollEntries: entries } : c
    ));
    
    try {
      const entry = entries[entries.length - 1];
      if (entry) await supabaseService.savePayrollEntry(activeCompanyId, entry);
    } catch(e){}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-black">
        <BrainCircuit className="w-16 h-16 text-blue-500 animate-bounce mb-6" />
        <p className="uppercase tracking-[0.3em] text-xs opacity-50">Autenticando rhtotal@gmail.com...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Visível para todos os usuários cadastrados */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-4 border-b border-slate-800">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-black">GestorPro</h1>
          </div>

          <nav className="flex-1 p-5 space-y-2 mt-4">
            {/* Empresa agora visível para todos para facilitar navegação */}
            <button onClick={() => {setActiveTab('empresa'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'empresa' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Building2 className="w-5 h-5" /> Empresas
            </button>
            <button onClick={() => {setActiveTab('lancamento'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'lancamento' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              <PlusCircle className="w-5 h-5" /> Lançamentos
            </button>
            <button onClick={() => {setActiveTab('dashboard'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            
            {/* Gerenciamento de Usuários apenas para Admin */}
            {auth.user?.role === 'admin' && (
              <button onClick={() => {setActiveTab('usuarios'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Users className="w-5 h-5" /> Usuários
              </button>
            )}
          </nav>

          <div className="p-6 border-t border-slate-800">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 mb-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Acesso Identificado</p>
              <p className="text-xs font-black text-slate-200 truncate">{auth.user?.name}</p>
              <button onClick={handleLogout} className="mt-4 w-full text-[10px] text-red-400 font-black py-2 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-2">
                <LogOut className="w-3 h-3" /> SAIR
              </button>
            </div>
            <button 
              onClick={handleGenerateAnalysis} 
              disabled={isGenerating || !activeCompany} 
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-600/20"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'GERAR INSIGHTS AI'}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-40">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-xl"><Menu /></button>
             <h2 className="text-2xl font-black text-slate-900">
                {activeTab === 'empresa' && 'Empresas'}
                {activeTab === 'lancamento' && 'Folha de Pagamento'}
                {activeTab === 'dashboard' && 'Dashboard Estratégico'}
                {activeTab === 'usuarios' && 'Gestão de Usuários'}
             </h2>
           </div>
           <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa Ativa</p>
              <p className="text-sm font-black text-slate-800">{activeCompany?.name || 'Selecione uma empresa'}</p>
           </div>
        </header>

        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {activeTab === 'empresa' && (
            <CompanyForm 
              companies={visibleCompanies} 
              activeCompanyId={activeCompanyId} 
              onSave={(data) => {
                setAllCompanies(prev => [...prev, data]);
                setActiveCompanyId(data.id);
                setActiveTab('lancamento');
              }} 
              onSelect={(id) => {setActiveCompanyId(id); setActiveTab('lancamento');}} 
              onDelete={(id) => {
                setAllCompanies(prev => prev.filter(c => c.id !== id));
                if (activeCompanyId === id) setActiveCompanyId(null);
              }} 
            />
          )}
          {activeTab === 'lancamento' && activeCompany && (
            <DataForm onDataChange={handleUpdatePayroll} data={activeCompany.payrollEntries} activeCompany={activeCompany} />
          )}
          {activeTab === 'dashboard' && activeCompany && (
            <AnalysisView data={activeCompany.payrollEntries} analysis={analysis} isGenerating={isGenerating} error={error} activeCompany={activeCompany} />
          )}
          {activeTab === 'usuarios' && auth.user?.role === 'admin' && (
            <UserManagement companies={allCompanies} />
          )}
          
          {/* Failsafe: Se não houver empresa selecionada em abas de dados */}
          {(activeTab === 'lancamento' || activeTab === 'dashboard') && !activeCompany && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <h3 className="text-xl font-black text-slate-400">Nenhuma empresa ativa para lançamentos</h3>
               <button onClick={() => setActiveTab('empresa')} className="mt-6 text-blue-600 font-bold hover:underline">Ir para seleção de empresas</button>
            </div>
          )}
        </div>
      </main>
      {isMenuOpen && <div className="fixed inset-0 bg-slate-900/60 z-[45] md:hidden" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
};

export default App;

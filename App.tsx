
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
  Users,
  Building2,
  RefreshCw,
  LogOut,
  Database,
  CloudOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const STORAGE_KEYS = {
  COMPANIES: 'gestorpro_companies_data',
  ACTIVE_ID: 'gestorpro_active_company_id',
  AUTH: 'gestorpro_auth_state',
  TAB: 'gestorpro_active_tab',
  COLLAPSED: 'gestorpro_sidebar_collapsed'
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
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.COLLAPSED) === 'true');
  
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'error' | 'local'>('connecting');

  const loadData = async () => {
    setCloudStatus('connecting');
    try {
      const connection = await supabaseService.testConnection();
      
      if (connection.success) {
        setCloudStatus('connected');
        const cloudData = await supabaseService.getCompanies();
        setAllCompanies(cloudData);
      } else {
        setCloudStatus('local');
        const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
        setAllCompanies(saved ? JSON.parse(saved) : []);
      }
    } catch (e) {
      setCloudStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) loadData();
    else setIsLoading(false);
  }, [auth.isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLAPSED, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (allCompanies.length > 0) {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(allCompanies));
    }
  }, [allCompanies]);

  const visibleCompanies = useMemo(() => {
    if (!auth.user) return [];
    if (auth.user.role === 'admin') return allCompanies;
    return allCompanies.filter(c => c.id === auth.user?.linkedCompanyId);
  }, [allCompanies, auth.user]);

  const activeCompany = useMemo(() => 
    visibleCompanies.find(c => c.id === activeCompanyId) || null
  , [visibleCompanies, activeCompanyId]);

  useEffect(() => {
    const triggerAnalysis = async () => {
      if (activeCompany && activeCompany.payrollEntries.length > 0) {
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
      } else {
        setAnalysis('');
      }
    };

    if (activeTab === 'dashboard') {
      triggerAnalysis();
    }
  }, [activeTab, activeCompany]);

  const handleLogin = (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => {
    const newState = { isAuthenticated: true, user: { name, role, linkedCompanyId } };
    setAuth(newState as AuthState);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newState));
    if (linkedCompanyId) {
      setActiveCompanyId(linkedCompanyId);
      setActiveTab('lancamento');
    } else {
      setActiveTab('empresa');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleUpdatePayroll = async (entries: PayrollData[]) => {
    if (!activeCompanyId) return;
    
    // Identifica se houve adição ou edição baseada no histórico local
    const currentEntries = activeCompany?.payrollEntries || [];
    const changedEntry = entries.find(e => {
      const existing = currentEntries.find(ce => ce.id === e.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(e);
    });

    setAllCompanies(prev => prev.map(c => 
      c.id === activeCompanyId ? { ...c, payrollEntries: entries } : c
    ));

    if (changedEntry) {
      try { 
        await supabaseService.savePayrollEntry(activeCompanyId, changedEntry); 
      } catch(e) {
        console.error("Erro ao salvar no banco:", e);
      }
    }
  };

  const handleDeletePayrollEntry = async (entryId: string) => {
    if (!activeCompanyId) return;
    
    try {
      await supabaseService.deletePayrollEntry(entryId);
      setAllCompanies(prev => prev.map(c => 
        c.id === activeCompanyId 
          ? { ...c, payrollEntries: c.payrollEntries.filter(e => e.id !== entryId) } 
          : c
      ));
    } catch (e) {
      alert("Erro ao excluir lançamento na nuvem.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-black">
        <BrainCircuit className="w-16 h-16 text-blue-500 animate-bounce mb-6" />
        <p className="uppercase tracking-[0.3em] text-[10px] opacity-50 text-center">Sincronizando Nuvem...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 md:static ${isCollapsed ? 'w-20' : 'w-72'} ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} border-b border-slate-800 transition-all`}>
            <BrainCircuit className="w-8 h-8 text-blue-500 shrink-0" />
            {!isCollapsed && <h1 className="text-xl font-black truncate">GestorPro</h1>}
          </div>

          <nav className="flex-1 p-3 space-y-1 mt-4">
            {[
              { id: 'empresa', label: 'Empresas', icon: Building2 },
              { id: 'lancamento', label: 'Lançamentos', icon: PlusCircle },
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              ...(auth.user?.role === 'admin' ? [{ id: 'usuarios', label: 'Usuários', icon: Users }] : [])
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => {setActiveTab(tab.id as AppTab); setIsMenuOpen(false);}} 
                title={isCollapsed ? tab.label : ''}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-5'} py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <tab.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-bold truncate">{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-800">
            <div className={`p-3 rounded-xl border mb-2 text-center transition-all ${
              cloudStatus === 'connected' ? 'bg-blue-500/10 border-blue-500/30' : 
              cloudStatus === 'error' ? 'bg-red-500/10 border-red-500/30' : 
              'bg-amber-500/10 border-amber-500/30'
            }`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-2 ${
                cloudStatus === 'connected' ? 'text-blue-400' : 
                cloudStatus === 'error' ? 'text-red-400' : 
                'text-amber-500'
              }`}>
                {cloudStatus === 'connected' ? <Database className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                {!isCollapsed && (cloudStatus === 'connected' ? 'Nuvem Ativa' : 'Offline')}
              </p>
              {!isCollapsed && <p className="text-[10px] font-black text-slate-200 truncate">{auth.user?.name}</p>}
              
              <button onClick={handleLogout} className={`mt-2 w-full text-[10px] text-red-400 font-black py-2 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-2 uppercase`}>
                <LogOut className="w-3 h-3" />
                {!isCollapsed && <span>Sair</span>}
              </button>
            </div>
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex w-full items-center justify-center py-2 text-slate-500 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen scroll-smooth">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-xl"><Menu /></button>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {activeTab === 'empresa' && 'Empresas'}
                {activeTab === 'lancamento' && 'Folha de Pagamento'}
                {activeTab === 'dashboard' && 'Estratégia RH'}
                {activeTab === 'usuarios' && 'Controle de Usuários'}
             </h2>
           </div>
           <div className="flex items-center gap-3">
             {activeCompany && !isCollapsed && (
               <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                 <Building2 className="w-4 h-4 text-blue-600" />
                 <span className="text-xs font-black text-slate-600 uppercase truncate max-w-[150px]">{activeCompany.name}</span>
               </div>
             )}
             <button onClick={loadData} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'empresa' && (
            <CompanyForm 
              companies={visibleCompanies} 
              activeCompanyId={activeCompanyId} 
              onSave={async (data) => {
                await supabaseService.saveCompany(data);
                setAllCompanies(prev => [...prev, data]);
              }} 
              onSelect={(id) => {setActiveCompanyId(id); setActiveTab('lancamento');}} 
              onDelete={async (id) => {
                if (window.confirm('Excluir empresa permanentemente da nuvem?')) {
                  try {
                    await supabaseService.deleteCompany(id);
                    setAllCompanies(prev => prev.filter(c => c.id !== id));
                    if (activeCompanyId === id) setActiveCompanyId(null);
                  } catch (e) {
                    alert("Erro ao excluir empresa.");
                  }
                }
              }} 
            />
          )}
          {activeTab === 'lancamento' && activeCompany && (
            <DataForm 
              onDataChange={handleUpdatePayroll} 
              onDeleteEntry={handleDeletePayrollEntry}
              data={activeCompany.payrollEntries} 
              activeCompany={activeCompany} 
            />
          )}
          {activeTab === 'dashboard' && activeCompany && (
            <AnalysisView data={activeCompany.payrollEntries} analysis={analysis} isGenerating={isGenerating} error={error} activeCompany={activeCompany} />
          )}
          {activeTab === 'usuarios' && auth.user?.role === 'admin' && (
            <UserManagement companies={allCompanies} />
          )}
        </div>
      </main>
      {isMenuOpen && <div className="fixed inset-0 bg-slate-900/60 z-[45] md:hidden" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
};

export default App;

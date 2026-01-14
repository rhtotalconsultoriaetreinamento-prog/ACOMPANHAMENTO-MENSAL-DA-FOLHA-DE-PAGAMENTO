
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

const RHTotalLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4" className="text-cyan-500/30" />
    <circle cx="35" cy="30" r="8" fill="currentColor" className="text-cyan-600" />
    <circle cx="65" cy="30" r="8" fill="currentColor" className="text-teal-600" />
    <path d="M20 60C20 45 40 45 50 60C60 45 80 45 80 60C80 75 60 75 50 60C40 75 20 75 20 60Z" fill="currentColor" className="text-cyan-500" />
  </svg>
);

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null };
  });

  const [allCompanies, setAllCompanies] = useState<CompanyData[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(localStorage.getItem(STORAGE_KEYS.ACTIVE_ID));
  
  // Abre no dashboard se houver empresa, senão na lista de empresas
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const hasCompany = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    return hasCompany ? 'dashboard' : 'empresa';
  });

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
    if (activeCompanyId) localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeCompanyId);
  }, [activeCompanyId]);

  const visibleCompanies = useMemo(() => {
    if (!auth.user) return [];
    if (auth.user.role === 'admin') return allCompanies;
    return allCompanies.filter(c => c.id === auth.user?.linkedCompanyId);
  }, [allCompanies, auth.user]);

  const activeCompany = useMemo(() => 
    visibleCompanies.find(c => c.id === activeCompanyId) || null
  , [visibleCompanies, activeCompanyId]);

  const handleGenerateAnalysis = async () => {
    if (!activeCompany || activeCompany.payrollEntries.length === 0) {
      alert("Lance dados na folha antes de gerar a análise.");
      return;
    }
    
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

  const handleLogin = (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => {
    const newState = { isAuthenticated: true, user: { name, role, linkedCompanyId } };
    setAuth(newState as AuthState);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newState));
    if (linkedCompanyId) {
      setActiveCompanyId(linkedCompanyId);
      setActiveTab('dashboard');
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
    setAllCompanies(prev => prev.map(c => 
      c.id === activeCompanyId ? { ...c, payrollEntries: entries } : c
    ));
    const currentEntries = activeCompany?.payrollEntries || [];
    const changedEntry = entries.find(e => {
      const existing = currentEntries.find(ce => ce.id === e.id);
      return !existing || JSON.stringify(existing) !== JSON.stringify(e);
    });
    if (changedEntry) {
      try { await supabaseService.savePayrollEntry(activeCompanyId, changedEntry); } catch(e) {}
    }
  };

  const handleDeletePayrollEntry = async (entryId: string) => {
    if (!activeCompanyId) return;
    try {
      await supabaseService.deletePayrollEntry(entryId);
      setAllCompanies(prev => prev.map(c => 
        c.id === activeCompanyId ? { ...c, payrollEntries: c.payrollEntries.filter(e => e.id !== entryId) } : c
      ));
    } catch (e) {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-black">
        <RHTotalLogo className="w-20 h-20 text-cyan-500 animate-pulse mb-6" />
        <p className="uppercase tracking-[0.3em] text-[10px] opacity-50 text-center">Iniciando RH TOTAL...</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 md:static ${isCollapsed ? 'w-20' : 'w-72'} ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} border-b border-slate-800 transition-all`}>
            <RHTotalLogo className="w-8 h-8 text-cyan-400 shrink-0" />
            {!isCollapsed && <h1 className="text-xl font-black truncate tracking-tighter uppercase italic">RH TOTAL</h1>}
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
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-5'} py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <tab.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-bold truncate uppercase text-xs">{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-800">
            <div className={`p-3 rounded-xl border mb-2 text-center transition-all ${cloudStatus === 'connected' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-2 ${cloudStatus === 'connected' ? 'text-cyan-400' : 'text-amber-500'}`}>
                {cloudStatus === 'connected' ? <Database className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                {!isCollapsed && (cloudStatus === 'connected' ? 'Sincronizado' : 'Modo Local')}
              </p>
              {!isCollapsed && <p className="text-[10px] font-black text-slate-200 truncate">{auth.user?.name}</p>}
              <button onClick={handleLogout} className="mt-2 w-full text-[10px] text-red-400 font-black py-2 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-2 uppercase">
                <LogOut className="w-3 h-3" /> {!isCollapsed && <span>Sair</span>}
              </button>
            </div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex w-full items-center justify-center py-2 text-slate-500 hover:text-white transition-colors">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen scroll-smooth">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 bg-slate-100 rounded-xl"><Menu /></button>
             <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  {activeTab === 'empresa' && 'Gestão de Carteira'}
                  {activeTab === 'lancamento' && 'Lançamentos Mensais'}
                  {activeTab === 'dashboard' && 'Dashboard Estratégico'}
                  {activeTab === 'usuarios' && 'Controle de Acessos'}
                </h2>
                {activeCompany && (
                  <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {activeCompany.name}
                  </span>
                )}
             </div>
           </div>
           <div className="flex items-center gap-3">
             <button onClick={loadData} className="p-2 text-slate-400 hover:text-cyan-600 transition-all"><RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'empresa' && (
            <CompanyForm companies={visibleCompanies} activeCompanyId={activeCompanyId} onSave={async (data) => { await supabaseService.saveCompany(data); setAllCompanies(prev => [...prev, data]); }} onSelect={(id) => {setActiveCompanyId(id); setActiveTab('dashboard');}} onDelete={async (id) => { if (window.confirm('Excluir empresa?')) { await supabaseService.deleteCompany(id); setAllCompanies(prev => prev.filter(c => c.id !== id)); if (activeCompanyId === id) setActiveCompanyId(null); } }} />
          )}
          {activeTab === 'lancamento' && activeCompany && (
            <DataForm onDataChange={handleUpdatePayroll} onDeleteEntry={handleDeletePayrollEntry} data={activeCompany.payrollEntries} activeCompany={activeCompany} />
          )}
          {activeTab === 'dashboard' && activeCompany && (
            <AnalysisView data={activeCompany.payrollEntries} analysis={analysis} isGenerating={isGenerating} error={error} activeCompany={activeCompany} onGenerateAnalysis={handleGenerateAnalysis} />
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

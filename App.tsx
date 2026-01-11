
import React, { useState, useEffect, useMemo } from 'react';
import DataForm from './components/DataForm';
import AnalysisView from './components/AnalysisView';
import UserManagement from './components/UserManagement';
import CompanyForm from './components/CompanyForm';
import Login from './components/Login';
import { PayrollData, AppTab, AuthState, CompanyData } from './types';
import { analyzePayroll } from './services/geminiService';
import { 
  BrainCircuit, 
  ChevronRight, 
  LayoutDashboard, 
  PlusCircle, 
  Info,
  Menu,
  X,
  Users,
  LogOut,
  Building2,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

// Chaves para o LocalStorage
const STORAGE_KEYS = {
  COMPANIES: 'gestorpro_companies_data',
  ACTIVE_ID: 'gestorpro_active_company_id',
  AUTH: 'gestorpro_auth_state'
};

const App: React.FC = () => {
  // Inicialização do estado com dados do LocalStorage
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : { isAuthenticated: false, user: null };
  });

  const [companies, setCompanies] = useState<CompanyData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
  });

  const [activeTab, setActiveTab] = useState<AppTab>('empresa');
  const [analysis, setAnalysis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Efeito para salvar dados sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeCompanyId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
  }, [auth]);

  // Helper para obter a empresa ativa
  const activeCompany = useMemo(() => 
    companies.find(c => c.id === activeCompanyId) || null
  , [companies, activeCompanyId]);

  // Se o usuário logar e não tiver empresa selecionada, mantém em 'empresa'
  useEffect(() => {
    if (auth.isAuthenticated && !activeCompanyId && companies.length === 0) {
      setActiveTab('empresa');
    }
  }, [auth.isAuthenticated, activeCompanyId, companies.length]);

  const handleLogin = (name: string, role: 'admin' | 'reseller') => {
    setAuth({
      isAuthenticated: true,
      user: { name, role }
    });
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
    // Opcional: não limpamos companies no logout para que fiquem salvas no dispositivo
  };

  const handleAddCompany = (data: CompanyData) => {
    setCompanies(prev => [...prev, data]);
    setActiveCompanyId(data.id);
    setActiveTab('lancamento');
  };

  const handleDeleteCompany = (id: string) => {
    if (window.confirm('Excluir esta empresa e todos os seus lançamentos?')) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (activeCompanyId === id) {
        setActiveCompanyId(null);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
      }
    }
  };

  const handleSelectCompany = (id: string) => {
    setActiveCompanyId(id);
    setActiveTab('lancamento');
    setAnalysis(''); // Limpa análise ao trocar de contexto
  };

  const handleUpdatePayroll = (entries: PayrollData[]) => {
    if (!activeCompanyId) return;
    setCompanies(prev => prev.map(c => 
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
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample = () => {
    const exampleCompany: CompanyData = {
      id: 'example-1',
      name: 'Exemplo Corp Solutions',
      cnpj: '12.345.678/0001-90',
      payrollEntries: [
        { id: '1', monthYear: 'Outubro/2024', totalValue: 125000, effectiveCount: 30, effectiveValue: 90000, contractedCount: 5, contractedValue: 20000, commissionedCount: 10, commissionedValue: 15000 },
        { id: '2', monthYear: 'Novembro/2024', totalValue: 142000, effectiveCount: 32, effectiveValue: 96000, contractedCount: 4, contractedValue: 16000, commissionedCount: 15, commissionedValue: 30000 },
        { id: '3', monthYear: 'Dezembro/2024', totalValue: 165000, effectiveCount: 35, effectiveValue: 105000, contractedCount: 3, contractedValue: 12000, commissionedCount: 20, commissionedValue: 48000 },
      ]
    };
    setCompanies(prev => {
      if (prev.some(c => c.id === 'example-1')) return prev;
      return [...prev, exampleCompany];
    });
    setActiveCompanyId(exampleCompany.id);
    setActiveTab('dashboard');
    setAnalysis('');
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Mobile Toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-slate-800">GestorPro</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar / Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-4 border-b border-slate-800">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/10">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">GestorPro</h1>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mt-1">Strategic HR</p>
            </div>
          </div>

          <nav className="flex-1 p-5 space-y-3 mt-4">
            <button 
              onClick={() => {setActiveTab('empresa'); setIsMenuOpen(false);}}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'empresa' ? 'bg-blue-600 text-white font-black shadow-2xl shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Building2 className="w-6 h-6" />
              Empresas
              {companies.length === 0 && <span className="w-2 h-2 bg-red-500 rounded-full ml-auto animate-pulse" />}
            </button>
            <button 
              onClick={() => {
                if (!activeCompanyId) {
                  alert('Por favor, selecione ou cadastre uma empresa primeiro.');
                  setActiveTab('empresa');
                } else {
                  setActiveTab('lancamento');
                }
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'lancamento' ? 'bg-blue-600 text-white font-black shadow-2xl shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <PlusCircle className="w-6 h-6" />
              Lançamento Mensal
            </button>
            <button 
              onClick={() => {
                if (!activeCompanyId) {
                  alert('Por favor, selecione ou cadastre uma empresa primeiro.');
                  setActiveTab('empresa');
                } else {
                  setActiveTab('dashboard');
                }
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-black shadow-2xl shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              Dashboard
            </button>

            {auth.user?.role === 'admin' && (
              <button 
                onClick={() => {setActiveTab('usuarios'); setIsMenuOpen(false);}}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 text-white font-black shadow-2xl shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Users className="w-6 h-6" />
                Gerenciar Revendas
              </button>
            )}
          </nav>

          <div className="p-6 border-t border-slate-800 space-y-5">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Logado como</p>
              <p className="text-sm font-black text-slate-200 truncate">{auth.user?.name}</p>
              <button 
                onClick={handleLogout}
                className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-white hover:bg-red-500 transition-all font-black py-3 bg-red-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" /> SAIR DO SISTEMA
              </button>
            </div>

            <button 
              onClick={handleGenerateAnalysis}
              disabled={!activeCompany || activeCompany.payrollEntries.length === 0 || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20"
            >
              {isGenerating ? 'Analisando...' : 'Atualizar Análise IA'}
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={loadExample}
              className="w-full text-[10px] text-slate-600 hover:text-blue-400 font-black uppercase tracking-widest transition-colors"
            >
              Carregar Dados Exemplo
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {activeTab === 'empresa' && 'Gestão de Carteira'}
              {activeTab === 'lancamento' && 'Alimentação de Dados'}
              {activeTab === 'dashboard' && 'Estratégia & BI'}
              {activeTab === 'usuarios' && 'Gestão de Revenda'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-slate-500 font-medium">
                {activeTab === 'empresa' && 'Administre os clientes e selecione o contexto atual de trabalho.'}
                {activeTab === 'lancamento' && `Lançamentos vinculados à: ${activeCompany?.name || 'Nenhuma empresa selecionada'}`}
                {activeTab === 'dashboard' && `Insights gerenciais para: ${activeCompany?.name || 'Nenhuma empresa selecionada'}`}
                {activeTab === 'usuarios' && 'Administre os acessos e licenças das suas revendas.'}
              </p>
            </div>
          </div>
          
          {companies.length > 0 && (
            <div className="relative group">
              <div className="bg-blue-600 px-6 py-4 rounded-3xl shadow-xl shadow-blue-600/10 flex items-center gap-4 text-white hover:bg-blue-700 transition-colors cursor-pointer">
                <div className="bg-white p-2 rounded-xl w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                  {activeCompany?.logo ? (
                    <img src={activeCompany.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div className="flex flex-col pr-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Empresa Ativa</p>
                  <p className="font-black text-lg leading-tight truncate max-w-[150px]">
                    {activeCompany?.name || 'Selecionar...'}
                  </p>
                </div>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                
                {/* Custom Styled Native Select for seamless integration */}
                <select 
                  value={activeCompanyId || ''}
                  onChange={(e) => handleSelectCompany(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-slate-900"
                >
                  <option value="" disabled className="text-slate-900">Escolha uma empresa...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        <div className="max-w-7xl mx-auto">
          {!activeCompanyId && activeTab !== 'empresa' && (
            <div className="mb-10 bg-amber-50 border-l-8 border-amber-500 p-8 rounded-2xl flex items-center gap-6 shadow-sm">
              <div className="bg-amber-500 p-3 rounded-xl text-white">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-black text-amber-900">Atenção Necessária</h4>
                <p className="text-amber-800 font-medium">Você precisa selecionar ou cadastrar uma empresa antes de prosseguir.</p>
              </div>
              <button 
                onClick={() => setActiveTab('empresa')}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black transition-all"
              >
                IR PARA EMPRESAS
              </button>
            </div>
          )}

          {activeTab === 'empresa' && (
            <CompanyForm 
              companies={companies}
              activeCompanyId={activeCompanyId}
              onSave={handleAddCompany}
              onSelect={handleSelectCompany}
              onDelete={handleDeleteCompany}
            />
          )}
          
          {activeTab === 'lancamento' && activeCompany && (
            <DataForm onDataChange={handleUpdatePayroll} data={activeCompany.payrollEntries} activeCompany={activeCompany} />
          )}
          
          {activeTab === 'dashboard' && activeCompany && (
            <AnalysisView 
              data={activeCompany.payrollEntries} 
              analysis={analysis} 
              isGenerating={isGenerating} 
              error={error} 
              activeCompany={activeCompany}
            />
          )}
          
          {activeTab === 'usuarios' && <UserManagement />}
        </div>
      </main>
    </div>
  );
};

export default App;

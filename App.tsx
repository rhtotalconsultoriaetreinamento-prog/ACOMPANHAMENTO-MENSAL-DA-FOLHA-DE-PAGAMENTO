
import React, { useState } from 'react';
import DataForm from './components/DataForm';
import AnalysisView from './components/AnalysisView';
import { PayrollData, AppTab } from './types';
import { analyzePayroll } from './services/geminiService';
import { 
  BrainCircuit, 
  ChevronRight, 
  LayoutDashboard, 
  PlusCircle, 
  Info,
  Menu,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('lancamento');
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGenerateAnalysis = async () => {
    if (payrollData.length === 0) return;
    setActiveTab('dashboard');
    setIsGenerating(true);
    setError(undefined);
    try {
      const result = await analyzePayroll(payrollData);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample = () => {
    const example: PayrollData[] = [
      { id: '1', monthYear: 'Outubro/2024', totalValue: 125000, effectiveCount: 30, effectiveValue: 90000, contractedCount: 5, contractedValue: 20000, commissionedCount: 10, commissionedValue: 15000 },
      { id: '2', monthYear: 'Novembro/2024', totalValue: 142000, effectiveCount: 32, effectiveValue: 96000, contractedCount: 4, contractedValue: 16000, commissionedCount: 15, commissionedValue: 30000 },
      { id: '3', monthYear: 'Dezembro/2024', totalValue: 165000, effectiveCount: 35, effectiveValue: 105000, contractedCount: 3, contractedValue: 12000, commissionedCount: 20, commissionedValue: 48000 },
    ];
    setPayrollData(example);
    setAnalysis('');
  };

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
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">GestorPro</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Strategic HR</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
            <button 
              onClick={() => {setActiveTab('lancamento'); setIsMenuOpen(false);}}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'lancamento' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <PlusCircle className="w-5 h-5" />
              Lançamento Mensal
            </button>
            <button 
              onClick={() => {setActiveTab('dashboard'); setIsMenuOpen(false);}}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={handleGenerateAnalysis}
              disabled={payrollData.length === 0 || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {isGenerating ? 'Analisando...' : 'Atualizar Análise IA'}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={loadExample}
              className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
            >
              Carregar Dados Exemplo
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              {activeTab === 'lancamento' && 'Alimentação de Dados'}
              {activeTab === 'dashboard' && 'Estratégia & BI'}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeTab === 'lancamento' && 'Gerencie o histórico financeiro da sua folha.'}
              {activeTab === 'dashboard' && 'Insights gerenciais e comparativos dinâmicos.'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
             <Info className="w-4 h-4 text-blue-500" />
             <span className="text-xs font-bold text-slate-600">{payrollData.length} meses registrados</span>
          </div>
        </header>

        {activeTab === 'lancamento' && <DataForm onDataChange={setPayrollData} data={payrollData} />}
        {activeTab === 'dashboard' && (
          <AnalysisView 
            data={payrollData} 
            analysis={analysis} 
            isGenerating={isGenerating} 
            error={error} 
          />
        )}
      </main>
    </div>
  );
};

export default App;

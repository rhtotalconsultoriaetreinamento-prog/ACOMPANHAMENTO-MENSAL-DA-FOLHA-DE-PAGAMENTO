
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Loader2, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Smartphone, RefreshCcw, X, Upload, Globe } from 'lucide-react';
import { findUserByEmail } from '../services/authService';

interface LoginProps {
  onLogin: (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showSyncImport, setShowSyncImport] = useState(false);
  const [importCode, setImportCode] = useState('');

  const handleImportSync = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(importCode.trim()))));
      if (decoded.companies && decoded.users) {
        localStorage.setItem('gestorpro_companies_data', JSON.stringify(decoded.companies));
        localStorage.setItem('gestorpro_users_data', JSON.stringify(decoded.users));
        alert('Dispositivo sincronizado com sucesso!');
        setShowSyncImport(false);
        setImportCode('');
        setError('');
      }
    } catch (e) {
      alert('Código inválido.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    setTimeout(() => {
      // 1. Admin Central
      if (normalizedEmail === 'admin@gestorpro.com' && password === 'admin123') {
        onLogin('Administrador', 'admin');
        return;
      }

      // 2. Busca Usuário (Global ou Local)
      const userMatch = findUserByEmail(normalizedEmail);
      
      if (userMatch && userMatch.password === password) {
        if (userMatch.status === 'Inativo') {
          setError('Sua conta está inativa. Entre em contato com o administrador.');
          setLoading(false);
          return;
        }
        onLogin(userMatch.name, 'reseller', userMatch.linkedCompanyId);
      } else {
        setError('E-mail ou senha incorretos. Verifique os dados ou utilize a sincronização se for um usuário local novo.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="p-8 bg-blue-600 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">GestorPro AI</h1>
            <p className="text-blue-100 text-sm mt-1">Acesso Direto Multi-Dispositivo</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-shake flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> FALHA NO LOGIN
                </div>
                <p className="font-medium opacity-90">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Seu E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ENTRAR NO GESTORPRO'}
            </button>
            
            <div className="flex items-center gap-2 justify-center py-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Global Ativo</span>
            </div>

            <button 
              type="button"
              onClick={() => setShowSyncImport(true)}
              className="w-full text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              Problemas no acesso? Sincronize manualmente
            </button>
          </form>

          {showSyncImport && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-tight">Importar Backup</h3>
                <button onClick={() => setShowSyncImport(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <form onSubmit={handleImportSync} className="p-8 flex-1 flex flex-col space-y-4">
                <textarea 
                  required
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="Cole o código aqui..."
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-[10px] font-mono"
                />
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl">Importar Dados</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

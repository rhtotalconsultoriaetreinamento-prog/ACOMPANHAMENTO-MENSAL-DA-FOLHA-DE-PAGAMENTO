
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, Globe } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase().replace(/\s/g, '');
    const cleanPassword = password.trim();

    try {
      // 1. ADMIN CENTRAL (Hardcoded para segurança absoluta do proprietário)
      if (normalizedEmail === 'admin@gestorpro.com' && cleanPassword === 'admin123') {
        onLogin('Administrador', 'admin');
        return;
      }

      // 2. BUSCA DINÂMICA (Global + Supabase + Local)
      const userMatch = await findUserByEmail(normalizedEmail);
      
      if (userMatch) {
        // Verifica se a senha confere OU se usou a master password do sistema
        const isPasswordCorrect = userMatch.password === cleanPassword || cleanPassword === 'gestor2024';
        
        if (isPasswordCorrect) {
          if (userMatch.status === 'Inativo') {
            setError('Esta conta está inativada. Contate o administrador.');
            setLoading(false);
            return;
          }
          
          // Se não tiver linkedCompanyId e não for admin, ele é um usuário com acesso total de consulta
          onLogin(userMatch.name, 'reseller', userMatch.linkedCompanyId);
        } else {
          setError('Senha incorreta. Verifique os dados ou use a master key se autorizado.');
          setLoading(false);
        }
      } else {
        setError('Usuário não localizado. Verifique o e-mail digitado.');
        setLoading(false);
      }
    } catch (err) {
      setError('Erro de conexão ao validar usuário. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-10"></div>
        
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100">
          <div className="p-10 bg-slate-900 text-white text-center">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/40 border border-blue-400/20">
              <BrainCircuit className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">GestorPro AI</h1>
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-[0.2em]">
              <Globe className="w-3 h-3" />
              Sincronização Cloud Ativa
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-black border border-red-100 animate-shake flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> FALHA NA AUTENTICAÇÃO
                </div>
                <p className="font-medium opacity-90">{error}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="email" 
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@email.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800 font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800 font-bold"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ACESSAR PLATAFORMA'}
            </button>
            
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Gestão Estratégica de Pessoas & BI
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

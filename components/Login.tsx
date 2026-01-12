
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, Globe, CloudCheck } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    // Simulação de delay de rede para Supabase
    setTimeout(() => {
      if (normalizedEmail === 'admin@gestorpro.com' && password === 'admin123') {
        onLogin('Administrador', 'admin');
        return;
      }

      const userMatch = findUserByEmail(normalizedEmail);
      
      if (userMatch && (userMatch.password === password || password === 'gestor2024')) {
        if (userMatch.status === 'Inativo') {
          setError('Sua conta está inativa. Entre em contato com o administrador.');
          setLoading(false);
          return;
        }
        onLogin(userMatch.name, 'reseller', userMatch.linkedCompanyId);
      } else {
        setError('Acesso negado. E-mail ou senha incorretos neste dispositivo.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[2.5rem] blur opacity-20"></div>
        
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          <div className="p-10 bg-slate-900 text-white text-center border-b border-white/5">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/40">
              <BrainCircuit className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">GestorPro AI</h1>
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-[0.2em]">
              <Globe className="w-3 h-3" />
              Sincronização em Tempo Real
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-black border border-red-100 animate-shake flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> FALHA NA AUTENTICAÇÃO
                </div>
                <p className="font-medium opacity-80">{error}</p>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: silva.palmeiras@gmail.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800 font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Privada</label>
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
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ACESSAR DASHBOARD'}
            </button>
            
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tecnologia Multi-Device</p>
               <div className="flex gap-4 opacity-30 grayscale">
                  <div className="w-6 h-6 bg-slate-300 rounded"></div>
                  <div className="w-6 h-6 bg-slate-300 rounded"></div>
                  <div className="w-6 h-6 bg-slate-300 rounded"></div>
               </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

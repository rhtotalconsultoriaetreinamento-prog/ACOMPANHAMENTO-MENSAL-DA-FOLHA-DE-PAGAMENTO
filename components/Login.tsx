
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

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. ADMIN CENTRAL (Failsafe)
      if (normalizedEmail === 'admin@gestorpro.com' && cleanPassword === 'admin123') {
        onLogin('Administrador Master', 'admin');
        return;
      }

      // 2. BUSCA DINÂMICA (Inclui Nuvem e Administradores Criados)
      const userMatch = await findUserByEmail(normalizedEmail);
      
      if (userMatch) {
        const isPasswordCorrect = userMatch.password === cleanPassword;
        
        if (isPasswordCorrect) {
          if (userMatch.status === 'Inativo') {
            setError('Conta inativada pelo administrador.');
            setLoading(false);
            return;
          }
          // Agora usa a role definida no cadastro do usuário
          onLogin(userMatch.name, userMatch.role || 'reseller', userMatch.linkedCompanyId);
        } else {
          setError('Senha incorreta.');
          setLoading(false);
        }
      } else {
        setError('E-mail não localizado no servidor global.');
        setLoading(false);
      }
    } catch (err) {
      setError('Erro de conexão com o servidor. Verifique sua internet.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-10"></div>
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100">
          <div className="p-10 bg-slate-900 text-white text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2 uppercase tracking-widest">GestorPro AI</h1>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
               <Globe className="w-3 h-3" /> VERIFICAÇÃO GLOBAL ATIVA
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black border border-red-100 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error.toUpperCase()}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@gestorpro.com" className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> VERIFICANDO NUVEM...</> : 'ENTRAR NA PLATAFORMA'}
            </button>
            
            <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Sistema de BI & Folha de Pagamento<br/>Sincronizado via GestorPro Cloud
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

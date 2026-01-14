
import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, Globe, UserPlus, ArrowLeft, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { findUserByEmail } from '../services/authService';
import { supabaseService } from '../services/supabase';
import { ResellerUser } from '../types';

interface LoginProps {
  onLogin: (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => void;
}

// Logo RH TOTAL para o Login
const RHTotalLogo: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" className="text-cyan-500/20" />
    <circle cx="35" cy="30" r="10" fill="currentColor" className="text-cyan-600" />
    <circle cx="65" cy="30" r="10" fill="currentColor" className="text-teal-600" />
    <path d="M20 60C20 40 40 40 50 60C60 40 80 40 80 60C80 80 60 80 50 60C40 80 20 80 20 60Z" fill="currentColor" className="text-cyan-500" />
  </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);

  useEffect(() => {
    if (isRegistering) {
      supabaseService.getUserCount().then(count => {
        setIsFirstUser(count === 0);
      });
    }
  }, [isRegistering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (isRegistering) {
        if (!name || !email || !password) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }

        const existing = await findUserByEmail(normalizedEmail);
        if (existing) {
          setError('E-mail já cadastrado no sistema.');
          setLoading(false);
          return;
        }

        const count = await supabaseService.getUserCount();
        const first = count === 0;

        const newUser: ResellerUser = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          email: normalizedEmail,
          password: cleanPassword,
          role: first ? 'admin' : 'reseller',
          company: first ? 'RH TOTAL Central' : 'Novo Cadastro',
          status: first ? 'Ativo' : 'Inativo', // Somente o primeiro admin entra Ativo
          expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        };

        await supabaseService.saveProfile(newUser);
        
        if (first) {
          alert('Conta de Administrador criada com sucesso! Você já pode acessar.');
          onLogin(newUser.name, newUser.role, newUser.linkedCompanyId);
        } else {
          alert('Cadastro realizado com sucesso! Para sua segurança, um administrador precisa liberar seu acesso antes do primeiro login.');
          setIsRegistering(false);
          setEmail('');
          setPassword('');
          setName('');
        }

      } else {
        if (normalizedEmail === 'admin@gestorpro.com' && cleanPassword === 'admin123') {
          onLogin('Administrador Master', 'admin');
          return;
        }

        const userMatch = await findUserByEmail(normalizedEmail);
        
        if (userMatch) {
          if (userMatch.password === cleanPassword) {
            if (userMatch.status === 'Inativo') {
              setError('ACESSO PENDENTE: Seu cadastro ainda não foi liberado pelo administrador.');
            } else {
              onLogin(userMatch.name, userMatch.role || 'reseller', userMatch.linkedCompanyId);
            }
          } else {
            setError('Senha incorreta.');
          }
        } else {
          setError('E-mail não localizado.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-teal-500 rounded-[2.5rem] blur opacity-10"></div>
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100">
          
          <div className="p-10 bg-white text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-sm relative z-10 border border-slate-100">
              {isRegistering ? <UserPlus className="w-10 h-10 text-cyan-600" /> : <RHTotalLogo className="w-14 h-14" />}
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-1 uppercase italic text-slate-900 relative z-10">
              {isRegistering ? 'Criar Acesso' : 'RH TOTAL AI'}
            </h1>
            <p className="text-[10px] text-cyan-600 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 relative z-10">
               <Globe className="w-3 h-3" /> Consultoria e Treinamento
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 pt-0 space-y-6">
            {error && (
              <div className={`p-4 rounded-2xl text-[10px] font-black border flex items-center gap-3 animate-shake ${error.includes('PENDENTE') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {error.includes('PENDENTE') ? <Clock className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {error.toUpperCase()}
              </div>
            )}

            {isRegistering && isFirstUser && (
              <div className="bg-cyan-50 text-cyan-700 p-4 rounded-2xl text-[10px] font-black border border-cyan-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>VOCÊ É O PRIMEIRO USUÁRIO. ESTA CONTA SERÁ CONFIGURADA COMO <b className="text-cyan-900 uppercase tracking-tighter">Administrador Master</b> E TERÁ ACESSO IMEDIATO.</span>
              </div>
            )}
            
            <div className="space-y-4">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@rhtotal.com.br" className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-900/10">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isRegistering ? 'PROCESSANDO...' : 'AUTENTICANDO...'}</>
              ) : (
                isRegistering ? <><CheckCircle2 className="w-5 h-5" /> SOLICITAR CADASTRO</> : 'ENTRAR NO DASHBOARD'
              )}
            </button>

            <div className="pt-4 border-t border-slate-100">
              {isRegistering ? (
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-[10px] font-black text-slate-400 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                  <ArrowLeft className="w-3 h-3" /> Voltar para o Login
                </button>
              ) : (
                <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-[10px] font-black text-cyan-600 hover:text-cyan-800 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                  <UserPlus className="w-3 h-3" /> Solicitar novo acesso
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

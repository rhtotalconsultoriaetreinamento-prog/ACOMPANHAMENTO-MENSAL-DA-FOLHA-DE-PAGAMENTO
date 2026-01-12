
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, Globe, UserPlus, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { findUserByEmail } from '../services/authService';
import { supabaseService } from '../services/supabase';
import { ResellerUser } from '../types';

interface LoginProps {
  onLogin: (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);

  // Verifica se o banco está vazio ao entrar na tela de registro
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
        // Lógica de Cadastro
        if (!name || !email || !password) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }

        // Verifica se usuário já existe
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
          company: first ? 'GestorPro Central' : 'Novo Gestor',
          status: 'Ativo',
          expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        };

        await supabaseService.saveProfile(newUser);
        alert(first 
          ? 'Conta de Administrador criada com sucesso! Você é o primeiro usuário do sistema.' 
          : 'Conta criada com sucesso! Aguarde a liberação do administrador se necessário.'
        );
        onLogin(newUser.name, newUser.role, newUser.linkedCompanyId);

      } else {
        // Lógica de Login (Existente)
        if (normalizedEmail === 'admin@gestorpro.com' && cleanPassword === 'admin123') {
          onLogin('Administrador Master', 'admin');
          return;
        }

        const userMatch = await findUserByEmail(normalizedEmail);
        
        if (userMatch) {
          if (userMatch.password === cleanPassword) {
            if (userMatch.status === 'Inativo') {
              setError('Conta inativada pelo administrador.');
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
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-10"></div>
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100">
          
          <div className="p-10 bg-slate-900 text-white text-center relative overflow-hidden">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30 relative z-10">
              {isRegistering ? <UserPlus className="w-10 h-10 text-white" /> : <BrainCircuit className="w-10 h-10 text-white" />}
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2 uppercase tracking-widest relative z-10">
              {isRegistering ? 'Criar Acesso' : 'GestorPro AI'}
            </h1>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative z-10">
               <Globe className="w-3 h-3" /> {isRegistering ? 'Registro em Nuvem Ativo' : 'Verificação Global Ativa'}
            </p>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black border border-red-100 flex items-center gap-3 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error.toUpperCase()}
              </div>
            )}

            {isRegistering && isFirstUser && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-[10px] font-black border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>VOCÊ É O PRIMEIRO USUÁRIO. ESTA CONTA SERÁ CONFIGURADA COMO <b className="text-blue-900">ADMINISTRADOR MASTER</b> COM ACESSO TOTAL AO PAINEL.</span>
              </div>
            )}
            
            <div className="space-y-4">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@gestorpro.com" className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-900/10">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isRegistering ? 'CRIANDO CONTA...' : 'VERIFICANDO...'}</>
              ) : (
                isRegistering ? <><CheckCircle2 className="w-5 h-5" /> CONCLUIR CADASTRO</> : 'ENTRAR NA PLATAFORMA'
              )}
            </button>

            <div className="pt-4 border-t border-slate-100">
              {isRegistering ? (
                <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                  <ArrowLeft className="w-3 h-3" /> Já tenho uma conta
                </button>
              ) : (
                <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                  <UserPlus className="w-3 h-3" /> Ainda não tem conta? Cadastre-se
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

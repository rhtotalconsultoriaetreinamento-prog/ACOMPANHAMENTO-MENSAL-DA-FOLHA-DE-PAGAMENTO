
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Loader2, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (name: string, role: 'admin' | 'reseller', linkedCompanyId?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para fluxo de troca de senha
  const [mustChangeMode, setMustChangeMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [showPass, setShowPass] = useState(false);

  const validatePassword = (pass: string) => {
    return pass.length >= 6 && /[a-zA-Z]/.test(pass);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const savedUsersStr = localStorage.getItem('gestorpro_users_data');
    const savedUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    setTimeout(() => {
      // Verificação Admin Hardcoded
      if (email === 'admin@gestorpro.com' && password === 'admin123') {
        onLogin('Administrador', 'admin');
      } 
      // Verificação em usuários criados dinamicamente
      else {
        const userMatch = savedUsers.find((u: any) => u.email === email && u.status === 'Ativo');
        
        if (userMatch && userMatch.password === password) {
          if (userMatch.mustChangePassword) {
            setPendingUser(userMatch);
            setMustChangeMode(true);
            setLoading(false);
          } else {
            onLogin(userMatch.name, 'reseller', userMatch.linkedCompanyId);
          }
        } else {
          setError('Credenciais inválidas ou conta inativa. Tente novamente.');
          setLoading(false);
        }
      }
    }, 1000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!validatePassword(newPassword)) {
      setError('A senha deve ter no mínimo 6 dígitos e pelo menos uma letra.');
      return;
    }

    setLoading(true);
    
    // Atualizar no LocalStorage
    const savedUsersStr = localStorage.getItem('gestorpro_users_data');
    if (savedUsersStr) {
      const savedUsers = JSON.parse(savedUsersStr);
      const updatedUsers = savedUsers.map((u: any) => 
        u.id === pendingUser.id ? { ...u, password: newPassword, mustChangePassword: false } : u
      );
      localStorage.setItem('gestorpro_users_data', JSON.stringify(updatedUsers));
    }

    setTimeout(() => {
      onLogin(pendingUser.name, 'reseller', pendingUser.linkedCompanyId);
    }, 800);
  };

  if (mustChangeMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-scale-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 bg-amber-500 text-white text-center">
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <KeyRound className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Primeiro Acesso</h1>
              <p className="text-amber-50 text-sm mt-1">Por segurança, altere sua senha inicial.</p>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type={showPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mín. 6 dígitos + 1 letra"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Confirmar Nova Senha</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type={showPass ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Requisitos de Segurança:</h4>
                <ul className="text-[10px] font-bold text-blue-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-blue-300'}`} />
                    Pelo menos 6 caracteres
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/[a-zA-Z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-blue-300'}`} />
                    Conter ao menos uma letra
                  </li>
                </ul>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar e Acessar Sistema'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 bg-blue-600 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">GestorPro AI</h1>
            <p className="text-blue-100 text-sm mt-1">Inteligência Estratégica para RH</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 animate-shake flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Sistema'}
            </button>
            
            <div className="pt-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Desenvolvido para análise gerencial de alta performance.
              </p>
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Admin: <b>admin@gestorpro.com</b> / <b>admin123</b></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

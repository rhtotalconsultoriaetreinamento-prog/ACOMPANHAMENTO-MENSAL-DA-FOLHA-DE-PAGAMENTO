
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Loader2, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Smartphone, RefreshCcw, X, Upload, Info } from 'lucide-react';

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

  // Estados para Sincronização no Login
  const [showSyncImport, setShowSyncImport] = useState(false);
  const [importCode, setImportCode] = useState('');

  const validatePassword = (pass: string) => {
    return pass.length >= 6 && /[a-zA-Z]/.test(pass);
  };

  const handleImportSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCode.trim()) return;
    
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(importCode.trim()))));
      if (decoded.companies && decoded.users) {
        localStorage.setItem('gestorpro_companies_data', JSON.stringify(decoded.companies));
        localStorage.setItem('gestorpro_users_data', JSON.stringify(decoded.users));
        alert('Dispositivo sincronizado com sucesso! Os dados agora estão disponíveis neste celular. Prossiga com seu login normalmente.');
        setShowSyncImport(false);
        setImportCode('');
        setError(''); // Limpa erros prévios
      } else {
        throw new Error();
      }
    } catch (e) {
      alert('O código colado parece inválido ou incompleto. Certifique-se de ter copiado o código inteiro do seu computador.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Normalização rigorosa para mobile (remove espaços e força minúsculas)
    const normalizedEmail = email.trim().toLowerCase();

    const savedUsersStr = localStorage.getItem('gestorpro_users_data');
    const savedUsers = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    setTimeout(() => {
      // Verificação Admin
      if (normalizedEmail === 'admin@gestorpro.com' && password === 'admin123') {
        onLogin('Administrador', 'admin');
      } 
      // Verificação Reseller
      else {
        const userMatch = savedUsers.find((u: any) => 
          u.email.trim().toLowerCase() === normalizedEmail && 
          u.status === 'Ativo'
        );
        
        if (userMatch && userMatch.password === password) {
          if (userMatch.mustChangePassword) {
            setPendingUser(userMatch);
            setMustChangeMode(true);
            setLoading(false);
          } else {
            onLogin(userMatch.name, 'reseller', userMatch.linkedCompanyId);
          }
        } else {
          // Mensagem de erro educativa para Local-First
          if (savedUsers.length === 0) {
            setError('Nenhum dado encontrado neste celular. Você precisa clicar em "Sincronizar Dispositivo" abaixo antes de entrar pela primeira vez.');
          } else {
            setError('E-mail ou senha incorretos. Verifique se digitou corretamente ou se o acesso foi sincronizado deste computador.');
          }
          setLoading(false);
        }
      }
    }, 800);
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
              <p className="text-amber-50 text-sm mt-1">Olá, altere sua senha para sua segurança.</p>
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

              <button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar e Acessar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="p-8 bg-blue-600 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">GestorPro AI</h1>
            <p className="text-blue-100 text-sm mt-1">Gestão Estratégica Multi-Dispositivo</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-shake flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> ACESSO NEGADO
                </div>
                <p className="font-medium opacity-90 leading-relaxed">{error}</p>
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
                    placeholder="exemplo@gmail.com"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 font-medium"
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
                    className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 font-medium"
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
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ENTRAR NO SISTEMA'}
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-3 text-slate-400 font-black tracking-[0.3em]">Primeiro acesso no celular?</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowSyncImport(true)}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black py-4 rounded-xl border border-emerald-100 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <Smartphone className="w-5 h-5" /> SINCRONIZAR DISPOSITIVO
            </button>
          </form>

          {/* Modal de Sincronia no Login - Otimizado para Mobile */}
          {showSyncImport && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="font-black uppercase tracking-tight">Sincronia Rápida</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Traga seus dados do PC</p>
                  </div>
                </div>
                <button onClick={() => setShowSyncImport(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4 items-start shadow-sm">
                  <Info className="w-6 h-6 text-blue-600 shrink-0" />
                  <div className="text-xs text-blue-800 leading-relaxed font-medium">
                    <p className="font-black mb-1 uppercase text-[10px] tracking-widest">Como funciona:</p>
                    Para usar este e-mail no celular, você precisa "ativar" os dados primeiro:
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>Abra o site no seu <b>Computador</b></li>
                      <li>Vá em <b>"Backup & Sincronia"</b> no menu lateral</li>
                      <li>Clique em <b>"Gerar Novo Código"</b></li>
                      <li>Cole o código no campo abaixo aqui no celular</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cole seu Código de Sincronia:</label>
                  <textarea 
                    required
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    placeholder="Código gerado no computador..."
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-[10px] font-mono transition-all resize-none shadow-inner"
                  />
                </div>

                <button 
                  onClick={handleImportSync}
                  className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all hover:bg-emerald-700 active:scale-95 text-base"
                >
                  <Upload className="w-5 h-5" /> IMPORTAR DADOS AGORA
                </button>
                
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Isso é necessário apenas uma vez por dispositivo.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-xs font-medium">
          <p>© GestorPro 2024 • Inteligência Gerencial</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

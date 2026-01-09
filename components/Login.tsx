
import React, { useState } from 'react';
import { BrainCircuit, Lock, Mail, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (name: string, role: 'admin' | 'reseller') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock authentication logic
    setTimeout(() => {
      if (email === 'admin@gestorpro.com' && password === 'admin123') {
        onLogin('Administrador', 'admin');
      } else if (email === 'demo@gestorpro.com' && password === 'demo123') {
        onLogin('Consultor Demo', 'reseller');
      } else {
        setError('Credenciais inválidas. Tente novamente.');
        setLoading(false);
      }
    }, 1000);
  };

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
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                {error}
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
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
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
          <p>Dica: Use <b>admin@gestorpro.com</b> / <b>admin123</b> para teste.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

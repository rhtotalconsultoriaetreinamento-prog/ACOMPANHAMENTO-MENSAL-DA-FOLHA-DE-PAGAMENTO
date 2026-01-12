
import React, { useState, useEffect } from 'react';
import { ResellerUser, CompanyData } from '../types';
import { Users, UserPlus, Trash2, Edit3, Search, X, Lock, Eye, EyeOff, RefreshCw, Cloud, CheckCircle, Globe, ShieldAlert } from 'lucide-react';
import { supabaseService } from '../services/supabase';

interface UserManagementProps {
  companies: CompanyData[];
}

const UserManagement: React.FC<UserManagementProps> = ({ companies }) => {
  const [users, setUsers] = useState<ResellerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<Omit<ResellerUser, 'id'>>({
    name: '',
    email: '',
    company: '',
    role: 'reseller',
    password: '',
    linkedCompanyId: '',
    status: 'Ativo',
    expirationDate: '',
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const cloudUsers = await supabaseService.getProfiles();
      setUsers(cloudUsers);
      localStorage.setItem('gestorpro_users_data', JSON.stringify(cloudUsers));
    } catch (e) {
      console.error("Falha ao sincronizar usuários:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.email || (!editingUserId && !formData.password)) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    const selectedCompany = companies.find(c => c.id === formData.linkedCompanyId);
    
    const targetUser: ResellerUser = {
      ...formData,
      id: editingUserId || Math.random().toString(36).substr(2, 9),
      company: formData.role === 'admin' ? 'Administração Central' : (selectedCompany?.name || 'Gestor Externo'),
      mustChangePassword: false
    };

    try {
      await supabaseService.saveProfile(targetUser);
      await loadUsers();
      setShowModal(false);
    } catch (e) {
      alert('FALHA NA SINCRONIZAÇÃO NUVEM.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Excluir acesso global permanentemente?')) {
      try { 
        await supabaseService.deleteProfile(id); 
        setUsers(users.filter(u => u.id !== id));
      } catch (e) {
        alert('Erro ao excluir.');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold shadow-sm"
            />
          </div>
          <button onClick={loadUsers} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
             <RefreshCw className={`w-5 h-5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <button 
          onClick={() => { setEditingUserId(null); setFormData({name: '', email: '', company: '', role: 'reseller', password: '', linkedCompanyId: '', status: 'Ativo', expirationDate: ''}); setShowModal(true); }}
          className="bg-slate-900 hover:bg-black text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> CRIAR NOVO ACESSO
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário cadastrado no banco de dados</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Nome</th>
                  <th className="px-8 py-5">Função</th>
                  <th className="px-8 py-5">Vínculo</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-black text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                            <ShieldAlert className="w-3 h-3" /> Administrador
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            Gestor / Operação
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-slate-600 uppercase truncate max-w-[150px] block">{user.company}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => { setEditingUserId(user.id); setFormData(user); setShowModal(true); }} className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteUser(user.id)} className="p-3 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative">
              <div className="relative z-10">
                <h3 className="font-black text-2xl uppercase tracking-tight">{editingUserId ? 'Editar' : 'Novo'} Usuário</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Defina permissões e acessos globais</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors relative z-10"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-blue-600 focus:ring-2 focus:ring-blue-600 outline-none">
                    <option value="reseller">GESTOR (Acesso Limitado)</option>
                    <option value="admin">ADMINISTRADOR (Acesso Total)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                    <option value="Ativo">ATIVO</option>
                    <option value="Inativo">INATIVO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular a Empresa (Opcional para Admin)</label>
                <select value={formData.linkedCompanyId} onChange={e => setFormData({...formData, linkedCompanyId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                  <option value="">NENHUMA / ACESSO TOTAL</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-5 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {editingUserId ? 'Salvar Alterações' : 'Criar Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

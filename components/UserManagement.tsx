
import React, { useState, useEffect } from 'react';
import { ResellerUser, CompanyData } from '../types';
import { Users, UserPlus, Trash2, Edit3, ShieldCheck, ShieldAlert, Search, X, Building, Lock, Eye, EyeOff, RefreshCw, Cloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { GLOBAL_USERS } from '../services/authService';

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
    password: '',
    linkedCompanyId: '',
    status: 'Ativo',
    expirationDate: '',
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const cloudUsers = await supabaseService.getProfiles();
      
      // Merge com locais e globais para visualização completa
      const localSaved = localStorage.getItem('gestorpro_users_data');
      const localUsers: ResellerUser[] = localSaved ? JSON.parse(localSaved) : [];
      
      // Filtra duplicatas priorizando Cloud
      const combined = [...cloudUsers];
      [...GLOBAL_USERS, ...localUsers].forEach(l => {
        if (!combined.some(c => c.email.toLowerCase() === l.email.toLowerCase())) {
          combined.push(l);
        }
      });
      
      setUsers(combined);
    } catch (e) {
      console.error("Erro ao sincronizar usuários:", e);
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
      company: selectedCompany?.name || formData.company,
      mustChangePassword: !editingUserId
    };

    try {
      // TENTA NUVEM PRIMEIRO (Crucial para multi-dispositivo)
      await supabaseService.saveProfile(targetUser);
      
      // Se salvou na nuvem, atualiza local também
      const updatedUsers = users.map(u => u.id === targetUser.id ? targetUser : u);
      if (!editingUserId) updatedUsers.push(targetUser);
      setUsers(updatedUsers);
      localStorage.setItem('gestorpro_users_data', JSON.stringify(updatedUsers));
      
      setShowModal(false);
      alert('Usuário salvo com sucesso na NUVEM! Acesso liberado em qualquer computador.');
    } catch (e) {
      console.error(e);
      if (window.confirm('Falha na sincronização Cloud. Deseja salvar apenas neste computador? (Não funcionará em outros dispositivos)')) {
        const updatedUsers = users.map(u => u.id === targetUser.id ? targetUser : u);
        if (!editingUserId) updatedUsers.push(targetUser);
        setUsers(updatedUsers);
        localStorage.setItem('gestorpro_users_data', JSON.stringify(updatedUsers));
        setShowModal(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Excluir usuário permanentemente?')) {
      try { await supabaseService.deleteProfile(id); } catch (e) {}
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('gestorpro_users_data', JSON.stringify(updated));
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
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold shadow-sm"
            />
          </div>
          <button onClick={loadUsers} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
             <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <button 
          onClick={() => { setEditingUserId(null); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-blue-600/20"
        >
          <UserPlus className="w-5 h-5" /> NOVO USUÁRIO
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
           <Cloud className="w-4 h-4 text-blue-500" />
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor Global: {supabaseService.isConnected() ? '🟢 Conectado' : '🔴 Modo Local (Offline)'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-4">Usuário / E-mail</th>
                <th className="px-6 py-4">Acesso Empresa</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-600">{user.name.charAt(0)}</div>
                      <div>
                        <p className="font-black text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">{user.company || 'Acesso Total'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setEditingUserId(user.id); setFormData(user); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => deleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl uppercase">{editingUserId ? 'Editar' : 'Novo'} Usuário</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase mt-1">Sincronização Cloud Ativa</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Privada</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vincular Empresa</label>
                <select value={formData.linkedCompanyId} onChange={e => setFormData({...formData, linkedCompanyId: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold cursor-pointer">
                  <option value="">Acesso Geral (Admin)</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Validade</label>
                  <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400">Cancelar</button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editingUserId ? 'Salvar Alterações' : 'Criar e Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

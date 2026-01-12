
import React, { useState, useEffect } from 'react';
import { ResellerUser, CompanyData } from '../types';
import { Users, UserPlus, Trash2, Edit3, ShieldCheck, ShieldAlert, Search, X, Building, Lock, Eye, EyeOff, RefreshCw, Cloud } from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { GLOBAL_USERS } from '../services/authService';

interface UserManagementProps {
  companies: CompanyData[];
}

const UserManagement: React.FC<UserManagementProps> = ({ companies }) => {
  const [users, setUsers] = useState<ResellerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Carregar usuários da nuvem
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        let cloudUsers = await supabaseService.getProfiles();
        
        // Se a nuvem estiver vazia, injeta os usuários globais (Silva) para visibilidade
        if (cloudUsers.length === 0) {
          const localSaved = localStorage.getItem('gestorpro_users_data');
          cloudUsers = localSaved ? JSON.parse(localSaved) : GLOBAL_USERS;
        }
        
        setUsers(cloudUsers);
      } catch (e) {
        console.error("Erro ao sincronizar usuários:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Persistência secundária no LocalStorage para redundância
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('gestorpro_users_data', JSON.stringify(users));
    }
  }, [users]);

  const validatePassword = (pass: string) => {
    return pass.length >= 6 && /[a-zA-Z]/.test(pass);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      company: '',
      password: '',
      linkedCompanyId: '',
      status: 'Ativo',
      expirationDate: '',
    });
    setShowModal(true);
  };

  const openEditModal = (user: ResellerUser) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      company: user.company,
      password: user.password || '',
      linkedCompanyId: user.linkedCompanyId || '',
      status: user.status,
      expirationDate: user.expirationDate,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.linkedCompanyId || (!editingUserId && !formData.password)) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!editingUserId && !validatePassword(formData.password || '')) {
      alert('A senha deve ter no mínimo 6 dígitos e pelo menos uma letra.');
      return;
    }

    const selectedCompany = companies.find(c => c.id === formData.linkedCompanyId);
    const updatedFormData = { 
      ...formData, 
      company: selectedCompany?.name || formData.company,
      mustChangePassword: !editingUserId
    };

    let updatedUsers;
    let targetUser: ResellerUser;

    if (editingUserId) {
      targetUser = { ...updatedFormData, id: editingUserId };
      updatedUsers = users.map(u => u.id === editingUserId ? targetUser : u);
    } else {
      targetUser = {
        ...updatedFormData,
        id: Math.random().toString(36).substr(2, 9),
      };
      updatedUsers = [...users, targetUser];
    }
    
    // Salvar no Supabase
    try {
      await supabaseService.saveProfile(targetUser);
    } catch (e) {
      console.warn("Falha ao salvar na nuvem, mantendo localmente.");
    }

    setUsers(updatedUsers);
    setShowModal(false);
  };

  const deleteUser = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este acesso permanentemente?')) {
      try {
        await supabaseService.deleteProfile(id);
      } catch (e) {}
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, e-mail ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium shadow-sm"
            />
          </div>
          {isLoading && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          ADICIONAR REVENDEDOR
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Cliente / Empresa</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Status de Acesso</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Data Expiração</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Cloud className="w-10 h-10 animate-bounce text-blue-600" />
                      <p className="text-xs font-black uppercase tracking-widest">Sincronizando Perfis...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-lg shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-base truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 font-bold truncate mt-0.5">{user.email}</p>
                          <p className="text-[10px] text-blue-600 font-black uppercase flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3" /> {user.company}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {user.status === 'Ativo' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-700">
                        {user.expirationDate ? new Date(user.expirationDate).toLocaleDateString('pt-BR') : 'ILIMITADO'}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-3 text-slate-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
                        title="Editar Perfil"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)} 
                        className="p-3 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                        title="Revogar Acesso"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto opacity-30">
                       <Users className="w-16 h-16 mx-auto mb-4" />
                       <p className="text-sm font-black uppercase tracking-widest">Nenhum Usuário na Base de Dados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in border border-white/20">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl uppercase tracking-tight">
                  {editingUserId ? 'Editar Cadastro' : 'Novo Revendedor'}
                </h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Gerenciamento de Identidade</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="bg-white/10 text-white hover:bg-white/20 p-2 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                    placeholder="Ex: João Silva"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de Login</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                    placeholder="email@corporativo.com"
                  />
                </div>
              </div>

              {!editingUserId && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className={`w-full px-5 py-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold ${formData.password && !validatePassword(formData.password) ? 'border-red-300 bg-red-50' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="Mín. 6 dígitos + 1 letra"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Empresa Master Vinculada</label>
                <select 
                  value={formData.linkedCompanyId}
                  onChange={e => setFormData({...formData, linkedCompanyId: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold cursor-pointer"
                >
                  <option value="">Selecione a empresa do cliente...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-600 font-bold italic ml-1">* Este usuário verá apenas os dados desta empresa específica.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status da Conta</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Ativo' | 'Inativo'})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold cursor-pointer"
                  >
                    <option value="Ativo">🟢 Ativo</option>
                    <option value="Inativo">🔴 Inativo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiração do Acesso</label>
                  <input 
                    type="date" 
                    value={formData.expirationDate}
                    onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-slate-600 font-black uppercase text-xs hover:bg-slate-200 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-xs rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
              >
                {editingUserId ? 'Atualizar Perfil' : 'Criar Novo Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

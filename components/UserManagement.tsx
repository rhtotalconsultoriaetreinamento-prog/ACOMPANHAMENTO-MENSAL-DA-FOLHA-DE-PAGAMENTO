
import React, { useState } from 'react';
import { ResellerUser } from '../types';
import { Users, UserPlus, Trash2, Edit3, ShieldCheck, ShieldAlert, Search, X } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ResellerUser[]>([
    { id: '1', name: 'João Silva', email: 'joao@cliente.com', company: 'Tech RH Solutions', status: 'Ativo', expirationDate: '2025-12-31' },
    { id: '2', name: 'Maria Santos', email: 'maria@gestao.com', company: 'Hospitais Associados', status: 'Ativo', expirationDate: '2024-11-20' },
    { id: '3', name: 'Ricardo Melo', email: 'ricardo@comercial.com', company: 'Vendas Diretas Ltda', status: 'Inativo', expirationDate: '2023-05-15' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<ResellerUser, 'id'>>({
    name: '',
    email: '',
    company: '',
    status: 'Ativo',
    expirationDate: '',
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      company: '',
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
      status: user.status,
      expirationDate: user.expirationDate,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.company) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (editingUserId) {
      // Atualizar usuário existente
      setUsers(users.map(u => u.id === editingUserId ? { ...formData, id: editingUserId } : u));
    } else {
      // Adicionar novo usuário
      const newUser: ResellerUser = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setUsers([...users, newUser]);
    }
    
    setShowModal(false);
  };

  const deleteUser = (id: string) => {
    if (window.confirm('Deseja realmente excluir este acesso?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Novo Cadastro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Cliente / Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Expiração</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {user.status === 'Ativo' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-600">
                        {user.expirationDate ? new Date(user.expirationDate).toLocaleDateString('pt-BR') : 'Sem data'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)} 
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingUserId ? 'Editar Cliente' : 'Novo Cliente (Revenda)'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Responsável *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Pedro Alvares"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa / Unidade *</label>
                <input 
                  type="text" 
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Filial Sul"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail de Acesso *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Ativo' | 'Inativo'})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Expiração</label>
                  <input 
                    type="date" 
                    value={formData.expirationDate}
                    onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                {editingUserId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

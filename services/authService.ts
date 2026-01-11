
import { ResellerUser, CompanyData } from '../types';

/**
 * LISTA DE USUÁRIOS GLOBAIS (ACESSÍVEIS DE QUALQUER DISPOSITIVO)
 * Adicione aqui os clientes que precisam de acesso imediato sem sincronia manual.
 */
export const GLOBAL_USERS: ResellerUser[] = [
  {
    id: 'global-1',
    name: 'Silva Palmeiras',
    email: 'silva.palmeiras2016@gmail.com',
    company: 'Palmeiras Negócios',
    password: 'gestor2024', // Senha padrão de acesso
    status: 'Ativo',
    expirationDate: '2025-12-31',
    linkedCompanyId: 'comp-silva-01',
    mustChangePassword: false
  }
];

/**
 * DADOS MESTRES (SEED DATA)
 * Se o usuário global logar em um aparelho novo, esses dados serão carregados.
 */
export const GLOBAL_COMPANIES_DATA: CompanyData[] = [
  {
    id: 'comp-silva-01',
    name: 'Palmeiras Negócios e Soluções',
    cnpj: '00.000.000/0001-00',
    payrollEntries: [] // Os dados reais seriam persistidos aqui em uma implementação com Backend real
  }
];

export const findUserByEmail = (email: string): ResellerUser | undefined => {
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. Procura na lista Global (Código)
  const global = GLOBAL_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
  if (global) return global;

  // 2. Procura na lista Local (Navegador)
  const savedUsersStr = localStorage.getItem('gestorpro_users_data');
  const localUsers: ResellerUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
  return localUsers.find(u => u.email.toLowerCase() === normalizedEmail);
};

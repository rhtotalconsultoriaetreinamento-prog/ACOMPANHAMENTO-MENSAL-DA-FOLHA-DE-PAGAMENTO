
import { ResellerUser, CompanyData } from '../types';

/**
 * LISTA DE USUÁRIOS GLOBAIS (ACESSÍVEIS DE QUALQUER DISPOSITIVO)
 */
export const GLOBAL_USERS: ResellerUser[] = [
  {
    id: 'global-1',
    name: 'Silva Palmeiras',
    email: 'silva.palmeiras2016@gmail.com',
    company: 'Palmeiras Negócios',
    password: 'gestor2024',
    status: 'Ativo',
    expirationDate: '2025-12-31',
    linkedCompanyId: 'comp-silva-01',
    mustChangePassword: false
  },
  {
    id: 'global-2',
    name: 'RH Total - Consultoria',
    email: 'rhtotal@gmail.com',
    company: 'RH Total Consultoria',
    password: 'gestor2024',
    status: 'Ativo',
    expirationDate: '2026-01-01',
    linkedCompanyId: 'comp-demo-rh',
    mustChangePassword: false
  }
];

/**
 * DADOS MESTRES PARA NOVOS USUÁRIOS (FAILSAFE)
 */
export const GLOBAL_COMPANIES_DATA: CompanyData[] = [
  {
    id: 'comp-silva-01',
    name: 'Palmeiras Negócios e Soluções',
    cnpj: '00.000.000/0001-00',
    payrollEntries: []
  },
  {
    id: 'comp-demo-rh',
    name: 'RH Total Consultoria',
    cnpj: '99.999.999/0001-99',
    payrollEntries: [
      {
        id: 'init-rh-1',
        monthYear: 'Janeiro/2024',
        totalValue: 18500,
        effectiveCount: 4,
        effectiveValue: 12000,
        contractedCount: 2,
        contractedValue: 4000,
        commissionedCount: 1,
        commissionedValue: 2500
      },
      {
        id: 'init-rh-2',
        monthYear: 'Fevereiro/2024',
        totalValue: 19200,
        effectiveCount: 4,
        effectiveValue: 12500,
        contractedCount: 2,
        contractedValue: 4200,
        commissionedCount: 1,
        commissionedValue: 2500
      }
    ]
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


import { ResellerUser, CompanyData } from '../types';
import { supabaseService } from './supabase';

/**
 * LISTA DE USUÁRIOS GLOBAIS (ESTÁTICOS)
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
 * DADOS MESTRES (FAILSAFE)
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
      }
    ]
  }
];

/**
 * Busca usuário: Prioriza Nuvem (para multi-acesso) -> Estáticos -> Local
 */
export const findUserByEmail = async (email: string): Promise<ResellerUser | undefined> => {
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. TENTA NUVEM (Obrigatório para multi-dispositivo)
  try {
    const cloudUsers = await supabaseService.getProfiles();
    const cloudMatch = cloudUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (cloudMatch) return cloudMatch;
  } catch (e) {
    console.warn("AuthService: Falha na nuvem, verificando locais...");
  }

  // 2. TENTA ESTÁTICOS (Hardcoded)
  const global = GLOBAL_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
  if (global) return global;

  // 3. TENTA CACHE LOCAL (Apenas no PC atual)
  const savedUsersStr = localStorage.getItem('gestorpro_users_data');
  const localUsers: ResellerUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
  return localUsers.find(u => u.email.toLowerCase() === normalizedEmail);
};

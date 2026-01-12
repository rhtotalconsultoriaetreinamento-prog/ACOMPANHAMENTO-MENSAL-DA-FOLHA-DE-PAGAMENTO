
import { ResellerUser, CompanyData } from '../types';
import { supabaseService } from './supabase';

/**
 * LISTA DE USUÁRIOS GLOBAIS (AGORA VAZIA PARA GESTÃO VIA CLOUD)
 */
export const GLOBAL_USERS: ResellerUser[] = [];

/**
 * DADOS MESTRES (AGORA VAZIA PARA GESTÃO VIA CLOUD)
 */
export const GLOBAL_COMPANIES_DATA: CompanyData[] = [];

export const findUserByEmail = async (email: string): Promise<ResellerUser | undefined> => {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const cloudUsers = await supabaseService.getProfiles();
    const cloudMatch = cloudUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (cloudMatch) return cloudMatch;
  } catch (e) {
    console.warn("AuthService: Falha na nuvem, verificando locais...");
  }

  const savedUsersStr = localStorage.getItem('gestorpro_users_data');
  const localUsers: ResellerUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
  return localUsers.find(u => u.email.toLowerCase() === normalizedEmail);
};

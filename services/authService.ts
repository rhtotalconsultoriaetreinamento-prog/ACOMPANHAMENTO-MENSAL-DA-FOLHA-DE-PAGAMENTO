
import { ResellerUser, CompanyData } from '../types';
import { supabaseService } from './supabase';

/**
 * LISTA DE USUÁRIOS (VAZIA - GESTÃO EXCLUSIVA VIA BANCO DE DADOS)
 */
export const GLOBAL_USERS: ResellerUser[] = [];

/**
 * DADOS DE EMPRESAS (VAZIA - GESTÃO EXCLUSIVA VIA BANCO DE DADOS)
 */
export const GLOBAL_COMPANIES_DATA: CompanyData[] = [];

export const findUserByEmail = async (email: string): Promise<ResellerUser | undefined> => {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    // Busca na nuvem (Supabase)
    const cloudUsers = await supabaseService.getProfiles();
    const cloudMatch = cloudUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (cloudMatch) return cloudMatch;
  } catch (e) {
    console.warn("AuthService: Falha na nuvem, verificando cache local...");
  }

  // Busca no cache do navegador (LocalStorage)
  const savedUsersStr = localStorage.getItem('gestorpro_users_data');
  const localUsers: ResellerUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
  return localUsers.find(u => u.email.toLowerCase() === normalizedEmail);
};

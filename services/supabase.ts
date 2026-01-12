
import { createClient } from '@supabase/supabase-js';
import { CompanyData, PayrollData, ResellerUser } from '../types';

// O Supabase é a ponte que permite que dados criados em um PC apareçam em outro.
// Se as variáveis de ambiente não estiverem configuradas no provedor de hospedagem, 
// o sistema funcionará apenas em modo LOCAL (apenas no computador atual).
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Inicializa o cliente apenas se houver credenciais
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const supabaseService = {
  /**
   * Verifica se a conexão com a nuvem está operacional
   */
  isConnected() {
    return !!supabase;
  },

  async getCompanies() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, payroll_entries(*)');
      if (error) throw error;
      return data as CompanyData[];
    } catch (e) {
      console.error("Supabase: Erro ao buscar empresas:", e);
      return [];
    }
  },

  async saveCompany(company: CompanyData) {
    if (!supabase) return;
    const { error } = await supabase
      .from('companies')
      .upsert({
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        logo: company.logo
      });
    if (error) throw error;
  },

  async deleteCompany(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  },

  async savePayrollEntry(companyId: string, entry: PayrollData) {
    if (!supabase) return;
    const { error } = await supabase
      .from('payroll_entries')
      .upsert({
        id: entry.id,
        company_id: companyId,
        month_year: entry.monthYear,
        total_value: entry.totalValue,
        effective_count: entry.effectiveCount,
        effective_value: entry.effectiveValue,
        contracted_count: entry.contractedCount,
        contracted_value: entry.contractedValue,
        commissioned_count: entry.commissionedCount,
        commissioned_value: entry.commissionedValue
      });
    if (error) throw error;
  },

  async getProfiles() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return (data || []) as ResellerUser[];
    } catch (e) {
      console.error("Supabase: Erro ao buscar perfis:", e);
      return [];
    }
  },

  async saveProfile(profile: ResellerUser) {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await supabase.from('profiles').upsert(profile);
    if (error) throw error;
  },

  async deleteProfile(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }
};

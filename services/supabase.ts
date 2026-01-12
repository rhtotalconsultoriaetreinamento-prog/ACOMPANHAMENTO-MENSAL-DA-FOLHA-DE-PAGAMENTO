
import { createClient } from '@supabase/supabase-js';
import { CompanyData, PayrollData, ResellerUser } from '../types';

// O SDK utilizará estas variáveis de ambiente (Configuração via backend/infra)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseService = {
  // Empresas
  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*, payroll_entries(*)');
    if (error) throw error;
    return data as CompanyData[];
  },

  async saveCompany(company: CompanyData) {
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
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  },

  // Lançamentos de Folha
  async savePayrollEntry(companyId: string, entry: PayrollData) {
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

  async deletePayrollEntry(id: string) {
    const { error } = await supabase.from('payroll_entries').delete().eq('id', id);
    if (error) throw error;
  },

  // Usuários / Perfis
  async getProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data as ResellerUser[];
  },

  async saveProfile(profile: ResellerUser) {
    const { error } = await supabase.from('profiles').upsert(profile);
    if (error) throw error;
  }
};

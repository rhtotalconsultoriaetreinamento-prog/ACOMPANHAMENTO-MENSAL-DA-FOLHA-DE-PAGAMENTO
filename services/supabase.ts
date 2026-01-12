
import { createClient } from '@supabase/supabase-js';
import { CompanyData, PayrollData, ResellerUser } from '../types';

// Detecta se as chaves são as originais do exemplo ou se foram preenchidas
const isConfigured = 
  process.env.SUPABASE_URL && 
  process.env.SUPABASE_URL !== 'https://your-project.supabase.co' &&
  process.env.SUPABASE_ANON_KEY &&
  process.env.SUPABASE_ANON_KEY !== 'your-anon-key';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseService = {
  async getCompanies() {
    if (!isConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, payroll_entries(*)');
      if (error) throw error;
      return data as CompanyData[];
    } catch (e) {
      console.warn("Erro ao buscar empresas no Supabase:", e);
      return [];
    }
  },

  async saveCompany(company: CompanyData) {
    if (!isConfigured) return;
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
    if (!isConfigured) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  },

  async savePayrollEntry(companyId: string, entry: PayrollData) {
    if (!isConfigured) return;
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
    if (!isConfigured) return [];
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data as ResellerUser[];
    } catch (e) {
      console.warn("Erro ao buscar perfis no Supabase:", e);
      return [];
    }
  },

  async saveProfile(profile: ResellerUser) {
    if (!isConfigured) return;
    const { error } = await supabase.from('profiles').upsert(profile);
    if (error) throw error;
  },

  async deleteProfile(id: string) {
    if (!isConfigured) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }
};


import { createClient } from '@supabase/supabase-js';
import { CompanyData, PayrollData, ResellerUser } from '../types';

const supabaseUrl = 'https://evupvjpujmwkljkkokif.supabase.co';
const supabaseKey = 'sb_publishable_FVsIWhUKKkS9QPyZ2UKmjQ_RYHC3eVj';

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const supabaseService = {
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: "Configuração ausente." };
    
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
    
    try {
      const fetchPromise = supabase.from('profiles').select('id').limit(1);
      await Promise.race([fetchPromise, timeout]);
      return { success: true, message: "Conectado" };
    } catch (e: any) {
      if (e.message === 'Timeout') return { success: false, message: "Servidor Lento" };
      return { success: false, message: "Tabela profiles não encontrada" };
    }
  },

  async getUserCount(): Promise<number> {
    if (!supabase) return 0;
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    } catch (e) {
      return 0;
    }
  },

  async getCompanies() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('companies').select('*, payroll_entries(*)');
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        cnpj: c.cnpj,
        logo: c.logo,
        payrollEntries: (c.payroll_entries || []).map((e: any) => ({
          id: e.id,
          monthYear: e.month_year,
          total_value: e.total_value,
          effective_count: e.effective_count,
          effective_value: e.effective_value,
          contracted_count: e.contracted_count,
          contracted_value: e.contracted_value,
          commissioned_count: e.commissioned_count,
          commissioned_value: e.commissioned_value
        }))
      })) as CompanyData[];
    } catch (e: any) {
      console.error("Erro ao buscar empresas:", e.message);
      return [];
    }
  },

  async saveCompany(company: CompanyData) {
    if (!supabase) return;
    const { error } = await supabase.from('companies').upsert({
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      logo: company.logo
    });
    if (error) {
      console.error("Erro Supabase (Companies):", error.message);
      throw new Error(`Erro ao salvar empresa: ${error.message}`);
    }
  },

  async savePayrollEntry(companyId: string, entry: PayrollData) {
    if (!supabase) return;
    const { error } = await supabase.from('payroll_entries').upsert({
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
    if (!supabase) return;
    const { error } = await supabase.from('payroll_entries').delete().eq('id', id);
    if (error) throw error;
  },

  async getProfiles() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.warn("Tabela profiles não existe ou RLS ativa:", error.message);
        return [];
      }
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        company: p.company,
        role: p.role || 'reseller',
        password: p.password,
        status: p.status,
        expirationDate: p.expiration_date,
        linkedCompanyId: p.linked_company_id
      })) as ResellerUser[];
    } catch (e) {
      return [];
    }
  },

  async saveProfile(profile: ResellerUser) {
    if (!supabase) throw new Error("Supabase não disponível");
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      company: profile.company,
      role: profile.role,
      password: profile.password,
      status: profile.status,
      expiration_date: profile.expirationDate,
      linked_company_id: profile.linkedCompanyId
    });
    
    if (error) {
      console.error("Erro crítico Supabase Profiles:", error);
      throw new Error(`Erro na Nuvem: ${error.message}`);
    }
  },

  async deleteProfile(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }
};

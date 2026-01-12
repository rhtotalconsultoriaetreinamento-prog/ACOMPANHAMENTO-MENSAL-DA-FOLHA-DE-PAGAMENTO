
import { createClient } from '@supabase/supabase-js';
import { CompanyData, PayrollData, ResellerUser } from '../types';

/**
 * INSTRUÇÕES PARA CONFIGURAÇÃO DO SUPABASE:
 * 
 * Execute o código SQL abaixo no 'SQL Editor' do seu painel Supabase
 * para criar a estrutura necessária para o GestorPro:
 * 
 * -- 1. Tabela de Empresas
 * CREATE TABLE companies (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   cnpj TEXT NOT NULL,
 *   logo TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 2. Tabela de Lançamentos de Folha
 * CREATE TABLE payroll_entries (
 *   id TEXT PRIMARY KEY,
 *   company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
 *   month_year TEXT NOT NULL,
 *   total_value NUMERIC DEFAULT 0,
 *   effective_count INTEGER DEFAULT 0,
 *   effective_value NUMERIC DEFAULT 0,
 *   contracted_count INTEGER DEFAULT 0,
 *   contracted_value NUMERIC DEFAULT 0,
 *   commissioned_count INTEGER DEFAULT 0,
 *   commissioned_value NUMERIC DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 3. Tabela de Perfis de Usuários
 * CREATE TABLE profiles (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   email TEXT UNIQUE NOT NULL,
 *   company TEXT,
 *   role TEXT DEFAULT 'reseller',
 *   password TEXT NOT NULL,
 *   must_change_password BOOLEAN DEFAULT FALSE,
 *   linked_company_id TEXT REFERENCES companies(id),
 *   status TEXT DEFAULT 'Ativo',
 *   expiration_date DATE,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

const supabaseUrl = 'https://evupvjpujmwkljkkokif.supabase.co';
const supabaseKey = 'sb_publishable_FVsIWhUKKkS9QPyZ2UKmjQ_RYHC3eVj';

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const supabaseService = {
  isConnected() {
    return !!supabase;
  },

  async getCompanies() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, payroll_entries(*)');
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          console.warn("Supabase: Tabelas ainda não criadas. Use LocalStorage.");
          return [];
        }
        throw error;
      }

      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        cnpj: c.cnpj,
        logo: c.logo,
        payrollEntries: (c.payroll_entries || []).map((e: any) => ({
          id: e.id,
          monthYear: e.month_year,
          totalValue: e.total_value,
          effectiveCount: e.effective_count,
          effectiveValue: e.effective_value,
          contractedCount: e.contracted_count,
          contractedValue: e.contracted_value,
          commissionedCount: e.commissioned_count,
          commissionedValue: e.commissioned_value
        }))
      })) as CompanyData[];
    } catch (e: any) {
      console.error("Supabase Error:", e.message);
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
        if (error.code === 'PGRST116' || error.message.includes('not found')) return [];
        throw error;
      }
      
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        company: p.company,
        role: p.role || 'reseller',
        password: p.password,
        mustChangePassword: p.must_change_password,
        linkedCompanyId: p.linked_company_id,
        status: p.status,
        expirationDate: p.expiration_date
      })) as ResellerUser[];
    } catch (e: any) {
      console.error("Supabase Profiles Error:", e.message);
      return [];
    }
  },

  async saveProfile(profile: ResellerUser) {
    if (!supabase) throw new Error("Supabase não configurado");
    
    const dbProfile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      company: profile.company,
      role: profile.role,
      password: profile.password,
      must_change_password: profile.mustChangePassword || false,
      linked_company_id: profile.linkedCompanyId || null,
      status: profile.status,
      expiration_date: profile.expirationDate
    };

    const { error } = await supabase.from('profiles').upsert(dbProfile);
    if (error) throw error;
  },

  async deleteProfile(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }
};

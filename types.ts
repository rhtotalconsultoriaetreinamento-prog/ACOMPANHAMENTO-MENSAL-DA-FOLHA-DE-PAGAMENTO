
export interface PayrollData {
  id: string;
  monthYear: string;
  totalValue: number;
  effectiveCount: number;
  effectiveValue: number;
  contractedCount: number;
  contractedValue: number;
  commissionedCount: number;
  commissionedValue: number;
}

export interface ResellerUser {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'Ativo' | 'Inativo';
  expirationDate: string;
}

export type AppTab = 'lancamento' | 'dashboard' | 'usuarios';

export interface ComparisonData {
  monthA?: PayrollData;
  monthB?: PayrollData;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    role: 'admin' | 'reseller';
  } | null;
}

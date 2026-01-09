
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

export type AppTab = 'lancamento' | 'dashboard';

export interface ComparisonData {
  monthA?: PayrollData;
  monthB?: PayrollData;
}

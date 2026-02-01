
export type PaymentStatus = 'PAID' | 'UNPAID' | 'MANUAL_PAID';

export interface MonthStatus {
  month: number; // 1-12
  year: number;
  status: PaymentStatus;
  paymentDates: string[];
  amount?: number;
  source?: 'ai' | 'manual';
}

export interface Client {
  id: string;
  name: string;
  startDate: string; // YYYY-MM
  expectedAmount: number;
  months: MonthStatus[];
  progress: number; // 0-100
}

export interface SummaryStats {
  totalClients: number;
  totalPaid: number;
  openMonths: number;
}

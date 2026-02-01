
export type PaymentStatus = 'paid' | 'pending' | 'manual_paid' | 'manual_billed';

export interface ClientPayment {
  month: string; // ISO Month e.g. "2024-03"
  day?: string;   // ISO Date e.g. "2024-03-15"
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
}

export interface Client {
  id: string;
  name: string;
  expectedAmount: number;
  payments: ClientPayment[];
  lastReconciliation?: string;
  history?: Array<{
    month: string;
    status: 'paid' | 'unpaid';
    date?: string;
    amount?: number;
  }>;
}

export interface ReconciliationResult {
  matches: Array<{
    clientName: string;
    amount: number;
    transactionDate: string;
    confidence: number;
    month: string;
  }>;
  unmatchedBilling: string[];
  unmatchedBank: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
}

export interface VehicleData {
  placa: string;
  marca: string;
  modelo: string;
  imei: string[];
}

export interface ServiceOrderField {
  label: string;
  value: any;
  type?: string;
}

export interface ServiceOrder {
  id: string;
  date: string;
  clientName: string;
  totalValue: number;
  status: 'completed' | 'pending';
  vehicle: {
    placa: string;
    modelo: string;
    marca: string;
  };
  templateName: string;
  fields: ServiceOrderField[];
}

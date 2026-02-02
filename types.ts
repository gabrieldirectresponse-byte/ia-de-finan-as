
export enum TransactionDirection {
  INFLOW = 'inflow',
  OUTFLOW = 'outflow'
}

export enum TransactionStatus {
  STAGING = 'staging',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  PENDING_FIXED = 'pending_fixed'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isNewUser: boolean;
  createdAt: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  day: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  direction: TransactionDirection;
  status: TransactionStatus;
  intentLabel?: string; // Rótulo amigável vindo da IA
  rawInput?: string;
  installmentInfo?: {
    current: number;
    total: number;
    parentId: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  transactionId?: string;
  type?: 'text' | 'transaction_card' | 'image';
  imageUrl?: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  day: number;
  type: 'subscription' | 'installment';
  remainingMonths?: number; 
  totalInstallments?: number;
}

export interface UserSettings {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  categories: Category[];
}

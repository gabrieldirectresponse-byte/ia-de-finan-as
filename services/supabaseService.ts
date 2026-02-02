
import { createClient } from '@supabase/supabase-js';
import { Transaction, UserSettings } from '../types';

const SUPABASE_URL = 'https://fkekpcgrqzmsjdpodgvm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8ebZHF-HBXtxWNHvkpKOAw_g5K5L2px';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Gerenciamento de Configurações (Incomes, FixedExpenses, Categories)
export async function saveUserSettings(userId: string, settings: UserSettings) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      settings: settings,
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Error saving settings:', error);
}

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
  return data?.settings as UserSettings;
}

// Gerenciamento de Transações
export async function syncTransactions(userId: string, transactions: Transaction[]) {
  // Nota: Em um app de produção, usaríamos upsert individual ou bulk. 
  // Para simplicidade técnica deste MVP, estamos armazenando a coleção.
  const { error } = await supabase
    .from('ledgers')
    .upsert({ 
      user_id: userId, 
      data: transactions,
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Error syncing transactions:', error);
}

export async function fetchTransactions(userId: string): Promise<Transaction[] | null> {
  const { data, error } = await supabase
    .from('ledgers')
    .select('data')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching ledger:', error);
    return null;
  }
  return data?.data as Transaction[];
}

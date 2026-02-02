
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionDirection, TransactionStatus, Category } from '../types';

interface HistoryProps {
  ledger: Transaction[];
  categories: Category[];
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ ledger, categories, onUpdateTransaction, onDeleteTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Transaction | null>(null);
  
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, { month: number, year: number, label: string }>();
    const now = new Date();
    const currentKey = `${now.getMonth()}-${now.getFullYear()}`;
    monthsMap.set(currentKey, {
      month: now.getMonth(),
      year: now.getFullYear(),
      label: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });

    ledger.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getMonth()}-${d.getFullYear()}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: d.getMonth(),
          year: d.getFullYear(),
          label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        });
      }
    });

    return Array.from(monthsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [ledger]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const filteredLedger = useMemo(() => {
    return ledger
      .filter(t => t.status === TransactionStatus.CONFIRMED)
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
      })
      .filter(t => {
        const merchant = (t.merchant || '').toLowerCase();
        const category = (t.category || '').toLowerCase();
        const search = (searchTerm || '').toLowerCase();
        return merchant.includes(search) || category.includes(search);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledger, searchTerm, selectedMonth]);

  const groupedTransactions = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredLedger.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }, [filteredLedger]);

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdateTransaction(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Histórico de Ativos</h2>
            <div className="relative inline-block group">
              <select 
                value={`${selectedMonth.month}-${selectedMonth.year}`}
                onChange={(e) => {
                  const [m, y] = e.target.value.split('-').map(Number);
                  setSelectedMonth({ month: m, year: y });
                }}
                className="appearance-none bg-transparent text-xl font-bold text-white pr-8 outline-none cursor-pointer focus:text-[#00DC82] transition-colors capitalize"
              >
                {availableMonths.map(m => (
                  <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`} className="bg-[#18181B] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-[#00DC82] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#00DC82] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input 
            type="text" 
            placeholder="Filtrar nesta lista..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#18181B] border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium focus:border-[#00DC82]/50 outline-none transition-all placeholder:text-zinc-700 shadow-inner"
          />
        </div>
      </header>

      <div className="space-y-8">
        {Object.entries(groupedTransactions).length > 0 ? (
          (Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([date, transactions]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                {date}
              </h3>
              <div className="space-y-2">
                {transactions.map(t => {
                  const isEditing = editingId === t.id;
                  const cat = categories.find(c => c.name === t.category) || categories[categories.length - 1];
                  const isInflow = t.direction === TransactionDirection.INFLOW;

                  if (isEditing && editForm) {
                    return (
                      <div key={t.id} className="p-4 bg-[#18181B] border border-[#00DC82]/40 rounded-2xl space-y-3 animate-in zoom-in-95">
                         <input 
                            value={editForm.merchant}
                            onChange={e => setEditForm({...editForm, merchant: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                         />
                         <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="number"
                              value={editForm.amount}
                              onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white mono"
                            />
                            <select 
                              value={editForm.category}
                              onChange={e => setEditForm({...editForm, category: e.target.value})}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                            >
                              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                            </select>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)} className="flex-1 py-2 text-[10px] font-bold uppercase bg-zinc-800 rounded-lg text-zinc-500">Cancelar</button>
                            <button onClick={() => onDeleteTransaction(t.id)} className="flex-1 py-2 text-[10px] font-bold uppercase bg-red-500/10 text-red-400 rounded-lg">Excluir</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-2 text-[10px] font-bold uppercase bg-[#00DC82] text-zinc-950 rounded-lg">Salvar</button>
                         </div>
                      </div>
                    );
                  }

                  return (
                    <div key={t.id} onClick={() => startEdit(t)} className="group flex items-center justify-between p-4 bg-[#18181B] border border-zinc-800/50 rounded-2xl hover:border-[#00DC82]/20 transition-all shadow-lg active:scale-[0.98] cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-100 truncate max-w-[120px]">{t.merchant}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{t.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black mono ${isInflow ? 'text-[#00DC82]' : 'text-zinc-100'}`}>
                          {isInflow ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {t.installmentInfo && (
                          <span className="text-[9px] text-zinc-600 font-black uppercase">Parcela {t.installmentInfo.current}/{t.installmentInfo.total}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-700 space-y-4 bg-zinc-900/30 rounded-[2rem] border border-zinc-900 border-dashed">
             <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 border-dashed">
                <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sem registros para este período</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

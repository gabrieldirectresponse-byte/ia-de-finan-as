
import React, { useState } from 'react';
import { Transaction, TransactionStatus, TransactionDirection, Category } from '../types';

interface TransactionCardProps {
  transaction: Transaction;
  categories: Category[];
  onConfirm: (transaction: Transaction) => void;
  onReject: (id: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, categories, onConfirm, onReject }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Transaction>({ ...transaction });

  const category = categories.find(c => c.name === transaction.category) || categories[categories.length - 1];
  const isStaging = transaction.status === TransactionStatus.STAGING || transaction.status === TransactionStatus.PENDING_FIXED;
  const isInflow = editedData.direction === TransactionDirection.INFLOW;

  const handleSave = () => {
    onConfirm({ ...editedData, status: TransactionStatus.CONFIRMED });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-5 rounded-[2rem] bg-[#18181B] border border-[#00DC82]/30 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <h4 className="text-[10px] font-black text-[#00DC82] uppercase tracking-widest">Ajustar Transação</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase">Descrição</label>
            <input 
              value={editedData.merchant}
              onChange={e => setEditedData({ ...editedData, merchant: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase">Valor (R$)</label>
            <input 
              type="number"
              value={editedData.amount}
              onChange={e => setEditedData({ ...editedData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase">Categoria</label>
            <select 
              value={editedData.category}
              onChange={e => setEditedData({ ...editedData, category: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-500 uppercase">Data</label>
            <input 
              type="date"
              value={new Date(editedData.date).toISOString().split('T')[0]}
              onChange={e => setEditedData({ ...editedData, date: new Date(e.target.value).toISOString() })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button 
            onClick={() => setEditedData({...editedData, direction: TransactionDirection.OUTFLOW})}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg ${editedData.direction === TransactionDirection.OUTFLOW ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
          >
            Saída
          </button>
          <button 
            onClick={() => setEditedData({...editedData, direction: TransactionDirection.INFLOW})}
            className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg ${editedData.direction === TransactionDirection.INFLOW ? 'bg-[#00DC82] text-zinc-950' : 'text-zinc-600'}`}
          >
            Entrada
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-xs font-bold text-zinc-500 bg-zinc-900 rounded-xl">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 text-xs font-bold text-zinc-950 bg-[#00DC82] rounded-xl shadow-lg shadow-[#00DC82]/10">Confirmar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-[#18181B] border transition-all duration-300 ${
      transaction.status === TransactionStatus.CONFIRMED ? 'border-emerald-500/30' : 
      transaction.status === TransactionStatus.REJECTED ? 'border-red-500/30' : 
      transaction.status === TransactionStatus.PENDING_FIXED ? 'border-amber-500/40' : 'border-zinc-800'
    }`}>
      <div className="flex justify-between items-start mb-2">
        {transaction.intentLabel ? (
          <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-zinc-900 text-[#00DC82] px-2 py-1 rounded-md border border-[#00DC82]/20">
            {transaction.intentLabel}
          </span>
        ) : <div />}
        
        {transaction.installmentInfo && (
          <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-400/20">
            Parcela {transaction.installmentInfo.current}/{transaction.installmentInfo.total}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">
            {category.icon}
          </div>
          <div>
            <h4 className="font-semibold text-zinc-100">{transaction.merchant}</h4>
            <p className="text-xs text-zinc-500">{transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className={`text-lg font-bold mono ${transaction.direction === TransactionDirection.OUTFLOW ? 'text-zinc-100' : 'text-[#00DC82]'}`}>
          {transaction.direction === TransactionDirection.OUTFLOW ? '-' : '+'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {isStaging && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onReject(transaction.id)}
            className="flex-1 py-2 px-4 rounded-xl bg-zinc-800 text-zinc-400 font-medium hover:bg-zinc-700 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 py-2 px-4 rounded-xl bg-zinc-800 text-[#00DC82] border border-[#00DC82]/20 font-medium hover:bg-zinc-700 transition-colors text-sm"
          >
            Editar
          </button>
          <button
            onClick={() => onConfirm({ ...transaction, status: TransactionStatus.CONFIRMED })}
            className="flex-1 py-2 px-4 rounded-xl bg-[#00DC82] text-zinc-950 font-bold hover:opacity-90 transition-opacity text-sm"
          >
            Confirmar
          </button>
        </div>
      )}

      {transaction.status === TransactionStatus.CONFIRMED && (
        <div className="flex items-center gap-1.5 text-[#00DC82] text-xs font-semibold mt-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Registro Efetuado
        </div>
      )}
    </div>
  );
};

export default TransactionCard;

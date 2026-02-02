
import React, { useState } from 'react';
import { UserSettings, FixedExpense, Income, User, Category } from '../types';
import { DISTINCT_COLORS } from '../constants';

interface SettingsProps {
  settings: UserSettings;
  onUpdate: (settings: UserSettings) => void;
  user: User;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, user, onLogout }) => {
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [newIncome, setNewIncome] = useState({ name: '', amount: 0, day: 1 });
  const [newExpense, setNewExpense] = useState({ 
    name: '', 
    amount: 0, 
    category: 'Moradia', 
    day: 1, 
    type: 'subscription' as 'subscription' | 'installment',
    remainingMonths: 1 
  });
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '' });

  const addIncome = () => {
    if (!newIncome.name || newIncome.amount <= 0) return;
    const income: Income = { id: `manual-${Date.now()}`, ...newIncome };
    onUpdate({ ...settings, incomes: [...settings.incomes, income] });
    setNewIncome({ name: '', amount: 0, day: 1 });
    setShowIncomeForm(false);
  };

  const addExpense = () => {
    if (!newExpense.name || newExpense.amount <= 0) return;
    const expense: FixedExpense = {
      id: `manual-${Date.now()}`,
      ...newExpense,
      remainingMonths: newExpense.type === 'installment' ? newExpense.remainingMonths : undefined
    };
    onUpdate({ ...settings, fixedExpenses: [...settings.fixedExpenses, expense] });
    setNewExpense({ name: '', amount: 0, category: 'Moradia', day: 1, type: 'subscription', remainingMonths: 1 });
    setShowExpenseForm(false);
  };

  const addCategory = () => {
    if (!newCat.name) return;
    // Pega uma cor da paleta que ainda não esteja em uso prioritariamente
    const usedColors = new Set(settings.categories.map(c => c.color));
    const availableColor = DISTINCT_COLORS.find(c => !usedColors.has(c)) || DISTINCT_COLORS[settings.categories.length % DISTINCT_COLORS.length];
    
    const cat: Category = { 
      id: `cat-${Date.now()}`, 
      ...newCat, 
      color: newCat.color || availableColor 
    };
    onUpdate({ ...settings, categories: [...settings.categories, cat] });
    setNewCat({ name: '', icon: '📦', color: '' });
    setShowCategoryForm(false);
  };

  return (
    <div className="p-6 space-y-10 pb-40 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h2 className="text-2xl font-black text-white tracking-tighter">Central de Controle</h2>
        <p className="text-[10px] text-[#00DC82] font-black uppercase tracking-[0.2em]">Configurações da Inteligência</p>
      </header>

      {/* Categorias */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500/50 rounded-full"></span>
            Categorias
          </h3>
          <button 
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="text-[10px] font-black text-purple-400 uppercase tracking-wider bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/20"
          >
            {showCategoryForm ? 'Fechar' : '+ Nova'}
          </button>
        </div>
        
        {showCategoryForm && (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-3 animate-in slide-in-from-top-2">
             <div className="grid grid-cols-2 gap-2">
               <input placeholder="Nome" value={newCat.name} onChange={e=>setNewCat({...newCat, name: e.target.value})} className="bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white" />
               <input placeholder="Emoji Icon" value={newCat.icon} onChange={e=>setNewCat({...newCat, icon: e.target.value})} className="bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white text-center" />
             </div>
             <button onClick={addCategory} className="w-full bg-purple-500 text-white font-black py-2.5 rounded-xl text-[10px] uppercase">Adicionar Categoria</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
           {settings.categories.map(cat => (
             <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-[#18181B] border border-zinc-800 rounded-xl group">
               <span style={{ color: cat.color }}>{cat.icon}</span>
               <span className="text-[10px] font-bold text-zinc-400">{cat.name}</span>
               <button onClick={() => onUpdate({...settings, categories: settings.categories.filter(c => c.id !== cat.id)})} className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all ml-1">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
               </button>
             </div>
           ))}
        </div>
      </section>

      {/* Rendas Fixas */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#00DC82] rounded-full"></span>
            Fontes de Renda
          </h3>
          <button onClick={() => setShowIncomeForm(!showIncomeForm)} className="text-[10px] font-black text-[#00DC82] uppercase tracking-wider bg-[#00DC82]/10 px-3 py-1 rounded-full border border-[#00DC82]/20">
            {showIncomeForm ? 'Fechar' : '+ Nova'}
          </button>
        </div>
        
        {showIncomeForm && (
          <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <input placeholder="Ex: Salário" value={newIncome.name} onChange={e=>setNewIncome({...newIncome, name: e.target.value})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white" />
               <input type="number" placeholder="R$ 0,00" value={newIncome.amount || ''} onChange={e=>setNewIncome({...newIncome, amount: parseFloat(e.target.value)})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white mono" />
             </div>
             <input type="number" min="1" max="31" value={newIncome.day} onChange={e=>setNewIncome({...newIncome, day: parseInt(e.target.value)})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white" />
             <button onClick={addIncome} className="w-full bg-[#00DC82] text-zinc-950 font-black py-3 rounded-xl text-[10px] uppercase">Salvar Renda</button>
          </div>
        )}

        {settings.incomes.map(income => (
          <div key={income.id} className="flex items-center justify-between p-4 bg-[#18181B] border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-lg">💰</div>
               <div><p className="text-sm font-bold text-zinc-100">{income.name}</p><span className="text-[9px] text-zinc-500 font-bold uppercase">Dia {income.day}</span></div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black mono text-sm text-[#00DC82]">R$ {income.amount.toLocaleString('pt-BR')}</span>
              <button onClick={() => onUpdate({...settings, incomes: settings.incomes.filter(i => i.id !== income.id)})} className="text-zinc-700 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
        ))}
      </section>

      {/* Gastos Fixos */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-500/50 rounded-full"></span>
            Gastos Fixos
          </h3>
          <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="text-[10px] font-black text-red-400 uppercase tracking-wider bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
            {showExpenseForm ? 'Fechar' : '+ Novo'}
          </button>
        </div>

        {showExpenseForm && (
          <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <input placeholder="Ex: Netflix" value={newExpense.name} onChange={e=>setNewExpense({...newExpense, name: e.target.value})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white" />
               <input type="number" placeholder="R$ 0,00" value={newExpense.amount || ''} onChange={e=>setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white mono" />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <select value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white">
                 {settings.categories.filter(c => c.name !== 'Salário').map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
               </select>
               <input type="number" min="1" max="31" value={newExpense.day} onChange={e=>setNewExpense({...newExpense, day: parseInt(e.target.value)})} className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white" />
             </div>
             <button onClick={addExpense} className="w-full bg-red-500 text-white font-black py-3 rounded-xl text-[10px] uppercase">Salvar Gasto</button>
          </div>
        )}

        {settings.fixedExpenses.map(expense => (
          <div key={expense.id} className="flex items-center justify-between p-4 bg-[#18181B] border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg">{settings.categories.find(c => c.name === expense.category)?.icon || '💸'}</div>
               <div><p className="text-sm font-bold text-zinc-100">{expense.name}</p><span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-black uppercase">Dia {expense.day}</span></div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black mono text-sm text-zinc-100">R$ {expense.amount.toLocaleString('pt-BR')}</span>
              <button onClick={() => onUpdate({...settings, fixedExpenses: settings.fixedExpenses.filter(e => e.id !== expense.id)})} className="text-zinc-700 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
        ))}
      </section>

      <footer className="pt-10 border-t border-zinc-900">
        <button onClick={onLogout} className="w-full py-4 rounded-2xl bg-zinc-900 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Encerrar Sessão
        </button>
      </footer>
    </div>
  );
};

export default Settings;

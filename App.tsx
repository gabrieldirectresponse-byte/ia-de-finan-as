
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Transaction, Message, TransactionStatus, TransactionDirection, UserSettings, FixedExpense, Income, User } from './types';
import { INITIAL_CATEGORIES } from './constants';
import { processFinancialIntent } from './services/geminiService';
import { supabase, saveUserSettings, fetchUserSettings, syncTransactions, fetchTransactions } from './services/supabaseService';
import TransactionCard from './components/TransactionCard';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import History from './components/History';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import SummaryHeader from './components/SummaryHeader';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard' | 'history' | 'settings'>('chat');
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    incomes: [],
    fixedExpenses: [],
    categories: INITIAL_CATEGORIES
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, view]);

  // Carregar dados iniciais do Supabase após login
  useEffect(() => {
    const loadAppData = async () => {
      if (user) {
        setIsDataLoaded(false);
        const [cloudSettings, cloudLedger] = await Promise.all([
          fetchUserSettings(user.id),
          fetchTransactions(user.id)
        ]);

        if (cloudSettings) setSettings(cloudSettings);
        if (cloudLedger) setLedger(cloudLedger);
        
        setIsDataLoaded(true);

        if (messages.length === 0) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `FinAI Cloud Ativo\nOlá, ${user.name.split(' ')[0]}. Todos os seus registros estão sincronizados e seguros na nuvem. Como posso te ajudar hoje?`,
            timestamp: new Date(),
            type: 'text'
          }]);
        }
      }
    };

    loadAppData();
  }, [user?.id]);

  // Persistir alterações no Supabase (Debounced ou Efeito)
  useEffect(() => {
    if (user && isDataLoaded) {
      const timeoutId = setTimeout(() => {
        saveUserSettings(user.id, settings);
        syncTransactions(user.id, ledger);
      }, 1000); // Debounce de 1s para evitar excesso de requisições
      return () => clearTimeout(timeoutId);
    }
  }, [ledger, settings, user?.id, isDataLoaded]);

  const financialSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const confirmedTransactions = ledger.filter(t => t.status === TransactionStatus.CONFIRMED);

    const currentMonthTs = confirmedTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const inflow = currentMonthTs
      .filter(t => t.direction === TransactionDirection.INFLOW)
      .reduce((acc, t) => acc + t.amount, 0);

    const outflow = currentMonthTs
      .filter(t => t.direction === TransactionDirection.OUTFLOW)
      .reduce((acc, t) => acc + t.amount, 0);

    const available = confirmedTransactions.reduce((acc, t) => {
      return t.direction === TransactionDirection.INFLOW ? acc + t.amount : acc - t.amount;
    }, 0);

    return {
      inflow,
      outflow,
      available,
      fixedIncomeCount: settings.incomes.length,
      fixedExpenseCount: settings.fixedExpenses.filter(e => e.type === 'subscription').length,
      installmentsCount: settings.fixedExpenses.filter(e => e.type === 'installment').length
    };
  }, [ledger, settings]);

  const handleUpdateTransaction = (updatedT: Transaction) => {
    if (updatedT.status === TransactionStatus.CONFIRMED && updatedT.installmentInfo) {
      setSettings(prev => {
        const newFixed = prev.fixedExpenses.map(f => {
          if (f.id === updatedT.installmentInfo?.parentId) {
            const rem = (f.remainingMonths || 1) - 1;
            return { ...f, remainingMonths: rem };
          }
          return f;
        }).filter(f => f.type !== 'installment' || (f.remainingMonths && f.remainingMonths > 0));
        return { ...prev, fixedExpenses: newFixed };
      });
    }
    setLedger(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setLedger(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLedger([]);
    setMessages([]);
    setSettings({ incomes: [], fixedExpenses: [], categories: INITIAL_CATEGORIES });
  };

  const handleSendMessage = async (text?: string, image?: string) => {
    const content = text || inputValue;
    if (!content.trim() && !image) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      type: 'text',
      imageUrl: image
    }]);
    setInputValue('');
    setPreviewImage(null);
    setIsLoading(true);

    const fixedNames = [
      ...settings.incomes.map(i => i.name),
      ...settings.fixedExpenses.map(e => e.name)
    ].join(', ');

    const context = `USUÁRIO: ${user?.name}. SALDO: ${financialSummary.available}. LISTA DE FIXOS ATUAIS: [${fixedNames}]. DIA HOJE: ${new Date().getDate()}.`;
    const result = await processFinancialIntent(content, context, image);
    setIsLoading(false);

    if (result.type === 'clarification') {
      setMessages(prev => [...prev, {
        id: `m-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        type: 'text'
      }]);
      return;
    }

    const now = new Date();
    let effectiveDate = new Date();
    if (result.transaction?.day) {
      effectiveDate = new Date(now.getFullYear(), now.getMonth(), result.transaction.day);
    }

    let fixedId = `f-${Date.now()}`;

    if (result.type === 'fixed_income' && result.transaction) {
      const income: Income = {
        id: fixedId,
        name: result.transaction.merchant,
        amount: result.transaction.amount,
        day: result.transaction.day || now.getDate()
      };
      setSettings(prev => ({ ...prev, incomes: [...prev.incomes, income] }));
    } 
    else if (result.type === 'installment' && result.transaction) {
      const expense: FixedExpense = {
        id: fixedId,
        name: result.transaction.merchant,
        amount: result.transaction.amount,
        category: result.transaction.category || 'Compras',
        day: result.transaction.day || now.getDate(),
        type: 'installment',
        remainingMonths: result.transaction.totalInstallments,
        totalInstallments: result.transaction.totalInstallments
      };
      setSettings(prev => ({ ...prev, fixedExpenses: [...prev.fixedExpenses, expense] }));
    }
    else if (result.type === 'fixed_expense' && result.transaction) {
      const expense: FixedExpense = {
        id: fixedId,
        name: result.transaction.merchant,
        amount: result.transaction.amount,
        category: result.transaction.category || 'Outros',
        day: result.transaction.day || now.getDate(),
        type: 'subscription'
      };
      setSettings(prev => ({ ...prev, fixedExpenses: [...prev.fixedExpenses, expense] }));
    }

    if (result.transaction) {
      const newT: Transaction = {
        id: `t-${Date.now()}`,
        amount: result.transaction.amount,
        merchant: result.transaction.merchant,
        category: result.transaction.category || "Outros",
        date: effectiveDate.toISOString(),
        direction: result.transaction.direction || (result.type === 'fixed_income' ? TransactionDirection.INFLOW : TransactionDirection.OUTFLOW),
        status: TransactionStatus.STAGING,
        intentLabel: result.intentLabel,
        installmentInfo: result.type === 'installment' ? {
          current: 1,
          total: result.transaction.totalInstallments || 1,
          parentId: fixedId
        } : undefined
      };
      setLedger(prev => [newT, ...prev]);
      
      setMessages(prev => [...prev, {
        id: `m-${Date.now()}`,
        role: 'assistant',
        content: result.response + (result.isPotentialDuplicate ? "\n⚠️ Notei que você já possui um lançamento similar na nuvem. Deseja manter ambos ou atualizar o anterior?" : ""),
        timestamp: new Date(),
        type: 'transaction_card',
        transactionId: newT.id
      }]);
    }
  };

  if (!user) return <Auth onLogin={setUser} />;
  if (user.isNewUser) return <Onboarding userName={user.name} onFinish={() => setUser({...user, isNewUser: false})} />;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[#09090B] shadow-2xl overflow-hidden text-zinc-100">
      <nav className="flex items-center justify-between px-6 py-4 bg-[#09090B]/80 backdrop-blur-lg border-b border-zinc-900 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00DC82] flex items-center justify-center font-black text-zinc-950">F</div>
          <span className="font-bold text-lg tracking-tight">FinAI</span>
        </div>
        <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800">
          <button onClick={() => setView('chat')} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${view === 'chat' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-500'}`}>Chat</button>
          <button onClick={() => setView('dashboard')} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${view === 'dashboard' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-500'}`}>Stats</button>
          <button onClick={() => setView('history')} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${view === 'history' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-500'}`}>Extrato</button>
          <button onClick={() => setView('settings')} className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${view === 'settings' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-500'}`}>Config</button>
        </div>
      </nav>

      <SummaryHeader 
        inflow={financialSummary.inflow} 
        outflow={financialSummary.outflow} 
        available={financialSummary.available}
        fixedIncomeCount={financialSummary.fixedIncomeCount}
        fixedExpenseCount={financialSummary.fixedExpenseCount}
        installmentsCount={financialSummary.installmentsCount}
      />

      <main className={`flex-1 overflow-y-auto chat-container ${view === 'chat' ? 'bg-[#09090B]' : ''}`}>
        {!isDataLoaded && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse-soft">
             <div className="w-12 h-12 border-4 border-[#00DC82]/20 border-t-[#00DC82] rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Sincronizando com a Nuvem...</p>
          </div>
        )}
        
        {isDataLoaded && (
          view === 'chat' ? (
            <div className="p-4 space-y-6 flex flex-col min-h-full pb-24">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col animate-message ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'transaction_card' && msg.transactionId ? (
                     <div className="w-full max-w-[95%] space-y-2">
                      {ledger.find(t => t.id === msg.transactionId) ? (
                        <TransactionCard 
                          transaction={ledger.find(t => t.id === msg.transactionId)!}
                          categories={settings.categories}
                          onConfirm={handleUpdateTransaction}
                          onReject={handleDeleteTransaction}
                        />
                      ) : null}
                      <div className="text-[12px] text-zinc-400 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm leading-relaxed">
                        {msg.content}
                      </div>
                     </div>
                  ) : (
                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-[13px] shadow-sm relative ${
                      msg.role === 'user' ? 'bg-[#00DC82] text-zinc-950 font-semibold rounded-tr-none' : 'bg-[#18181B] border border-zinc-800/80 rounded-tl-none'
                    }`}>
                      {msg.imageUrl && <img src={msg.imageUrl} className="max-h-56 w-full object-cover mb-2 rounded-xl" alt="Preview" />}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && <div className="flex gap-1.5 px-4 py-3 bg-[#18181B] rounded-2xl w-16"><div className="typing-dot"></div><div className="typing-dot" style={{animationDelay:'0.2s'}}></div><div className="typing-dot" style={{animationDelay:'0.4s'}}></div></div>}
              <div ref={chatEndRef} className="h-4" />
            </div>
          ) : view === 'dashboard' ? <Dashboard transactions={ledger} settings={settings} /> : 
              view === 'history' ? <History ledger={ledger} categories={settings.categories} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} /> : 
              <Settings settings={settings} onUpdate={setSettings} user={user} onLogout={handleLogout} />
        )}
      </main>

      {view === 'chat' && isDataLoaded && (
        <div className="p-4 bg-[#09090B]">
          <div className="flex items-center gap-2 bg-[#18181B] rounded-2xl p-2 border border-zinc-800 shadow-2xl">
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-zinc-500 hover:text-[#00DC82] transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onloadend = () => setPreviewImage(reader.result as string);
                 reader.readAsDataURL(file);
               }
            }} className="hidden" accept="image/*" />
            <input 
              type="text" 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Fale com seu CFO Cloud..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] text-white outline-none"
            />
            <button onClick={() => handleSendMessage()} disabled={!inputValue.trim() && !previewImage} className="p-2.5 bg-[#00DC82] text-zinc-950 rounded-xl disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

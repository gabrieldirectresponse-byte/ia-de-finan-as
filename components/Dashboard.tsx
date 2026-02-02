
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  CartesianGrid, Line, ComposedChart, Legend
} from 'recharts';
import { Transaction, TransactionDirection, UserSettings, TransactionStatus, Income, FixedExpense } from '../types';
import { DISTINCT_COLORS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  settings: UserSettings;
}

interface DashboardMetrics {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  fixedCommitment: number;
  totalConfiguredFixed: number;
  catMap: Record<string, number>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181B] border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-[#00DC82] uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center gap-4">
              <span className="text-[11px] text-zinc-400">{p.name}</span>
              <span className={`text-[11px] font-bold ${p.name.includes('Receita') ? 'text-[#00DC82]' : 'text-red-400'}`}>
                R$ {p.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
          <div className="pt-1.5 border-t border-zinc-800 mt-1.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase">Saldo Mês</span>
              <span className="text-[11px] font-black text-white">
                R$ {(payload[0].value - payload[1].value).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, settings }) => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'projections' | 'profile'>('realtime');
  const [projectionRange, setProjectionRange] = useState<1 | 3 | 6>(3);

  const confirmed = useMemo(() => 
    [...transactions]
      .filter(t => t.status === TransactionStatus.CONFIRMED)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  , [transactions]);
  
  const metrics = useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentTs = confirmed.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = currentTs.filter(t => t.direction === TransactionDirection.INFLOW).reduce((a: number, b: Transaction) => a + b.amount, 0);
    const expenses = currentTs.filter(t => t.direction === TransactionDirection.OUTFLOW).reduce((a: number, b: Transaction) => a + b.amount, 0);
    
    const totalConfiguredIncome = settings.incomes.reduce((a: number, b: Income) => a + b.amount, 0);
    const totalConfiguredFixed = settings.fixedExpenses.reduce((a: number, b: FixedExpense) => a + b.amount, 0);

    const effectiveIncome = Math.max(income, totalConfiguredIncome);
    const fixedCommitment = effectiveIncome > 0 ? (totalConfiguredFixed / effectiveIncome) * 100 : 0;
    const savingsRate = effectiveIncome > 0 ? ((effectiveIncome - expenses) / effectiveIncome) * 100 : 0;
    
    const catMap: Record<string, number> = {};
    currentTs
      .filter(t => t.direction === TransactionDirection.OUTFLOW)
      .forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    return { 
      income: effectiveIncome, 
      expenses, 
      balance: effectiveIncome - expenses, 
      savingsRate, 
      fixedCommitment,
      totalConfiguredFixed,
      catMap
    };
  }, [confirmed, settings]);

  const dailyFlowData = useMemo(() => {
    const now = new Date();
    const data = [];

    for (let i = 1; i <= now.getDate(); i++) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
      const dayTs = confirmed.filter(t => new Date(t.date).toDateString() === dayDate.toDateString());
      
      const dayIn = dayTs.filter(t => t.direction === TransactionDirection.INFLOW).reduce((a: number, b: Transaction) => a + b.amount, 0);
      const dayOut = dayTs.filter(t => t.direction === TransactionDirection.OUTFLOW).reduce((a: number, b: Transaction) => a + b.amount, 0);
      
      data.push({
        day: i,
        entrada: dayIn,
        saida: dayOut,
      });
    }
    return data;
  }, [confirmed]);

  const radarData = useMemo(() => {
    const values = Object.values(metrics.catMap) as number[];
    const maxVal = values.length > 0 ? Math.max(...values) : 100;
    
    return settings.categories.map(cat => ({
      subject: cat.name,
      value: metrics.catMap[cat.name] || 0,
      fullMark: maxVal,
    })).filter(d => d.value > 0 || settings.categories.indexOf(settings.categories.find(c => c.name === d.subject)!) < 5);
  }, [metrics.catMap, settings.categories]);

  const categoryData = useMemo(() => {
    return Object.entries(metrics.catMap)
      .map(([name, value], index) => {
        // Garante uma cor única baseada no índice se a cor da categoria for repetida ou padrão
        const dataColor = settings.categories.find(c => c.name === name)?.color;
        const finalColor = (dataColor && dataColor !== '#71717A') 
          ? dataColor 
          : DISTINCT_COLORS[index % DISTINCT_COLORS.length];

        return { 
          name, 
          value, 
          color: finalColor 
        };
      })
      .sort((a: any, b: any) => (b.value as number) - (a.value as number));
  }, [metrics.catMap, settings.categories]);

  // Projeção Mensal Detalhada
  const monthlyProjectionData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < projectionRange; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = targetDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
      
      const incomeForMonth = settings.incomes.reduce((a, b) => a + b.amount, 0);
      const expensesForMonth = settings.fixedExpenses.reduce((a, b) => {
        if (b.type === 'subscription') {
          return a + b.amount;
        } else {
          return (b.remainingMonths && b.remainingMonths > i) ? a + b.amount : a;
        }
      }, 0);

      data.push({
        name: monthLabel,
        receita: incomeForMonth,
        despesa: expensesForMonth,
        saldo: incomeForMonth - expensesForMonth
      });
    }
    return data;
  }, [settings, projectionRange]);

  const totalProjectionSummary = useMemo(() => {
    return monthlyProjectionData.reduce((acc, curr) => ({
      receita: acc.receita + curr.receita,
      despesa: acc.despesa + curr.despesa,
      saldo: acc.saldo + curr.saldo
    }), { receita: 0, despesa: 0, saldo: 0 });
  }, [monthlyProjectionData]);

  return (
    <div className="p-6 space-y-8 pb-32 animate-in fade-in duration-700">
      {/* Resumo do Mês Atual */}
      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-2 p-6 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Patrimônio Líquido Atual</p>
            <h2 className="text-4xl font-black mono text-white">R$ {metrics.balance.toLocaleString('pt-BR')}</h2>
            <div className="flex items-center gap-2 mt-4">
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${metrics.savingsRate > 0 ? 'bg-[#00DC82]/10 text-[#00DC82]' : 'bg-red-500/10 text-red-500'}`}>
                {metrics.savingsRate > 0 ? 'Superávit' : 'Déficit'} {Math.abs(metrics.savingsRate).toFixed(1)}%
              </span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">vs. Renda Total</span>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#00DC82]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase mb-2">Comprometimento</p>
          <div className="flex items-end justify-between">
            <span className="text-xl font-black text-white">{metrics.fixedCommitment.toFixed(0)}%</span>
            <span className="text-[8px] font-bold text-zinc-600 mb-1">FIXOS</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${metrics.fixedCommitment}%` }} />
          </div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase mb-2">Custo Fixo</p>
          <div className="flex items-end justify-between">
            <span className="text-xl font-black text-white">R$ {metrics.totalConfiguredFixed.toFixed(0)}</span>
            <div className="w-2 h-2 rounded-full bg-red-500 mb-1.5 animate-pulse"></div>
          </div>
          <p className="text-[8px] text-zinc-600 font-bold uppercase mt-2">Dedução Automática</p>
        </div>
      </section>

      {/* Tabs Principais */}
      <div className="flex p-1 bg-zinc-900/80 rounded-2xl border border-zinc-800">
        {[
          { id: 'realtime', label: 'Fluxo' },
          { id: 'profile', label: 'DNA' },
          { id: 'projections', label: 'Futuro' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-[#00DC82] shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'realtime' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <section className="space-y-4">
              <header className="px-2">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Movimentação Diária</h3>
                <p className="text-[14px] font-bold text-white leading-tight">Histórico Mensal Ativo</p>
              </header>
              <div className="h-80 bg-zinc-900/30 rounded-[2.5rem] p-6 border border-zinc-800 shadow-inner overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#52525B', fontSize: 10, fontWeight: 900 }} 
                      dy={10}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="entrada" stroke="#00DC82" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="saida" stroke="#EF4444" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="bg-[#18181B] p-6 rounded-[2rem] border border-zinc-800 flex flex-col items-center shadow-lg">
                 <p className="text-[8px] font-black text-zinc-500 uppercase mb-4 w-full text-center tracking-widest">Distribuição</p>
                 <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={categoryData} 
                          innerRadius={32} 
                          outerRadius={48} 
                          paddingAngle={6} 
                          dataKey="value" 
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="bg-[#18181B] p-6 rounded-[2rem] border border-zinc-800 space-y-4 shadow-lg">
                <p className="text-[8px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Top Categorias</p>
                {categoryData.slice(0, 3).map((cat, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-zinc-400 truncate w-16">{cat.name}</span>
                      <span className="text-white">R$ {cat.value.toFixed(0)}</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cat.value / (metrics.expenses || 1)) * 100}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <section className="bg-[#18181B] rounded-[2.5rem] p-8 border border-zinc-800 flex flex-col items-center shadow-2xl">
               <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8">Análise de Comportamento</h3>
               <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#27272A" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717A', fontSize: 9, fontWeight: 700 }} />
                      <Radar name="Gastos" dataKey="value" stroke="#00DC82" fill="#00DC82" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
               <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-4">Padrões baseados no extrato atual</p>
            </section>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
             <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl mx-2 shadow-inner">
                {[
                  { value: 1, label: '30 Dias' },
                  { value: 3, label: '3 Meses' },
                  { value: 6, label: '6 Meses' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setProjectionRange(range.value as any)}
                    className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${projectionRange === range.value ? 'bg-[#00DC82] text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
                  >
                    {range.label}
                  </button>
                ))}
             </div>

             <section className="bg-zinc-900/60 rounded-[2.5rem] p-6 border border-zinc-800 shadow-2xl relative overflow-hidden">
                <header className="mb-8">
                  <h3 className="text-[10px] font-black text-[#00DC82] uppercase tracking-[0.2em] mb-1">Previsão Mensal Detalhada</h3>
                  <p className="text-white text-lg font-bold tracking-tight">Evolução do Fluxo Estrutural</p>
                </header>
                
                <div className="h-72 w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyProjectionData} barGap={4}>
                      <defs>
                        <linearGradient id="barIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00DC82" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#00DC82" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="barOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717A', fontSize: 10, fontWeight: 900 }} 
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                      <Bar name="Receita" dataKey="receita" fill="url(#barIn)" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar name="Despesa" dataKey="despesa" fill="url(#barOut)" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10 border-t border-zinc-800 pt-6">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Acumulado</p>
                    <p className="text-xl font-black text-white mono">R$ {totalProjectionSummary.receita.toLocaleString('pt-BR')}</p>
                    <div className="h-0.5 w-8 bg-[#00DC82]"></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Saída Total</p>
                    <p className="text-xl font-black text-white mono">R$ {totalProjectionSummary.despesa.toLocaleString('pt-BR')}</p>
                    <div className="h-0.5 w-8 bg-red-500 ml-auto"></div>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-gradient-to-r from-zinc-950 to-[#00DC82]/5 border border-[#00DC82]/20 rounded-[2rem] flex items-center justify-between">
                   <div>
                     <p className="text-[9px] font-black text-[#00DC82] uppercase mb-1 tracking-widest">Saldo Livre do Período</p>
                     <p className="text-2xl font-black text-white mono">R$ {totalProjectionSummary.saldo.toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Saúde Média</p>
                     <p className="text-lg font-black text-[#00DC82]">
                       {totalProjectionSummary.receita > 0 ? ((totalProjectionSummary.saldo / totalProjectionSummary.receita) * 100).toFixed(0) : 0}%
                     </p>
                   </div>
                </div>
                <div className="absolute -left-20 -top-20 w-48 h-48 bg-[#00DC82]/5 rounded-full blur-[80px]"></div>
             </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

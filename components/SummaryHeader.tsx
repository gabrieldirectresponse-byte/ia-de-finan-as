
import React from 'react';

interface SummaryHeaderProps {
  inflow: number;
  outflow: number;
  available: number;
  fixedIncomeCount: number;
  fixedExpenseCount: number;
  installmentsCount: number;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ 
  inflow, 
  outflow, 
  available,
  fixedIncomeCount,
  fixedExpenseCount,
  installmentsCount
}) => {
  return (
    <div className="bg-[#09090B] border-b border-zinc-900 sticky top-14 z-20">
      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-800">
          <p className="text-[8px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Entrada</p>
          <p className="text-xs font-black mono text-[#00DC82]">
            R$ {inflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-800">
          <p className="text-[8px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Saída</p>
          <p className="text-xs font-black mono text-red-400">
            R$ {outflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-800 ring-1 ring-[#00DC82]/20">
          <p className="text-[8px] font-black text-zinc-100 uppercase mb-1 tracking-widest">Disponível</p>
          <p className={`text-xs font-black mono ${available >= 0 ? 'text-white' : 'text-red-500'}`}>
            R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      {/* Micro-resumo Cognitivo */}
      <div className="px-6 pb-4 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#00DC82]"></span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">{fixedIncomeCount} Rendas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-500"></span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">{fixedExpenseCount} Fixos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500"></span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">{installmentsCount} Parcelas</span>
          </div>
        </div>
        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Status Atual</div>
      </div>
    </div>
  );
};

export default SummaryHeader;

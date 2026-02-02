
import React, { useState } from 'react';

interface OnboardingProps {
  userName: string;
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ userName, onFinish }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Olá, ${userName}!`,
      description: "Eu sou o FinAI. Não sou apenas um app de finanças, sou seu CFO Digital autônomo.",
      icon: "🤖",
      color: "bg-[#00DC82]"
    },
    {
      title: "Fale como um humano",
      description: "Esqueça formulários chatos. Apenas diga: 'Gastei 50 reais no Uber' ou mande uma foto da nota fiscal.",
      icon: "🎙️",
      color: "bg-blue-500"
    },
    {
      title: "IA que entende tudo",
      description: "Se você disser 'Parcelei em 10x', eu cuido das parcelas dos próximos meses automaticamente para você.",
      icon: "🧠",
      color: "bg-purple-500"
    },
    {
      title: "Pronto para decolar?",
      description: "Seus dados são processados com IA de última geração e ficam seguros no seu dispositivo.",
      icon: "🚀",
      color: "bg-orange-500"
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B] flex flex-col items-center justify-center p-8 text-zinc-100">
      <div className="w-full max-w-sm space-y-12 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`w-24 h-24 rounded-[2rem] ${currentStep.color} flex items-center justify-center text-5xl shadow-2xl transition-all duration-500`}>
            {currentStep.icon}
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tighter">{currentStep.title}</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">{currentStep.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 justify-center">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#00DC82]' : 'w-2 bg-zinc-800'}`} />
            ))}
          </div>

          <button 
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : onFinish()}
            className="w-full bg-zinc-100 text-zinc-950 font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {step < steps.length - 1 ? 'Próximo' : 'Entrar no Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

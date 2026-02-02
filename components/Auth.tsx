
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user: User = {
          id: session.user.id,
          name: session.user.user_metadata.name || 'Usuário',
          email: session.user.email || '',
          isNewUser: false,
          createdAt: session.user.created_at
        };
        onLogin(user);
      }
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!formData.name) {
          setError('Nome é obrigatório.');
          setIsLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          onLogin({
            id: data.user.id,
            name: formData.name,
            email: formData.email,
            isNewUser: true,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;
        if (data.user) {
          onLogin({
            id: data.user.id,
            name: data.user.user_metadata.name || 'Usuário',
            email: data.user.email || '',
            isNewUser: false,
            createdAt: data.user.created_at
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6 text-zinc-100">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#00DC82] flex items-center justify-center font-black text-3xl text-zinc-950 shadow-[0_0_30px_rgba(0,220,130,0.3)]">F</div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tighter">FinAI Cloud</h1>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Sincronização em Tempo Real</p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="bg-[#18181B] border border-zinc-800 p-8 rounded-[2rem] shadow-2xl space-y-5 relative overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{isRegistering ? 'Criar Nova Conta' : 'Acessar Sistema'}</h2>
            <p className="text-xs text-zinc-500">Seus dados agora são salvos na nuvem.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 font-bold flex items-center gap-2 animate-shake">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Nome Completo</label>
                <input 
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#00DC82]/50 focus:ring-1 focus:ring-[#00DC82]/20 transition-all placeholder:text-zinc-700"
                  required={isRegistering}
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">E-mail</label>
              <input 
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#00DC82]/50 focus:ring-1 focus:ring-[#00DC82]/20 transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Senha de Acesso</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#00DC82]/50 focus:ring-1 focus:ring-[#00DC82]/20 transition-all placeholder:text-zinc-700"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00DC82] text-zinc-950 font-black py-4 rounded-xl shadow-[0_4px_20px_rgba(0,220,130,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></div>
            ) : isRegistering ? 'Finalizar Cadastro' : 'Entrar na Plataforma'}
          </button>

          <div className="flex flex-col items-center gap-4 pt-2">
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-[0.2em]"
            >
              {isRegistering ? 'Já possui conta? Conectar' : 'Novo por aqui? Criar acesso'}
            </button>
          </div>
        </form>
        
        <p className="text-center text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
          Autenticação segura via Supabase Auth.
        </p>
      </div>
    </div>
  );
};

export default Auth;

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword, type CurrentUser } from '../lib/auth';

interface LoginProps {
  onLogin: (user: CurrentUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hash = await hashPassword(password);

      // Tenta autenticar pela tabela de usuários
      const { data: usuario } = await supabase
        .from('5.8-usuarios')
        .select('id, nome, email, role, permissao, ativo')
        .eq('email', email.trim().toLowerCase())
        .eq('senha_hash', hash)
        .eq('ativo', true)
        .maybeSingle();

      if (usuario) {
        onLogin({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role as 'admin' | 'user',
          permissao: usuario.permissao as 'view' | 'edit',
        });
        setLoading(false);
        return;
      }

      // Fallback: credenciais hardcoded do admin inicial
      if (email.trim() === 'adm5.8@gmail.com' && password === '@Inter58') {
        // Auto-cria o admin na tabela se ainda não existir
        await supabase.from('5.8-usuarios').upsert({
          nome: 'Administrador',
          email: 'adm5.8@gmail.com',
          senha_hash: hash,
          role: 'admin',
          permissao: 'edit',
          ativo: true,
        }, { onConflict: 'email' });

        onLogin({ id: 0, nome: 'Administrador', email: 'adm5.8@gmail.com', role: 'admin', permissao: 'edit' });
        setLoading(false);
        return;
      }

      setError('Email ou senha incorretos');
    } catch {
      setError('Erro ao conectar. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: perspective(900px) translateY(0px) rotateX(6deg) rotateY(-6deg); }
          50%       { transform: perspective(900px) translateY(-18px) rotateX(6deg) rotateY(-6deg); }
        }
        @keyframes spin-conic {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .logo-float {
          animation: float 3.5s ease-in-out infinite;
          filter: drop-shadow(0 30px 50px rgba(0,0,0,0.7));
        }

        .logo-border-wrap {
          position: relative;
          border-radius: 22px;
          padding: 4px;
        }
        .logo-border-wrap .spin-ring {
          position: absolute;
          inset: 0;
          border-radius: 22px;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 55%,
            #b91c1c 68%,
            #ef4444 76%,
            #ff3333 80%,
            #ef4444 86%,
            #b91c1c 92%,
            transparent 100%
          );
          animation: spin-conic 2s linear infinite;
        }
        .logo-border-wrap .spin-ring-blur {
          position: absolute;
          inset: -3px;
          border-radius: 26px;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 55%,
            #ef4444 72%,
            #ff0000 80%,
            #ef4444 88%,
            transparent 100%
          );
          animation: spin-conic 2s linear infinite;
          filter: blur(16px);
          opacity: 0.7;
        }
        .logo-border-wrap img {
          position: relative;
          z-index: 1;
          display: block;
          border-radius: 18px;
        }

        .glow-blob {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .input-dark {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          transition: all 0.2s;
        }
        .input-dark::placeholder { color: rgba(255,255,255,0.3); }
        .input-dark:focus {
          outline: none;
          background: rgba(255,255,255,0.09);
          border-color: rgba(239,68,68,0.6);
          box-shadow: 0 0 0 3px rgba(239,68,68,0.15);
        }
      `}</style>

      {/* Fundo geral escuro */}
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center p-4 relative overflow-hidden">

        {/* ── Holofotes / neons de fundo ── */}

        {/* Holofote vermelho — canto superior esquerdo, longe */}
        <div className="pointer-events-none absolute" style={{
          top: '-10%', left: '-8%',
          width: 600, height: 600,
          background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.18) 0%, transparent 65%)',
          filter: 'blur(8px)',
        }} />

        {/* Holofote rosa/laranja — canto superior direito */}
        <div className="pointer-events-none absolute" style={{
          top: '-5%', right: '-5%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse at center, rgba(251,113,133,0.12) 0%, transparent 60%)',
          filter: 'blur(12px)',
        }} />

        {/* Holofote roxo/índigo — canto inferior direito */}
        <div className="pointer-events-none absolute" style={{
          bottom: '-8%', right: '5%',
          width: 550, height: 550,
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.14) 0%, transparent 60%)',
          filter: 'blur(10px)',
        }} />

        {/* Holofote vermelho frio — canto inferior esquerdo */}
        <div className="pointer-events-none absolute" style={{
          bottom: '-5%', left: '5%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse at center, rgba(185,28,28,0.12) 0%, transparent 65%)',
          filter: 'blur(14px)',
        }} />

        {/* Luz central fraca — dá profundidade atrás do card */}
        <div className="pointer-events-none absolute" style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900, height: 500,
          background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.06) 0%, transparent 60%)',
          filter: 'blur(4px)',
        }} />

        {/* Card principal */}
        <div className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex" style={{ minHeight: 480 }}>

          {/* ---- Lado esquerdo: formulário ---- */}
          <div className="flex-1 bg-[#18181f] p-10 flex flex-col justify-center">
            <h2 className="text-white text-2xl font-bold mb-1">
              Faça o seu login <span className="inline-block w-2 h-2 rounded-full bg-red-500 mb-1" />
            </h2>
            <p className="text-slate-500 text-sm mb-8">Acesse o painel de análises</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
              >
                {loading ? 'Entrando...' : <><LogIn size={17} /> Entrar</>}
              </button>
            </form>
          </div>

          {/* ---- Lado direito: logo visual ---- */}
          <div
            className="hidden md:flex w-72 flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #13131a 0%, #0f0f16 50%, #11111a 100%)',
            }}
          >
            {/* Logo flutuante — glow só no hover */}
            <div className="logo-float relative z-10 group">
              {/* Blob aparece só no hover */}
              <div
                className="absolute rounded-full pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                style={{
                  width: 260, height: 260,
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(220,38,38,0.35) 0%, transparent 70%)',
                  filter: 'blur(6px)',
                  zIndex: -1,
                }}
              />
              <div className="logo-border-wrap">
                <div className="spin-ring-blur" />
                <div className="spin-ring" />
                <img
                  src="/logo.png"
                  alt="Internet 5.8"
                  style={{ width: 150, height: 150, objectFit: 'contain' }}
                />
              </div>
            </div>

            <p className="relative z-10 mt-6 text-slate-400 text-xs text-center px-4 leading-relaxed">
              Plataforma de<br />Monitoramento e Análise
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

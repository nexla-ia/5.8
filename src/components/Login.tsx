import { useState } from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
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

    if (email === 'adm5.8@gmail.com' && password === '@Inter58') {
      localStorage.setItem('authenticated', 'true');
      onLogin();
    } else {
      setError('Email ou senha incorretos');
    }

    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: perspective(900px) translateY(0px) rotateX(6deg) rotateY(-8deg); }
          50%       { transform: perspective(900px) translateY(-22px) rotateX(6deg) rotateY(-8deg); }
        }
        @keyframes spin-conic {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .logo-float {
          animation: float 3.5s ease-in-out infinite;
          filter: drop-shadow(0 40px 60px rgba(0,0,0,0.6));
        }

        /* Container com padding = espessura da borda */
        .logo-border-wrap {
          position: relative;
          border-radius: 24px;
          padding: 4px;
          cursor: default;
        }

        /* Conic-gradient girando — fica atrás da imagem */
        .logo-border-wrap .spin-ring {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 55%,
            #b91c1c 68%,
            #ef4444 76%,
            #ff2222 80%,
            #ef4444 84%,
            #b91c1c 90%,
            transparent 100%
          );
          animation: spin-conic 2s linear infinite;
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        /* Glow blur atrás */
        .logo-border-wrap .spin-ring-blur {
          position: absolute;
          inset: -2px;
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
          filter: blur(14px);
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .logo-border-wrap:hover .spin-ring,
        .logo-border-wrap:hover .spin-ring-blur {
          opacity: 1;
        }

        /* Imagem fica por cima do spin-ring */
        .logo-border-wrap img {
          position: relative;
          z-index: 1;
          display: block;
          border-radius: 20px;
        }

        /* Fundo esquerdo — grid de pontos sutil */
        .dot-grid {
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="min-h-screen flex">

        {/* ---- Lado esquerdo: logo + branding ---- */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex-col items-center justify-center gap-10 relative overflow-hidden dot-grid">
          {/* Blob decorativo vermelho */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="logo-float">
            <div className="logo-border-wrap">
              <div className="spin-ring-blur" />
              <div className="spin-ring" />
              <img
                src="/logo.png"
                alt="Internet 5.8"
                style={{ width: 180, height: 180, objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Texto */}
          <div className="text-center px-8 relative z-10">
            <h1 className="text-white text-3xl font-bold tracking-tight mb-2">
              Internet 5.8
            </h1>
            <p className="text-slate-400 text-base">
              Plataforma de Monitoramento e Análise
            </p>
          </div>

          {/* Rodapé esquerdo */}
          <p className="absolute bottom-6 text-slate-600 text-xs">
            © 2026 Internet 5.8 · Todos os direitos reservados
          </p>
        </div>

        {/* ---- Lado direito: formulário ---- */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-sm">

            {/* Logo pequena no mobile (só aparece quando sidebar some) */}
            <div className="flex justify-center mb-8 lg:hidden">
              <img src="/logo.png" alt="5.8" className="w-20 h-20 object-contain rounded-2xl" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-1">Bem-vindo</h2>
            <p className="text-gray-500 text-sm mb-8">Faça login para acessar o dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  'Entrando...'
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}

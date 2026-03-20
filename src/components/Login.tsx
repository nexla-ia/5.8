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
          0%, 100% { transform: perspective(900px) translateY(0px) rotateX(6deg) rotateY(-6deg); }
          50%       { transform: perspective(900px) translateY(-18px) rotateX(6deg) rotateY(-6deg); }
        }
        @keyframes spin-conic {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.08); }
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
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4">

        {/* Card principal */}
        <div className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex" style={{ minHeight: 480 }}>

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
              background: 'linear-gradient(145deg, #1a0a0a 0%, #0f0a14 40%, #0a0f1a 100%)',
            }}
          >
            {/* Blob vermelho difuso */}
            <div
              className="glow-blob absolute w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            {/* Blob roxo sutil */}
            <div
              className="absolute w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                bottom: '15%', right: '10%',
              }}
            />

            {/* Logo flutuante */}
            <div className="logo-float relative z-10">
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

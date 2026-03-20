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
          0%, 100% { transform: perspective(800px) translateY(0px) rotateX(8deg) rotateY(-6deg); }
          50%       { transform: perspective(800px) translateY(-20px) rotateX(8deg) rotateY(-6deg); }
        }
        @keyframes spin-conic {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .logo-float {
          animation: float 3.5s ease-in-out infinite;
          filter: drop-shadow(0 30px 50px rgba(0,0,0,0.55));
        }

        .logo-ring-wrap {
          position: relative;
          display: inline-block;
          border-radius: 22px;
        }

        .logo-ring-wrap::before,
        .logo-ring-wrap::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 26px;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            transparent 60%,
            #ef4444 75%,
            #ff2222 85%,
            #ef4444 90%,
            transparent 100%
          );
          animation: spin-conic 1.8s linear infinite;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .logo-ring-wrap::after {
          filter: blur(10px);
        }

        .logo-ring-wrap:hover::before,
        .logo-ring-wrap:hover::after {
          opacity: 1;
        }

        .logo-ring-wrap img {
          position: relative;
          z-index: 1;
          display: block;
          border-radius: 20px;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Logo flutuante 3D */}
          <div className="flex justify-center mb-10">
            <div className="logo-float">
              <div className="logo-ring-wrap">
                <img
                  src="/logo.png"
                  alt="Internet 5.8"
                  style={{ width: 140, height: 140, objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>

          {/* Card de login */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Bem-vindo</h2>
            <p className="text-center text-gray-600 mb-8">Dashboard de Análises</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Entrando...'
                ) : (
                  <>
                    <LogIn size={20} />
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

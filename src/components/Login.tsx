import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Mail } from 'lucide-react';
import MatrixRain from './MatrixRain';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let finalEmail = email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // if no @ is present, auto-append @programmingclubustc.org
      if (email && !email.includes('@')) {
        finalEmail = email + '@programmingclubustc.org';
      } else {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
    }

    try {
      await login(finalEmail, password);
    } catch (err) {
      setError((err as Error)?.message || 'Failed to login. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-black border-2 border-green-500 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,0,0.3)]">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 border-2 border-green-500 rounded-full flex items-center justify-center animate-pulse">
              <Mail className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-green-500 text-center mb-2 font-mono glitch">
            MATRIX MAIL
          </h1>
          <p className="text-green-400 text-center mb-8 text-sm font-mono">
            ENTER THE SYSTEM
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-green-500 text-sm font-mono mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all"
                placeholder="user@domain.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-green-500 text-sm font-mono mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded font-mono text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded font-mono transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_20px_rgba(0,255,0,0.4)]"
            >
              {loading ? 'ACCESSING...' : 'ENTER'}
            </button>
            
          </form>

          <div className="mt-8 text-center">
            <p className="text-green-600 text-xs font-mono">
              &gt; SECURE CONNECTION ESTABLISHED
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 text-center z-10 hidden sm:block">
        <p className="text-green-600 text-xs font-mono">© {new Date().getFullYear()} Safone, All Rights Reserved.</p>
      </div>

      <style>{`
        @keyframes glitch {
          0% {
            text-shadow: 2px 2px #00ff00, -2px -2px #00ff00;
          }
          25% {
            text-shadow: -2px 2px #00ff00, 2px -2px #00ff00;
          }
          50% {
            text-shadow: 2px -2px #00ff00, -2px 2px #00ff00;
          }
          75% {
            text-shadow: -2px -2px #00ff00, 2px 2px #00ff00;
          }
          100% {
            text-shadow: 2px 2px #00ff00, -2px -2px #00ff00;
          }
        }
        .glitch {
          animation: glitch 2s infinite;
        }
      `}</style>
    </div>
  );
}

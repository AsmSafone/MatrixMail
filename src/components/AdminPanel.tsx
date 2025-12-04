import { useState } from 'react';
import { registerUser, loginUser } from '../lib/api';
import { ArrowLeft } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    try {
      await loginUser(adminEmail, adminPassword);
      setAdminAuthenticated(true);
    } catch (err) {
      setAdminError((err as Error)?.message || 'Failed to authenticate admin');
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (!name.trim()) {
      setError('Please enter a valid name');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await registerUser(email, password, name.trim());
      setSuccess('User registered successfully');
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError((err as Error)?.message || 'Failed to register user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items_center items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30" />
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-black border-2 border-green-500 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,0,0.3)]">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="p-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-black transition-all mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-green-500 font-mono">
                {adminAuthenticated ? 'REGISTER USER' : 'ADMIN PANEL'}
              </h1>
              <p className="text-green-400 text-xs font-mono">
                {adminAuthenticated ? 'CREATE NEW USER ACCOUNT' : 'ADMIN AUTHENTICATION REQUIRED'}
              </p>
            </div>
          </div>
          {!adminAuthenticated ? (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label htmlFor="adminEmail" className="block text-green-500 text-sm font-mono mb-2">
                  ADMIN EMAIL
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all"
                  placeholder="admin@domain.com"
                  required
                  disabled={adminLoading}
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-green-500 text-sm font-mono mb-2">
                  ADMIN PASSWORD
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all"
                  placeholder="••••••••"
                  required
                  disabled={adminLoading}
                />
              </div>

              {adminError && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded font-mono text-sm">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded font-mono transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_20px_rgba(0,255,0,0.4)]"
              >
                {adminLoading ? 'AUTHENTICATING...' : 'LOGIN AS ADMIN'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-green-500 text-sm font-mono mb-2">
                  NAME
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all"
                  placeholder="User Name"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-green-500 text-sm font-mono mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
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
              {success && (
                <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded font-mono text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded font-mono transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_20px_rgba(0,255,0,0.4)]"
              >
                {loading ? 'REGISTERING...' : 'REGISTER USER'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-green-600 text-xs font-mono">
              Admin must authenticate before user registration.
            </p>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 left-0 right-0 text-center z-10">
        <p className="text-green-600 text-xs font-mono">© {new Date().getFullYear()} Safone, All Rights Reserved.</p>
      </div>
    </div>
  );
}

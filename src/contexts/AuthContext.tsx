import { useEffect, useState, ReactNode } from 'react';
import { AuthContext } from './useAuth';

const CORS_PREFIX = 'https://cors.safothebot.workers.dev';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('matrix_user');
      if (raw) {
        const data = JSON.parse(raw) as { name?: string; email?: string };
        if (data?.email) {
          setEmail(String(data.email));
          setName(data?.name ? String(data.name) : null);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = async (emailAddress: string, password: string) => {
    const resp = await fetch(`${CORS_PREFIX}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAddress, password }),
    });
    const data = await resp.json().catch(() => ({} as unknown));
    if (!resp.ok) {
      const msg = (data as { error?: string })?.error || 'Invalid credentials';
      throw new Error(msg);
    }
    const access = (data as { access_token?: string })?.access_token;
    const user = (data as { user?: { name?: string; email?: string } })?.user;
    if (!access || !user?.email) {
      throw new Error('Invalid response');
    }
    setEmail(String(user.email));
    setName(user?.name ? String(user.name) : null);
    try {
      localStorage.setItem('access_token', String(access));
      localStorage.setItem('matrix_user', JSON.stringify({ name: user?.name || null, email: user.email }));
    } catch { /* ignore */ }
  };

  const logout = async () => {
    setEmail(null);
    setName(null);
    try {
      localStorage.removeItem('matrix_user');
      localStorage.removeItem('access_token');
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ name, email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export {}

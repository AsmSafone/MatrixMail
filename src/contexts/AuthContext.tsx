import { useEffect, useState, ReactNode } from 'react';
import { AuthContext } from './useAuth';

const USERS = [
  { name: 'Admin', email: 'admin@example.com', password: 'AdminPassword123!' },
  { name: 'Support Team', email: 'support@example.com', password: 'SupportPassword123!' },
  { name: 'Event Updates', email: 'events@example.com', password: 'EventsPassword123!' },
  { name: 'Demo User', email: 'demo@example.com', password: 'DemoPassword123!' }
];

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
    const user = USERS.find((u) => u.email === emailAddress && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    setEmail(user.email);
    setName(user.name);
    try {
      localStorage.setItem('matrix_user', JSON.stringify({ name: user.name, email: user.email }));
    } catch { /* ignore */ }
  };

  const logout = async () => {
    setEmail(null);
    setName(null);
    try {
      localStorage.removeItem('matrix_user');
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ name, email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export {}

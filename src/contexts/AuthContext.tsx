import { useState, useEffect, ReactNode } from 'react';
import { loginUser } from '../lib/api';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('matrix_email_session');
      const sessionEmail = localStorage.getItem('matrix_email_address');
      const sessionExpiry = Number(localStorage.getItem('matrix_email_session_expiry') || '0');
      if (!sessionToken || !sessionEmail) {
        setLoading(false);
        return;
      }
      if (sessionExpiry && Date.now() > sessionExpiry) {
        localStorage.removeItem('matrix_email_session');
        localStorage.removeItem('matrix_email_session_expiry');
        localStorage.removeItem('matrix_email_address');
        setLoading(false);
        return;
      }
      setEmail(sessionEmail);
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailAddress: string, password: string) => {
    const { token, expiresIn } = await loginUser(emailAddress, password);
    const expiryAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('matrix_email_session', token);
    localStorage.setItem('matrix_email_session_expiry', String(expiryAt));
    localStorage.setItem('matrix_email_address', emailAddress);
    setEmail(emailAddress);
  };

  const logout = async () => {
    localStorage.removeItem('matrix_email_session');
    localStorage.removeItem('matrix_email_session_expiry');
    localStorage.removeItem('matrix_email_address');
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export {}

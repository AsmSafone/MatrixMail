import { useState, ReactNode } from 'react';
import { loginUser } from '../lib/api';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const loading = false;

  const login = async (emailAddress: string, password: string) => {
    await loginUser(emailAddress, password);
    setEmail(emailAddress);
  };

  const logout = async () => {
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{ email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export {}

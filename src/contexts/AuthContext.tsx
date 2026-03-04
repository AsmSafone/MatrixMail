import { useEffect, useState, useRef, ReactNode } from 'react';
import { AuthContext } from './useAuth';
import { BACKEND_BASE } from '../config';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // timer id used for automatic logout when token expires
  const expireTimer = useRef<number | null>(null);

  // helpers ---------------------------------------------------------------
  const getTokenExpiryTime = (token: string): number | null => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      if (typeof payload.exp === 'number') {
        return payload.exp * 1000;
      }
    } catch {
      // ignore malformed token
    }
    return null;
  };

  const scheduleExpiry = (expiryMs: number) => {
    if (expireTimer.current !== null) {
      window.clearTimeout(expireTimer.current);
    }
    const delay = expiryMs - Date.now();
    if (delay <= 0) {
      window.dispatchEvent(new Event('auth-expired'));
      return;
    }
    expireTimer.current = window.setTimeout(() => {
      window.dispatchEvent(new Event('auth-expired'));
    }, delay + 1000);
  };

  useEffect(() => {
    // if there is a token stored, schedule a logout when it expires
    const token = String(localStorage.getItem('access_token') || '');
    if (token) {
      const exp = getTokenExpiryTime(token);
      if (exp && exp <= Date.now()) {
        // already expired
        logout().catch(() => {});
      } else if (exp) {
        scheduleExpiry(exp);
      }
    }

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
    const base = BACKEND_BASE;
    if (!base) throw new Error('Backend URL not configured');
    const url = `${base}/api/login`;
    const resp = await fetch(url, {
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
    // when we successfully login schedule automatic logout
    const expires = getTokenExpiryTime(String(access));
    if (expires) scheduleExpiry(expires);
  };

  const logout = async () => {
    setEmail(null);
    setName(null);
    if (expireTimer.current !== null) {
      window.clearTimeout(expireTimer.current);
      expireTimer.current = null;
    }
    try {
      localStorage.removeItem('matrix_user');
      localStorage.removeItem('access_token');
    } catch { /* ignore */ }
  };
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const base = BACKEND_BASE;
    if (!base) throw new Error('Backend URL not configured');
    const token = String(localStorage.getItem('access_token') || '');
    const url = `${base}/api/change-password?token=${encodeURIComponent(token)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await resp.json().catch(() => ({} as unknown));
    if (!resp.ok) {
      const msg = (data as { error?: string })?.error || 'Failed to change password';
      throw new Error(msg);
    }
  };

  // listen for broadcasts from the API layer indicating that the token was rejected
  useEffect(() => {
    const handler = () => {
      // reuse our existing logout implementation
      logout().catch(() => {});
      // ensure the UI returns to the login screen; reload will
      // also clear any stale state in other components
      try {
        window.location.replace('/');
      } catch {
        window.location.href = '/';
      }
    };
    window.addEventListener('auth-expired', handler);
    return () => {
      window.removeEventListener('auth-expired', handler);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ name, email, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export {}

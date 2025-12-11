import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import Login from './components/Login';
import Inbox from './components/Inbox';

function AppContent() {
  const { email, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono text-xl animate-pulse">
          INITIALIZING SYSTEM...
        </div>
      </div>
    );
  }

  return email ? <Inbox /> : <Login />;
}

function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = String(e.key || '').toLowerCase();
      const block =
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'p')) ||
        ((e.ctrlKey || e.metaKey) && (k === 'u'));
      if (block) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('keydown', onKey, true);

    let redirected = false;
    const threshold = 160;
    const detect = () => {
      const w = window.outerWidth - window.innerWidth > threshold;
      const h = window.outerHeight - window.innerHeight > threshold;
      if ((w || h) && !redirected) {
        redirected = true;
        try {
          window.location.replace('about:blank');
        } catch {
          window.location.href = 'about:blank';
        }
      }
    };

    const interval = setInterval(() => {
      detect();
      try { (performance as Performance).clearResourceTimings?.(); } catch { /* ignore */ }
    }, 1000);

    return () => {
      window.removeEventListener('keydown', onKey, true);
      clearInterval(interval);
    };
  }, []);
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

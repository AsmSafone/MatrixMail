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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

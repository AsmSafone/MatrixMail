import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { fetchEmails, Email } from '../lib/api';
import { Mail, RefreshCw, LogOut, Send, Inbox as InboxIcon } from 'lucide-react';
import MatrixRain from './MatrixRain';
import EmailViewer from './EmailViewer';
import Compose from './Compose';

export default function Inbox() {
  const { email: userEmail, logout } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');

  const loadEmails = useCallback(async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const fetchedEmails = await fetchEmails(userEmail);
      setEmails(fetchedEmails.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmails();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (selectedEmail) {
    return (
      <EmailViewer
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onDeleted={loadEmails}
      />
    );
  }

  if (showCompose) {
    return <Compose onBack={() => setShowCompose(false)} onSent={loadEmails} />;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10">
        <header className="bg-black/90 border-b-2 border-green-500 sticky top-0 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 border-2 border-green-500 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-500 font-mono">MATRIX MAIL</h1>
                  <p className="text-green-400 text-sm font-mono">{userEmail}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 border border-green-500 text-green-500 rounded hover:bg-green-500/10 transition-all disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowCompose(true)}
                  className="px-4 py-2 bg-green-500 text-black font-mono font-bold rounded hover:bg-green-400 transition-all flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>COMPOSE</span>
                </button>
                <button
                  onClick={logout}
                  className="p-2 border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/80 border-2 border-green-500 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.2)]">
            <div className="bg-green-500/10 border-b-2 border-green-500 px-6 py-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className={`px-4 py-2 text-sm font-mono rounded inline-flex items-center space-x-2 ${
                      activeTab === 'inbox'
                        ? 'bg-green-500 text-black border-2 border-green-500'
                        : 'text-green-500 border-2 border-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    <InboxIcon className="w-4 h-4" />
                    <span>INBOX ({emails.filter((e) => e.type === 'received').length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('outbox')}
                    className={`px-4 py-2 text-sm font-mono rounded inline-flex items-center space-x-2 ${
                      activeTab === 'outbox'
                        ? 'bg-green-500 text-black border-2 border-green-500'
                        : 'text-green-500 border-2 border-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>OUTBOX ({emails.filter((e) => e.type === 'sent').length})</span>
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-green-500 font-mono text-lg animate-pulse">
                  LOADING EMAILS...
                </div>
              </div>
            ) : emails.filter((e) => e.type === (activeTab === 'inbox' ? 'received' : 'sent')).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Mail className="w-16 h-16 text-green-500/30 mb-4" />
                <p className="text-green-500 font-mono text-lg">NO EMAILS</p>
                <p className="text-green-600 font-mono text-sm mt-2">
                  Your {activeTab === 'inbox' ? 'inbox' : 'outbox'} is empty
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-green-900/30">
                {emails
                  .filter((e) => e.type === (activeTab === 'inbox' ? 'received' : 'sent'))
                  .map((email) => (
                  <div
                    key={`${email.id}-${email.type}-${email.to}-${email.from}`}
                    onClick={() => setSelectedEmail(email)}
                    className="px-6 py-4 hover:bg-green-500/5 cursor-pointer transition-all border-l-4 border-transparent hover:border-green-500 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-green-400 font-mono text-sm font-semibold truncate">
                            {email.type === 'sent' ? `TO: ${email.to}` : `FROM: ${email.from}`}
                          </span>
                        </div>
                        <h3 className="text-green-300 font-mono font-semibold text-base mb-2 group-hover:text-green-200 transition-colors">
                          {email.subject || '(No Subject)'}
                        </h3>
                        <p className="text-green-600 font-mono text-sm line-clamp-2">
                          {email.text || '(No content)'}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <span className="text-green-500 font-mono text-xs whitespace-nowrap">
                          {formatDate(email.date)}
                        </span>
                        {email.hasHtml && (
                          <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded border border-green-700">
                            HTML
                          </span>
                        )}
                        {email.attachments > 0 && (
                          <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded border border-green-700">
                            ATTACHMENT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <div className="fixed bottom-4 left-0 right-0 text-center z-10">
        <p className="text-green-600 text-xs font-mono">© {new Date().getFullYear()} Safone, All Rights Reserved.</p>
      </div>
    </div>
  );
}

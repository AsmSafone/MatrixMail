import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { fetchEmails, Email, fetchEmailHtml, fetchAttachments } from '../lib/api';
import { Mail, RefreshCw, LogOut, Send, Inbox as InboxIcon, Search, Star, Square, CheckSquare, ChevronLeft, ChevronRight, User } from 'lucide-react';
import MatrixRain from './MatrixRain';
import EmailViewer from './EmailViewer';
import Compose from './Compose';

export default function Inbox() {
  const { name: userName, email: userEmail, logout, changePassword } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox' | 'starred'>('inbox');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [metaById, setMetaById] = useState<Record<string, { hasHtml: boolean; attachments: number }>>({});
  const [initStarLoaded, setInitStarLoaded] = useState(false);
  const [initReadLoaded, setInitReadLoaded] = useState(false);

  const loadEmails = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedEmails = await fetchEmails();
      setEmails(fetchedEmails.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmails();
  };

  useEffect(() => {
    if (!userEmail) return;
    try {
      const raw = localStorage.getItem(`matrix_starred_${userEmail}`);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setStarredIds(new Set(arr));
      }
    } catch { /* ignore */ }
    setInitStarLoaded(true);
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail || !initStarLoaded) return;
    try {
      localStorage.setItem(`matrix_starred_${userEmail}`, JSON.stringify(Array.from(starredIds)));
    } catch { /* ignore */ }
  }, [starredIds, userEmail, initStarLoaded]);

  useEffect(() => {
    if (!userEmail) return;
    try {
      const raw = localStorage.getItem(`matrix_read_${userEmail}`);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setReadIds(new Set(arr));
      }
    } catch { /* ignore */ }
    setInitReadLoaded(true);
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail || !initReadLoaded) return;
    try {
      localStorage.setItem(`matrix_read_${userEmail}`, JSON.stringify(Array.from(readIds)));
    } catch { /* ignore */ }
  }, [readIds, userEmail, initReadLoaded]);

  const filtered = emails
    .filter((e) => {
      if (activeTab === 'inbox') return e.type === 'received' && e.to === userEmail;
      if (activeTab === 'outbox') return e.type === 'sent' && e.from === userEmail;
      return starredIds.has(e.id) && (e.to === userEmail || e.from === userEmail);
    })
    .filter((e) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        (e.subject || '').toLowerCase().includes(q) ||
        (e.from || '').toLowerCase().includes(q) ||
        (e.to || '').toLowerCase().includes(q)
      );
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const tasks = paged.map(async (email) => {
        if (metaById[email.id]) return;
        try {
          const [htmlRes, att] = await Promise.all([
            fetchEmailHtml(userEmail || '', email.id, email.type),
            fetchAttachments(email.id, email.type),
          ]);
          const next = { hasHtml: !!htmlRes.html, attachments: att.length };
          if (!cancelled) {
            setMetaById((prev) => ({ ...prev, [email.id]: next }));
          }
        } catch { void 0; }
      });
      await Promise.allSettled(tasks);
    };
    run();
    return () => { cancelled = true; };
  }, [paged, userEmail, metaById]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleStar = (id: string) => {
    const next = new Set(starredIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setStarredIds(next);
  };

  const markRead = (read: boolean) => {
    const next = new Set(readIds);
    for (const id of selectedIds) {
      if (read) next.add(id); else next.delete(id);
    }
    setReadIds(next);
    setSelectedIds(new Set());
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 border-2 border-green-500 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-500 font-mono">MATRIX MAIL</h1>
                  <p className="text-green-400 text-sm font-mono">{userEmail}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                  className="px-4 py-2 bg-green-500 text.black font-mono font-bold rounded hover:bg-green-400 transition-all flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>COMPOSE</span>
                </button>
                <button
                  onClick={() => { setShowChangePass(true); setCurrentPass(''); setNewPass(''); setChangeError(''); }}
                  className="px-4 py-2 border border-green-500 text-green-500 rounded font-mono hover:bg-green-500/10 transition-all flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>PROFILE</span>
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className={`px-4 py-2 text-sm font-mono rounded inline-flex items-center space-x-2 ${
                      activeTab === 'inbox'
                        ? 'bg-green-500 text-black border-2 border-green-500'
                        : 'text-green-500 border-2 border-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    <InboxIcon className="w-4 h-4" />
                    <span>INBOX ({emails.filter((e) => e.type === 'received' && e.to === userEmail).length})</span>
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
                    <span>OUTBOX ({emails.filter((e) => e.type === 'sent' && e.from === userEmail).length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('starred')}
                    className={`px-4 py-2 text-sm font-mono rounded inline-flex items-center space-x-2 ${
                      activeTab === 'starred'
                        ? 'bg-green-500 text-black border-2 border-green-500'
                        : 'text-green-500 border-2 border-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span>STARRED ({Array.from(starredIds).length})</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                      className="w-full md:w-64 pl-9 pr-3 py-2 bg-black border-2 border-green-500 rounded text-green-400 font-mono text-sm focus:outline-none focus:border-green-300"
                      placeholder="Search"
                    />
                  </div>
                  <button
                    onClick={() => markRead(true)}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-2 border-2 border-green-500 text-green-500 rounded font-mono text-xs disabled:opacity-50"
                    title="Mark as read"
                  >
                    READ
                  </button>
                  <button
                    onClick={() => markRead(false)}
                    disabled={selectedIds.size === 0}
                    className="px-3 py-2 border-2 border-green-500 text-green-500 rounded font-mono text-xs disabled:opacity-50"
                    title="Mark as unread"
                  >
                    UNREAD
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
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Mail className="w-16 h-16 text-green-500/30 mb-4" />
                <p className="text-green-500 font-mono text-lg">NO EMAILS</p>
                <p className="text-green-600 font-mono text-sm mt-2">
                  Your {activeTab === 'inbox' ? 'inbox' : activeTab === 'outbox' ? 'outbox' : 'starred'} is empty
                </p>
              </div>
            ) : (
              <div>
                <div className="divide-y-2 divide-green-900/30">
                  {paged.map((email) => (
                  <div
                    key={`${email.id}-${email.type}-${email.to}-${email.from}`}
                    onClick={() => {
                      setSelectedEmail(email);
                      setReadIds((prev) => {
                        const next = new Set(prev);
                        next.add(email.id);
                        return next;
                      });
                    }}
                    className="px-6 py-4 hover:bg-green-500/5 cursor-pointer transition-all border-l-4 border-transparent hover:border-green-500 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-green-400 font-mono text-sm font-semibold truncate">
                            {email.type === 'sent' ? `TO: ${email.to}` : `FROM: ${email.from}`}
                          </span>
                        </div>
                        <h3 className="text-green-300 font-mono font-semibold text-base mb-2 group-hover:text-green-200 transition-colors">
                          {email.subject || '(No Subject)'}
                        </h3>
                        
                      </div>
                      <div className="sm:ml-4 mt-2 sm:mt-0 flex items-start sm:items-end sm:flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500 font-mono text-xs whitespace-nowrap">
                            {formatDate(email.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!selectedIds.has(email.id) && !readIds.has(email.id) && (
                            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded border border-green-700">
                              UNREAD
                            </span>
                          )}
                          {!selectedIds.has(email.id) && ((metaById[email.id]?.hasHtml) || email.hasHtml) && (
                            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded border border-green-700">
                              HTML
                            </span>
                          )}
                          {!selectedIds.has(email.id) && ((metaById[email.id]?.attachments ?? email.attachments) > 0) && (
                            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs font-mono rounded border border-green-700">
                              ATTACHMENT
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelect(email.id); }}
                            className={`h-6 w-6 flex items-center justify-center rounded border ${selectedIds.has(email.id) ? 'border-green-500 bg-green-900/30' : 'border-green-700 bg-black'} hover:bg-green-900/30`}
                            title={selectedIds.has(email.id) ? 'Deselect' : 'Select'}
                          >
                            {selectedIds.has(email.id) ? (
                              <CheckSquare className="w-4 h-4 text-green-500" />
                            ) : (
                              <Square className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                            className="p-1 rounded border border-green-700 hover:bg-green-900/30"
                            title={starredIds.has(email.id) ? 'Unstar' : 'Star'}
                          >
                            {starredIds.has(email.id) ? (
                              <Star className="w-4 h-4 text-green-500" fill="currentColor" />
                            ) : (
                              <Star className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                <div className="flex items-center justify-between px-6 py-3 border-t border-green-900/30 bg-black/40">
                <div className="text-green-500 font-mono text-xs">Page {currentPage} of {totalPages}</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    className="p-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-500/10 disabled:opacity-50"
                    disabled={currentPage <= 1}
                    title="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    className="p-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-500/10 disabled:opacity-50"
                    disabled={currentPage >= totalPages}
                    title="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {showChangePass && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm bg-black border-2 border-green-500 rounded-lg p-6 shadow-[0_0_30px_rgba(0,255,0,0.3)]">
            <h2 className="text-green-500 font-mono font-bold text-lg mb-4">USER PROFILE</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-green-500 font-mono text-xs mb-2">USER NAME</label>
                <p className="w-full bg-black border-2 border-green-500 text-green-400 px-3 py-2 rounded font-mono">{userName}</p>
              </div>
              <div>
                <label className="block text-green-500 font-mono text-xs mb-2">USER EMAIL</label>
                <p className="w-full bg-black border-2 border-green-500 text-green-400 px-3 py-2 rounded font-mono">{userEmail}</p>
              </div>
            </div>
            <h2 className="text-green-500 font-mono font-bold text-lg mb-4 mt-8">CHANGE PASSWORD</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-green-500 font-mono text-xs mb-2">CURRENT PASSWORD</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-black border-2 border-green-500 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:border-green-300"
                  disabled={changing}
                />
              </div>
              <div>
                <label className="block text-green-500 font-mono text-xs mb-2">NEW PASSWORD</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-black border-2 border-green-500 text-green-400 px-3 py-2 rounded font-mono focus:outline-none focus:border-green-300"
                  disabled={changing}
                />
              </div>
              {changeError && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-3 py-2 rounded font-mono text-xs">
                  {changeError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { if (changing) return; setShowChangePass(false); setChangeError(''); }}
                  className="px-3 py-2 border-2 border-green-700 text-green-500 rounded font-mono hover:bg-green-900/30"
                  disabled={changing}
                >
                  CANCEL
                </button>
                <button
                  onClick={async () => {
                    setChangeError('');
                    setChanging(true);
                    try {
                      await changePassword(currentPass, newPass);
                      setShowChangePass(false);
                    } catch (err) {
                      setChangeError((err as Error)?.message || 'Failed to change password');
                    } finally {
                      setChanging(false);
                    }
                  }}
                  className="px-3 py-2 bg-green-500 text-black rounded font-mono hover:bg-green-400 disabled:opacity-50"
                  disabled={changing || !currentPass || !newPass}
                >
                  {changing ? 'UPDATING...' : 'UPDATE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 left-0 right-0 text-center z-10 hidden sm:block">
        <p className="text-green-600 text-xs font-mono">© {new Date().getFullYear()} Safone, All Rights Reserved.</p>
      </div>
    </div>
  );
}

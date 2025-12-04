import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { fetchEmailHtml, deleteEmail, fetchAttachments, downloadAttachment, Email } from '../lib/api';
import { ArrowLeft, Mail, Calendar, User, Trash2, Paperclip, FileText } from 'lucide-react';
import MatrixRain from './MatrixRain';

interface EmailViewerProps {
  email: Email;
  onBack: () => void;
  onDeleted?: () => void;
}

export default function EmailViewer({ email, onBack, onDeleted }: EmailViewerProps) {
  const { email: userEmail } = useAuth();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attachments, setAttachments] = useState<{ index: number; filename: string; contentType: string; size: number }[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  const loadHtmlContent = useCallback(async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      let html = await fetchEmailHtml(userEmail, email.id);
      const trimmed = html.trim();
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        try {
          html = JSON.parse(trimmed);
        } catch {}
      }
      const sanitized = html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '')
        .replace(/on[a-z]+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:\s*/gi, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      setHtmlContent(sanitized);
    } catch (error) {
      console.error('Failed to load HTML content:', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail, email.id]);

  useEffect(() => {
    if (email.hasHtml) {
      loadHtmlContent();
    }
  }, [email.hasHtml, loadHtmlContent]);

  useEffect(() => {
    const loadAtt = async () => {
      if (!userEmail || !email.attachments) return;
      try {
        setAttLoading(true);
        const metas = await fetchAttachments(userEmail, email.id);
        setAttachments(metas);
      } catch (err) {
        console.error('Failed to load attachments:', err);
      } finally {
        setAttLoading(false);
      }
    };
    loadAtt();
  }, [userEmail, email.id, email.attachments]);

  useEffect(() => {
    let revoked: string[] = [];
    const buildPreviews = async () => {
      if (!userEmail) return;
      const urls: Record<number, string> = {};
      for (const att of attachments) {
        if (att.contentType?.startsWith('image/')) {
          try {
            const blob = await downloadAttachment(userEmail, email.id, att.index);
            const url = URL.createObjectURL(blob);
            urls[att.index] = url;
            revoked.push(url);
          } catch {}
        }
      }
      setPreviewUrls(urls);
    };
    buildPreviews();
    return () => {
      for (const u of revoked) URL.revokeObjectURL(u);
    };
  }, [attachments, userEmail, email.id]);
  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10">
        <header className="bg-black/90 border-b-2 border-green-500 sticky top-0 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="p-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-black transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-xl font-bold text-green-500 font-mono">EMAIL VIEWER</h1>
                    <p className="text-green-400 text-sm font-mono">{userEmail}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!userEmail || deleting) return;
                  const ok = confirm('Delete this email?');
                  if (!ok) return;
                  try {
                    setDeleting(true);
                    await deleteEmail(userEmail, email.id);
                    onDeleted?.();
                    onBack();
                  } catch (err) {
                    console.error(err);
                    alert((err as Error)?.message || 'Failed to delete email');
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="p-2 border-2 border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-black transition-all disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/80 border-2 border-green-500 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.2)]">
            <div className="bg-green-500/10 border-b-2 border-green-500 px-6 py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-green-300 font-mono">
                    {email.subject || '(No Subject)'}
                  </h2>
                </div>

                <div className="space-y-2">
                  {email.type === 'sent' ? (
                    <div className="flex items-center space-x-3 text-green-400 font-mono text-sm">
                      <Mail className="w-4 h-4" />
                      <span className="font-semibold">TO:</span>
                      <span>{email.to}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 text-green-400 font-mono text-sm">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">FROM:</span>
                      <span>{email.from}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 text-green-400 font-mono text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">DATE:</span>
                    <span>{formatDate(email.date)}</span>
                  </div>
                  
                </div>
              </div>
            </div>

            

            <div className="px-6 py-8">
              {email.hasHtml ? (
                loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-green-500 font-mono animate-pulse">
                      LOADING...
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <div
                      className="p-6"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  </div>
                )
              ) : (
                <div className="text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {email.text || '(No content)'}
                </div>
              )}
              {email.attachments > 0 && (
                <div className="mt-6">
                  <div className="flex items-center space-x-3 text-green-400 font-mono text-sm mb-3">
                    <Paperclip className="w-4 h-4" />
                    <span className="font-semibold">ATTACHMENTS</span>
                    <span className="text-green-600">({email.attachments})</span>
                  </div>
                  {attLoading ? (
                    <div className="text-green-500 font-mono text-sm">LOADING ATTACHMENTS...</div>
                  ) : attachments.length === 0 ? (
                    <div className="text-green-600 font-mono text-sm">No attachment metadata</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {attachments.map((att) => {
                        const isImage = att.contentType?.startsWith('image/');
                        const url = previewUrls[att.index];
                        return (
                          <button
                            key={att.index}
                            className="group relative border border-green-500/50 rounded overflow-hidden bg-green-900/20 hover:border-green-500 transition-all"
                            onClick={async () => {
                              if (!userEmail) return;
                              try {
                                const blob = await downloadAttachment(userEmail, email.id, att.index);
                                const dl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = dl;
                                a.download = att.filename;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(dl);
                              } catch (err) {
                                console.error(err);
                                alert('Failed to download attachment');
                              }
                            }}
                            title={att.filename}
                          >
                            {isImage && url ? (
                              <img src={url} alt={att.filename} className="aspect-square w-full object-cover" />
                            ) : (
                              <div className="aspect-square w-full flex items-center justify-center">
                                <FileText className="w-10 h-10 text-green-500" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-xs font-mono text-green-300 truncate">
                              {att.filename}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <div className="fixed bottom-4 left-0 right-0 text-center z-10">
        <p className="text-green-600 text-xs font-mono">© {new Date().getFullYear()} Safone, All Rights Reserved.</p>
      </div>
    </div>
  );
}

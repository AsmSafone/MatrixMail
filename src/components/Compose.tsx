import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { sendEmail } from '../lib/api';
import { ArrowLeft, Send, Paperclip, X } from 'lucide-react';
import MatrixRain from './MatrixRain';

interface ComposeProps {
  onBack: () => void;
  onSent: () => void;
}

interface Attachment {
  filename: string;
  contentType: string;
  data: string;
}

export default function Compose({ onBack, onSent }: ComposeProps) {
  const { email: userEmail } = useAuth();
  const [fromEmail, setFromEmail] = useState(userEmail || '');
  const [senderName, setSenderName] = useState('Admin');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [html, setHtml] = useState('');
  const [useHtml, setUseHtml] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      await new Promise((resolve) => {
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const base64Data = base64.split(',')[1];

          newAttachments.push({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            data: base64Data,
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setAttachments([...attachments, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      setError('Please enter a valid recipient email address');
      setSending(false);
      return;
    }

    if (!emailRegex.test(fromEmail)) {
      setError('Please enter a valid sender email address');
      setSending(false);
      return;
    }

    try {
      await sendEmail({
        sender: fromEmail,
        sname: senderName,
        recipient,
        subject,
        message: useHtml ? undefined : message,
        html: useHtml ? html : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSent();
        onBack();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10">
        <header className="bg-black/90 border-b-2 border-green-500 sticky top-0 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-black transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-xl font-bold text-green-500 font-mono">COMPOSE EMAIL</h1>
                  <p className="text-green-400 text-sm font-mono">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/80 border-2 border-green-500 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.2)]">
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="sname" className="block text-green-500 font-mono text-sm mb-2">
                    NAME:
                  </label>
                  <input
                    type="text"
                    id="sname"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-2 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                    placeholder="Sender name"
                    disabled={sending}
                  />
                </div>
                <div>
                  <label htmlFor="from" className="block text-green-500 font-mono text-sm mb-2">
                    FROM:
                  </label>
                  <input
                    type="email"
                    id="from"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-2 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                    placeholder="sender@example.com"
                    disabled={sending}
                  />
                </div>
                <div>
                  <label htmlFor="recipient" className="block text-green-500 font-mono text-sm mb-2">
                    TO:
                  </label>
                  <input
                    type="email"
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-2 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                    placeholder="recipient@example.com"
                    required
                    disabled={sending}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-green-500 font-mono text-sm mb-2">
                    SUBJECT:
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-2 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)]"
                    placeholder="Email subject"
                    required
                    disabled={sending}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="message" className="block text-green-500 font-mono text-sm">
                      {useHtml ? 'HTML CONTENT:' : 'MESSAGE:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseHtml(!useHtml)}
                      className="px-3 py-1 border border-green-500 text-green-500 rounded font-mono text-xs hover:bg-green-500 hover:text-black transition-all"
                    >
                      {useHtml ? 'SWITCH TO TEXT' : 'SWITCH TO HTML'}
                    </button>
                  </div>
                  {useHtml ? (
                    <textarea
                      id="html"
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] resize-y"
                      placeholder="<h1>Your HTML content</h1>"
                      rows={12}
                      required
                      disabled={sending}
                    />
                  ) : (
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] resize-y"
                      placeholder="Your message here..."
                      rows={12}
                      required
                      disabled={sending}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-green-500 font-mono text-sm mb-2">
                    ATTACHMENTS:
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      id="attachment"
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      disabled={sending}
                    />
                    <label
                      htmlFor="attachment"
                      className="inline-flex items-center space-x-2 px-4 py-2 border-2 border-green-500 text-green-500 rounded font-mono cursor-pointer hover:bg-green-500 hover:text-black transition-all"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>ADD FILES</span>
                    </label>

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-green-900/20 border border-green-500/50 rounded px-4 py-2"
                          >
                            <div className="flex items-center space-x-3">
                              <Paperclip className="w-4 h-4 text-green-500" />
                              <span className="text-green-400 font-mono text-sm">
                                {attachment.filename}
                              </span>
                              <span className="text-green-600 font-mono text-xs">
                                ({attachment.contentType})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="p-1 text-red-500 hover:text-red-400 transition-colors"
                              disabled={sending}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border-2 border-red-500 text-red-400 px-4 py-3 rounded font-mono text-sm">
                    ERROR: {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-900/20 border-2 border-green-500 text-green-400 px-4 py-3 rounded font-mono text-sm">
                    EMAIL SENT SUCCESSFULLY!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || success}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded font-mono transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_20px_rgba(0,255,0,0.4)] flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{sending ? 'SENDING...' : 'SEND EMAIL'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

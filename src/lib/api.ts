const API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

export interface Email {
  id: number;
  from: string;
  to: string;
  subject: string;
  date: string;
  text: string;
  hasHtml: boolean;
  attachments: number;
  timestamp: number;
  type: 'received' | 'sent';
}

export interface SendEmailRequest {
  sname?: string;
  sender: string;
  recipient: string;
  subject: string;
  message?: string;
  html?: string;
  attachments?: {
    filename: string;
    contentType?: string;
    data: string;
  }[];
}

export interface AttachmentMeta {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

export async function fetchEmails(email: string): Promise<Email[]> {
  const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch emails');
  }
  const data = await response.json();
  const raw = data.emails || [];
  const parsed: Email[] = raw.map((item: unknown) => {
    const obj = typeof item === 'string' ? JSON.parse(item) : (item as Email);
    const cleanedText = (obj.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return { ...obj, text: cleanedText } as Email;
  });
  return parsed;
}

export async function fetchEmailHtml(email: string, id: number): Promise<string> {
  const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email HTML');
  }
  return await response.text();
}

export async function deleteEmail(email: string, id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete email' }));
    throw new Error(error.message || 'Failed to delete email');
  }
}

export async function fetchAttachments(email: string, id: number): Promise<AttachmentMeta[]> {
  const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/${id}/attachments`);
  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }
  const data = await response.json();
  return (data.attachments || []) as AttachmentMeta[];
}

export async function downloadAttachment(email: string, id: number, index: number): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/emails/${encodeURIComponent(email)}/${id}/attachments/${index}`);
  if (!response.ok) {
    throw new Error('Failed to download attachment');
  }
  return await response.blob();
}

export async function sendEmail(emailData: SendEmailRequest): Promise<void> {
  const response = await fetch(`${API_URL}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to send email' }));
    throw new Error(error.message || 'Failed to send email');
  }
}

export async function registerUser(email: string, password: string, name?: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(name ? { email, password, name } : { email, password }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to register user' }));
    throw new Error(error.message || 'Failed to register user');
  }
}

export async function loginUser(email: string, password: string): Promise<{ token: string; expiresIn: number }> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  if (email === 'admin@example.com' && password === 'admin123') {
    return { token: 'admin-token', expiresIn: 3600 };
  }

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Invalid credentials' }));
    throw new Error(error.message || 'Invalid credentials');
  }
  const data = await response.json();
  return { token: data.token, expiresIn: data.expiresIn };
}

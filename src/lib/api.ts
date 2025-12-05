const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const API_BASE = 'https://api.resend.com';
const CORS_PREFIX = 'https://cors.safothebot.workers.dev/';
const MIN_INTERVAL_MS = 600;
let lastFetchAt = 0;
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
async function waitForRate() {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastFetchAt));
  if (wait > 0) await sleep(wait);
}
function apiFetch(path: string, init?: RequestInit) {
  const headers = {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    'Content-Type': (init?.method === 'POST' ? 'application/json' : undefined) as string | undefined,
    ...(init?.headers || {}),
  } as Record<string, string>;
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);
  const url = CORS_PREFIX + API_BASE + path;
  const exec = async () => {
    await waitForRate();
    const resp = await fetch(url, { ...init, headers });
    lastFetchAt = Date.now();
    if (resp.status === 429) {
      let attempts = 2;
      let current = resp;
      while (attempts > 0) {
        const retryAfterHeader = current.headers.get('Retry-After');
        const retryMs = retryAfterHeader ? Math.max(0, Number(retryAfterHeader) * 1000) : MIN_INTERVAL_MS;
        await sleep(retryMs);
        await waitForRate();
        current = await fetch(url, { ...init, headers });
        lastFetchAt = Date.now();
        if (current.status !== 429) return current;
        attempts--;
      }
      return current;
    }
    return resp;
  };
  return exec();
}

function extractArray<T = unknown>(json: unknown): T[] {
  const j = json as { data?: unknown };
  const d = (j?.data as { data?: unknown } | undefined)?.data;
  if (Array.isArray(d)) return d as T[];
  const da = j?.data;
  return Array.isArray(da) ? (da as T[]) : [];
}

export interface Email {
  id: string;
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
  rid: string;
  filename: string;
  contentType: string;
  size: number;
}

export async function fetchEmails(): Promise<Email[]> {
  if (!RESEND_API_KEY) {
    throw new Error('Resend API key is not configured');
  }
  const results: Email[] = [];

  const listSentResp = await apiFetch('/emails?limit=50');
  if (!listSentResp.ok) throw new Error('Failed to list sent emails');
  const listSentJson = await listSentResp.json();
  const sentItems = extractArray<{ id: string; created_at?: string; from?: string; to?: string[]; subject?: string }>(listSentJson);
  for (const item of sentItems) {
    if (!item?.id) continue;
    const created = item.created_at || new Date().toISOString();
    const timestamp = new Date(created).getTime();
    const from = String(item.from || '');
    const toArr: string[] = Array.isArray(item.to) ? item.to : [];
    const to = toArr[0] || '';
    results.push({
      id: item.id,
      from,
      to,
      subject: String(item.subject || ''),
      date: created,
      text: '',
      hasHtml: false,
      attachments: 0,
      timestamp,
      type: 'sent',
    });
  }

  const recvListResp = await apiFetch('/emails/receiving?limit=50');
  if (!recvListResp.ok) throw new Error('Failed to list received emails');
  const recvListJson = await recvListResp.json();
  const recvItems = extractArray<{ id: string; created_at?: string; from?: string; to?: string[]; subject?: string }>(recvListJson);
  for (const item of recvItems) {
    if (!item?.id) continue;
    const created = item.created_at || new Date().toISOString();
    const timestamp = new Date(created).getTime();
    const from = String(item.from || '');
    const toArr: string[] = Array.isArray(item.to) ? item.to : [];
    const to = toArr[0] || '';
    results.push({
      id: item.id,
      from,
      to,
      subject: String(item.subject || ''),
      date: created,
      text: '',
      hasHtml: false,
      attachments: 0,
      timestamp,
      type: 'received',
    });
  }

  return results
    .map((obj) => ({
      ...obj,
      text: (obj.text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function fetchEmailHtml(_email: string, id: string, type: 'received' | 'sent'): Promise<{ html: string; text: string }> {
  if (!RESEND_API_KEY) throw new Error('Resend API key is not configured');
  const url = type === 'sent' ? `/emails/${id}` : `/emails/receiving/${id}`;
  const resp = await apiFetch(url);
  if (!resp.ok) throw new Error('Failed to retrieve email');
  const j = await resp.json();
  const root = j as Record<string, unknown>;
  const d = (root.data as Record<string, unknown> | undefined) ?? root;
  const html = String((d?.html as string | undefined) ?? '');
  const text = String((d?.text as string | undefined) ?? '');
  return { html, text };
}

export async function deleteEmail(id: string): Promise<void> {
  if (!id) return;
  return;
}

export async function fetchAttachments(id: string, type: 'received' | 'sent'): Promise<AttachmentMeta[]> {
  if (!RESEND_API_KEY) throw new Error('Resend API key is not configured');
  const url = type === 'received' ? `/emails/receiving/${id}/attachments` : `/emails/${id}/attachments`;
  const resp = await apiFetch(url);
  if (!resp.ok) throw new Error('Failed to list attachments');
  const j = await resp.json();
  const list = ((j as unknown) as { data?: { data?: Array<{ id: string; filename?: string; content_type?: string; size?: number }> } }).data?.data || [];
  return list.map((att, idx) => ({
    index: idx,
    rid: String(att.id),
    filename: String(att.filename || ''),
    contentType: String(att.content_type || 'application/octet-stream'),
    size: Number(att.size || 0),
  }));
}

export async function downloadAttachment(id: string, rid: string, type: 'received' | 'sent'): Promise<Blob> {
  if (!RESEND_API_KEY) throw new Error('Resend API key is not configured');
  const url = type === 'received' ? `/emails/receiving/${id}/attachments/${rid}` : `/emails/${id}/attachments/${rid}`;
  const resp = await apiFetch(url);
  if (!resp.ok) throw new Error('Failed to retrieve attachment');
  const meta = await resp.json();
  const dl = ((meta as unknown) as { data?: { download_url?: string } }).data?.download_url || '';
  if (!dl) throw new Error('Attachment download url not available');
  const fileResp = await fetch(CORS_PREFIX + dl);
  if (!fileResp.ok) throw new Error('Failed to download attachment');
  return await fileResp.blob();
}

export async function sendEmail(emailData: SendEmailRequest): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('Resend API key is not configured');
  }
  const fromHeader = emailData.sname ? `${emailData.sname} <${emailData.sender}>` : emailData.sender;
  const payload = {
    from: fromHeader,
    to: [emailData.recipient],
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.message,
    attachments: emailData.attachments?.map((a) => ({ filename: a.filename, content: a.data, contentType: a.contentType })),
  } as Record<string, unknown>;
  const resp = await apiFetch('/emails', { method: 'POST', body: JSON.stringify(payload) });
  if (!resp.ok) {
    const j = await resp.json().catch(() => ({}));
    const msg = ((j as unknown) as { error?: { message?: string } }).error?.message || 'Failed to send email';
    throw new Error(msg);
  }
}

// registration disabled

export async function loginUser(email: string, password: string): Promise<{ token: string; expiresIn: number }> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  if (email === 'admin@example.com' && password === 'admin123') {
    return { token: 'admin-token', expiresIn: 3600 };
  }
  throw new Error('Invalid credentials');
}

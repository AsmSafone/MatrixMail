import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';
import jwt from 'jsonwebtoken';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const origin = process.env.CORS_ORIGIN || '*';
const apiKey = process.env.RESEND_API_KEY || '';
const RESEND = 'https://api.resend.com';
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 12 * 60 * 60);
const SESSION_SECRET = process.env.SESSION_SECRET || 'matrix-mail-default-session-secret';

if (!apiKey) {
  console.error('Missing RESEND_API_KEY');
  process.exit(1);
}

app.use(helmet());
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, 'users.json');
let USERS = [];

async function loadUsers() {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    USERS = JSON.parse(data);
  } catch (e) {
    USERS = [];
  }
}

async function saveUsers() {
  const data = JSON.stringify(USERS, null, 2);
  await writeFile(USERS_FILE, data, 'utf-8');
}

function signToken(user) {
  const payload = { email: user.email, name: user.name };
  return jwt.sign(payload, SESSION_SECRET, { algorithm: 'HS256', expiresIn: TOKEN_TTL_SECONDS });
}

function getAuthToken(req) {
  const q = req.query && (req.query.token || req.query.Token || req.query.access_token);
  if (Array.isArray(q)) return q[0];
  if (typeof q === 'string' && q) return q;
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\\s+(.+)$/i);
  return m ? m[1] : null;
}

function authMiddleware(req, res, next) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, SESSION_SECRET, { algorithms: ['HS256'] });
    req.user = { email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    const msg = err && err.name === 'TokenExpiredError' ? 'Session expired' : 'Unauthorized';
    return res.status(401).json({ error: msg });
  }
}

async function forward(path, init = {}) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type':
      init.method && init.method.toUpperCase() === 'POST'
        ? 'application/json'
        : undefined,
    ...(init.headers || {}),
  };
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);
  const resp = await fetch(RESEND + path, { ...init, headers });
  const body = await resp.text();
  return { status: resp.status, body, type: resp.headers.get('content-type') || 'application/json' };
}

async function forwardJson(path, init = {}) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type':
      init.method && init.method.toUpperCase() === 'POST'
        ? 'application/json'
        : undefined,
    Accept: 'application/json',
    ...(init.headers || {}),
  };
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);
  const resp = await fetch(RESEND + path, { ...init, headers });
  const json = await resp.json().catch(() => ({}));
  return { status: resp.status, json, type: resp.headers.get('content-type') || 'application/json' };
}

function normalizeAddress(value) {
  const v = String(value || '').trim();
  const lt = v.indexOf('<');
  const gt = v.indexOf('>');
  if (lt !== -1 && gt !== -1 && gt > lt) {
    return v.slice(lt + 1, gt).trim();
  }
  const match = v.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i);
  return match ? match[0] : v;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  });
  res.status(200).end();
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = USERS.find((u) => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken(user);
  res.json({ access_token: token, user: { name: user.name, email: user.email }, expires_in: TOKEN_TTL_SECONDS });
});
app.post('/api/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const user = USERS.find((u) => u.email === req.user.email);
  if (!user || user.password !== current_password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  user.password = String(new_password);
  await saveUsers().catch(() => {});
  res.json({ ok: true });
});

// Sent emails list (proxy to Resend /emails)
app.get('/api/sent', authMiddleware, async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const { status, json, type } = await forwardJson(`/emails${qs ? `?${qs}` : ''}`);
  const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.data) ? json.data.data : [];
  const filtered = arr.filter((item) => {
    const from = normalizeAddress(String(item?.from || ''));
    return from.toLowerCase() === String(req.user.email).toLowerCase();
  });
  const wrapped = json?.data?.data ? { data: { data: filtered } } : { data: filtered };
  res.status(status).type(type).send(wrapped);
});

// Sent email detail
app.get('/api/sent/:id', authMiddleware, async (req, res) => {
  const { status, json, type } = await forwardJson(`/emails/${encodeURIComponent(req.params.id)}`);
  const from = normalizeAddress(String(json?.from || json?.data?.from || ''));
  if (from.toLowerCase() !== String(req.user.email).toLowerCase()) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(status).type(type).send(json);
});

// Sent email attachments
app.get('/api/sent/:id/attachments', authMiddleware, async (req, res) => {
  const meta = await forwardJson(`/emails/${encodeURIComponent(req.params.id)}`);
  const from = normalizeAddress(String(meta?.json?.from || meta?.json?.data?.from || ''));
  if (from.toLowerCase() !== String(req.user.email).toLowerCase()) {
    return res.status(404).json({ error: 'Not found' });
  }
  const { status, body, type } = await forward(`/emails/${encodeURIComponent(req.params.id)}/attachments`);
  res.status(status).type(type).send(body);
});

// Received emails list (proxy to Resend /emails/receiving)
app.get('/api/received', authMiddleware, async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const { status, json, type } = await forwardJson(`/emails/receiving${qs ? `?${qs}` : ''}`);
  const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.data) ? json.data.data : [];
  const filtered = arr.filter((item) => {
    const toArr = Array.isArray(item?.to) ? item.to : [];
    const to0 = normalizeAddress(String(toArr[0] || ''));
    return to0.toLowerCase() === String(req.user.email).toLowerCase();
  });
  const wrapped = json?.data?.data ? { data: { data: filtered } } : { data: filtered };
  res.status(status).type(type).send(wrapped);
});

// Received email detail
app.get('/api/received/:id', authMiddleware, async (req, res) => {
  const { status, json, type } = await forwardJson(`/emails/receiving/${encodeURIComponent(req.params.id)}`);
  const toArr = Array.isArray(json?.to) ? json.to : Array.isArray(json?.data?.to) ? json.data.to : [];
  const to0 = normalizeAddress(String((toArr[0] || '')));
  if (to0.toLowerCase() !== String(req.user.email).toLowerCase()) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(status).type(type).send(json);
});

// Received email attachments
app.get('/api/received/:id/attachments', authMiddleware, async (req, res) => {
  const meta = await forwardJson(`/emails/receiving/${encodeURIComponent(req.params.id)}`);
  const toArr = Array.isArray(meta?.json?.to) ? meta.json.to : Array.isArray(meta?.json?.data?.to) ? meta.json.data.to : [];
  const to0 = normalizeAddress(String((toArr[0] || '')));
  if (to0.toLowerCase() !== String(req.user.email).toLowerCase()) {
    return res.status(404).json({ error: 'Not found' });
  }
  const { status, body, type } = await forward(`/emails/receiving/${encodeURIComponent(req.params.id)}/attachments`);
  res.status(status).type(type).send(body);
});

// Send new email
app.post('/api/send', authMiddleware, async (req, res) => {
  const payload = req.body || {};
  if (!payload || !payload.to || !payload.from || !payload.subject) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const fromNorm = normalizeAddress(String(payload.from));
  if (fromNorm.toLowerCase() !== String(req.user.email).toLowerCase()) {
    return res.status(403).json({ error: 'From address mismatch' });
  }
  const { status, body, type } = await forward('/emails', { method: 'POST', body: JSON.stringify(payload) });
  res.status(status).type(type).send(body);
});


loadUsers().catch(() => {});
app.listen(port, () => {
  console.log(`Resend proxy listening on http://localhost:${port}`);
});

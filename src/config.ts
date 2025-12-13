export const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
export const API_URL = BACKEND_BASE ? `${BACKEND_BASE}/api` : '';

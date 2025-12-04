# Matrix Mail

Matrix‑themed email client for Cloudflare Worker Email API. Supports HTML rendering, attachments, delete, and basic auth with an Admin Panel.

## Features

- Matrix UI with animated background
- Inbox/Outbox tabs, sorting by newest
- HTML email rendering with sanitization
- Attachment listing, previews (images) and click‑to‑download
- Delete email from viewer
- Compose with text/HTML and file attachments
- Admin Panel: login as admin, then register users (name + email + password)

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Lucide React icons
- Cloudflare Worker REST API (see `api.md`)

## Setup

1) Environment

Create `.env` with:

```
VITE_EMAIL_API_URL=https://your-worker.workers.dev
```

2) Install

```
npm install
```

3) Develop

```
npm run dev
```

4) Build

```
npm run build
```

## Configuration

- App reads `VITE_EMAIL_API_URL` for the Worker base URL.
- Client stores `matrix_email_session` and `matrix_email_session_expiry` in `localStorage` after login.

## Usage

- Login: use your registered email/password; sessions auto‑restore if not expired
- Admin Panel: open from Login, authenticate as admin, then register users with name/email/password
- Inbox/Outbox: filter by type; click any email to view
- Email Viewer: shows From/To based on type, HTML body by default, attachments at bottom with previews and click‑to‑download, delete button in header
- Compose: send text or HTML, add attachments (base64), refreshes inbox after send

## API Integration

- Send: `POST /api/send`
- List: `GET /api/emails/{email}`
- HTML: `GET /api/emails/{email}/{id}`
- Attachments (meta): `GET /api/emails/{email}/{id}/attachments`
- Attachment (file): `GET /api/emails/{email}/{id}/attachments/{index}`
- Delete: `DELETE /api/emails/{email}/{id}`
- Auth Register: `POST /api/auth/register` (name, email, password)
- Auth Login: `POST /api/auth/login` (email, password → token, expiresIn)

## Project Structure

```
src/
├── components/
│   ├── Login.tsx
│   ├── AdminPanel.tsx
│   ├── Inbox.tsx
│   ├── EmailViewer.tsx
│   ├── Compose.tsx
│   └── MatrixRain.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── useAuth.ts
├── lib/
│   └── api.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Security

- HTML sanitized before rendering (scripts and event handlers removed)
- Session token expiry enforced on restore
- Basic client‑side validation for email/password

## Troubleshooting

- Emails not loading: check `VITE_EMAIL_API_URL`, Worker deployment, browser console
- Auth issues: verify Worker auth endpoints respond and token/expiresIn in responses
- Type errors: `npm run typecheck`

## License

Demonstration project.

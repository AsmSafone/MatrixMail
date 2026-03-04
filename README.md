# ✉️ Matrix Mail

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-00ff66.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-18-00ff66?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-00ff66?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-00ff66?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-00ff66?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-00ff66?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)

**A modern, cyberpunk-themed webmail client & lightweight API proxy designed for custom domain messaging.**

[Explore Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [API Reference](#-api-endpoints)

</div>

---

## 🌌 Overview

**Matrix Mail** is an interactive, cyberpunk-inspired webmail application featuring the iconic Matrix digital rain animation, high-contrast terminal aesthetics, and a robust dual-layer architecture. 

It pairs a responsive **React + TypeScript + Tailwind CSS** frontend with a secure **Node.js Express** backend proxy powered by **Resend**. Whether managing organization correspondence, sending formatted HTML newsletters with attachments, or managing domain mailboxes, Matrix Mail provides a fluid, cyberpunk-themed experience with enterprise-grade session security.

---

## ✨ Features

- 🌧️ **Cyberpunk Matrix Canvas**: Dynamic, configurable green digital rain canvas animation behind a sleek semi-transparent UI.
- 📬 **Full Webmail Suite**:
  - **Inbox & Sent Folders**: Filter between received and sent correspondence with real-time updates.
  - **Live Search**: Instant keyword search across email subjects, senders, and message snippets.
  - **Pagination & Read State**: Paginated message views with automatic and manual read/unread status management.
  - **Batch Operations**: Quick "Select All" / "Unselect All" page controls and bulk read toggles.
- ✍️ **Advanced Email Composer**:
  - **Multi-Recipient Fields**: Full support for `TO`, `CC`, and `BCC` address lists.
  - **Dual Mode Editor**: Seamlessly toggle between rich HTML and clean plain-text drafting.
  - **Attachment Drag & Drop**: Send file attachments (PDFs, images, archives) encoded directly with MIME types.
- 🔍 **Rich Email Viewer**:
  - Sanitized HTML rendering preventing XSS attacks and unsafe script execution.
  - Image attachment previews with download buttons and metadata indicators (file name, size).
- 🛡️ **Authentication & Security**:
  - Stateless JSON Web Token (JWT) session authorization.
  - Proactive client-side and server-side JWT expiration checking with automatic auto-logout.
  - In-app User Profile view and self-service password changing.
- ⚡ **Lightweight Express Proxy Server**:
  - Securely isolates Resend API credentials from client browsers.
  - Built-in `Helmet` headers, configurable `CORS`, and IP-based rate limiting.

---

## 🏛️ Architecture

```
┌────────────────────────────────┐
│   Matrix Mail Frontend (SPA)   │
│  React 18 + Vite + Tailwind    │
└───────────────┬────────────────┘
                │
                │ HTTP REST (JWT Bearer / Query)
                ▼
┌────────────────────────────────┐
│      Express Proxy Server      │
│  Helmet • CORS • Rate Limiter  │
│      JWT Auth & users.json     │
└───────────────┬────────────────┘
                │
                │ HTTPS (Bearer API Key)
                ▼
┌────────────────────────────────┐
│        Resend Email API        │
│  Transactional Email Delivery  │
└────────────────────────────────┘
```

---

## 📁 Repository Structure

```
CustomMail/
├── public/                 # Static assets, web icons, favicons, manifests
├── server/                 # Express backend service
│   ├── index.mjs           # Express API proxy, JWT auth, and routing
│   ├── package.json        # Backend dependencies (Express, Helmet, JWT, etc.)
│   └── users.json          # User credentials database (JSON)
├── src/                    # Frontend React source code
│   ├── components/         # React UI components
│   │   ├── Compose.tsx     # Rich email compose modal with CC/BCC/attachments
│   │   ├── EmailViewer.tsx # Sanitized HTML email & attachment viewer
│   │   ├── Inbox.tsx       # Main mailbox dashboard, search, and profile modal
│   │   ├── Login.tsx       # Matrix login terminal screen
│   │   └── MatrixRain.tsx  # Optimized HTML5 canvas digital rain background
│   ├── contexts/           # Authentication context and custom hooks
│   │   ├── AuthContext.tsx # JWT session lifecycle, auto-logout listener
│   │   └── useAuth.ts      # useAuth React hook
│   ├── lib/                # API client helper functions and types
│   │   └── api.ts          # REST client communicating with Express proxy
│   ├── config.ts           # App configuration and backend endpoints
│   ├── App.tsx             # Root application view router
│   ├── main.tsx            # Vite React entry point
│   └── index.css           # Custom cyberpunk styles & Tailwind directives
├── index.html              # HTML template with SEO and open-graph meta tags
├── vite.config.ts          # Vite bundler configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (or `yarn` / `pnpm`)
- A **Resend API Key** ([Create a free Resend account](https://resend.com/))

---

### 1. Clone the Repository

```bash
git clone https://github.com/AsmSafone/MatrixMail.git
cd MatrixMail
```

---

### 2. Setup the Backend Server

Navigate into the `server` directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=3001
CORS_ORIGIN=*
RESEND_API_KEY=re_your_actual_resend_api_key_here
SESSION_SECRET=your_super_secret_jwt_key_here
TOKEN_TTL_SECONDS=43200
```

Configure your user accounts in `server/users.json`:

```json
[
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "YourSecurePassword123!"
  },
  {
    "name": "Demo User",
    "email": "demo@example.com",
    "password": "DemoPassword123!"
  }
]
```

Start the backend server:

```bash
npm start
# Server running at http://localhost:3001
```

---

### 3. Setup the Frontend Client

Open a new terminal tab in the root project directory and install dependencies:

```bash
cd ..
npm install
```

Create a `.env` file in the project root:

```env
VITE_BACKEND_URL=http://localhost:3001
```

Start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to enter the Matrix.

---

### 4. Production Build

To build the client application for production:

```bash
npm run build
```

The optimized static production assets will be generated in the `dist/` directory, ready to be served by any static host or web server.

---

## ⚙️ Environment Variables

### Backend Server (`server/.env`)

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `PORT` | Optional | `3001` | The HTTP port the Express server listens on. |
| `CORS_ORIGIN` | Optional | `*` | Allowed CORS origin (set to your frontend domain in production). |
| `RESEND_API_KEY` | **Yes** | — | Your Resend API secret key (`re_...`). |
| `SESSION_SECRET` | Optional | `matrix-mail-default-session-secret` | Cryptographic secret for signing JWT tokens. |
| `TOKEN_TTL_SECONDS` | Optional | `43200` (12 hours) | Token lifespan before requiring re-authentication. |

### Frontend Client (`.env`)

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `VITE_BACKEND_URL` | Optional | `http://localhost:3001` | Base URL of the running Matrix Mail Express proxy. |

---

## 🔌 API Endpoints

The Express server exposes the following endpoints:

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/login` | No | Authenticate user with email and password; returns JWT token. |
| `POST` | `/api/change-password` | **JWT** | Update the authenticated user's password in `users.json`. |
| `GET` | `/api/received` | **JWT** | List incoming emails (supports `?limit=50`). |
| `GET` | `/api/received/:id` | **JWT** | Retrieve body and details of a received email. |
| `GET` | `/api/received/:id/attachments` | **JWT** | List attachments for a received email. |
| `GET` | `/api/received/:id/attachments/:index` | **JWT** | Download an attachment from a received email. |
| `GET` | `/api/sent` | **JWT** | List sent emails (supports `?limit=50`). |
| `GET` | `/api/sent/:id` | **JWT** | Retrieve body and details of a sent email. |
| `GET` | `/api/sent/:id/attachments` | **JWT** | List attachments for a sent email. |
| `GET` | `/api/sent/:id/attachments/:index` | **JWT** | Download an attachment from a sent email. |
| `POST` | `/api/send` | **JWT** | Send an email with HTML/text and optional attachments. |

---

## 👤 Credits & Author

Matrix Mail is designed and maintained with ❤️ by:

**A.S.M. Arsad Ahamed Safone**
- GitHub: [@AsmSafone](https://github.com/AsmSafone)
- Repository: [MatrixMail](https://github.com/AsmSafone/MatrixMail)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - feel free to use, modify, and distribute it for personal and commercial projects.

# Virtual Gratitude Wall

A real-time, high-performance Virtual Gratitude Wall web application built with a **Node.js & TypeScript** Layered Monolithic backend, **React 19 & TypeScript** frontend, **MongoDB**, and **Socket.io** for real-time notifications and live post updates.

---

## ✨ Features

- 📌 **Interactive Gratitude Wall**: Dotted grid canvas displaying pastel sticky notes (Yellow, Green, Blue, Pink, Purple) with realistic tape header graphics.
- 👥 **User Authentication & Profiles**:
  - Employee Registration: Full Name, Employee Code, Password, and Confirm Password (with show/hide eye toggle buttons).
  - Employee Login: Employee Code & Password.
  - Dual-token security: JWT access tokens + HTTP-only `SameSite=Strict` refresh cookies.
- ⚡ **Real-Time WebSockets Engine**:
  - **Live Post Feed**: Instant wall updates whenever any user shares a gratitude note.
  - **Global Notifications**: Real-time toast alerts broadcast to all active users when a new post is published.
  - **Direct @Mention Alerts**: Targeted real-time notifications when a user is tagged.
  - **Live Heart Likes**: Synchronized like counters across all connected clients.
- 🛡️ **Full Security Blueprint**:
  - Helmet HTTP security headers (CSP, HSTS, X-Content-Type-Options).
  - Express Rate Limiting (API, Auth, and Post creation limits).
  - Input XSS sanitization (`sanitize-html`) and NoSQL injection protection.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Cloud Atlas or local instance)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

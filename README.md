# BROTIFY — Virtual Gratitude Wall

A real-time, high-performance Virtual Gratitude Wall web application built with a **Node.js & TypeScript** Layered Monolithic backend, **React 19 & TypeScript** frontend, **MongoDB**, and **Socket.io** for real-time notifications and live post updates.

---

## ✨ Features

- 📌 **Interactive Gratitude Wall**: Dotted grid canvas displaying pastel sticky notes (Yellow, Green, Blue, Pink, Purple) with realistic tape header graphics and organic rotations.
- 👥 **User Authentication & Profiles**:
  - Employee Registration: Full Name, Employee Code, Password, and Confirm Password (with show/hide eye toggle buttons).
  - Employee Login: Employee Code & Password.
  - Dual-token security: JWT access tokens (15m) + HTTP-only `SameSite=Strict` refresh cookies (7d).
- ⚡ **Real-Time WebSockets Engine**:
  - **Live Post Feed**: Instant wall updates whenever any user shares a gratitude note.
  - **Global Notifications**: Real-time toast alerts broadcast to all active users when a new post is published.
  - **Direct @Mention Alerts**: Targeted real-time notifications when a user is tagged.
  - **Live Heart Likes**: Synchronized like counters across all connected clients.
- 🛡️ **Full Security Blueprint**:
  - Helmet HTTP security headers (CSP, HSTS, X-Content-Type-Options).
  - Express Rate Limiting (API: 200/15min, Auth: 20/15min, Post creation: 50/hr).
  - Input XSS sanitization (`sanitize-html`) and NoSQL injection protection.
  - Graceful shutdown with SIGTERM/SIGINT handlers.
- 🏆 **Top Gratitude Spotlight**: Real-time leaderboard showing most appreciated employees.
- 🔧 **Admin Console**: Full admin dashboard with user management, post moderation, department management, announcement broadcasting, and analytics.

---

## 🏗 Architecture

```
Gratitude_Wall/
├── backend/                 # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/          # Database & Socket.io configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation, security, error handling
│   │   ├── models/          # Mongoose schemas (User, Post, Reaction, Notification, Team)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # JWT, sanitizer, admin seeding
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # HTTP server + Socket.io entry point
│   ├── .env.example         # Environment variable template
│   └── package.json
├── frontend/                # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/      # React UI components
│   │   ├── services/        # API client & Socket.io client
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Root application component
│   │   ├── index.css        # Global styles & design system
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Cloud Atlas or local instance)

### 1. Clone & Configure
```bash
git clone <repository-url>
cd Gratitude_Wall
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env    # Then edit .env with your MongoDB URI and secrets
npm install
npm run dev             # Development server with hot reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Development server at http://localhost:5173
```

Open `http://localhost:5173/` in your browser.

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|:---|:---|:---|
| `PORT` | Backend server port | `5001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/gratitude_wall` |
| `JWT_SECRET` | JWT access token secret | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (required) |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |

---

## 🚢 Production Deployment

### Build
```bash
# Backend
cd backend
npm run build           # Compiles TypeScript to dist/

# Frontend
cd frontend
npm run build           # Outputs optimized bundle to dist/
```

### Run in Production
```bash
cd backend
NODE_ENV=production npm run start:prod
```

Serve the frontend `dist/` directory with Nginx or any static file server, proxying `/api` and `/socket.io` to the backend.

### Default Admin Account
- **Employee Code**: `BROTOTYPE`
- **Password**: Set via `ADMIN_SEED_PASSWORD` env variable
- **Admin Login**: Navigate to `/admin-login`

---

## 🛡️ Security Checklist

- [x] Helmet HTTP security headers with CSP in production
- [x] CORS restricted to `CLIENT_URL`
- [x] Express rate limiting on API, auth, and post routes
- [x] XSS sanitization with `sanitize-html`
- [x] NoSQL injection protection
- [x] HTTP-only SameSite=Strict refresh token cookies
- [x] JWT dual-token authentication (15m access + 7d refresh)
- [x] Input validation with Zod schemas
- [x] Graceful shutdown handlers
- [x] 30-day TTL on notifications

# Heyo — Nearby Social & Meetup App

A full-stack, location-based social & group meetup web application built with **React 19 + Vite** (frontend) and **Node.js + Express + Prisma (PostgreSQL/SQLite)** (backend). Installable as a **Progressive Web App (PWA)** on iOS and Android, and deployed on **Vercel** & **Render**.

---

## 🌐 Live App & Deployment

- **Live Frontend (Vercel)**: [heyo-mbkm6hwzd-akshat24.vercel.app](https://heyo-mbkm6hwzd-akshat24.vercel.app)
- **Live Backend API (Render)**: [https://nearby-meetup.onrender.com](https://nearby-meetup.onrender.com)

---

## 🔑 Test Credentials

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Standard Test User** | `Testuser@heyo.com` | `heyo123` | User / Admin |
| **Google Auth** | Click *Sign in with Google* in app | — | OAuth 2.0 User |

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Environment Variables

Create `.env` in the root directory:
```env
VITE_GOOGLE_CLIENT_ID="89316739468-fl1qh59g60qqfup9ubkg8f4ifcnus8ln.apps.googleusercontent.com"
```

Create `server/.env` for the backend:
```env
PORT=5001
JWT_SECRET="your_jwt_secret_key"
DATABASE_URL="file:./dev.db" # or PostgreSQL connection string
GOOGLE_CLIENT_ID="89316739468-fl1qh59g60qqfup9ubkg8f4ifcnus8ln.apps.googleusercontent.com"
```

### 3. Run Locally

```bash
# Run client (Vite: 5173) and server (Express: 5001) concurrently
npm run start
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`

---

## ⚡ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8, React Router DOM v7 |
| **Styling & UI** | Vanilla CSS + Design Tokens, Lucide Icons, Glassmorphism UI |
| **Animations & 3D** | Framer Motion v12, Three.js v0.185 |
| **Mapping & Geospatial** | Leaflet + React-Leaflet |
| **PWA Support** | `vite-plugin-pwa` with custom Service Worker & Web Manifest |
| **Backend Runtime** | Node.js + Express 5 |
| **Database & ORM** | Prisma ORM with PostgreSQL adapter (`@prisma/adapter-pg`) & SQLite fallback |
| **Auth & Security** | JWT, Bcrypt password hashing, Google OAuth 2.0 GSI (`@google-auth-library`), Express Rate Limiters |
| **AI Workflows** | Custom AI Agent engine (Think → Plan → Execute → Respond) with tool calling & intent classification |

---

## 🎯 Capability Highlights

### 🗄️ 1. PostgreSQL & Document Database Support
- Powered by **Prisma ORM** ([server/prisma/schema.prisma](server/prisma/schema.prisma))
- Supports production **PostgreSQL** via `@prisma/adapter-pg` with local **SQLite** fallback (`dev.db`).
- Relational schema covering `User`, `Post`, `Meetup`, `Request`, and `Message` models.

### 🛡️ 2. Internal Tools & Admin Panel
- Dedicated Admin Dashboard ([AdminPanel.jsx](src/components/AdminPanel.jsx) & [server/routes/admin.js](server/routes/admin.js))
- Features: User status management (suspend/activate), user report reviews (spam/harassment), audit logging, and live system metrics.

### ☁️ 3. Vercel & Production Deployment
- Custom [vercel.json](vercel.json) configuration with SPA rewrites (`/(.*) -> /index.html`) and security headers (`X-Frame-Options`, `X-Content-Type-Options`, CORS).
- Build-time environment variable support via `VITE_GOOGLE_CLIENT_ID`.

### 🤖 4. AI-Agent & LLM Workflows
- **Heyo AI Assistant** ([AiAssistant.jsx](src/components/AiAssistant.jsx) & [server/routes/ai-agent.js](server/routes/ai-agent.js))
- Multi-step reasoning pipeline: **Think** (intent classification) → **Plan** → **Execute** (tool invocation) → **Respond**.
- Transparent agent workflow execution logs with execution timers.
- Automatic icebreaker generation, compatibility scoring, and group meetup planner.

### 🎨 5. Motion Graphics & Interactive Web Elements
- Smooth UI micro-interactions, modal spring physics, and draggable UI elements powered by **Framer Motion v12**.
- **Three.js v0.185** integration for 3D graphics capabilities.

### 📊 6. Analytics & User Insights
- Analytics engine ([server/routes/analytics.js](server/routes/analytics.js)) tracking active users, meetup participation rates, and connection conversions.

### 🔐 7. Google OAuth 2.0 Authentication
- Seamless Google Sign-In via Google Identity Services (GSI) SDK ([GoogleAuthModal.jsx](src/components/GoogleAuthModal.jsx)) and backend token verification using Google OAuth Client Library ([server/routes/auth.js](server/routes/auth.js)).

---

## 📱 Features Overview

### 🗺️ Nearby Discovery & Leaflet Maps
- Discover nearby people via card grid or interactive Leaflet map.
- Filter by interests (Coffee, Design, Music, Gaming, Tech, etc.).
- Location permissions with city detection.

### 💬 Connections & Real-time Chat
- Send, accept, decline, or cancel connection requests.
- Automatic redirection to chat upon connection acceptance.
- iMessage-style chat with timestamp grouping, message status indicators, and live location sharing (15m / 1h / 8h timers).

### 🎯 Group Meetups
- Create and join local meetup activities.
- Creator request approval flow (accept/decline incoming join requests directly from meetup cards).

### 📸 Posts & User Profiles
- Post creation with text and custom aspect ratio images.
- Post archiving and deletion.
- Profile editing (bio, avatar, interests, username availability check).
- Account privacy modes (private profile blur).

---

## 🧹 Code Quality & Cleanup Notes

In recent updates, the project underwent a complete codebase audit and cleanup:
- **Removed Dead Code**: Deleted unused components (`MapView.jsx`) and unused boilerplate SVG assets (`react.svg`, `vite.svg`, `hero.png`).
- **Linter & Type Polish**: Resolved all `oxlint` unused variable warnings across frontend components (`Profile.jsx`, `AdminPanel.jsx`) and backend API routes (`ai-agent.js`).
- **Production Build Verification**: Verified clean Vite production builds with zero errors.

---

## 🧪 Testing & CI/CD

### Backend Tests
```bash
cd server
npm run test
```
Uses **Vitest** and **Supertest** with mocked Prisma database queries.

### CI/CD Pipeline
Configured via [.github/workflows/ci.yml](.github/workflows/ci.yml) to automatically run `oxlint` linting and backend Vitest test suites on every `push` and `pull_request` to `main`.

# Heyo — Nearby Social App

A full-stack location-based social app built with **React + Vite** (frontend) and **Node.js + Express + Prisma (SQLite)** (backend). Installable as a **Progressive Web App (PWA)** on iOS and Android.

---

## 🔑 Test Account

| Field    | Value               |
|----------|---------------------|
| Email    | `Testuser@heyo.com` |
| Password | `heyo123`           |

---

## 🚀 Quick Start

```bash
npm install
cd server && npm install && cd ..
npm run start
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:5001

---

## 📱 Install as PWA

**iOS**: Safari → Share → Add to Home Screen  
**Android**: Chrome → ⋮ menu → Install app

---

## ✨ Full Feature List

### 🗺️ Nearby Discovery
- See people near you on a card feed or interactive map
- Filter by interests (Coffee, Design, Music, Gaming, etc.)
- AI Semantic Search — search by vibe (e.g. "someone into coffee and design")

### 💬 Messaging & Connections
- Send connection requests with a custom invite message
- **Cancel a pending request** you sent by mistake (Cancel button on card)
- Accept / Decline incoming requests from Inbox or the 🔔 notification bell
- After accepting → **auto-redirects to the chat screen**
- Real-time iMessage-style chat with date grouping and message tails
- Location sharing (static snapshot or live with 15min / 1hr / 8hr timer)
- AI Icebreakers — generated conversation starters based on shared interests

### 🔔 Notification Bell (Home page)
- Small bell icon in top-right corner of the Nearby screen
- Shows all pending connection requests with Accept / Decline inline
- Accepting auto-navigates to the chat with that person

### 🎯 Group Meetups
- Browse open meetup events in your area
- Create meetups with AI-suggested activity ideas
- Join meetups — sends a request to the meetup creator
- **Meetup creators see incoming join requests** directly on their meetup card
- Accept a join request → opens chat with that person
- Cancel a pending join request with one tap

### 📸 Posts
- Create posts with text and/or images
- View others' posts on their profile card
- Archive or delete your own posts

### 👤 Profile
- Customizable bio, interests, avatar
- Private account mode (blur profile until connected)
- Multi-account support (switch between accounts)
- Google sign-in with OTP verification
- Password reset via email

### 🎨 UI / UX
- Dark mode / Light mode toggle
- Smooth splash screen on launch (1.2s)
- Floating pill-shaped bottom navigation
- Minimal glassmorphism design language
- Safe-area aware for iPhone notch / home bar

---

## 🏗️ Architecture

### Frontend
- React 19 + Vite, React Router DOM v7
- Lucide React icons, Framer Motion animations
- Leaflet maps (react-leaflet)
- PWA via vite-plugin-pwa

### Backend
- Node.js + Express
- Prisma ORM with SQLite (swap to PostgreSQL in schema)
- JWT + bcrypt authentication
- OpenAI API (icebreakers + semantic search + activity suggestions)

---

## 🗄️ Switch to PostgreSQL

1. Edit `server/prisma/schema.prisma` — change provider to `postgresql`
2. Set `DATABASE_URL` in `server/.env`
3. Run `npx prisma db push`

---

## 🌐 Live App

Deployed on **Vercel** (frontend) + **Render** (backend).

> **Live URL**: https://heyo-dqrdhpnoq-akshat24.vercel.app

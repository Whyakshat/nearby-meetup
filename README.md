# Heyo — Nearby Social App

A full-stack location-based social app built with **React + Vite** (frontend) and **Node.js + Express + Prisma (SQLite)** (backend). Installable as a **Progressive Web App (PWA)** on iOS and Android.

---

## 🔑 Test Account

Try the app instantly using this demo account:

| Field    | Value               |
|----------|---------------------|
| Email    | `Testuser@heyo.com` |
| Password | `heyo123`           |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
cd server && npm install && cd ..
```

### 2. Run locally
```bash
npm run start
```

Starts **both** frontend and backend:
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

---

## 📱 Install as PWA

### iOS
1. Open in **Safari**
2. Tap **Share** → **Add to Home Screen** → **Add**

### Android
1. Open in **Chrome**
2. Tap **⋮ menu** → **Install app**

---

## ✨ Features

- 📍 **Nearby discovery** — map + card feed of people around you
- 💬 **Real-time chat** — minimal iMessage-style messaging with date grouping
- 🤝 **Connect requests** — send/accept/decline meetup invites
- 📸 **Posts feed** — share photos and updates
- 🗺️ **Live location sharing** — share your live location with a timer
- 🤖 **AI Icebreakers** — generated conversation starters based on shared interests
- 🔍 **AI Semantic Search** — find people by vibe
- 🎯 **Group Meetups** — create or join open meetup events nearby
- 🌙 **Dark mode** — full theme support
- 🔒 **Private accounts** — control who can see your profile

---

## 🏗️ Architecture

### Frontend
- React 19 + Vite, React Router DOM v7
- Lucide React, Framer Motion, Leaflet maps
- PWA via vite-plugin-pwa

### Backend
- Node.js + Express, Prisma ORM, SQLite
- JWT + bcrypt authentication
- OpenAI API (icebreakers + semantic search)

---

## 🗄️ Switch to PostgreSQL

1. Edit `server/prisma/schema.prisma` — change provider to `postgresql`
2. Set `DATABASE_URL` in `server/.env`
3. Run `npx prisma db push`

---

## 🌐 Live App

Deployed on **Vercel** (frontend) + **Render** (backend).

> **Live URL**: https://heyo-dqrdhpnoq-akshat24.vercel.app

# Nearby Meetup (Full-Stack PWA)

A full-stack location-based social application with real-time features, built with **React, Vite, Node.js, Express, and Prisma (SQLite)**. It is configured as a **Progressive Web App (PWA)**, meaning you can install it on your iOS or Android device without going through an App Store.

## Prerequisites
- Node.js (v18+)
- npm

## How to Run Locally

### 1. Install Dependencies
Install the root dependencies:
```bash
npm install
```
Install the backend dependencies:
```bash
cd server
npm install
```

### 2. Run the App
From the root of the project, simply run:
```bash
npm run start
```
This single command will start **both** the React frontend (Vite) and the Node.js backend (Express) concurrently!

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## How to Install as a PWA (On your Phone)
Because this app is a Progressive Web App, you can "install" it on your phone natively.

### **iOS (iPhone / iPad)**
1. Host the app online (e.g. Vercel, Netlify) or use something like `ngrok` to get an HTTPS link to your local server.
2. Open the link in **Safari**.
3. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
4. Scroll down and tap **"Add to Home Screen"**.
5. Tap **Add** in the top right corner.
6. The app is now installed on your Home Screen with a custom icon. It will open in full-screen mode like a native app!

### **Android**
1. Open the app link in **Google Chrome**.
2. Tap the **three dots menu** in the top right corner.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. The app is now installed!

---

## Architecture Overview

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM
- **UI Icons**: Lucide React
- **Map**: Leaflet + React Leaflet
- **State**: React Context (`AppContext.jsx`) using Fetch API
- **PWA**: `vite-plugin-pwa`

### Backend
- **Server**: Node.js + Express
- **Database**: SQLite (local file database at `server/dev.db`)
- **ORM**: Prisma (schema defined in `server/prisma/schema.prisma`)
- **Authentication**: JWT & bcrypt

### Changing the Database
If you ever want to move from SQLite to a massive cloud database like **PostgreSQL**:
1. Open `server/prisma/schema.prisma`.
2. Change `provider = "sqlite"` to `provider = "postgresql"`.
3. Update `DATABASE_URL` in `server/.env` to your PostgreSQL URL.
4. Run `npx prisma db push`.

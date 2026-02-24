# 👶 Baby Growth Journey

A daily tracker app designed for new parents to record and monitor their baby's feeding, sleep, diaper changes, and more — with cross-device sync.

## ✨ Features

- 🍼 **Feeding** — Breastfeeding (left/right duration) & bottle-feeding (breast milk / formula volume)
- 🧷 **Diaper** — Pee/poop type, color, amount, with photo support
- 😴 **Sleep** — Sleep & wake times, sleeping position direction
- 🧴 **Daily Care** — Checklist for face wash, bath, oral care, moisturizing, etc.
- 💊 **Supplements** — Daily checklist for AD, D3, iron, probiotics, DHA, etc.
- 🎓 **Education** — Track early education activities by category and duration
- 📝 **Daily Notes** — Temperature, vaccine records, and general notes
- 📊 **Daily Stats** — Auto-aggregated summary dashboard
- 📅 **History** — Browse records by date
- 🔄 **Cross-device Sync** — Login with a "family code" to share data across devices
- 📤📥 **Import / Export** — Backup and restore data in JSON format

## 🏗️ Architecture

```
┌──────────────────────────────┐
│     Frontend (Vite + TS)     │
│    SPA · Hash Router · PWA   │
├──────────────────────────────┤
│            Nginx             │
│   Static files + /api proxy  │
├──────────────────────────────┤
│    Backend (Express + TS)    │
│       REST API · Port 3001   │
├──────────────────────────────┤
│   SQLite (better-sqlite3)    │
│      Persistent storage      │
└──────────────────────────────┘
```

- **Frontend**: TypeScript + Vite, vanilla CSS, mobile-first responsive design
- **Backend**: Express 5 + better-sqlite3, RESTful API
- **Deployment**: Multi-stage Docker build (Nginx + Node)

## 🚀 Getting Started

### Local Development

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..

# 3. Start backend API (Terminal 1)
cd server
npm run dev

# 4. Start frontend dev server (Terminal 2)
npm run dev
```

Frontend: `http://localhost:5173` | API proxied to `http://localhost:3001` via Vite

### Docker Deployment

```bash
docker-compose up --build -d
```

Serves at `http://localhost:80`. Data persists in the `baby_data` Docker volume.

## 📁 Project Structure

```
baby_growth_journey/
├── src/                    # Frontend source
│   ├── main.ts             # Entry point + route registration
│   ├── api.ts              # API request layer
│   ├── router.ts           # Hash-based router
│   ├── utils.ts            # Utility functions
│   ├── style.css           # Global styles
│   └── pages/              # Page components
│       ├── home.ts         # Home (stats + daily records)
│       ├── login.ts        # Family code login
│       ├── feeding.ts      # Feeding tracker
│       ├── diaper.ts       # Diaper tracker
│       ├── sleep.ts        # Sleep tracker
│       ├── education.ts    # Education & exercise
│       ├── supplement.ts   # Supplements & medicine
│       ├── care.ts         # Daily care checklist
│       └── dailyNote.ts    # Daily notes
├── server/                 # Backend source
│   ├── src/
│   │   ├── index.ts        # Express entry point
│   │   ├── db.ts           # SQLite initialization
│   │   └── routes.ts       # API routes
│   └── package.json
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Container orchestration
├── nginx.conf              # Nginx configuration
└── vite.config.ts          # Vite dev config
```

## 📜 License

MIT

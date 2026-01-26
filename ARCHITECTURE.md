# 📊 Architecture Diagram

## Local Development Setup

```
Your Computer
│
├─── Frontend App (http://localhost:5173)
│    │ package.json has: "npm run dev"
│    └─ Uses: import.meta.env.VITE_BACKEND_URL
│       └─ Value: "http://localhost:5000" (from .env)
│       └─ Connects to: ↓
│
└─── Backend Server (http://localhost:5000)
     │ package.json has: "npm start"
     └─ Runs: node index.js
        └─ Calls: server.listen(5000)
        └─ CORS allows: http://localhost:5173
```

## Production on Vercel

```
GitHub Repository
│
├─── Git Push → Vercel
│    │
│    ├─ Frontend Deployment
│    │  │ Detects: frontend/ folder
│    │  │ Builds: npm run build
│    │  │ Output: dist/ folder
│    │  │ Deploys to: https://your-frontend.vercel.app
│    │  │
│    │  └─ Runs browser with .env.production:
│    │     VITE_BACKEND_URL=https://your-backend.vercel.app
│    │     │
│    │     └─ Frontend makes requests to: ↓
│    │
│    └─ Backend Deployment
│       │ Detects: backend/vercel.json
│       │ Reads: backend/api/index.js (Serverless entry point)
│       │ Runs: Node.js runtime
│       │ Scales: Automatically as Serverless Functions
│       │ Deploys to: https://your-backend.vercel.app
│       │ Sets env vars:
│       │  ├─ MONGO_URI (from your settings)
│       │  ├─ JWT_SECRET (from your settings)
│       │  └─ FRONTEND_URL=https://your-frontend.vercel.app
│       │
│       └─ Handles requests from frontend
```

## Request Flow

### Local Development
```
User in Browser (localhost:5173)
    ↓ [Click button in frontend]
    ↓ fetch('/api/tokens')
    ↓ (uses SOCKET_URL = http://localhost:5000)
Backend Server (localhost:5000)
    ↓ [Express route handler]
    ↓ [Query MongoDB]
    ↓ [Send response]
    ↑ [JSON response back to frontend]
```

### Production on Vercel
```
User in Browser (your-frontend.vercel.app)
    ↓ [Click button in frontend]
    ↓ fetch('/api/tokens')
    ↓ (uses VITE_BACKEND_URL = https://your-backend.vercel.app)
Vercel Edge Network
    ↓ [Routes to Serverless Function]
Backend Serverless Function
    ↓ [Express handles request]
    ↓ [Query MongoDB]
    ↓ [CORS check: is origin in allowedOrigins?]
    ↓ [Send response]
    ↑ [JSON response back to frontend]
```

## File Locations & Their Purpose

```
token-system/
│
├── vercel.json                          [ROOT CONFIG]
│   └─ Configures frontend build/deploy
│      ├─ buildCommand: cd frontend && npm run build
│      └─ outputDirectory: frontend/dist
│
├── backend/
│   ├── vercel.json                      [BACKEND CONFIG] ✨ NEW
│   │   └─ Configures backend Serverless
│   │      ├─ builds: api/index.js
│   │      └─ routes: all → api/index.js
│   │
│   ├── api/
│   │   └── index.js                     [SERVERLESS ENTRY] ✨ NEW
│   │       ├─ Exports Express app
│   │       ├─ CORS with FRONTEND_URL
│   │       └─ Socket.io setup
│   │
│   ├── index.js                         [LOCAL DEV]
│   │   ├─ server.listen(5000)
│   │   ├─ Use for npm start
│   │   └─ Updated CORS config
│   │
│   ├── models/
│   │   ├── Token.js
│   │   └── Schedule.js
│   │
│   ├── routes/
│   │   ├── tokenRoutes.js
│   │   └── scheduleRoutes.js
│   │
│   └── package.json
│       └─ Dependencies: express, mongoose, cors, socket.io
│
└── frontend/
    ├── .env                             [DEV CONFIG] ✨ NEW
    │   └─ VITE_BACKEND_URL=http://localhost:5000
    │
    ├── .env.production                  [PROD CONFIG] ✨ NEW
    │   └─ VITE_BACKEND_URL=https://your-backend.vercel.app
    │
    ├── src/
    │   ├── App.jsx                      [UPDATED] ✨
    │   │   ├─ Uses getBackendURL()
    │   │   ├─ Uses import.meta.env.VITE_BACKEND_URL
    │   │   └─ Socket.io with fallback transports
    │   │
    │   └── i18n.js
    │
    └── package.json
        └─ "npm run dev" → Vite dev server
```

## Environment Variable Flow

### Development
```
.env file created
    ↓
VITE_BACKEND_URL=http://localhost:5000
    ↓
npm run dev (Vite dev server)
    ↓
Vite injects: import.meta.env.VITE_BACKEND_URL
    ↓
Browser has access to the value
    ↓
Frontend connects to localhost:5000
```

### Production
```
.env.production file created
    ↓
VITE_BACKEND_URL=https://your-backend.vercel.app
    ↓
npm run build (Production build)
    ↓
Vite injects: import.meta.env.VITE_BACKEND_URL
    ↓
Browser has access to the value
    ↓
Frontend connects to your Vercel backend URL
```

### Backend Environment Variables (Vercel Dashboard)
```
Vercel Backend Project Settings
    ↓
Environment Variables
    ├─ MONGO_URI = mongodb+srv://...
    ├─ JWT_SECRET = your-secret
    └─ FRONTEND_URL = https://your-frontend.vercel.app
    ↓
Vercel injects into Serverless Function runtime
    ↓
backend/api/index.js reads: process.env.MONGO_URI
    ├─ Connects to MongoDB
    └─ Reads: process.env.FRONTEND_URL
       ├─ Adds to allowedOrigins
       └─ CORS allows requests from your frontend
```

## Comparison: Before vs After

### ❌ BEFORE (Your original setup)
```
Frontend (localhost:5173)
    ↓ hardcoded connection to localhost:5000
Backend (localhost:5000)
    ↓ file: backend/index.js
    └─ server.listen(5000)
       └─ Cannot run on Vercel ❌
       └─ CORS allows "*" (not secure)

Deployment Issue: How to deploy backend?
Answer: Cannot! Vercel doesn't support server.listen()
```

### ✅ AFTER (Your new setup)
```
Frontend (.env.production)
    ├─ localhost:5173 → VITE_BACKEND_URL from .env
    └─ production → VITE_BACKEND_URL from .env.production
        ↓
Backend (Vercel Serverless)
    ├─ Local: backend/index.js with server.listen()
    └─ Production: backend/api/index.js exports app
       ├─ Runs as Serverless Function
       ├─ CORS allows only specific origins
       └─ Scales automatically ✅

Deployment Solution: 
✅ Deploy backend/api/index.js to Vercel
✅ Deploy frontend/dist to Vercel
✅ They communicate via HTTPS
```

## Summary

| Component | Local | Production |
|-----------|-------|------------|
| **Frontend URL** | `http://localhost:5173` | `https://your-frontend.vercel.app` |
| **Backend URL** | `http://localhost:5000` | `https://your-backend.vercel.app` |
| **Config File** | `.env` | `.env.production` |
| **Entry Point** | `npm run dev` | Vite build + Vercel |
| **Backend Entry** | `index.js` | `api/index.js` |
| **CORS Origin** | `*` (dev only) | Specific URLs |
| **Database** | Local/Cloud | Same (MONGO_URI) |


# MERN Stack Vercel Deployment Guide

## ✅ What I've Done

I've configured your MERN project for Vercel deployment by fixing three critical issues:

### 1. **Created Backend Vercel Configuration** 
   - **File**: `backend/vercel.json`
   - Configures Vercel to treat your Express app as a **Serverless Function**
   - Routes all requests to `api/index.js`
   - Sets up environment variables (MONGO_URI, JWT_SECRET, FRONTEND_URL)

### 2. **Created Serverless-Compatible Backend Entry Point**
   - **File**: `backend/api/index.js`
   - Exports the Express app for Vercel Serverless Functions (no `server.listen()`)
   - **Fixed CORS**: Now accepts your frontend URL dynamically instead of `*`
   - Includes fallback for localhost development
   - Added health check endpoint at `/api/health`

### 3. **Fixed Frontend Configuration**
   - **Updated**: `frontend/src/App.jsx`
   - **Created**: `frontend/.env` (development)
   - **Created**: `frontend/.env.production` (for Vercel)
   - Detects if running on localhost or production
   - Uses environment variable `VITE_BACKEND_URL` for production backend URL
   - Added proper WebSocket transports (websocket + polling for Vercel)

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend to Vercel

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**: https://vercel.com/dashboard
   - Click **Add New Project**
   - Select your GitHub repository
   - **Root Directory**: Select `backend` folder
   - Click **Deploy**

3. **Copy the Backend URL**: After deployment, you'll get a URL like:
   ```
   https://your-project-name.vercel.app
   ```

### Step 2: Set Environment Variables on Vercel (Backend)

In your Vercel Backend project settings:

1. Go to **Settings > Environment Variables**
2. Add these variables:
   - **MONGO_URI**: Your MongoDB connection string
   - **JWT_SECRET**: Your JWT secret key
   - **FRONTEND_URL**: Your Vercel frontend URL (e.g., https://your-frontend.vercel.app)

### Step 3: Update Frontend Environment File

1. **Edit** `frontend/.env.production`
2. Replace `https://your-backend-project.vercel.app` with your actual backend URL from Step 1:
   ```
   VITE_BACKEND_URL=https://your-actual-backend-url.vercel.app
   ```

3. **Rebuild and push**:
   ```bash
   cd frontend
   npm run build
   cd ..
   git add .
   git commit -m "Update backend URL for production"
   git push origin main
   ```

### Step 4: Deploy Frontend to Vercel

1. Go to Vercel Dashboard → **Add New Project**
2. Select your repository
3. **Root Directory**: Select `frontend` folder
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Click **Deploy**

7. Optional: Set **VITE_BACKEND_URL** in frontend environment variables if not using .env.production

---

## 🔧 Keep Your Local Development Working

Your local development still works as-is:

**Start local development**:
```bash
# Terminal 1: Backend
cd backend
npm install
npm start
# Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (or similar)
```

The code automatically detects localhost and connects to `http://localhost:5000`.

---

## ❌ Common Issues & Solutions

### Issue: **404 errors on API calls**
**Solution**: 
- Ensure backend is deployed and FRONTEND_URL environment variable is set on Vercel
- Check that `api/index.js` exists in backend folder
- Verify vercel.json in backend folder has correct path

### Issue: **CORS errors**
**Solution**:
- Make sure FRONTEND_URL is set in backend environment variables
- Update `allowedOrigins` array in `backend/api/index.js` if needed
- Ensure frontend is calling the correct backend URL (check `VITE_BACKEND_URL`)

### Issue: **WebSocket connection fails**
**Solution**:
- Vercel doesn't support WebSockets on free tier for long-running connections
- The code now includes polling fallback: `transports: ['websocket', 'polling']`
- This allows the app to work even if WebSocket is unavailable

### Issue: **Environment variables not working**
**Solution**:
- Frontend vars must start with `VITE_` to be exposed (e.g., `VITE_BACKEND_URL`)
- Backend vars are set in Vercel project Settings > Environment Variables
- Rebuild frontend after changing .env files

---

## 📂 Your Updated Project Structure

```
token-system/
├── vercel.json (ROOT - for frontend deployment)
├── backend/
│   ├── vercel.json (Serverless config)
│   ├── api/
│   │   └── index.js (Serverless entry point - EXPORTS app)
│   ├── index.js (Keep for local development)
│   ├── package.json
│   ├── models/
│   └── routes/
└── frontend/
    ├── .env (localhost: 5000)
    ├── .env.production (your Vercel backend URL)
    ├── src/
    │   ├── App.jsx (Updated to use env vars)
    │   └── ...
    └── package.json
```

---

## ✨ Key Changes Explained

### Why `backend/api/index.js`?
- Vercel looks for `api/index.js` as the entry point for Serverless Functions
- It exports the Express app without calling `server.listen()` (Vercel handles that)
- This allows Vercel to scale your backend as serverless functions

### Why CORS changes?
- Using `"*"` origin doesn't work reliably on production
- Now it checks specific allowed URLs (localhost for dev, your frontend URL for production)
- More secure and Vercel-friendly

### Why two environment files?
- `.env` is used locally (npm run dev)
- `.env.production` is used by Vercel build (npm run build)
- Allows different backend URLs for development vs production

---

## 🧪 Testing Your Deployment

After deployment, test the connection:

```javascript
// Open browser console on your frontend
fetch('https://your-backend-url.vercel.app/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

Should return: `{ success: true, message: 'Backend is running!' }`

---

## 📝 Next Steps

1. ✅ Test locally first
2. ✅ Deploy backend, get URL
3. ✅ Update `frontend/.env.production` with backend URL
4. ✅ Deploy frontend
5. ✅ Test API calls in production
6. ✅ Monitor Vercel logs for errors

Good luck! 🚀

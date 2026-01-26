# 🚀 Vercel Deployment Checklist

## Before Deployment

- [ ] Commit all changes: `git add . && git commit -m "Setup Vercel deployment"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Have MongoDB URI ready
- [ ] Have JWT_SECRET ready
- [ ] Test locally: `npm start` (backend) and `npm run dev` (frontend)

---

## Backend Deployment

### Step 1: Deploy Backend
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New Project"
- [ ] Select your GitHub repository
- [ ] **Important**: Set "Root Directory" to `backend`
- [ ] Click "Deploy"

### Step 2: Copy Backend URL
- [ ] Wait for deployment to finish
- [ ] Copy your backend URL (looks like: `https://your-project.vercel.app`)
- [ ] Save it somewhere safe

### Step 3: Set Backend Environment Variables
- [ ] In Vercel, go to Backend Project → Settings → Environment Variables
- [ ] Add:
  - **MONGO_URI** = `[Your MongoDB connection string]`
  - **JWT_SECRET** = `[Your JWT secret]`
  - **FRONTEND_URL** = `[Your frontend Vercel URL - will set after deploying frontend]`
- [ ] Redeploy after adding env vars (Deployments → Redeploy)

---

## Frontend Deployment

### Step 1: Update Backend URL
- [ ] Open `frontend/.env.production`
- [ ] Replace `https://your-backend-project.vercel.app` with your actual backend URL from Step 2 above
- [ ] Example: `VITE_BACKEND_URL=https://my-token-system.vercel.app`

### Step 2: Commit and Push
- [ ] Commit: `git add frontend/.env.production && git commit -m "Update backend URL"`
- [ ] Push: `git push origin main`

### Step 3: Deploy Frontend
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New Project"
- [ ] Select your GitHub repository
- [ ] **Important**: Set "Root Directory" to `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Click "Deploy"

### Step 4: Copy Frontend URL
- [ ] Wait for deployment to finish
- [ ] Copy your frontend URL (looks like: `https://your-frontend.vercel.app`)

### Step 5: Update Backend with Frontend URL
- [ ] Go to Backend Project → Settings → Environment Variables
- [ ] Update **FRONTEND_URL** with your frontend URL from Step 4
- [ ] Go to Deployments → Select latest → Click "Redeploy"

---

## Testing

### Test Backend Health
- [ ] Open browser and visit: `https://your-backend.vercel.app/api/health`
- [ ] Should return: `{"success":true,"message":"Backend is running!"}`

### Test Frontend Connection
- [ ] Visit: `https://your-frontend.vercel.app`
- [ ] Open browser DevTools (F12) → Console
- [ ] Try making an API call:
  ```javascript
  fetch('https://your-backend.vercel.app/api/health')
    .then(r => r.json())
    .then(d => console.log(d))
  ```
- [ ] Should see the health check response

### Test Full Functionality
- [ ] Try login/authentication features
- [ ] Check if token operations work
- [ ] Verify schedule updates work
- [ ] Check WebSocket connection (look for `io.emit` in console)

---

## Troubleshooting

### "Cannot GET /api/..." (404 errors)
- ✓ Check backend URL in `frontend/.env.production`
- ✓ Verify backend is deployed
- ✓ Check Environment Variables are set in backend
- ✓ Redeploy backend after setting env vars

### CORS Errors
- ✓ Ensure FRONTEND_URL is set in backend environment variables
- ✓ Make sure it matches your actual frontend URL exactly
- ✓ Redeploy backend after updating FRONTEND_URL

### WebSocket Connection Failed
- ✓ This is normal on free tier (Vercel has limitations)
- ✓ Code automatically falls back to polling
- ✓ Check browser console for specific error messages

### "Cannot find module" errors
- ✓ Ensure all dependencies are in `package.json`
- ✓ Run `npm install` locally to verify
- ✓ Check that relative paths in imports are correct

### Deploy keeps failing
- ✓ Check "Deployments" tab for error logs
- ✓ Click on failed deployment to see full error
- ✓ Verify all environment variables are set
- ✓ Make sure `backend/api/index.js` exists and exports the app

---

## Quick Command Reference

```bash
# Local development
cd backend && npm start          # Terminal 1: Backend on localhost:5000
cd frontend && npm run dev       # Terminal 2: Frontend on localhost:5173

# Testing locally
curl http://localhost:5000/api/health

# Verify Node version (should be 18+)
node --version

# Check if packages are installed
npm list

# Test build locally
npm run build
```

---

## Important Files

📄 `backend/api/index.js` - Vercel entry point (DO NOT MODIFY)
📄 `backend/vercel.json` - Vercel config (DO NOT MODIFY)
📄 `frontend/.env.production` - YOUR BACKEND URL (MUST UPDATE)
📄 `frontend/src/App.jsx` - Uses env variable (Already updated)

---

## Common Mistakes to Avoid

❌ Forgetting to update `frontend/.env.production` with backend URL
❌ Not setting environment variables in Vercel backend settings
❌ Setting "Root Directory" incorrectly (should be `frontend` or `backend`)
❌ Forgetting to redeploy backend after setting environment variables
❌ Using `http://` instead of `https://` for production URLs
❌ Not committing `.env.production` to git (it should be committed)

---

## Support

If something isn't working:
1. Check Vercel logs: Dashboard → Select Project → Deployments
2. Check browser console: F12 → Console tab
3. Check backend logs: Vercel → Select Backend → Deployments → Recent
4. Verify all URLs match exactly (case-sensitive!)

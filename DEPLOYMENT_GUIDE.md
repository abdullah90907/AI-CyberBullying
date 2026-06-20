# OmniGuard Deployment Guide

## 🎯 Deployment Plan

- **Frontend**: Vercel
- **Backend**: Render
- **Android**: Keep in GitHub (no deployment needed)

---

## 📋 Prerequisites

Before deploying, make sure you have these API keys ready:

### Required API Keys
1. **GROQ_API_KEY** - from [console.groq.com](https://console.groq.com)
2. **GEMINI_API_KEY** - from [aistudio.google.com](https://aistudio.google.com)
3. **NEWS_API_KEY** - from [newsapi.org](https://newsapi.org)

---

## 🚀 Part 1: Backend Deployment on Render

### Step 1: Prepare Backend for Deployment

First, let's create the necessary files for Render:

#### Create `render.yaml` (optional but recommended)
```yaml
services:
  - type: web
    name: omniguard-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        value: sqlite:///./omniguard.db
      - key: GROQ_API_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: NEWS_API_KEY
        sync: false
```

### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com) and sign up/login**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `omniguard-backend`
   - **Region**: Choose the one closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or set to your repo root)
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
5. **Add Environment Variables (in Render dashboard):**
   - `DATABASE_URL`: `sqlite:///./omniguard.db`
   - `GROQ_API_KEY`: Your Groq API key
   - `GEMINI_API_KEY`: Your Gemini API key
   - `NEWS_API_KEY`: Your NewsAPI key
6. **Click "Create Web Service"**

### Important Notes for Render:
- Free tier has **750 hours/month** (plenty for a project)
- Free instances **spin down after 15 minutes of inactivity**
- First request after spin down may take 30-60 seconds
- SQLite database will be **reset on every deploy** (you might want to use PostgreSQL for production)

---

## 🎨 Part 2: Frontend Deployment on Vercel

### Step 1: Update Frontend API URL

Create or update `.env.production` in the `frontend/` folder:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com/api/v1/
```

**Important**: Replace `your-render-backend-url` with your actual Render URL (e.g., `https://omniguard-backend.onrender.com`)

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign up/login**
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Project Name**: `omniguard-frontend`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (should auto-detect)
5. **Add Environment Variable:**
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-render-backend-url.onrender.com/api/v1/`
6. **Click "Deploy"**

### Step 3: Update CORS in Backend (if needed)

After Vercel gives you a frontend URL, update the CORS settings in `backend/app/main.py`:

```python
origins = [
    "*",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    "https://your-vercel-frontend-url.vercel.app",  # Add this
]
```

---

## 📱 Android: Keep in GitHub

The Android folder is already properly gitignored via `frontend/android/.gitignore`, so it will stay in GitHub but won't be deployed to Vercel/Render. This is exactly what you want!

---

## 🔑 Environment Variables Summary

### Backend (Render)
| Variable | Purpose | Required? |
|----------|---------|-----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `GROQ_API_KEY` | For text analysis LLM | Yes |
| `GEMINI_API_KEY` | For image/video analysis | Yes |
| `NEWS_API_KEY` | For fetching cyberbullying news | Yes |

### Frontend (Vercel)
| Variable | Purpose | Required? |
|----------|---------|-----------|
| `VITE_API_BASE_URL` | Backend API URL (must end with `/`) | Yes |

---

## 🎉 After Deployment

1. **Test the backend first**: Visit `https://your-render-url.onrender.com/health` - should show `{"status": "running"}`
2. **Test the frontend**: Visit your Vercel URL and try signing up/logging in
3. **Test the features**: Try text/image/video analysis

---

## ⚠️ Important Considerations

1. **Free Tier Limitations**:
   - Render free tier spins down after inactivity
   - Vercel free tier has bandwidth limits
   - NewsAPI free tier has 100 requests/day

2. **Database Persistence**:
   - SQLite on Render is **not persistent** - data resets on every deploy
   - For production, consider using Render's PostgreSQL database

3. **Security**:
   - Never commit `.env` files to GitHub
   - Use Render/Vercel's built-in secret management
   - Consider adding authentication middleware for sensitive endpoints

4. **Android App**:
   - The Android code stays in GitHub
   - You can build the APK locally using Android Studio when needed
   - Update `.env.production` in frontend before building Android app to use your deployed backend URL

---

## 📞 Need Help?

- **Render Docs**: https://docs.render.com
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

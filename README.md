
# 🚀 NexusStream: Production Deployment Guide

This repository contains a high-performance, anonymous video/chat platform. Follow these steps to deploy.

---

## 📦 1. Push to GitHub
1. Create a new repo on GitHub.
2. Run:
   ```bash
   git init
   git add .
   git commit -m "Deployment ready"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/nexus-stream.git
   git push -u origin main
   ```

---

## 🧠 2. Deploy Backend (Render / Railway / Fly.io)
1. **New Web Service** from GitHub.
2. **Runtime:** Node.
3. **Build Command:** `npm install`.
4. **Start Command:** `npm run server`.
5. **Env Vars:**
   - `PORT`: `5000`
   - `NODE_ENV`: `production`

---

## 🎨 3. Deploy Frontend (Netlify / Vercel)
1. **New Site** from GitHub.
2. **Build Command:** `npm run build`.
3. **Publish Directory:** `dist`.
4. **Env Vars (CRITICAL):**
   - `VITE_API_URL`: Paste your Backend URL (e.g., `https://nexus-api.onrender.com`).
   - `API_KEY`: Your Google Gemini API Key.

---

## 🛠 Troubleshooting
- **No Video?** Ensure you are on `https://`. WebRTC requires a secure context.
- **Backend sleeping?** Render's free tier spins down after 15 mins of inactivity. The first connection might take 30 seconds.
- **Admin Access:** Login with `khiteshjain09@gmail.com` / `Kjsince2k@whodis`. Click the logo 10 times to toggle the Dev Panel.

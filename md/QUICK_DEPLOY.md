# 🚀 Quick Deploy Script - Hi Math

## Bước 1: Chuẩn bị code

### 1.1 Update API URLs trong panels
Tất cả các panels đã được cấu hình để sử dụng `config.js`.
File `config.js` sẽ tự động detect môi trường (local/production).

### 1.2 Update production API URL
Sau khi deploy backend, cập nhật URL trong `frontEnd/config.js`:
```javascript
return 'https://YOUR-BACKEND-URL.onrender.com';
```

## Bước 2: Push lên GitHub

```bash
# Initialize git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/hi-math.git
git branch -M main
git push -u origin main
```

## Bước 3: Deploy Database (Railway - Khuyến nghị)

1. Truy cập: https://railway.app
2. Sign up với GitHub
3. New Project → Deploy MySQL
4. Copy credentials:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

## Bước 4: Deploy Backend (Render)

1. Truy cập: https://render.com
2. Sign up với GitHub
3. New → Web Service
4. Connect repository: `hi-math`
5. Settings:
   ```
   Name: hi-math-backend
   Root Directory: backEnd
   Build Command: npm install
   Start Command: npm start
   ```
6. Environment Variables (từ Railway):
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<from Railway>
   DB_PORT=<from Railway>
   DB_USER=<from Railway>
   DB_PASSWORD=<from Railway>
   DB_NAME=<from Railway>
   JWT_SECRET=<random-secret-key>
   JWT_EXPIRES_IN=7d
   ```
7. Create Web Service
8. Wait for deploy (~5 minutes)
9. Copy backend URL: `https://hi-math-backend-xxxx.onrender.com`

## Bước 5: Seed Database

### Option A: Using Render Shell
1. Go to backend service → Shell tab
2. Run:
```bash
npm run seed
npm run seed:games
```

### Option B: From local
1. Update local `.env` with Railway credentials
2. Run:
```bash
cd backEnd
npm run seed
npm run seed:games
```

## Bước 6: Deploy Frontend (Render)

1. Update `frontEnd/config.js` with backend URL
2. Commit and push:
```bash
git add frontEnd/config.js
git commit -m "Update API URL for production"
git push
```
3. In Render: New → Static Site
4. Connect repository: `hi-math`
5. Settings:
   ```
   Name: hi-math-frontend
   Root Directory: frontEnd
   Build Command: (leave empty)
   Publish Directory: .
   ```
6. Create Static Site
7. Copy frontend URL: `https://hi-math-frontend-xxxx.onrender.com`

## Bước 7: Update CORS

1. Go to backend service → Environment
2. Add:
   ```
   FRONTEND_URL=<your-frontend-url>
   ```
3. Save (auto redeploy)

## Bước 8: Test

1. Visit: `https://hi-math-frontend-xxxx.onrender.com`
2. Register new account
3. Test all features:
   - ✅ Login/Register
   - ✅ Game Selection
   - ✅ Progress
   - ✅ Leaderboard

## ✅ Done!

Your app is now live! 🎉

**URLs:**
- Frontend: `https://hi-math-frontend-xxxx.onrender.com`
- Backend: `https://hi-math-backend-xxxx.onrender.com`
- Database: Railway MySQL

---

## 🔧 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify environment variables
- Test database connection

### Frontend can't connect to backend
- Check API URL in `config.js`
- Verify CORS settings
- Check browser console for errors

### Database connection failed
- Verify Railway database is running
- Check credentials in environment variables
- Whitelist Render IPs in Railway (if needed)

---

## 💡 Keep Service Active (Free Tier)

Render free tier sleeps after 15 minutes of inactivity.

**Solution:** Use UptimeRobot
1. Sign up: https://uptimerobot.com
2. Add monitor: `https://hi-math-backend-xxxx.onrender.com/api/health`
3. Interval: 5 minutes
4. Done! Service will stay active.

---

*Happy Deploying! 🚀*

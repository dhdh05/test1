# 🚀 Hướng dẫn Deploy Hi Math lên Render

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn deploy:
- ✅ Backend API (Node.js + Express)
- ✅ MySQL Database
- ✅ Frontend (Static site)

## 🎯 Bước 1: Chuẩn bị

### 1.1 Tạo tài khoản Render
1. Truy cập: https://render.com
2. Đăng ký tài khoản (miễn phí)
3. Kết nối với GitHub

### 1.2 Push code lên GitHub
```bash
# Nếu chưa có Git repository
git init
git add .
git commit -m "Initial commit - Hi Math"

# Tạo repository mới trên GitHub
# Sau đó push code
git remote add origin https://github.com/YOUR_USERNAME/hi-math.git
git branch -M main
git push -u origin main
```

## 🗄️ Bước 2: Deploy Database (MySQL)

### 2.1 Tạo MySQL Database
1. Đăng nhập vào Render Dashboard
2. Click **"New +"** → **"PostgreSQL"** (hoặc sử dụng external MySQL)

**Lưu ý:** Render không hỗ trợ MySQL miễn phí. Bạn có 2 lựa chọn:

#### Option A: Sử dụng PostgreSQL (Miễn phí trên Render)
- Render cung cấp PostgreSQL miễn phí
- Cần chuyển đổi code từ MySQL sang PostgreSQL

#### Option B: Sử dụng MySQL từ bên ngoài (Khuyến nghị)
Sử dụng **Railway**, **PlanetScale**, hoặc **Aiven** (có free tier):

**Railway (Khuyến nghị):**
1. Truy cập: https://railway.app
2. Đăng ký và tạo MySQL database
3. Copy connection details:
   - Host
   - Port
   - Username
   - Password
   - Database name

**PlanetScale (Khuyến nghị cho production):**
1. Truy cập: https://planetscale.com
2. Tạo database miễn phí
3. Copy connection string

## 🔧 Bước 3: Deploy Backend

### 3.1 Tạo Web Service
1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Kết nối với GitHub repository của bạn
3. Cấu hình:
   - **Name:** `hi-math-backend`
   - **Region:** Singapore (hoặc gần bạn nhất)
   - **Branch:** `main`
   - **Root Directory:** `backEnd`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 3.2 Thêm Environment Variables
Trong phần **Environment**, thêm các biến sau:

```
NODE_ENV=production
PORT=5000

# Database (từ Railway hoặc PlanetScale)
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=himath

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS (sẽ cập nhật sau khi có frontend URL)
FRONTEND_URL=https://your-frontend-url.onrender.com
```

### 3.3 Deploy
1. Click **"Create Web Service"**
2. Đợi deploy hoàn tất (3-5 phút)
3. Copy URL backend (ví dụ: `https://hi-math-backend.onrender.com`)

### 3.4 Test Backend
Truy cập: `https://hi-math-backend.onrender.com/api/health`

Nếu thấy response JSON → Backend đã hoạt động! ✅

## 🌐 Bước 4: Deploy Frontend

### 4.1 Chuẩn bị Frontend

Trước tiên, cập nhật API URL trong frontend:

**Tạo file `frontEnd/config.js`:**
```javascript
// API Configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : 'https://hi-math-backend.onrender.com'; // Thay bằng URL backend của bạn

export default API_URL;
```

**Cập nhật tất cả panels để sử dụng config:**
Thay `const API_URL = 'http://localhost:5000';` 
Bằng `import API_URL from '../../config.js';`

### 4.2 Tạo Static Site
1. Trong Render Dashboard, click **"New +"** → **"Static Site"**
2. Kết nối với cùng GitHub repository
3. Cấu hình:
   - **Name:** `hi-math-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontEnd`
   - **Build Command:** (để trống)
   - **Publish Directory:** `.`

### 4.3 Deploy
1. Click **"Create Static Site"**
2. Đợi deploy hoàn tất
3. Copy URL frontend (ví dụ: `https://hi-math-frontend.onrender.com`)

### 4.4 Cập nhật CORS
Quay lại Backend Web Service:
1. Vào **Environment**
2. Cập nhật `FRONTEND_URL` với URL frontend vừa có
3. Save → Backend sẽ tự động redeploy

## 🎯 Bước 5: Seed Database

### 5.1 Chạy seed scripts
Sau khi backend deploy xong, cần seed data:

**Option 1: Sử dụng Render Shell**
1. Vào Backend Web Service
2. Click **"Shell"** tab
3. Chạy lệnh:
```bash
npm run seed
npm run seed:games
```

**Option 2: Chạy local và kết nối remote DB**
1. Cập nhật `.env` local với database credentials từ Railway/PlanetScale
2. Chạy:
```bash
npm run seed
npm run seed:games
```

## ✅ Bước 6: Kiểm tra

### 6.1 Test Backend
```bash
# Health check
curl https://hi-math-backend.onrender.com/api/health

# Test register
curl -X POST https://hi-math-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","full_name":"Test User"}'
```

### 6.2 Test Frontend
1. Truy cập: `https://hi-math-frontend.onrender.com`
2. Thử đăng ký/đăng nhập
3. Kiểm tra các tính năng:
   - Game Selection
   - Progress
   - Leaderboard

## 🔧 Troubleshooting

### Backend không kết nối được database
- Kiểm tra environment variables
- Kiểm tra database có đang chạy không
- Xem logs trong Render Dashboard

### Frontend không gọi được API
- Kiểm tra CORS settings
- Kiểm tra API_URL trong config.js
- Xem Network tab trong DevTools

### Database connection timeout
- Kiểm tra firewall/whitelist IP
- Railway/PlanetScale có thể cần whitelist Render IPs

## 💡 Tips

### Free Tier Limitations
- **Render Free:** Service sẽ sleep sau 15 phút không hoạt động
- **Railway Free:** 500 hours/month
- **PlanetScale Free:** 5GB storage, 1 billion row reads/month

### Giữ service luôn active
Sử dụng cron job hoặc UptimeRobot để ping health endpoint mỗi 10 phút:
```
https://hi-math-backend.onrender.com/api/health
```

### Monitoring
- Sử dụng Render Dashboard để xem logs
- Setup UptimeRobot để monitor uptime
- Sử dụng Sentry cho error tracking

## 📚 Alternative: Deploy toàn bộ lên Railway

Railway hỗ trợ cả MySQL và có free tier tốt hơn:

1. Truy cập: https://railway.app
2. Tạo project mới
3. Add MySQL database
4. Add service từ GitHub (backend)
5. Add service từ GitHub (frontend)
6. Configure environment variables
7. Deploy!

## 🎉 Hoàn thành!

Sau khi hoàn tất, bạn sẽ có:
- ✅ Backend API: `https://hi-math-backend.onrender.com`
- ✅ Frontend: `https://hi-math-frontend.onrender.com`
- ✅ Database: Railway/PlanetScale

**Chia sẻ link với bạn bè và enjoy! 🚀**

---

## 📞 Cần hỗ trợ?

Nếu gặp vấn đề:
1. Kiểm tra logs trong Render Dashboard
2. Xem Network tab trong browser DevTools
3. Kiểm tra environment variables
4. Đảm bảo database đang chạy

---

*Tạo bởi: Antigravity AI Assistant*  
*Ngày: 24/12/2024*

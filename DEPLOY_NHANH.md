# 🚀 HƯỚNG DẪN DEPLOY NHANH - HI MATH

## ⚡ Deploy trong 10 phút!

### Bước 1: Tạo tài khoản (2 phút)

1. **Railway** (cho Database):
   - Truy cập: https://railway.app
   - Đăng ký bằng GitHub
   
2. **Render** (cho Backend + Frontend):
   - Truy cập: https://render.com
   - Đăng ký bằng GitHub

### Bước 2: Deploy Database (2 phút)

1. Vào Railway → **New Project**
2. Chọn **Deploy MySQL**
3. Đợi 1 phút
4. Click vào MySQL → **Variables** tab
5. **Copy** các thông tin sau:
   ```
   MYSQL_HOST
   MYSQL_PORT  
   MYSQL_USER
   MYSQL_PASSWORD
   MYSQL_DATABASE
   ```

### Bước 3: Push code lên GitHub (2 phút)

```bash
# Mở terminal trong thư mục Hi_Math-main

# Khởi tạo git
git init
git add .
git commit -m "Initial commit"

# Tạo repo mới trên GitHub (https://github.com/new)
# Đặt tên: hi-math

# Push code
git remote add origin https://github.com/YOUR_USERNAME/hi-math.git
git branch -M main
git push -u origin main
```

### Bước 4: Deploy Backend (3 phút)

1. Vào Render → **New** → **Web Service**
2. Connect GitHub repo: **hi-math**
3. Điền thông tin:
   - **Name:** `hi-math-backend`
   - **Root Directory:** `backEnd`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   
4. **Environment Variables** (paste từ Railway):
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=<paste từ Railway>
   DB_PORT=<paste từ Railway>
   DB_USER=<paste từ Railway>
   DB_PASSWORD=<paste từ Railway>
   DB_NAME=<paste từ Railway>
   JWT_SECRET=abc123xyz789  
   JWT_EXPIRES_IN=7d
   ```

5. Click **Create Web Service**
6. Đợi deploy xong (~3 phút)
7. **Copy URL backend** (ví dụ: `https://hi-math-backend-abc.onrender.com`)

### Bước 5: Seed Database (1 phút)

1. Trong Render backend service → **Shell** tab
2. Chạy lệnh:
   ```bash
   npm run seed
   npm run seed:games
   ```
3. Đợi hoàn tất

### Bước 6: Deploy Frontend (2 phút)

1. **Cập nhật API URL:**
   - Mở file: `frontEnd/config.js`
   - Dòng 11: Thay `https://hi-math-backend.onrender.com` 
   - Bằng URL backend vừa copy ở bước 4
   
2. **Push code:**
   ```bash
   git add frontEnd/config.js
   git commit -m "Update API URL"
   git push
   ```

3. **Deploy:**
   - Vào Render → **New** → **Static Site**
   - Connect repo: **hi-math**
   - Settings:
     - **Name:** `hi-math-frontend`
     - **Root Directory:** `frontEnd`
     - **Build Command:** (để trống)
     - **Publish Directory:** `.`
   - Click **Create Static Site**
   - Đợi deploy (~2 phút)
   - **Copy URL frontend**

### Bước 7: Cập nhật CORS (30 giây)

1. Vào backend service → **Environment**
2. Thêm biến:
   ```
   FRONTEND_URL=<paste URL frontend>
   ```
3. Save → Tự động redeploy

### ✅ XONG! Truy cập app của bạn!

**Frontend:** `https://hi-math-frontend-xyz.onrender.com`

---

## 🎉 Chúc mừng!

App của bạn đã online! Giờ bạn có thể:
- ✅ Đăng ký/Đăng nhập
- ✅ Chơi games
- ✅ Xem tiến độ
- ✅ Xem bảng xếp hạng

---

## 🔧 Gặp lỗi?

### Backend không chạy?
- Kiểm tra logs trong Render
- Verify database credentials
- Đảm bảo đã seed data

### Frontend không kết nối được?
- Kiểm tra API URL trong `config.js`
- Xem Console (F12) trong browser
- Verify CORS đã cập nhật

### Database lỗi?
- Kiểm tra Railway database đang chạy
- Verify credentials đúng
- Thử kết nối từ local

---

## 💡 Tips

### Giữ service active (Free tier)
Render free sẽ sleep sau 15 phút không dùng.

**Giải pháp:** Dùng UptimeRobot
1. Đăng ký: https://uptimerobot.com
2. Add monitor: URL backend + `/api/health`
3. Interval: 5 phút
4. Xong! Service sẽ luôn active

### Monitor app
- **Logs:** Xem trong Render Dashboard
- **Uptime:** UptimeRobot
- **Errors:** Xem Console trong browser

---

## 📞 Cần giúp?

1. Xem file `DEPLOY_GUIDE.md` để biết chi tiết
2. Check logs trong Render Dashboard
3. Xem Network tab trong DevTools

---

**Chúc bạn deploy thành công! 🚀**

*Tạo bởi: Antigravity AI Assistant*

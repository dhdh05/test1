# 🚀 HƯỚNG DẪN DEPLOY NHANH - HI MATH

## ⚡ Deploy trong 15 phút với TiDB Cloud!

### Bước 1: Tạo tài khoản (2 phút)

1. **TiDB Cloud** (cho Database - MIỄN PHÍ):
   - Truy cập: https://tidbcloud.com
   - Đăng ký bằng GitHub hoặc Email
   - Chọn plan **Free Tier** (Serverless)
   
2. **Render** (cho Backend + Frontend):
   - Truy cập: https://render.com
   - Đăng ký bằng GitHub

### Bước 2: Tạo Database trên TiDB Cloud (3 phút)

1. Sau khi đăng nhập TiDB Cloud → Click **Create Cluster**
2. Chọn **Serverless** (Free tier)
3. Chọn region gần bạn nhất (Singapore hoặc Tokyo)
4. Đặt tên cluster: `himath-db`
5. Click **Create**
6. Đợi 1-2 phút cluster khởi tạo

#### Lấy Connection String:
1. Click vào cluster vừa tạo
2. Click **Connect** button
3. Chọn **General** tab
4. Copy thông tin:
   ```
   Host: gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   Port: 4000
   User: <your-username>
   Password: <your-password>
   Database: test
   ```
5. **LƯU Ý:** Tick vào "Include password in connection string"

### Bước 3: Push code lên GitHub (2 phút)

```bash
# Mở terminal trong thư mục Hi_Math-main

# Khởi tạo git (nếu chưa có)
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Tạo repo mới trên GitHub (https://github.com/new)
# Đặt tên: hi-math

# Push code
git remote add origin https://github.com/YOUR_USERNAME/hi-math.git
git branch -M main
git push -u origin main
```

### Bước 4: Deploy Backend trên Render (4 phút)

1. Vào Render → **New** → **Web Service**
2. Connect GitHub repo: **hi-math**
3. Điền thông tin:
   - **Name:** `hi-math-backend`
   - **Region:** Singapore
   - **Root Directory:** `backEnd`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   
4. **Environment Variables** (paste từ TiDB Cloud):
   ```
   NODE_ENV=production
   PORT=5000
   
   # TiDB Cloud Connection
   DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   DB_PORT=4000
   DB_USER=<your-tidb-username>
   DB_PASSWORD=<your-tidb-password>
   DB_NAME=test
   
   # SSL cho TiDB (QUAN TRỌNG!)
   DB_SSL=true
   
   # JWT
   JWT_SECRET=himath-super-secret-key-2024-change-this
   JWT_EXPIRES_IN=7d
   ```

5. Click **Create Web Service**
6. Đợi deploy xong (~3-4 phút)
7. **Copy URL backend** 
   - Ví dụ: `https://hi-math-backend-abc.onrender.com`

### Bước 5: Seed Database (2 phút)

#### Option A: Sử dụng Render Shell (Khuyến nghị)
1. Trong Render backend service → Tab **Shell**
2. Chạy lần lượt:
   ```bash
   npm run seed
   npm run seed:games
   ```
3. Đợi hoàn tất (sẽ thấy "✅ Seed completed")

#### Option B: Từ máy local
1. Cập nhật file `backEnd/.env` với TiDB credentials
2. Thêm dòng: `DB_SSL=true`
3. Chạy:
   ```bash
   cd backEnd
   npm run seed
   npm run seed:games
   ```

### Bước 6: Deploy Frontend (2 phút)

1. **Cập nhật API URL:**
   - Mở file: `frontEnd/config.js`
   - Dòng 11: Thay URL mặc định
   - Bằng URL backend vừa copy ở Bước 4
   - Ví dụ:
   ```javascript
   return 'https://hi-math-backend-abc.onrender.com';
   ```
   
2. **Push code:**
   ```bash
   git add frontEnd/config.js
   git commit -m "Update API URL for production"
   git push
   ```

3. **Deploy trên Render:**
   - Vào Render → **New** → **Static Site**
   - Connect repo: **hi-math**
   - Settings:
     - **Name:** `hi-math-frontend`
     - **Root Directory:** `frontEnd`
     - **Build Command:** (để trống)
     - **Publish Directory:** `.`
   - Click **Create Static Site**
   - Đợi deploy (~1-2 phút)
   - **Copy URL frontend**

### Bước 7: Cập nhật CORS (30 giây)

1. Vào backend service → **Environment**
2. Thêm biến mới:
   ```
   FRONTEND_URL=<paste-url-frontend-vừa-copy>
   ```
3. Click **Save** → Backend tự động redeploy

### ✅ XONG! Truy cập app!

**Frontend URL:** `https://hi-math-frontend-xyz.onrender.com`

---

## 🎉 Chúc mừng!

App của bạn đã online với:
- ✅ **Database:** TiDB Cloud (MySQL-compatible, miễn phí)
- ✅ **Backend:** Render Web Service
- ✅ **Frontend:** Render Static Site

Giờ bạn có thể:
- ✅ Đăng ký/Đăng nhập
- ✅ Chơi games
- ✅ Xem tiến độ
- ✅ Xem bảng xếp hạng

---

## 🔧 Gặp lỗi?

### Backend không start được?
1. Kiểm tra logs trong Render Dashboard
2. Verify TiDB credentials đúng
3. Đảm bảo đã set `DB_SSL=true`

### Database connection error?
1. Kiểm tra TiDB cluster đang chạy
2. Verify connection string
3. Đảm bảo IP không bị block (TiDB cho phép mọi IP)

### Frontend không kết nối được?
1. Kiểm tra API URL trong `config.js`
2. Xem Console (F12) trong browser
3. Verify CORS đã cập nhật `FRONTEND_URL`

### Seed data lỗi?
1. Kiểm tra database connection
2. Xem logs khi chạy seed
3. Thử seed từ local với TiDB credentials

---

## 💡 Tips quan trọng

### 1. TiDB Cloud Free Tier
- **Storage:** 5GB (đủ cho project)
- **Compute:** Serverless, auto-scale
- **Bandwidth:** Unlimited
- **Uptime:** 99.9%
- **Không cần credit card!**

### 2. Giữ Render service active
Render free tier sleep sau 15 phút không dùng.

**Giải pháp:** Dùng UptimeRobot (miễn phí)
1. Đăng ký: https://uptimerobot.com
2. Add monitor: `https://hi-math-backend-xyz.onrender.com/api/health`
3. Interval: 5 phút
4. Xong! Service sẽ luôn active

### 3. Monitor app
- **Backend logs:** Render Dashboard → Logs tab
- **Database:** TiDB Cloud Dashboard → Monitoring
- **Uptime:** UptimeRobot dashboard
- **Errors:** Browser Console (F12)

### 4. Backup database
TiDB Cloud tự động backup, nhưng bạn có thể:
```bash
# Export từ TiDB
mysqldump -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com \
  -P 4000 -u <user> -p test > backup.sql
```

---

## 📊 So sánh với Railway

| Feature | TiDB Cloud | Railway |
|---------|-----------|---------|
| MySQL Compatible | ✅ Yes | ✅ Yes |
| Free Tier | ✅ Forever | ❌ Limited |
| Credit Card | ❌ No | ✅ Required |
| Storage | 5GB | 1GB |
| Setup | Easy | Easy |

**TiDB Cloud thắng!** 🏆

---

## 🚀 Next Steps

### Sau khi deploy xong:

1. **Test đầy đủ:**
   - Đăng ký tài khoản mới
   - Chơi tất cả games
   - Kiểm tra progress
   - Xem leaderboard

2. **Chia sẻ:**
   - Share link với bạn bè
   - Post lên Facebook
   - Khoe với thầy cô 😎

3. **Monitor:**
   - Setup UptimeRobot
   - Check logs thường xuyên
   - Monitor TiDB usage

4. **Improve:**
   - Thêm games mới
   - Cải thiện UI
   - Thêm features

---

## 📞 Cần giúp?

1. Xem file `md/DEPLOY_GUIDE.md` để biết chi tiết
2. Check logs trong Render Dashboard
3. Xem TiDB Cloud documentation
4. Test API với `frontEnd/test-panels.html`

---

## 🎯 Checklist Deploy

- [ ] Tạo TiDB Cloud account
- [ ] Tạo Serverless cluster
- [ ] Copy connection credentials
- [ ] Push code lên GitHub
- [ ] Deploy backend trên Render
- [ ] Thêm environment variables
- [ ] Seed database
- [ ] Update API URL trong config.js
- [ ] Deploy frontend trên Render
- [ ] Update CORS settings
- [ ] Test app online
- [ ] Setup UptimeRobot
- [ ] ✅ Done!

---

**Chúc bạn deploy thành công với TiDB Cloud! 🚀**

*Updated: 24/12/2024 - Using TiDB Cloud*  
*By: Antigravity AI Assistant*

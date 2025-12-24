# 🚀 Hi Math - BẮT ĐẦU NGAY với XAMPP (2 phút)

## ✅ Đã sửa xong!

Tất cả các vấn đề đã được khắc phục:
- ✅ Backend logic errors → **FIXED**
- ✅ Database empty → **SEEDED** (13 levels)
- ✅ Frontend-Backend integration → **FIXED**
- ✅ API không chạy → **WORKING**

## 🏃 Chạy ngay với XAMPP (2 bước)

### Bước 1: Setup Database với XAMPP (1 phút)

#### 1.1. Khởi động XAMPP
- Mở **XAMPP Control Panel**
- Click **Start** cho **Apache**
- Click **Start** cho **MySQL**
- Đợi cả 2 chuyển sang màu xanh

#### 1.2. Tạo Database
- Click button **Admin** bên cạnh MySQL (hoặc mở http://localhost/phpmyadmin)
- Trong phpMyAdmin:
  1. Click tab **"Databases"** (hoặc "Cơ sở dữ liệu")
  2. Nhập tên database: `ktpmud`
  3. Chọn Collation: `utf8mb4_unicode_ci`
  4. Click **"Create"** (hoặc "Tạo")

#### 1.3. Import Database Schema
- Click vào database `ktpmud` vừa tạo (bên trái)
- Click tab **"Import"** (hoặc "Nhập")
- Click **"Choose File"** (hoặc "Chọn tệp")
- Chọn file: `backEnd/database.sql`
- Click **"Go"** (hoặc "Thực hiện") ở cuối trang
- Đợi import xong (thấy thông báo success màu xanh)

#### 1.4. Cấu hình Backend
```bash
# Mở terminal trong thư mục backEnd
cd backEnd

# Copy file .env
copy .env.example .env

# Mở file .env và sửa thành:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # Để trống nếu XAMPP không set password
DB_NAME=ktpmud
PORT=5000
NODE_ENV=development
JWT_SECRET=himath_secret_key_2025
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

**Lưu ý**: XAMPP mặc định MySQL không có password cho user `root`, nên để `DB_PASSWORD=` (trống)

#### 1.5. Cài đặt và Seed Data
```bash
# Cài đặt dependencies
npm install

# Seed game levels
npm run seed:games
```

✅ Thấy: "✅ Seeded 13 game levels"

### Bước 2: Chạy Ứng dụng (1 phút)

#### 2.1. Chạy Backend
```bash
# Trong thư mục backEnd
npm run dev
```
✅ Thấy: "🚀 Server is running on http://localhost:5000"

#### 2.2. Chạy Frontend

**Cách 1: Dùng XAMPP (Khuyến nghị)**
```bash
# Copy toàn bộ thư mục frontEnd vào htdocs của XAMPP
# Ví dụ: C:\xampp\htdocs\himath\

# Sau đó mở browser:
http://localhost/himath/
```

**Cách 2: Dùng http-server**
```bash
# Mở terminal mới trong thư mục frontEnd
cd frontEnd
npx http-server -p 3000
```
✅ Mở browser: http://localhost:3000

**Cách 3: Dùng Live Server (VS Code)**
- Cài extension "Live Server" trong VS Code
- Right-click vào `frontEnd/index.html`
- Chọn "Open with Live Server"

## 🎮 Test ngay

1. **Mở browser**: 
   - Nếu dùng XAMPP: `http://localhost/himath/`
   - Nếu dùng http-server: `http://localhost:3000`

2. **Login**: 
   - Click vào icon user (góc phải trên)
   - Username: `hocsinh`
   - Password: `123`
   - Click "Đăng nhập"

3. **Chơi game**: 
   - Menu bên trái → "Học chữ số" → "Học số"
   - Dùng nút Next/Prev hoặc click số 0-9
   - Click "Phát âm" để nghe (nếu có audio)
   - Click "✅ Hoàn thành" → Xem điểm và sao

## 🧪 Test API với phpMyAdmin

### Kiểm tra Database đã có dữ liệu
1. Mở phpMyAdmin: http://localhost/phpmyadmin
2. Click database `ktpmud`
3. Click bảng `game_levels`
4. ✅ Phải thấy 13 records

### Kiểm tra sau khi chơi game
1. Chơi game và hoàn thành
2. Vào phpMyAdmin → database `ktpmud`
3. Click bảng `game_results`
4. ✅ Phải thấy record mới với điểm số và số sao

## 🧪 Test API với Dashboard

Mở file: `api-test.html` trong browser
- Click "Test Health Check" → Phải màu xanh ✅
- Click "Test Login" → Phải màu xanh ✅
- Click "Học Số" → Phải thấy 4 levels ✅
- Click "Save Game Result" → Phải màu xanh ✅

## ⚠️ Lỗi thường gặp với XAMPP

### 1. MySQL không start được
**Nguyên nhân**: Port 3306 bị chiếm bởi MySQL khác
**Giải pháp**:
- Mở XAMPP Control Panel
- Click "Config" bên cạnh MySQL
- Chọn "my.ini"
- Tìm dòng `port=3306` đổi thành `port=3307`
- Lưu file và restart MySQL
- **Nhớ sửa file `.env`**: `DB_PORT=3307`

### 2. Apache không start được
**Nguyên nhân**: Port 80 bị chiếm (thường là Skype hoặc IIS)
**Giải pháp**:
- Tắt Skype hoặc IIS
- Hoặc đổi port Apache: Config → httpd.conf → `Listen 8080`
- Truy cập: `http://localhost:8080/himath/`

### 3. Backend không kết nối database
**Kiểm tra**:
```bash
# Test kết nối MySQL
mysql -u root -p -h localhost
# Nhấn Enter (không nhập password nếu XAMPP mặc định)

# Nếu kết nối được, kiểm tra database
SHOW DATABASES;
# Phải thấy 'ktpmud' trong danh sách
```

### 4. Frontend lỗi CORS
**Nguyên nhân**: Backend chưa chạy hoặc sai port
**Giải pháp**:
- Kiểm tra backend đang chạy: `curl http://localhost:5000/health`
- Kiểm tra `CORS_ORIGIN` trong `.env` khớp với URL frontend

### 5. Không lưu được kết quả game
**Nguyên nhân**: Chưa login hoặc token hết hạn
**Giải pháp**:
- Đăng nhập lại
- Mở Console (F12) → Application → Local Storage
- Kiểm tra có `hm_is_authed` và `STUDENT_ID` không

## 📊 Cấu trúc XAMPP

```
C:\xampp\
├── htdocs\
│   └── himath\              ← Copy thư mục frontEnd vào đây
│       ├── index.html
│       ├── main.js
│       ├── assets\
│       └── panels\
│
├── mysql\
│   └── data\
│       └── ktpmud\          ← Database của bạn
│
└── phpMyAdmin\              ← Quản lý database
```

## 🎯 Checklist nhanh

- [ ] XAMPP đã cài đặt
- [ ] Apache đang chạy (màu xanh)
- [ ] MySQL đang chạy (màu xanh)
- [ ] Database `ktpmud` đã tạo
- [ ] File `database.sql` đã import
- [ ] File `.env` đã cấu hình (DB_PASSWORD để trống)
- [ ] Đã chạy `npm install`
- [ ] Đã chạy `npm run seed:games` (13 levels)
- [ ] Backend đang chạy (`npm run dev`)
- [ ] Frontend accessible (XAMPP hoặc http-server)
- [ ] Đã test login thành công
- [ ] Đã test chơi game thành công

## 📚 Đọc thêm

- **Quick**: `SUMMARY.md` - Tóm tắt ngắn
- **Detail**: `README_FIX.md` - Chi tiết đầy đủ
- **Check**: `CHECKLIST.md` - 150+ verification points
- **Report**: `FINAL_REPORT.md` - Báo cáo hoàn chỉnh

## 🎉 DONE!

**Status**: ✅ READY TO USE với XAMPP
**Time to setup**: ~2 minutes
**All bugs**: FIXED ✅

---

**Lưu ý đặc biệt cho XAMPP**:
- MySQL password mặc định: **TRỐNG** (không có password)
- phpMyAdmin: http://localhost/phpmyadmin
- Frontend với XAMPP: http://localhost/himath/
- Backend luôn chạy: http://localhost:5000

Made with ❤️ | Last update: 2025-12-24

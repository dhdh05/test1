# 🔧 FIX: Tạo Database trên TiDB Cloud

## ⚠️ Vấn đề

Database `ktpmud` chưa tồn tại trên TiDB Cloud. Cần tạo database trước khi seed.

---

## ✅ Giải pháp

### Option 1: Sử dụng database mặc định `test`

Cách dễ nhất: Dùng database `test` có sẵn

#### Cập nhật `.env`:
```env
DB_NAME=test
```

Thay vì `ktpmud`, dùng `test`

### Option 2: Tạo database `ktpmud` trên TiDB Cloud

#### Bước 1: Kết nối với TiDB Cloud
```bash
mysql -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com \
  -P 4000 \
  -u MdXQpVvKQim1SCY.root \
  -p \
  --ssl-mode=REQUIRED
```

Nhập password: `Swl0KcLpFiBrgnxX`

#### Bước 2: Tạo database
```sql
CREATE DATABASE ktpmud;
USE ktpmud;
```

#### Bước 3: Verify
```sql
SHOW DATABASES;
```

---

## 🚀 KHUYẾN NGHỊ: Dùng database `test`

Để đơn giản, hãy dùng database `test` có sẵn:

### 1. Cập nhật `.env`:
```env
NODE_ENV=development
PORT=5000

DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=MdXQpVvKQim1SCY.root
DB_PASSWORD=Swl0KcLpFiBrgnxX
DB_NAME=test
DB_SSL=true

JWT_SECRET=himath-super-secret-key-2024-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### 2. Seed database:
```bash
npm run seed
npm run seed:games
```

### 3. Cập nhật Render Environment Variables:
```
DB_NAME=test
```

---

## 🧪 Test

Sau khi cập nhật:

```bash
# Test connection
npm start

# Nếu OK, seed data
npm run seed
npm run seed:games
```

---

## ✅ Checklist

- [ ] Cập nhật `DB_NAME=test` trong `.env`
- [ ] Test connection với `npm start`
- [ ] Seed database
- [ ] Commit và push code
- [ ] Cập nhật Render environment variables
- [ ] Redeploy trên Render

---

**Khuyến nghị: Dùng database `test` cho đơn giản! 🚀**

*Fix Guide - 24/12/2024*

# 🎯 TiDB Cloud - Hướng dẫn chi tiết

## 🌟 Tại sao chọn TiDB Cloud?

- ✅ **Miễn phí mãi mãi** - Free tier không hết hạn
- ✅ **MySQL compatible** - Không cần thay đổi code
- ✅ **5GB storage** - Đủ cho project
- ✅ **Không cần credit card** - Đăng ký dễ dàng
- ✅ **Auto-scale** - Serverless, tự động mở rộng
- ✅ **99.9% uptime** - Độ tin cậy cao

---

## 📋 Bước 1: Đăng ký TiDB Cloud

### 1.1 Truy cập và đăng ký
1. Mở: https://tidbcloud.com
2. Click **Sign Up** hoặc **Start Free**
3. Chọn một trong các cách:
   - **Sign up with GitHub** (Khuyến nghị)
   - **Sign up with Google**
   - **Sign up with Email**

### 1.2 Xác thực email
- Nếu dùng email, check inbox và verify
- Nếu dùng GitHub/Google, tự động verify

---

## 🗄️ Bước 2: Tạo Cluster

### 2.1 Tạo Serverless Cluster (Free)
1. Sau khi đăng nhập → Dashboard
2. Click **Create Cluster**
3. Chọn **Serverless** (Free tier)
   - **Dedicated** là trả phí, đừng chọn!

### 2.2 Cấu hình Cluster
1. **Cluster Name:** `himath-db` (hoặc tên bạn thích)
2. **Cloud Provider:** AWS (mặc định)
3. **Region:** Chọn gần bạn nhất:
   - `ap-southeast-1` (Singapore) - Khuyến nghị cho VN
   - `ap-northeast-1` (Tokyo)
   - `us-west-2` (Oregon)
4. Click **Create**

### 2.3 Đợi cluster khởi tạo
- Mất khoảng 1-2 phút
- Status sẽ chuyển từ "Creating" → "Available"

---

## 🔌 Bước 3: Lấy Connection String

### 3.1 Mở Connection Dialog
1. Click vào cluster name `himath-db`
2. Click nút **Connect** (góc trên bên phải)

### 3.2 Tạo Password (Lần đầu)
Nếu chưa có password:
1. Click **Generate Password**
2. **LƯU PASSWORD NGAY!** - Chỉ hiện 1 lần
3. Copy và lưu vào notepad

### 3.3 Copy Connection Info
Trong tab **General**, bạn sẽ thấy:

```
Host: gateway01.ap-southeast-1.prod.aws.tidbcloud.com
Port: 4000
User: 2aXXXXXXX.root (username của bạn)
Password: ********** (password vừa tạo)
Database: test
```

**Quan trọng:** 
- ✅ Tick vào "**Include password in connection string**"
- ✅ Copy toàn bộ thông tin

---

## ⚙️ Bước 4: Cấu hình Backend

### 4.1 Cho Local Development
Tạo/cập nhật file `backEnd/.env`:

```env
NODE_ENV=development
PORT=5000

# TiDB Cloud Connection
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=2aXXXXXXX.root
DB_PASSWORD=your-password-here
DB_NAME=test
DB_SSL=true

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 4.2 Cho Production (Render)
Trong Render Environment Variables:

```
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=2aXXXXXXX.root
DB_PASSWORD=your-password-here
DB_NAME=test
DB_SSL=true
```

---

## 🧪 Bước 5: Test Connection

### 5.1 Test từ Local
```bash
cd backEnd
npm start
```

Nếu thấy:
```
✅ Database connected successfully
🚀 Server running on port 5000
```
→ Kết nối thành công!

### 5.2 Test bằng MySQL Client
```bash
mysql -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com \
  -P 4000 \
  -u 2aXXXXXXX.root \
  -p test \
  --ssl-mode=REQUIRED
```

---

## 📊 Bước 6: Seed Database

### 6.1 Seed từ Local
```bash
cd backEnd
npm run seed
npm run seed:games
```

### 6.2 Seed từ Render Shell
1. Deploy backend lên Render trước
2. Vào backend service → **Shell** tab
3. Chạy:
```bash
npm run seed
npm run seed:games
```

---

## 🔍 Bước 7: Quản lý Database

### 7.1 Xem Tables
1. Trong TiDB Dashboard → Click cluster
2. Tab **SQL Editor**
3. Chạy query:
```sql
SHOW TABLES;
```

### 7.2 Xem Data
```sql
SELECT * FROM students LIMIT 10;
SELECT * FROM game_levels;
SELECT * FROM game_results;
```

### 7.3 Backup Data
```bash
# Export toàn bộ database
mysqldump -h gateway01.ap-southeast-1.prod.aws.tidbcloud.com \
  -P 4000 \
  -u 2aXXXXXXX.root \
  -p test \
  --ssl-mode=REQUIRED > backup.sql
```

---

## 📈 Monitoring & Limits

### Free Tier Limits:
- **Storage:** 5 GB
- **Compute:** Serverless (auto-scale)
- **Row-based Storage:** 50 million rows
- **Requests:** Unlimited
- **Bandwidth:** Unlimited

### Monitor Usage:
1. Dashboard → Cluster → **Monitoring** tab
2. Xem:
   - Storage usage
   - Request count
   - Query performance

---

## 🔧 Troubleshooting

### Connection timeout?
- Kiểm tra internet connection
- Verify host và port đúng
- Đảm bảo `DB_SSL=true`

### Authentication failed?
- Kiểm tra username format: `2aXXXXXXX.root`
- Verify password đúng
- Thử generate password mới

### SSL error?
- Đảm bảo đã set `DB_SSL=true`
- Check dialectOptions trong database.js
- Update Sequelize nếu cần

### Database not found?
- Default database là `test`
- Có thể tạo database mới:
```sql
CREATE DATABASE himath;
USE himath;
```

---

## 💡 Tips & Best Practices

### 1. Security
- ✅ Không commit password vào Git
- ✅ Dùng environment variables
- ✅ Rotate password định kỳ

### 2. Performance
- ✅ Sử dụng connection pooling (đã config)
- ✅ Index các columns thường query
- ✅ Monitor slow queries

### 3. Backup
- ✅ TiDB tự động backup
- ✅ Export manual backup thường xuyên
- ✅ Test restore process

### 4. Cost Management
- ✅ Monitor usage trong Dashboard
- ✅ Free tier đủ cho development
- ✅ Upgrade khi cần scale

---

## 🆚 So sánh với các giải pháp khác

| Feature | TiDB Cloud | Railway | PlanetScale |
|---------|-----------|---------|-------------|
| Free Tier | ✅ Forever | ❌ Limited | ✅ Yes |
| Storage | 5GB | 1GB | 5GB |
| Credit Card | ❌ No | ✅ Yes | ❌ No |
| MySQL Compatible | ✅ Yes | ✅ Yes | ✅ Yes |
| Auto-scale | ✅ Yes | ❌ No | ✅ Yes |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**TiDB Cloud là lựa chọn tốt nhất cho project này!** 🏆

---

## 📞 Support

### TiDB Cloud Resources:
- 📖 Docs: https://docs.pingcap.com/tidbcloud
- 💬 Community: https://ask.pingcap.com
- 🐛 GitHub: https://github.com/pingcap/tidb

### Nếu gặp vấn đề:
1. Check TiDB Cloud status page
2. Xem logs trong Render
3. Test connection từ local
4. Verify environment variables

---

**Chúc bạn setup thành công với TiDB Cloud! 🚀**

*Created: 24/12/2024*  
*By: Antigravity AI Assistant*

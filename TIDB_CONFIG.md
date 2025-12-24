# 🔧 CẤU HÌNH TIDB CLOUD - COPY VÀO FILE .env

## Bước 1: Tạo file .env

Trong thư mục `backEnd`, tạo file mới tên `.env` và paste nội dung sau:

```env
# Environment Configuration - Hi Math Backend
# TiDB Cloud Production Configuration

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000

# TiDB Cloud Database Configuration
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=MdXQpVvKQim1SCY.root
DB_PASSWORD=Swl0KcLpFiBrgnxX
DB_NAME=ktpmud
DB_SSL=true

# JWT Configuration
JWT_SECRET=himath-super-secret-key-2024-production
JWT_EXPIRES_IN=7d

# CORS Configuration
# For local development
FRONTEND_URL=http://localhost:3000

# For production (update after deploying frontend)
# FRONTEND_URL=https://hi-math-frontend.onrender.com
```

## Bước 2: Tạo file .env bằng lệnh

### Windows (PowerShell):
```powershell
cd backEnd

# Tạo file .env
@"
NODE_ENV=development
PORT=5000

DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=MdXQpVvKQim1SCY.root
DB_PASSWORD=Swl0KcLpFiBrgnxX
DB_NAME=ktpmud
DB_SSL=true

JWT_SECRET=himath-super-secret-key-2024-production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding UTF8
```

### Hoặc copy từ example:
```powershell
cd backEnd
Copy-Item .env.example .env
# Sau đó edit .env và paste config trên
```

## Bước 3: Verify file đã tạo

```powershell
# Kiểm tra file tồn tại
Test-Path .env

# Xem nội dung
Get-Content .env
```

## Bước 4: Restart server

```powershell
# Stop server hiện tại (Ctrl+C)
# Sau đó start lại:
npm start
```

## ✅ Kết quả mong đợi

Khi chạy `npm start`, bạn sẽ thấy:

```
✅ Database connected successfully
Database: ktpmud
Host: gateway01.ap-southeast-1.prod.aws.tidbcloud.com
🚀 Server running on port 5000
📊 Health check: http://localhost:5000/api/health
```

## 🔧 Nếu gặp lỗi

### Error: "getaddrinfo ENOTFOUND"
- Kiểm tra internet connection
- Verify DB_HOST đúng

### Error: "Access denied"
- Kiểm tra DB_USER và DB_PASSWORD
- Verify username format: `MdXQpVvKQim1SCY.root`

### Error: "SSL connection error"
- Đảm bảo `DB_SSL=true`
- Check database.js đã có SSL config

## 📋 Environment Variables cho Render

Khi deploy lên Render, thêm các biến sau:

```
NODE_ENV=production
PORT=5000
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=MdXQpVvKQim1SCY.root
DB_PASSWORD=Swl0KcLpFiBrgnxX
DB_NAME=ktpmud
DB_SSL=true
JWT_SECRET=himath-super-secret-key-2024-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=<your-frontend-url-after-deploy>
```

---

**LƯU Ý BẢO MẬT:**
- ⚠️ KHÔNG commit file `.env` lên Git
- ⚠️ KHÔNG share password công khai
- ✅ File `.env` đã được thêm vào `.gitignore`

---

*Created: 24/12/2024*  
*TiDB Cloud Configuration*

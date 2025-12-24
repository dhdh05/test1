# Hi Math - Hướng dẫn sửa lỗi và chạy dự án

## Tổng quan các vấn đề đã sửa

### 1. **Backend Logic Issues** ✅
- **Vấn đề**: Model `Student` sử dụng `user_id` làm primary key, nhưng code đang tìm kiếm bằng `student_id`
- **Giải pháp**: Đã sửa tất cả các controller để sử dụng `user_id` thay vì `student_id`
- **Files đã sửa**:
  - `backEnd/controllers/gameController.js` - Sửa `Student.findByPk()` thành `Student.findOne({ where: { user_id: studentId } })`
  - `backEnd/controllers/authController.js` - Sửa response để trả về `user_id` đúng cách

### 2. **Database Issues** ✅
- **Vấn đề**: Bảng `game_levels` chưa có dữ liệu mẫu
- **Giải pháp**: Tạo script seed để thêm dữ liệu mẫu cho các game levels
- **Files đã tạo**:
  - `backEnd/scripts/seedGameLevels.js` - Script để seed dữ liệu game levels
  - Đã thêm script `seed:games` vào `package.json`

### 3. **Frontend-Backend Integration** ✅
- **Vấn đề**: Frontend sử dụng constants khác với main.js
- **Giải pháp**: Đã cập nhật constants trong panel.js để khớp với main.js
- **Files đã sửa**:
  - `frontEnd/panels/hoc-so/panel.js` - Cập nhật AUTH_KEY và STUDENT_ID constants

### 4. **Model Associations** ✅
- **Vấn đề**: Các include statements trong controller tìm kiếm fields không tồn tại
- **Giải pháp**: Đã xóa các include statements không hợp lệ
- **Files đã sửa**:
  - `backEnd/controllers/gameController.js` - Xóa include Student với full_name attribute

## Hướng dẫn chạy dự án

### Bước 1: Cài đặt dependencies

```bash
# Backend
cd backEnd
npm install

# Frontend (nếu cần)
cd ../frontEnd
# Frontend không cần npm install vì chỉ dùng vanilla JS
```

### Bước 2: Cấu hình database

1. Tạo database MySQL:
```sql
CREATE DATABASE ktpmud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import database schema:
```bash
# Trong thư mục backEnd
mysql -u root -p ktpmud < database.sql
```

3. Cấu hình file `.env`:
```bash
# Copy file .env.example thành .env
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ktpmud
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### Bước 3: Seed dữ liệu game levels

```bash
cd backEnd
npm run seed:games
```

Kết quả mong đợi:
```
✅ Database connected
🗑️  Cleared existing game levels
✅ Seeded 13 game levels
```

### Bước 4: Chạy backend server

```bash
cd backEnd
npm run dev
```

Kết quả mong đợi:
```
✅ Database connection has been established successfully.
✅ Database synchronized.
🚀 Server is running on http://localhost:5000
📊 Health check: http://localhost:5000/health
```

### Bước 5: Chạy frontend

Mở file `frontEnd/index.html` bằng Live Server hoặc web server khác.

**Lưu ý**: Không thể mở trực tiếp file HTML vì sẽ gặp lỗi CORS. Cần dùng web server.

#### Sử dụng VS Code Live Server:
1. Cài extension "Live Server"
2. Right-click vào `index.html`
3. Chọn "Open with Live Server"

#### Hoặc sử dụng Python:
```bash
cd frontEnd
python -m http.server 3000
```

#### Hoặc sử dụng Node.js http-server:
```bash
npx http-server frontEnd -p 3000
```

### Bước 6: Kiểm tra kết nối

1. Mở trình duyệt tại `http://localhost:3000`
2. Click vào "Đăng ký" để tạo tài khoản mới
3. Đăng nhập với tài khoản vừa tạo
4. Thử chơi game "Học số" để kiểm tra API

## API Endpoints chính

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần token)

### Game
- `GET /api/games/levels/:gameType` - Lấy danh sách levels của game
- `POST /api/games/result` - Lưu kết quả chơi game (cần token)
- `GET /api/games/progress/:studentId` - Lấy tiến độ của học sinh (cần token)
- `GET /api/games/results/:studentId` - Lấy lịch sử kết quả (cần token)
- `GET /api/games/achievements/:studentId` - Lấy thành tích (cần token)

## Kiểm tra API bằng cURL

### 1. Đăng ký tài khoản:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "full_name": "Test User",
    "role": "student"
  }'
```

### 2. Đăng nhập:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

### 3. Lấy game levels:
```bash
curl http://localhost:5000/api/games/levels/hoc-so
```

### 4. Lưu kết quả game (cần token từ login):
```bash
curl -X POST http://localhost:5000/api/games/result \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "studentId": 1,
    "levelId": 1,
    "score": 85,
    "timeSpent": 120
  }'
```

## Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra thông tin trong file `.env`
- Kiểm tra database `ktpmud` đã được tạo chưa

### Lỗi: "CORS policy"
- Đảm bảo backend đang chạy trên port 5000
- Đảm bảo frontend đang chạy qua web server (không mở trực tiếp file HTML)
- Kiểm tra `CORS_ORIGIN` trong file `.env`

### Lỗi: "Invalid credentials"
- Kiểm tra username và password đã đúng chưa
- Kiểm tra user đã được tạo trong database chưa

### Lỗi: "Token expired"
- Đăng nhập lại để lấy token mới
- Token có thời hạn 7 ngày (cấu hình trong `JWT_EXPIRE`)

## Cấu trúc Database quan trọng

### Bảng `users`
- `user_id` (PK) - ID người dùng
- `username` - Tên đăng nhập
- `password` - Mật khẩu (đã hash)
- `full_name` - Họ tên
- `role` - Vai trò (student, teacher, parent, admin)

### Bảng `students`
- `user_id` (PK, FK) - ID người dùng (cũng là student ID)
- `total_stars` - Tổng số sao
- `current_level` - Level hiện tại

### Bảng `game_levels`
- `level_id` (PK) - ID level
- `game_type` - Loại game (hoc-so, ghep-so, chan-le, so-sanh, xep-so)
- `level_number` - Số thứ tự level
- `title` - Tiêu đề
- `config` - Cấu hình game (JSON)

### Bảng `game_results`
- `result_id` (PK) - ID kết quả
- `student_id` (FK) - ID học sinh
- `level_id` (FK) - ID level
- `score` - Điểm số (0-100)
- `stars` - Số sao (0-3)
- `is_passed` - Đã vượt qua chưa

### Bảng `student_game_progress`
- `progress_id` (PK) - ID tiến độ
- `student_id` (FK) - ID học sinh
- `game_type` - Loại game
- `current_level` - Level hiện tại
- `highest_level_passed` - Level cao nhất đã vượt qua
- `total_stars` - Tổng số sao

## Lưu ý quan trọng

1. **Student ID = User ID**: Trong hệ thống này, `student_id` chính là `user_id`. Không có field `student_id` riêng.

2. **Authentication**: Hầu hết các API game đều cần token. Lưu token sau khi login và gửi kèm trong header `Authorization: Bearer <token>`.

3. **CORS**: Backend đã cấu hình CORS cho `http://localhost:3000`. Nếu chạy frontend trên port khác, cần cập nhật `CORS_ORIGIN` trong `.env`.

4. **Database Schema**: File `database.sql` chứa schema đầy đủ. Nếu cần reset database, chỉ cần drop và import lại.

5. **Game Levels**: Sau khi seed, sẽ có 13 game levels cho 5 loại game khác nhau.

## Tính năng đã hoàn thiện

✅ Đăng ký / Đăng nhập
✅ Lưu kết quả game
✅ Tính toán số sao dựa trên điểm và thời gian
✅ Theo dõi tiến độ học sinh
✅ Hệ thống thành tích (achievements)
✅ Bảng xếp hạng
✅ Game "Học số" với UI hoàn chỉnh

## Các bảng database không sử dụng (có thể xóa nếu cần)

Các bảng sau được tạo nhưng chưa được sử dụng trong phiên bản hiện tại:
- `logs` - Ghi log hệ thống
- `exercises` - Bài tập
- `lessons` - Bài học
- `tests` - Bài kiểm tra
- `test_exercises` - Liên kết test-exercise
- `test_results` - Kết quả kiểm tra
- `progress_tracking` - Theo dõi tiến độ bài học
- `rewards` - Phần thưởng
- `parent_notifications` - Thông báo cho phụ huynh
- `completed_levels` - Level đã hoàn thành (cũ)
- `game_progress` - Tiến độ game (cũ, đã thay bằng student_game_progress)

Nếu muốn giữ database gọn nhẹ, có thể xóa các bảng này. Tuy nhiên, chúng có thể hữu ích cho các tính năng mở rộng sau này.

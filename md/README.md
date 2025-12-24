# 🎮 Hi Math - Nền tảng học toán tương tác cho trẻ em

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 Giới thiệu

**Hi Math** là một nền tảng học toán tương tác được thiết kế đặc biệt cho trẻ em. Ứng dụng kết hợp giữa học tập và giải trí, giúp trẻ học toán một cách vui vẻ và hiệu quả.

### ✨ Tính năng chính

- 🔢 **Học số**: Nhận biết và học các số từ 0-9 với hình ảnh và âm thanh
- 🧩 **Ghép số**: Kéo thả các số để ghép với số lượng hình ảnh tương ứng
- ⚖️ **Chẵn lẻ**: Phân loại các số chẵn và lẻ
- ⚡ **So sánh**: So sánh số lớn hơn, nhỏ hơn hoặc bằng
- 📊 **Xếp số**: Sắp xếp các số theo thứ tự tăng/giảm dần

### 🎯 Hệ thống game

- **13 levels** trải dài 5 loại game khác nhau
- **Hệ thống sao** (0-3 sao) dựa trên điểm số và thời gian
- **Theo dõi tiến độ** tự động cho từng học sinh
- **Thành tích** tự động unlock khi đạt milestone
- **Bảng xếp hạng** để tạo động lực học tập

## 🚀 Quick Start

### Yêu cầu hệ thống

- Node.js >= 14.x
- MySQL/MariaDB >= 5.7
- Web browser hiện đại (Chrome, Firefox, Edge)

### Cài đặt

```bash
# 1. Clone repository
git clone https://github.com/yourusername/Hi_Math.git
cd Hi_Math

# 2. Cài đặt dependencies cho backend
cd backEnd
npm install

# 3. Cấu hình database
cp .env.example .env
# Chỉnh sửa file .env với thông tin database của bạn

# 4. Tạo database
mysql -u root -p
CREATE DATABASE ktpmud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 5. Import schema
mysql -u root -p ktpmud < database.sql

# 6. Seed dữ liệu game levels
npm run seed:games

# 7. Chạy backend server
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### Chạy Frontend

```bash
# Mở terminal mới
cd frontEnd

# Sử dụng Live Server (VS Code extension)
# Hoặc sử dụng http-server:
npx http-server -p 3000
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📚 Documentation

- 📄 [**SUMMARY.md**](SUMMARY.md) - Tóm tắt các vấn đề đã sửa
- 📘 [**README_FIX.md**](README_FIX.md) - Hướng dẫn chi tiết sửa lỗi
- 📗 [**FRONTEND_IMPROVEMENTS.md**](FRONTEND_IMPROVEMENTS.md) - Hướng dẫn cải thiện frontend
- 📕 [**FINAL_REPORT.md**](FINAL_REPORT.md) - Báo cáo hoàn chỉnh

## 🧪 Testing

### Test API với Dashboard

Mở file `api-test.html` trong trình duyệt để test tất cả API endpoints với giao diện đẹp.

### Test bằng cURL

```bash
# Health check
curl http://localhost:5000/health

# Get game levels
curl http://localhost:5000/api/games/levels/hoc-so

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hocsinh","password":"123"}'
```

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐
│   Frontend      │
│  (Vanilla JS)   │
└────────┬────────┘
         │ HTTP/HTTPS
         ↓
┌─────────────────┐
│   Backend       │
│  (Express.js)   │
└────────┬────────┘
         │ Sequelize ORM
         ↓
┌─────────────────┐
│   Database      │
│ (MySQL/MariaDB) │
└─────────────────┘
```

### Tech Stack

#### Backend
- **Framework**: Express.js
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcrypt
- **CORS**: cors middleware
- **Environment**: dotenv

#### Frontend
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Nunito)

#### Database
- **DBMS**: MySQL/MariaDB
- **Charset**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

## 📊 Database Schema

### Core Tables

#### users
Lưu thông tin người dùng
- `user_id` (PK)
- `username`, `password`, `full_name`
- `role` (admin, teacher, student, parent)
- `email`, `phone`

#### students
Lưu thông tin học sinh (extends users)
- `user_id` (PK, FK)
- `total_stars`, `current_level`
- `parent_id`, `teacher_id`

#### game_levels
Lưu cấu hình các level game
- `level_id` (PK)
- `game_type`, `level_number`
- `title`, `description`
- `difficulty`, `time_limit`, `required_score`
- `config` (JSON)

#### game_results
Lưu kết quả chơi game
- `result_id` (PK)
- `student_id` (FK), `level_id` (FK)
- `score`, `stars`, `time_spent`
- `is_passed`

#### student_game_progress
Theo dõi tiến độ học sinh
- `progress_id` (PK)
- `student_id` (FK), `game_type`
- `current_level`, `highest_level_passed`
- `total_stars`, `total_attempts`

#### game_achievements
Lưu thành tích
- `achievement_id` (PK)
- `student_id` (FK)
- `achievement_type`, `title`, `description`

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register     - Đăng ký tài khoản
POST   /api/auth/login        - Đăng nhập
GET    /api/auth/me           - Lấy thông tin user (protected)
```

### Game Levels
```
GET    /api/games/levels/:gameType    - Lấy danh sách levels
GET    /api/games/level/:levelId      - Lấy chi tiết level
```

### Game Results
```
POST   /api/games/result                      - Lưu kết quả (protected)
GET    /api/games/progress/:studentId         - Lấy tiến độ (protected)
GET    /api/games/results/:studentId          - Lấy lịch sử (protected)
GET    /api/games/achievements/:studentId     - Lấy thành tích (protected)
GET    /api/games/stats/:studentId            - Lấy thống kê (protected)
GET    /api/games/leaderboard/:gameType       - Bảng xếp hạng
```

## 🎮 Game Types

| Game Type | Levels | Description |
|-----------|--------|-------------|
| `hoc-so` | 4 | Học nhận biết số từ 0-9 |
| `ghep-so` | 3 | Ghép số với hình ảnh |
| `chan-le` | 2 | Phân loại số chẵn lẻ |
| `so-sanh` | 2 | So sánh số |
| `xep-so` | 2 | Sắp xếp số |

**Tổng: 13 levels**

## 🌟 Tính năng nổi bật

### Hệ thống sao
Số sao được tính dựa trên:
- **Điểm số**: 
  - 100% = 3 sao
  - 80-99% = 2 sao
  - 60-79% = 1 sao
  - < 60% = 0 sao
- **Thời gian**: Bonus +1 sao nếu hoàn thành < 50% thời gian
- **Số lần thử**: Penalty -1 sao nếu thử > 2 lần

### Hệ thống thành tích
Tự động unlock khi:
- 🎯 **First Play**: Chơi lần đầu
- 💯 **Perfect Score**: Đạt 100 điểm
- 🏆 **Level Master**: Đạt 3 sao ở 3 level
- 🔥 **Streak 5**: Vượt qua 5 level liên tiếp
- ⚡ **Speedrun**: Hoàn thành nhanh

### Theo dõi tiến độ
- Level hiện tại
- Level cao nhất đã vượt qua
- Tổng số sao
- Tổng số lần chơi
- Thời gian chơi gần nhất

## 🔐 Security

- ✅ Password hashing với bcrypt (10 rounds)
- ✅ JWT authentication (7 days expiry)
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection

## 🐛 Troubleshooting

### Backend không kết nối được database
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra file .env
cat .env

# Kiểm tra database đã tạo chưa
mysql -u root -p -e "SHOW DATABASES;"
```

### Frontend gặp lỗi CORS
```bash
# Đảm bảo backend đang chạy
curl http://localhost:5000/health

# Đảm bảo CORS_ORIGIN trong .env đúng
CORS_ORIGIN=http://localhost:3000
```

### Không lưu được kết quả game
```bash
# Kiểm tra đã login chưa
# Kiểm tra token trong localStorage
# Kiểm tra student_id trong localStorage
```

## 📝 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ktpmud

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Original Team** - Initial work
- **AI Assistant** - Bug fixes and improvements (2025-12-24)

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- Pixabay for images
- All contributors and testers

## 📞 Contact

- **Facebook**: [Phan Công Trung](https://www.facebook.com/trung28102005/)
- **Project Link**: [GitHub Repository](https://github.com/yourusername/Hi_Math)

---

**Made with ❤️ for children learning math**

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2025-12-24

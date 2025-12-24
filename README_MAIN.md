# 🎓 Hi Math - Interactive Math Learning Platform

> Nền tảng học toán tương tác cho trẻ em với games, theo dõi tiến độ và bảng xếp hạng

[![Status](https://img.shields.io/badge/status-ready%20to%20deploy-success)](.)
[![License](https://img.shields.io/badge/license-MIT-blue)](.)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](.)

---

## 🎯 Tổng quan

**Hi Math** là một ứng dụng web học toán tương tác được thiết kế cho trẻ em, kết hợp:
- 🎮 **5 Mini Games** - Học số, Ghép số, Chẵn lẻ, So sánh, Xếp số
- 📊 **Theo dõi tiến độ** - Thống kê chi tiết, lịch sử chơi
- 🏆 **Hệ thống thành tích** - Động lực học tập
- 🥇 **Bảng xếp hạng** - Cạnh tranh lành mạnh
- ⭐ **Hệ thống sao** - Đánh giá kết quả

---

## ✨ Tính năng

### 🎮 Games
- **Học Số** - Làm quen với các chữ số
- **Ghép Số** - Ghép số thành cặp
- **Chẵn Lẻ** - Phân biệt số chẵn lẻ
- **So Sánh** - So sánh lớn nhỏ
- **Xếp Số** - Sắp xếp số theo thứ tự

### 📊 Progress Tracking
- Thống kê tổng quan
- Tiến độ từng game
- Lịch sử 10 lượt chơi gần nhất
- Hệ thống thành tích

### 🏆 Leaderboard
- Bảng xếp hạng tổng thể
- Bảng xếp hạng tuần
- Bảng xếp hạng tháng
- Highlight vị trí của bạn

---

## 🚀 Quick Start

### 📖 Chạy Local

#### 1. Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/hi-math.git
cd hi-math
```

#### 2. Setup Database (XAMPP)
```bash
# Xem hướng dẫn chi tiết:
md/QUICKSTART_XAMPP.md
```

#### 3. Setup Backend
```bash
cd backEnd
npm install
npm run seed
npm run seed:games
npm start
```

#### 4. Open Frontend
```bash
# Mở file trong browser:
frontEnd/index.html
```

### 🌐 Deploy lên Cloud

#### ⚡ Deploy nhanh (10 phút)
```bash
# Đọc file này:
START_HERE_DEPLOY.md
```

Hoặc xem hướng dẫn chi tiết:
- 📖 `DEPLOY_NHANH.md` - Tiếng Việt, step-by-step
- 📖 `md/DEPLOY_GUIDE.md` - English, detailed guide

---

## 🏗️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Modular panel architecture
- Responsive design
- No framework dependencies

### Backend
- Node.js + Express
- JWT Authentication
- RESTful API
- Sequelize ORM

### Database
- MySQL
- Structured schema
- Seeded sample data

---

## 📁 Project Structure

```
Hi_Math-main/
├── frontEnd/              # Frontend application
│   ├── index.html        # Main HTML
│   ├── main.js           # Router & navigation
│   ├── config.js         # API configuration
│   ├── panels/           # Game panels
│   │   ├── game-selection/
│   │   ├── game-levels/
│   │   ├── progress/
│   │   └── leaderboard/
│   └── assets/           # CSS, images
│
├── backEnd/              # Backend API
│   ├── server.js         # Express server
│   ├── routes/           # API routes
│   ├── controllers/      # Business logic
│   ├── models/           # Database models
│   └── scripts/          # Seed scripts
│
└── md/                   # Documentation
    ├── DEPLOY_GUIDE.md
    ├── FRONTEND_COMPLETED.md
    └── ...
```

---

## 📚 Documentation

### 🚀 Deployment
- **[START_HERE_DEPLOY.md](START_HERE_DEPLOY.md)** - Bắt đầu deploy
- **[DEPLOY_NHANH.md](DEPLOY_NHANH.md)** - Hướng dẫn nhanh (Tiếng Việt)
- **[md/DEPLOY_GUIDE.md](md/DEPLOY_GUIDE.md)** - Chi tiết đầy đủ

### 💻 Development
- **[md/FRONTEND_COMPLETED.md](md/FRONTEND_COMPLETED.md)** - Frontend features
- **[md/ARCHITECTURE.md](md/ARCHITECTURE.md)** - System architecture
- **[md/QUICKSTART_XAMPP.md](md/QUICKSTART_XAMPP.md)** - Local setup

### ✅ Reference
- **[md/CHECKLIST.md](md/CHECKLIST.md)** - Feature checklist
- **[md/WORK_SUMMARY.md](md/WORK_SUMMARY.md)** - Work summary

---

## 🎮 Usage

### 1. Đăng ký/Đăng nhập
- Click icon user ở góc phải trên
- Đăng ký tài khoản mới hoặc đăng nhập

### 2. Chọn Game
- Click menu "Trò chơi"
- Chọn game muốn chơi
- Xem các levels

### 3. Chơi Game
- Click "Bắt đầu" ở level mong muốn
- Hoàn thành challenges
- Nhận sao dựa trên kết quả

### 4. Xem Tiến độ
- Click menu "Tiến độ"
- Xem thống kê, lịch sử, thành tích

### 5. Bảng Xếp Hạng
- Click menu "Bảng xếp hạng"
- Xem vị trí của bạn
- Cạnh tranh với người chơi khác

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Games
- `GET /api/games/levels/:gameType` - Lấy levels
- `POST /api/games/result` - Lưu kết quả

### Progress
- `GET /api/games/stats/:studentId` - Thống kê
- `GET /api/games/progress/:studentId` - Tiến độ
- `GET /api/games/results/:studentId` - Lịch sử
- `GET /api/games/achievements/:studentId` - Thành tích

### Leaderboard
- `GET /api/games/leaderboard?period=:period` - Bảng xếp hạng

---

## 🧪 Testing

### Test API Endpoints
```bash
# Mở trong browser:
frontEnd/test-panels.html
```

### Manual Testing
1. Test authentication
2. Test game selection
3. Test progress tracking
4. Test leaderboard

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Created with ❤️ by **Phan Công Trung**

- Facebook: [@trung28102005](https://www.facebook.com/trung28102005/)

---

## 🙏 Acknowledgments

- Developed with assistance from **Antigravity AI Assistant**
- Inspired by interactive learning platforms
- Built for children's education

---

## 📞 Support

Nếu gặp vấn đề:
1. Xem [DEPLOY_NHANH.md](DEPLOY_NHANH.md) cho hướng dẫn deploy
2. Xem [md/FRONTEND_COMPLETED.md](md/FRONTEND_COMPLETED.md) cho tính năng
3. Check logs trong browser Console (F12)

---

**⭐ Nếu project hữu ích, hãy cho một star! ⭐**

---

*Last updated: 24/12/2024*

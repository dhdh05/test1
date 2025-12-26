const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000; // Giữ nguyên 3000 nếu bạn đã kill port thành công

app.use(cors());
app.use(bodyParser.json());

// --- KẾT NỐI DATABASE ---
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '', 
    database: 'ktpmud', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// ==========================================
// 🚀 PHẦN SỬA QUAN TRỌNG: AUTHENTICATION
// ==========================================

// 1. Đăng nhập (Sửa đường dẫn thành /api/auth/login để khớp Frontend)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`📡 Login Request: ${username}`); // Log để biết có ai gọi không

    try {
        // Tìm user trong DB
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?', 
            [username, password]
        );

        if (rows.length > 0) {
            const user = rows[0];
            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                token: 'fake-jwt-token-' + user.user_id,
                user: {
                    id: user.user_id, // Map user_id thành id
                    username: user.username,
                    name: user.full_name,
                    role: user.role,
                    avatar: user.avatar_url // Thêm avatar nếu frontend cần
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 2. Đăng ký (Thêm luôn cho đủ bộ /api/auth/register)
app.post('/api/auth/register', async (req, res) => {
    const { username, password, full_name, role } = req.body;
    try {
        // Kiểm tra trùng username
        const [exists] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
        }

        // Thêm user mới
        // Lưu ý: role mặc định là 'student' nếu không gửi lên
        const userRole = role || 'student';
        
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, full_name, role, created_at) VALUES (?, ?, ?, ?, NOW())',
            [username, password, full_name, userRole]
        );

        // Nếu là học sinh, thêm vào bảng students luôn
        if (userRole === 'student') {
             await pool.execute('INSERT INTO students (user_id) VALUES (?)', [result.insertId]);
        }

        res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
    }
});

// ==========================================
// 🎮 PHẦN API GAME (GIỮ NGUYÊN)
// ==========================================

// Lấy danh sách Level
app.get('/api/games/levels/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let dbType = type === 'dino' ? 'dino-math' : type;

        const [rows] = await pool.execute(
            'SELECT * FROM game_levels WHERE game_type = ? ORDER BY level_number ASC',
            [dbType]
        );

        const levels = rows.map(level => {
            if (level.config && typeof level.config === 'string') {
                try {
                    let parsed = JSON.parse(level.config);
                    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                    level.config = parsed;
                } catch (e) { level.config = {}; }
            }
            return level;
        });

        res.json({ success: true, data: levels });
    } catch (error) {
        console.error("Lỗi lấy level:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Lưu kết quả
app.post('/api/games/submit', async (req, res) => {
    try {
        const { student_id, level_id, game_type, score, stars, is_passed, time_spent } = req.body;
        let dbType = game_type === 'dino' ? 'dino-math' : game_type;

        console.log(`📝 Submit: User ${student_id} | Game ${dbType} | Score ${score}`);

        await pool.execute(
            `INSERT INTO game_results (student_id, level_id, game_type, score, stars, is_passed, time_spent, completed_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [student_id, level_id || null, dbType, score, stars, is_passed ? 1 : 0, time_spent || 0]
        );

        res.json({ success: true, message: 'Lưu thành công' });
    } catch (error) {
        console.error("Lỗi lưu điểm:", error);
        res.status(500).json({ success: false, message: 'Lỗi lưu điểm' });
    }
});

// --- API 4: KIỂM TRA MÃ PIN PHỤ HUYNH ---
app.post('/api/parents/verify-pin', async (req, res) => {
    const { student_id, pin } = req.body;
    try {
        // Lấy pin của user
        const [rows] = await pool.execute('SELECT parent_pin FROM users WHERE user_id = ?', [student_id]);
        if (rows.length > 0) {
            const correctPin = rows[0].parent_pin || '1234'; // Mặc định 1234 nếu chưa set
            if (pin === correctPin) {
                res.json({ success: true });
            } else {
                res.status(401).json({ success: false, message: 'Mã PIN không đúng!' });
            }
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API 5: THỐNG KÊ CHO PHỤ HUYNH (Theo ngày) ---
app.get('/api/parents/stats/:student_id', async (req, res) => {
    const { student_id } = req.params;
    try {
        // Query tổng hợp thời gian chơi theo ngày và loại game
        // DATE_FORMAT(completed_at, '%Y-%m-%d') để nhóm theo ngày
        const sql = `
            SELECT 
                DATE_FORMAT(completed_at, '%d/%m/%Y') as play_date,
                game_type,
                SUM(time_spent) as total_time,
                SUM(score) as total_score,
                COUNT(*) as play_count
            FROM game_results
            WHERE student_id = ?
            GROUP BY play_date, game_type
            ORDER BY completed_at DESC
        `;
        
        const [rows] = await pool.execute(sql, [student_id]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lấy thống kê' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
    console.log(`👉 API Login sẵn sàng: http://localhost:${PORT}/api/auth/login`);
});
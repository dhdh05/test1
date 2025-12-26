const db = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Tìm user trong database
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
        }

        const user = users[0];

        // 2. Kiểm tra password 
        // (Lưu ý: Vì data của bạn đang để pass là '123' dạng thô, nên mình so sánh trực tiếp.
        // Thực tế nên dùng thư viện bcrypt để mã hóa password nhé)
        if (password !== user.password) {
            return res.status(401).json({ success: false, message: 'Sai mật khẩu!' });
        }

        // 3. Nếu đúng, tạo Token (thẻ bài)
        const token = jwt.sign(
            { id: user.user_id, role: user.role, username: user.username },
            process.env.JWT_SECRET || 'secret_key_cua_huy', // Khóa bí mật
            { expiresIn: '24h' }
        );

        // 4. Trả về thông tin cho Frontend lưu lại
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token: token,
            user: {
                id: user.user_id,
                name: user.full_name,
                role: user.role,
                avatar: user.avatar_url
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
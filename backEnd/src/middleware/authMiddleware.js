const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    // Lấy token từ header gửi lên (Dạng: Bearer abcxyz...)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, message: 'Chưa đăng nhập (Thiếu Token)!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_cua_huy');
        req.user = decoded; // Lưu thông tin user vào biến req để dùng ở bước sau
        next(); // Cho phép đi tiếp
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn!' });
    }
};
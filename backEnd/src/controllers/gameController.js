const db = require('../config/db');

// API 1: Lấy danh sách Level theo loại game (ví dụ: 'hoc-so')
exports.getLevelsByGameType = async (req, res) => {
    try {
        const { gameType } = req.params; // Lấy từ URL
        const [rows] = await db.execute(
            'SELECT * FROM game_levels WHERE game_type = ? ORDER BY level_number ASC',
            [gameType]
        );
        
        // Parse JSON config để Frontend dùng được luôn
        const levels = rows.map(level => ({
            ...level,
            config: typeof level.config === 'string' ? JSON.parse(level.config) : level.config
        }));

        res.json({ success: true, data: levels });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// API 2: Nộp bài và lưu kết quả
exports.submitGameResult = async (req, res) => {
    try {
        const { student_id, level_id, game_type, score, stars, time_spent, is_passed, answers } = req.body;

        // 1. Lưu vào bảng lịch sử chi tiết (game_results)
        await db.execute(
            `INSERT INTO game_results 
            (student_id, level_id, game_type, score, stars, time_spent, is_passed, answers) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, level_id, game_type, score, stars, time_spent, is_passed, JSON.stringify(answers)]
        );

        // 2. Cập nhật tiến độ tổng (student_game_progress)
        // Logic: Nếu chưa có thì tạo mới, nếu có rồi thì update level cao nhất và cộng dồn sao
        if (is_passed) {
            // Lấy level number hiện tại
            const [levelInfo] = await db.execute('SELECT level_number FROM game_levels WHERE level_id = ?', [level_id]);
            const currentLevelNum = levelInfo[0].level_number;

            // Upsert (Insert nếu chưa có, Update nếu đã có)
            const sqlUpdateProgress = `
                INSERT INTO student_game_progress (student_id, game_type, current_level, highest_level_passed, total_stars, last_played_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    highest_level_passed = GREATEST(highest_level_passed, ?),
                    total_stars = total_stars + ?,
                    last_played_at = NOW();
            `;
            await db.execute(sqlUpdateProgress, [student_id, game_type, currentLevelNum + 1, currentLevelNum, stars, currentLevelNum, stars]);
        }

        res.json({ success: true, message: 'Lưu kết quả thành công!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi lưu kết quả' });
    }
};
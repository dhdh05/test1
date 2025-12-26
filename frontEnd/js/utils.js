// js/utils.js

const API_URL = 'http://localhost:3000/api'; // Đảm bảo đúng port server của bạn

export async function callAPI(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('user_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, config);
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// --- HÀM NỘP BÀI (Đã sửa để nhận timeSpent) ---
// Tham số timeSpent = 0 ở cuối nghĩa là: Nếu game nào không gửi thời gian, 
// thì mặc định coi như là 0 giây để không bị lỗi.
export async function submitGameResult(levelId, gameType, score, stars, isPassed, timeSpent = 0) {
    const userInfo = JSON.parse(localStorage.getItem('user_info'));
    
    // Nếu chưa đăng nhập thì không lưu được
    if (!userInfo) {
        console.warn("Chưa đăng nhập, không thể lưu kết quả.");
        return;
    }

    const body = {
        student_id: userInfo.id,
        level_id: levelId,
        game_type: gameType,
        score: score,
        stars: stars,
        is_passed: isPassed,
        time_spent: timeSpent, // Gửi thời gian thực tế lên server
        answers: [] 
    };

    console.log(`📤 Đang nộp kết quả ${gameType}: ${score} điểm - ${timeSpent}s`);

    const res = await callAPI('/games/submit', 'POST', body);
    
    if (res && res.success) {
        console.log("✅ Lưu thành công!");
    } else {
        console.error("❌ Lưu thất bại!");
    }
}
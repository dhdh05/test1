const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: '127.0.0.1', // Hoặc localhost
    user: 'root',      // User MySQL của bạn
    password: '',      // Password MySQL của bạn
    database: 'ktpmud',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4' // Hỗ trợ đầy đủ Unicode, bao gồm cả emoji
});

// Dùng promise wrapper để code async/await cho gọn
module.exports = pool.promise();
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ktpmud', // Ưu tiên lấy từ .env, nếu không có thì dùng 'ktpmud'
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    dialect: 'mysql',
    logging: false,
    
    // 👇 Cấu hình SSL bắt buộc cho TiDB
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    },
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export { sequelize };
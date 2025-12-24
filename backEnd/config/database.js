import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// SSL configuration for cloud databases (TiDB Cloud, PlanetScale, etc.)
const dialectOptions = process.env.DB_SSL === 'true' ? {
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
} : {};

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ktpmud',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export { sequelize };

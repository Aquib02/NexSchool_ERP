import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/school_erp_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_fallback_secret_key_change_in_production_2026',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_fallback_refresh_secret_key_2026',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SUPER_ADMIN: {
    USERNAME: process.env.SUPER_ADMIN_USERNAME || 'admin',
    EMAIL: process.env.SUPER_ADMIN_EMAIL || 'admin@schoolerp.internal',
    PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345',
  },
};

export default ENV;

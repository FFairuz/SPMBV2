const mysql2 = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Mendukung Railway DATABASE_URL (mysql://user:pass@host:port/db)
// atau env var individual (DB_HOST, DB_USER, dll)
let poolConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    host:     url.hostname,
    port:     parseInt(url.port) || 3306,
    user:     url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
  };
} else {
  poolConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'spmb_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
  };
}

const pool = mysql2.createPool(poolConfig);
const db = pool.promise();

// Fungsi test koneksi dengan retry – dipanggil dari server.js
async function connectWithRetry(maxRetries = 10, delayMs = 3000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const conn = await db.getConnection();
      conn.release();
      console.log('✅ Database terhubung');
      return true;
    } catch (err) {
      console.warn(`⏳ Menunggu database... (${i}/${maxRetries}): ${err.message}`);
      if (i === maxRetries) {
        console.error('❌ Gagal terhubung ke database setelah', maxRetries, 'percobaan');
        return false;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

module.exports = db;
module.exports.connectWithRetry = connectWithRetry;

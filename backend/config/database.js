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
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
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
  };
}

const pool = mysql2.createPool(poolConfig);

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database terhubung');
    connection.release();
  }
});

module.exports = pool.promise();

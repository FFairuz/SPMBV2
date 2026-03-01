const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware – CORS
// Di Railway: frontend & backend 1 domain → CORS tidak diperlukan tapi tetap dikonfigurasi.
// FRONTEND_URL bisa diisi multiple URL dipisah koma: https://a.com,https://b.com
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (lokal – hanya aktif saat development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pendaftaran', require('./routes/pendaftaran'));
app.use('/api/admin', require('./routes/admin'));

// Public: identitas sekolah (no auth needed)
const db = require('./config/database');
app.get('/api/sekolah', async (req, res) => {
  try {
    const [[data]] = await db.query('SELECT id, nama_sekolah, npsn, kepala_sekolah, alamat, kota, provinsi, telpon, email, website, logo FROM sekolah WHERE id=1');
    res.json(data || {});
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SPMB API is running' });
});

// Serve React build (production)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  // SPA fallback – semua route non-API diarahkan ke index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Tunggu koneksi database, inisialisasi tabel, lalu start server
const { connectWithRetry } = require('./config/database');
const autoInit = require('./scripts/autoInit');

connectWithRetry(15, 3000).then(async (connected) => {
  if (connected) {
    try {
      await autoInit(db);
    } catch (e) {
      console.error('⚠️  autoInit error (tidak fatal):', e.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`✅ Server SPMB berjalan di port ${PORT}`);
  });
});

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan, akses ditolak' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

// Hanya admin penuh
const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin' });
    }
    next();
  });
};

// Admin + Panitia (kelola pendaftaran, data siswa)
const panitiaMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!['admin', 'panitia'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin atau panitia' });
    }
    next();
  });
};

// Admin + Bendahara (kelola pembayaran)
const bendaharaMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!['admin', 'bendahara'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin atau bendahara' });
    }
    next();
  });
};

// Admin + Panitia + Bendahara (akses dashboard umum)
const staffMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!['admin', 'panitia', 'bendahara'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    next();
  });
};

module.exports = { authMiddleware, adminMiddleware, panitiaMiddleware, bendaharaMiddleware, staffMiddleware };

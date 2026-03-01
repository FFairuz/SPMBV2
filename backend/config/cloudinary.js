const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cek apakah Cloudinary dikonfigurasi
const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let _cloudinary = null;
const getCloudinary = () => {
  if (!_cloudinary) {
    _cloudinary = require('cloudinary').v2;
    _cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return _cloudinary;
};

/**
 * Hapus file dari Cloudinary berdasarkan URL tersimpan.
 */
const deleteFromCloudinary = async (url) => {
  if (!url || !url.includes('cloudinary.com')) return;
  try {
    const c = getCloudinary();
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
    if (match) await c.uploader.destroy(match[1]);
  } catch (e) {
    console.warn('Gagal hapus dari Cloudinary:', e.message);
  }
};

/**
 * Buat storage untuk multer.
 * Otomatis fallback ke disk jika Cloudinary belum dikonfigurasi.
 */
const makeStorage = (folder, publicIdFn) => {
  if (isCloudinaryConfigured()) {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    return new CloudinaryStorage({
      cloudinary: getCloudinary(),
      params: async (req, file) => ({
        folder,
        public_id: publicIdFn(req, file),
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
        resource_type: 'auto',
      }),
    });
  }
  // Fallback: simpan ke disk lokal
  console.warn('⚠️  CLOUDINARY tidak dikonfigurasi, pakai disk storage');
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${publicIdFn(req, file)}${path.extname(file.originalname)}`);
    },
  });
};

module.exports = { getCloudinary, makeStorage, deleteFromCloudinary };

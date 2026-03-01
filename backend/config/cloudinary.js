const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Hapus file dari Cloudinary berdasarkan URL tersimpan.
 * Aman dipanggil meski URL adalah path lokal lama (diabaikan).
 */
const deleteFromCloudinary = async (url) => {
  if (!url || !url.includes('cloudinary.com')) return;
  try {
    // URL format: .../upload/v123/spmb/folder/public_id.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
    if (match) {
      await cloudinary.uploader.destroy(match[1]);
    }
  } catch (e) {
    console.warn('Gagal hapus dari Cloudinary:', e.message);
  }
};

/**
 * Buat CloudinaryStorage untuk multer.
 * @param {string} folder - subfolder di Cloudinary, misal 'spmb/jurusan'
 * @param {Function} publicIdFn - (req, file) => string
 */
const makeStorage = (folder, publicIdFn) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder,
      public_id: publicIdFn(req, file),
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      resource_type: 'auto',
    }),
  });

module.exports = { cloudinary, makeStorage, deleteFromCloudinary };

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { makeStorage } = require('../config/cloudinary');

// Setup multer – Cloudinary storage untuk dokumen siswa
const storage = makeStorage(
  'spmb/dokumen',
  (req, file) => `${file.fieldname}-${req.user?.id || 'anon'}-${Date.now()}`
);

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadFields = upload.fields([
  { name: 'foto',   maxCount: 1 },
  { name: 'ijazah', maxCount: 1 },
  { name: 'kk',     maxCount: 1 }
]);

// Generate nomor pendaftaran
const generateNomor = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `SPMB-${year}-${random}`;
};

// POST /api/pendaftaran - Daftar baru
router.post('/', authMiddleware, uploadFields, async (req, res) => {
  try {
    const userId = req.user.id;

    // Cek sudah pernah daftar
    const [existing] = await db.query(
      'SELECT id FROM pendaftaran WHERE user_id = ?',
      [userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Anda sudah pernah mendaftar' });
    }

    const {
      // Identitas
      nama_lengkap, nik, nisn, tempat_lahir, tanggal_lahir,
      jenis_kelamin, agama, kewarganegaraan, berkebutuhan_khusus,
      // Tempat Tinggal
      alamat, rt, rw, kelurahan, kecamatan, kabupaten, provinsi, kode_pos,
      jarak_rumah, transportasi,
      // Kontak
      no_telp, email_siswa,
      // Orang Tua - Ayah
      nama_ayah, nik_ayah, pendidikan_ayah, pekerjaan_ayah, penghasilan_ayah, no_hp_ayah,
      // Orang Tua - Ibu
      nama_ibu, nik_ibu, pendidikan_ibu, pekerjaan_ibu, penghasilan_ibu, no_hp_ibu,
      // Wali
      nama_wali, no_hp_wali,
      // Asal Sekolah
      asal_sekolah, npsn_asal, kabupaten_asal, tahun_lulus,
      // Akademik & Pilihan
      nilai_rata_rata, pilihan1, pilihan2, jalur_pendaftaran
    } = req.body;

    // Validasi wajib
    if (!nama_lengkap || !nik || !tempat_lahir || !tanggal_lahir ||
        !jenis_kelamin || !agama || !alamat || !no_telp ||
        !asal_sekolah || !pilihan1) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const jalurValid = ['muhammadiyah', 'non_muhammadiyah', 'spmb_bersama'].includes(jalur_pendaftaran);
    const jalurFinal = jalurValid ? jalur_pendaftaran : 'muhammadiyah';

    // File uploads – simpan Cloudinary URL
    const foto   = req.files?.foto?.[0]?.path   || null;
    const ijazah = req.files?.ijazah?.[0]?.path || null;
    const kk     = req.files?.kk?.[0]?.path     || null;

    const nomorPendaftaran = generateNomor();

    await db.query(
      `INSERT INTO pendaftaran (
        user_id, nomor_pendaftaran,
        nama_lengkap, nik, nisn, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
        kewarganegaraan, berkebutuhan_khusus,
        alamat, rt, rw, kelurahan, kecamatan, kabupaten, provinsi, kode_pos,
        jarak_rumah, transportasi,
        no_telp, email_siswa,
        nama_ayah, nik_ayah, pendidikan_ayah, pekerjaan_ayah, penghasilan_ayah, no_hp_ayah,
        nama_ibu, nik_ibu, pendidikan_ibu, pekerjaan_ibu, penghasilan_ibu, no_hp_ibu,
        nama_wali, no_hp_wali,
        asal_sekolah, npsn_asal, kabupaten_asal, tahun_lulus,
        nilai_rata_rata, pilihan1, pilihan2, jalur_pendaftaran,
        foto, ijazah, kk, status
      ) VALUES (
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, 'pending'
      )`,
      [
        userId, nomorPendaftaran,
        nama_lengkap, nik, nisn || null, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
        kewarganegaraan || 'WNI', berkebutuhan_khusus || 'Tidak',
        alamat, rt || null, rw || null, kelurahan || null, kecamatan || null, kabupaten || null, provinsi || null, kode_pos || null,
        jarak_rumah || null, transportasi || null,
        no_telp, email_siswa || null,
        nama_ayah || null, nik_ayah || null, pendidikan_ayah || null, pekerjaan_ayah || null, penghasilan_ayah || null, no_hp_ayah || null,
        nama_ibu || null, nik_ibu || null, pendidikan_ibu || null, pekerjaan_ibu || null, penghasilan_ibu || null, no_hp_ibu || null,
        nama_wali || null, no_hp_wali || null,
        asal_sekolah, npsn_asal || null, kabupaten_asal || null, tahun_lulus || null,
        nilai_rata_rata || null, pilihan1, pilihan2 || null, jalurFinal,
        foto, ijazah, kk
      ]
    );

    res.status(201).json({
      message: 'Pendaftaran berhasil dikirim',
      nomor_pendaftaran: nomorPendaftaran
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/pendaftaran/saya - Data pendaftaran siswa yang login
router.get('/saya', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, 
        j1.nama AS jurusan1, j1.kode AS kode1,
        j2.nama AS jurusan2, j2.kode AS kode2
       FROM pendaftaran p
       LEFT JOIN jurusan j1 ON p.pilihan1 = j1.id
       LEFT JOIN jurusan j2 ON p.pilihan2 = j2.id
       WHERE p.user_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/pendaftaran/jurusan - Daftar jurusan (with kuota info)
router.get('/jurusan', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT j.*,
        COUNT(p.id) as total_pendaftar
      FROM jurusan j
      LEFT JOIN pendaftaran p ON j.id = p.pilihan1
      GROUP BY j.id
      ORDER BY j.nama
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/pendaftaran/sekolah-asal - Master daftar sekolah asal (untuk autocomplete form)
router.get('/sekolah-asal', async (req, res) => {
  try {
    const search = req.query.q || '';
    const [rows] = await db.query(
      `SELECT id, nama_sekolah, npsn, tipe FROM master_asal_sekolah
       WHERE nama_sekolah LIKE ? OR npsn LIKE ?
       ORDER BY nama_sekolah LIMIT 30`,
      [`%${search}%`, `%${search}%`]
    );
    res.json(rows);
  } catch {
    res.json([]); // tabel belum ada, kembalikan kosong
  }
});

// GET /api/pendaftaran/form-settings - Pengaturan field formulir (public, untuk siswa)
router.get('/form-settings', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT field_key, is_required, is_enabled FROM form_field_settings'
    );
    res.json(rows);
  } catch {
    res.json([]); // tabel belum dibuat — form pakai default (semua wajib)
  }
});

module.exports = router;

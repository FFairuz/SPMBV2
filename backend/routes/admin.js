const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { adminMiddleware, panitiaMiddleware, bendaharaMiddleware, staffMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { makeStorage, deleteFromCloudinary } = require('../config/cloudinary');

// Multer memory storage for import (no disk write needed)
const importStorage = multer.memoryStorage();
const uploadImport = multer({
  storage: importStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      return cb(null, true);
    }
    cb(new Error('Hanya file Excel (.xlsx, .xls) atau CSV yang diizinkan'));
  }
});

// Cloudinary storage for jurusan logo
const logoStorage = makeStorage(
  'spmb/jurusan',
  (req) => `jurusan-${req.params.id}-${Date.now()}`
);
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Hanya file gambar yang diizinkan'));
    cb(null, true);
  }
});

// Cloudinary storage for sekolah logo
const sekolahLogoStorage = makeStorage(
  'spmb/sekolah',
  () => `sekolah-logo-${Date.now()}`
);
const uploadSekolahLogo = multer({
  storage: sekolahLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Hanya file gambar yang diizinkan'));
    cb(null, true);
  }
});

// GET /api/admin/dashboard - Statistik
router.get('/dashboard', staffMiddleware, async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM pendaftaran');
    const [[{ pending }]] = await db.query("SELECT COUNT(*) as pending FROM pendaftaran WHERE status = 'pending'");
    const [[{ diterima }]] = await db.query("SELECT COUNT(*) as diterima FROM pendaftaran WHERE status = 'diterima'");
    const [[{ ditolak }]] = await db.query("SELECT COUNT(*) as ditolak FROM pendaftaran WHERE status = 'ditolak'");
    const [[{ totalSiswa }]] = await db.query("SELECT COUNT(*) as totalSiswa FROM users WHERE role = 'siswa'");

    // Statistik per jurusan
    const [jurusanStats] = await db.query(`
      SELECT j.nama, j.kode, j.kuota,
        COUNT(p.id) as total_pendaftar,
        SUM(CASE WHEN p.status = 'diterima' THEN 1 ELSE 0 END) as diterima
      FROM jurusan j
      LEFT JOIN pendaftaran p ON j.id = p.pilihan1
      GROUP BY j.id
      ORDER BY j.nama
    `);

    // Pendaftar terbaru
    const [terbaru] = await db.query(`
      SELECT p.id, p.nomor_pendaftaran, p.nama_lengkap, p.asal_sekolah,
             p.nilai_rata_rata, p.status, p.created_at,
             j.nama AS jurusan1
      FROM pendaftaran p
      LEFT JOIN jurusan j ON p.pilihan1 = j.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.json({ total, pending, diterima, ditolak, totalSiswa, jurusanStats, terbaru });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/admin/pendaftar - Semua pendaftar
router.get('/pendaftar', panitiaMiddleware, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = [];
    let params = [];

    if (status && status !== 'semua') {
      whereClause.push('p.status = ?');
      params.push(status);
    }

    if (search) {
      whereClause.push('(p.nama_lengkap LIKE ? OR p.nomor_pendaftaran LIKE ? OR p.asal_sekolah LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT p.id, p.nomor_pendaftaran, p.nama_lengkap, p.jenis_kelamin,
              p.asal_sekolah, p.nilai_rata_rata, p.status, p.created_at,
              j1.nama AS jurusan1, j2.nama AS jurusan2
       FROM pendaftaran p
       LEFT JOIN jurusan j1 ON p.pilihan1 = j1.id
       LEFT JOIN jurusan j2 ON p.pilihan2 = j2.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM pendaftaran p ${where}`,
      params
    );

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/admin/pendaftar/:id - Detail pendaftar
router.get('/pendaftar/:id', panitiaMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.email,
              j1.nama AS jurusan1, j1.kode AS kode1,
              j2.nama AS jurusan2, j2.kode AS kode2
       FROM pendaftaran p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN jurusan j1 ON p.pilihan1 = j1.id
       LEFT JOIN jurusan j2 ON p.pilihan2 = j2.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/admin/pendaftar/:id - Edit semua data pendaftaran
router.put('/pendaftar/:id', panitiaMiddleware, async (req, res) => {
  try {
    const {
      nama_lengkap, nik, nisn, tempat_lahir, tanggal_lahir,
      jenis_kelamin, agama, kewarganegaraan, berkebutuhan_khusus,
      alamat, rt, rw, dusun, kelurahan, kecamatan, kabupaten, provinsi, kode_pos,
      jarak_rumah, transportasi,
      no_telp, email_siswa,
      nama_ayah, nik_ayah, pendidikan_ayah, pekerjaan_ayah, penghasilan_ayah, no_hp_ayah,
      nama_ibu, nik_ibu, pendidikan_ibu, pekerjaan_ibu, penghasilan_ibu, no_hp_ibu,
      nama_wali, no_hp_wali,
      asal_sekolah, npsn_asal, kabupaten_asal, tahun_lulus,
      nilai_rata_rata, pilihan1, pilihan2, jalur_pendaftaran
    } = req.body;

    if (!nama_lengkap || !nik || !asal_sekolah || !nilai_rata_rata || !pilihan1) {
      return res.status(400).json({ message: 'Field wajib belum lengkap' });
    }

    await db.query(`UPDATE pendaftaran SET
      nama_lengkap=?, nik=?, nisn=?, tempat_lahir=?, tanggal_lahir=?,
      jenis_kelamin=?, agama=?, kewarganegaraan=?, berkebutuhan_khusus=?,
      alamat=?, rt=?, rw=?, dusun=?, kelurahan=?, kecamatan=?, kabupaten=?, provinsi=?, kode_pos=?,
      jarak_rumah=?, transportasi=?,
      no_telp=?, email_siswa=?,
      nama_ayah=?, nik_ayah=?, pendidikan_ayah=?, pekerjaan_ayah=?, penghasilan_ayah=?, no_hp_ayah=?,
      nama_ibu=?, nik_ibu=?, pendidikan_ibu=?, pekerjaan_ibu=?, penghasilan_ibu=?, no_hp_ibu=?,
      nama_wali=?, no_hp_wali=?,
      asal_sekolah=?, npsn_asal=?, kabupaten_asal=?, tahun_lulus=?,
      nilai_rata_rata=?, pilihan1=?, pilihan2=?, jalur_pendaftaran=?
      WHERE id=?`,
      [
        nama_lengkap, nik, nisn||null, tempat_lahir, tanggal_lahir,
        jenis_kelamin, agama, kewarganegaraan||'WNI', berkebutuhan_khusus||'Tidak',
        alamat, rt||null, rw||null, dusun||null, kelurahan||null, kecamatan||null, kabupaten||null, provinsi||null, kode_pos||null,
        jarak_rumah||null, transportasi||null,
        no_telp, email_siswa||null,
        nama_ayah||null, nik_ayah||null, pendidikan_ayah||null, pekerjaan_ayah||null, penghasilan_ayah||null, no_hp_ayah||null,
        nama_ibu||null, nik_ibu||null, pendidikan_ibu||null, pekerjaan_ibu||null, penghasilan_ibu||null, no_hp_ibu||null,
        nama_wali||null, no_hp_wali||null,
        asal_sekolah, npsn_asal||null, kabupaten_asal||null, tahun_lulus||null,
        parseFloat(nilai_rata_rata), parseInt(pilihan1), pilihan2?parseInt(pilihan2):null, jalur_pendaftaran||'muhammadiyah',
        req.params.id
      ]
    );

    res.json({ message: 'Data pendaftaran berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server: ' + error.message });
  }
});

// PUT /api/admin/pendaftar/:id/status - Update status
router.put('/pendaftar/:id/status', panitiaMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { status, catatan } = req.body;

    if (!['pending', 'diterima', 'ditolak'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    await conn.beginTransaction();

    // Ambil data pendaftar + status saat ini
    const [[pendaftar]] = await conn.query(
      'SELECT id, status, pilihan1 FROM pendaftaran WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    if (!pendaftar) {
      await conn.rollback();
      return res.status(404).json({ message: 'Data pendaftar tidak ditemukan' });
    }

    // Jika mau mengubah ke "diterima", cek kuota dengan lock
    if (status === 'diterima' && pendaftar.status !== 'diterima') {
      // Kunci baris jurusan agar tidak bisa diakses proses lain secara bersamaan
      const [[jurusan]] = await conn.query(
        'SELECT id, nama, kuota FROM jurusan WHERE id = ? FOR UPDATE',
        [pendaftar.pilihan1]
      );

      if (!jurusan) {
        await conn.rollback();
        return res.status(400).json({ message: 'Jurusan pilihan tidak ditemukan' });
      }

      // Hitung sudah berapa yang diterima di jurusan ini (di dalam transaksi)
      const [[{ sudahDiterima }]] = await conn.query(
        `SELECT COUNT(*) as sudahDiterima
         FROM pendaftaran
         WHERE pilihan1 = ? AND status = 'diterima' AND id != ?`,
        [pendaftar.pilihan1, req.params.id]
      );

      if (sudahDiterima >= jurusan.kuota) {
        await conn.rollback();
        return res.status(409).json({
          message: `Kuota jurusan ${jurusan.nama} sudah penuh (${jurusan.kuota} siswa). Tidak dapat menerima pendaftar ini.`
        });
      }
    }

    await conn.query(
      'UPDATE pendaftaran SET status = ?, catatan = ? WHERE id = ?',
      [status, catatan || null, req.params.id]
    );

    await conn.commit();
    res.json({ message: `Status berhasil diubah menjadi ${status}` });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    conn.release();
  }
});

// POST /api/admin/tambah-siswa - Admin tambah pendaftaran siswa manual
router.post('/tambah-siswa', panitiaMiddleware, async (req, res) => {
  const conn = await require('../config/database').getConnection();
  try {
    await conn.beginTransaction();

    const {
      // Identitas
      nama_lengkap, nik, nisn, tempat_lahir, tanggal_lahir,
      jenis_kelamin, agama, kewarganegaraan, berkebutuhan_khusus,
      // Tempat Tinggal
      alamat, rt, rw, dusun, kelurahan, kecamatan, kabupaten, provinsi, kode_pos,
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
      // Pendaftaran
      nilai_rata_rata, pilihan1, pilihan2, jalur_pendaftaran,
      // Status
      status
    } = req.body;

    // Validasi wajib
    if (!nama_lengkap || !nik || !tempat_lahir || !tanggal_lahir || !jenis_kelamin || !agama || !alamat || !no_telp || !asal_sekolah || !pilihan1) {
      return res.status(400).json({ message: 'Harap lengkapi semua field yang wajib diisi' });
    }

    const statusFinal = ['pending', 'diterima', 'ditolak'].includes(status) ? status : 'pending';

    // Jika langsung diterima, cek kuota dengan lock sebelum insert
    if (statusFinal === 'diterima') {
      const [[jurusan]] = await conn.query(
        'SELECT id, nama, kuota FROM jurusan WHERE id = ? FOR UPDATE',
        [parseInt(pilihan1)]
      );
      if (!jurusan) {
        await conn.rollback();
        return res.status(400).json({ message: 'Jurusan pilihan tidak ditemukan' });
      }
      const [[{ sudahDiterima }]] = await conn.query(
        `SELECT COUNT(*) as sudahDiterima FROM pendaftaran WHERE pilihan1 = ? AND status = 'diterima'`,
        [parseInt(pilihan1)]
      );
      if (sudahDiterima >= jurusan.kuota) {
        await conn.rollback();
        return res.status(409).json({
          message: `Kuota jurusan ${jurusan.nama} sudah penuh (${jurusan.kuota} siswa). Siswa tidak dapat langsung diterima.`
        });
      }
    }

    // Buat akun user untuk siswa
    const bcrypt = require('bcryptjs');
    const loginEmail = email_siswa || `siswa.${nik}@spmb-auto.id`;
    const defaultPassword = nisn || nik.slice(-6);
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Cek apakah email sudah terdaftar
    const [existingUser] = await conn.query('SELECT id FROM users WHERE email = ?', [loginEmail]);
    let userId;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const [userResult] = await conn.query(
        'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
        [nama_lengkap, loginEmail, hashedPassword, 'siswa']
      );
      userId = userResult.insertId;
    }

    // Generate nomor pendaftaran
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const [[{ count }]] = await conn.query('SELECT COUNT(*) as count FROM pendaftaran');
    const nomorUrut = String(count + 1).padStart(4, '0');
    const nomor_pendaftaran = `SPMB-${year}${month}-${nomorUrut}`;

    // Insert pendaftaran
    await conn.query(
      `INSERT INTO pendaftaran (
        user_id, nomor_pendaftaran,
        nama_lengkap, nik, nisn, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
        kewarganegaraan, berkebutuhan_khusus,
        alamat, rt, rw, dusun, kelurahan, kecamatan, kabupaten, provinsi, kode_pos,
        jarak_rumah, transportasi,
        no_telp, email_siswa,
        nama_ayah, nik_ayah, pendidikan_ayah, pekerjaan_ayah, penghasilan_ayah, no_hp_ayah,
        nama_ibu, nik_ibu, pendidikan_ibu, pekerjaan_ibu, penghasilan_ibu, no_hp_ibu,
        nama_wali, no_hp_wali,
        asal_sekolah, npsn_asal, kabupaten_asal, tahun_lulus,
        nilai_rata_rata, pilihan1, pilihan2, jalur_pendaftaran,
        status
      ) VALUES (
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?
      )`,
      [
        userId, nomor_pendaftaran,
        nama_lengkap, nik, nisn || null, tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
        kewarganegaraan || 'WNI', berkebutuhan_khusus || 'Tidak',
        alamat, rt || null, rw || null, dusun || null, kelurahan || null, kecamatan || null, kabupaten || null, provinsi || null, kode_pos || null,
        jarak_rumah || null, transportasi || null,
        no_telp, email_siswa || null,
        nama_ayah || null, nik_ayah || null, pendidikan_ayah || null, pekerjaan_ayah || null, penghasilan_ayah || null, no_hp_ayah || null,
        nama_ibu || null, nik_ibu || null, pendidikan_ibu || null, pekerjaan_ibu || null, penghasilan_ibu || null, no_hp_ibu || null,
        nama_wali || null, no_hp_wali || null,
        asal_sekolah, npsn_asal || null, kabupaten_asal || null, tahun_lulus || null,
        nilai_rata_rata || null, pilihan1, pilihan2 || null, jalur_pendaftaran || 'muhammadiyah',
        statusFinal
      ]
    );


    await conn.commit();

    res.status(201).json({
      message: 'Pendaftaran siswa berhasil ditambahkan',
      nomor_pendaftaran,
      login: { email: loginEmail, password: defaultPassword }
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server: ' + error.message });
  } finally {
    conn.release();
  }
});

// GET /api/admin/jurusan - Daftar jurusan
router.get('/jurusan', panitiaMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT j.*,
        COUNT(p.id) as total_pendaftar,
        SUM(CASE WHEN p.status = 'diterima' THEN 1 ELSE 0 END) as diterima
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

// POST /api/admin/jurusan - Tambah jurusan
router.post('/jurusan', panitiaMiddleware, async (req, res) => {
  try {
    const { nama, kode, kuota, deskripsi } = req.body;
    if (!nama || !kode || !kuota) {
      return res.status(400).json({ message: 'Nama, kode, dan kuota wajib diisi' });
    }
    const [result] = await db.query(
      'INSERT INTO jurusan (nama, kode, kuota, deskripsi) VALUES (?, ?, ?, ?)',
      [nama, kode.toUpperCase(), parseInt(kuota), deskripsi || null]
    );
    res.status(201).json({ message: 'Jurusan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Kode jurusan sudah digunakan' });
    }
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /api/admin/jurusan/:id/logo - Upload logo jurusan
router.post('/jurusan/:id/logo', panitiaMiddleware, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File logo tidak ditemukan' });
    // Hapus logo lama dari Cloudinary
    const [[j]] = await db.query('SELECT logo FROM jurusan WHERE id=?', [req.params.id]);
    if (j?.logo) await deleteFromCloudinary(j.logo);
    const logoUrl = req.file.path; // Cloudinary secure URL
    await db.query('UPDATE jurusan SET logo=? WHERE id=?', [logoUrl, req.params.id]);
    res.json({ message: 'Logo berhasil diupload', logo: logoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/admin/jurusan/:id/logo - Hapus logo jurusan
router.delete('/jurusan/:id/logo', panitiaMiddleware, async (req, res) => {
  try {
    const [[j]] = await db.query('SELECT logo FROM jurusan WHERE id=?', [req.params.id]);
    if (j?.logo) await deleteFromCloudinary(j.logo);
    await db.query('UPDATE jurusan SET logo=NULL WHERE id=?', [req.params.id]);
    res.json({ message: 'Logo berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/admin/jurusan/:id - Edit jurusan
router.put('/jurusan/:id', panitiaMiddleware, async (req, res) => {
  try {
    const { nama, kode, kuota, deskripsi } = req.body;
    if (!nama || !kode || !kuota) {
      return res.status(400).json({ message: 'Nama, kode, dan kuota wajib diisi' });
    }
    await db.query(
      'UPDATE jurusan SET nama=?, kode=?, kuota=?, deskripsi=? WHERE id=?',
      [nama, kode.toUpperCase(), parseInt(kuota), deskripsi || null, req.params.id]
    );
    res.json({ message: 'Jurusan berhasil diperbarui' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Kode jurusan sudah digunakan' });
    }
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/admin/pendaftar/:id - Hapus pendaftar
router.delete('/pendaftar/:id', panitiaMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT id FROM pendaftaran WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Data tidak ditemukan' });
    await db.query('DELETE FROM pendaftaran WHERE id = ?', [req.params.id]);
    res.json({ message: 'Data pendaftar berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/admin/jurusan/:id - Hapus jurusan
router.delete('/jurusan/:id', panitiaMiddleware, async (req, res) => {
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM pendaftaran WHERE pilihan1=? OR pilihan2=?',
      [req.params.id, req.params.id]
    );
    if (total > 0) {
      return res.status(400).json({ message: `Jurusan tidak dapat dihapus karena sudah digunakan oleh ${total} pendaftar` });
    }
    await db.query('DELETE FROM jurusan WHERE id=?', [req.params.id]);
    res.json({ message: 'Jurusan berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ===================== SEKOLAH =====================

// GET /api/admin/sekolah - Ambil data identitas sekolah
router.get('/sekolah', adminMiddleware, async (req, res) => {
  try {
    const [[data]] = await db.query('SELECT * FROM sekolah WHERE id=1');
    res.json(data || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/admin/sekolah - Update identitas sekolah
router.put('/sekolah', adminMiddleware, async (req, res) => {
  try {
    const { nama_sekolah, npsn, kepala_sekolah, alamat, kota, provinsi, telpon, email, website } = req.body;
    await db.query(
      `UPDATE sekolah SET nama_sekolah=?, npsn=?, kepala_sekolah=?, alamat=?, kota=?, provinsi=?, telpon=?, email=?, website=? WHERE id=1`,
      [nama_sekolah || '', npsn || null, kepala_sekolah || null, alamat || null, kota || null, provinsi || null, telpon || null, email || null, website || null]
    );
    res.json({ message: 'Identitas sekolah berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /api/admin/sekolah/logo - Upload logo sekolah
router.post('/sekolah/logo', adminMiddleware, uploadSekolahLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File logo tidak ditemukan' });
    const [[s]] = await db.query('SELECT logo FROM sekolah WHERE id=1');
    if (s?.logo) await deleteFromCloudinary(s.logo);
    const logoUrl = req.file.path; // Cloudinary secure URL
    await db.query('UPDATE sekolah SET logo=? WHERE id=1', [logoUrl]);
    res.json({ message: 'Logo berhasil diupload', logo: logoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/admin/sekolah/logo - Hapus logo sekolah
router.delete('/sekolah/logo', adminMiddleware, async (req, res) => {
  try {
    const [[s]] = await db.query('SELECT logo FROM sekolah WHERE id=1');
    if (s?.logo) await deleteFromCloudinary(s.logo);
    await db.query('UPDATE sekolah SET logo=NULL WHERE id=1');
    res.json({ message: 'Logo berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ─── Pengaturan Pendaftaran ───────────────────────────────────────────────────

// Ensure tables exist
async function ensurePengaturanTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pengaturan_pendaftaran (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tahun_ajaran VARCHAR(20) NOT NULL DEFAULT '2025/2026',
      status_pendaftaran ENUM('buka','tutup') NOT NULL DEFAULT 'tutup',
      tgl_mulai DATE,
      tgl_selesai DATE,
      tgl_pengumuman DATE,
      tgl_daftar_ulang DATE,
      catatan TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS persyaratan_pendaftaran (
      id INT PRIMARY KEY AUTO_INCREMENT,
      dokumen VARCHAR(255) NOT NULL,
      keterangan TEXT,
      wajib TINYINT(1) NOT NULL DEFAULT 1,
      urutan INT NOT NULL DEFAULT 0
    )
  `);
  // Seed default row if empty
  const [[{ cnt }]] = await db.query('SELECT COUNT(*) as cnt FROM pengaturan_pendaftaran');
  if (cnt === 0) {
    await db.query(`INSERT INTO pengaturan_pendaftaran (tahun_ajaran, status_pendaftaran) VALUES ('2025/2026', 'tutup')`);
  }
}

// GET /api/admin/pengaturan - Ambil pengaturan pendaftaran
router.get('/pengaturan', adminMiddleware, async (req, res) => {
  try {
    await ensurePengaturanTables();
    const [[pengaturan]] = await db.query('SELECT * FROM pengaturan_pendaftaran WHERE id=1');
    const [persyaratan] = await db.query('SELECT * FROM persyaratan_pendaftaran ORDER BY urutan, id');
    res.json({ pengaturan, persyaratan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/admin/pengaturan - Update pengaturan pendaftaran
router.put('/pengaturan', adminMiddleware, async (req, res) => {
  try {
    await ensurePengaturanTables();
    const { tahun_ajaran, status_pendaftaran, tgl_mulai, tgl_selesai, tgl_pengumuman, tgl_daftar_ulang, catatan } = req.body;
    await db.query(
      `UPDATE pengaturan_pendaftaran SET tahun_ajaran=?, status_pendaftaran=?, tgl_mulai=?, tgl_selesai=?, tgl_pengumuman=?, tgl_daftar_ulang=?, catatan=? WHERE id=1`,
      [tahun_ajaran, status_pendaftaran, tgl_mulai || null, tgl_selesai || null, tgl_pengumuman || null, tgl_daftar_ulang || null, catatan || null]
    );
    res.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /api/admin/pengaturan/persyaratan - Tambah persyaratan
router.post('/pengaturan/persyaratan', adminMiddleware, async (req, res) => {
  try {
    await ensurePengaturanTables();
    const { dokumen, keterangan, wajib, urutan } = req.body;
    if (!dokumen) return res.status(400).json({ message: 'Nama dokumen wajib diisi' });
    const [result] = await db.query(
      'INSERT INTO persyaratan_pendaftaran (dokumen, keterangan, wajib, urutan) VALUES (?, ?, ?, ?)',
      [dokumen, keterangan || null, wajib !== false ? 1 : 0, urutan || 0]
    );
    res.status(201).json({ message: 'Persyaratan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/admin/pengaturan/persyaratan/:id - Update persyaratan
router.put('/pengaturan/persyaratan/:id', adminMiddleware, async (req, res) => {
  try {
    const { dokumen, keterangan, wajib, urutan } = req.body;
    if (!dokumen) return res.status(400).json({ message: 'Nama dokumen wajib diisi' });
    await db.query(
      'UPDATE persyaratan_pendaftaran SET dokumen=?, keterangan=?, wajib=?, urutan=? WHERE id=?',
      [dokumen, keterangan || null, wajib !== false ? 1 : 0, urutan || 0, req.params.id]
    );
    res.json({ message: 'Persyaratan berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/admin/pengaturan/persyaratan/:id - Hapus persyaratan
router.delete('/pengaturan/persyaratan/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM persyaratan_pendaftaran WHERE id=?', [req.params.id]);
    res.json({ message: 'Persyaratan berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ─── MASTER ASAL SEKOLAH ───────────────────────────────────────────────────
async function ensureAsalSekolahTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS master_asal_sekolah (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama_sekolah VARCHAR(255) NOT NULL,
      npsn VARCHAR(20) DEFAULT NULL,
      tipe ENUM('Negeri','Swasta') DEFAULT 'Negeri',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// GET /admin/asal-sekolah
router.get('/asal-sekolah', panitiaMiddleware, async (req, res) => {
  try {
    await ensureAsalSekolahTable();
    const search = req.query.q || '';
    const [rows] = await db.query(
      `SELECT * FROM master_asal_sekolah
       WHERE nama_sekolah LIKE ? OR npsn LIKE ?
       ORDER BY nama_sekolah`,
      [`%${search}%`, `%${search}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /admin/asal-sekolah
router.post('/asal-sekolah', panitiaMiddleware, async (req, res) => {
  try {
    await ensureAsalSekolahTable();
    const { nama_sekolah, npsn, tipe } = req.body;
    if (!nama_sekolah) return res.status(400).json({ message: 'Nama sekolah wajib diisi' });
    const [result] = await db.query(
      'INSERT INTO master_asal_sekolah (nama_sekolah, npsn, tipe) VALUES (?, ?, ?)',
      [nama_sekolah.trim(), npsn?.trim() || null, tipe || 'Negeri']
    );
    res.status(201).json({ id: result.insertId, message: 'Berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /admin/asal-sekolah/import
router.post('/asal-sekolah/import', panitiaMiddleware, uploadImport.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });

    await ensureAsalSekolahTable();

    // Parse file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ message: 'File kosong atau format tidak valid' });

    // Normalize headers (case-insensitive)
    const normalize = (obj) => {
      const result = {};
      for (const key of Object.keys(obj)) {
        result[key.toLowerCase().trim().replace(/\s+/g, '_')] = String(obj[key]).trim();
      }
      return result;
    };

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = normalize(rows[i]);
      const nama = row['nama_sekolah'] || row['nama'] || row['school_name'] || '';
      const npsn  = row['npsn'] || row['kode'] || null;
      const rawTipe = (row['tipe'] || row['type'] || 'Negeri');
      const tipe  = rawTipe.charAt(0).toUpperCase() + rawTipe.slice(1).toLowerCase();
      const tipeValid = ['Negeri', 'Swasta'].includes(tipe) ? tipe : 'Negeri';

      if (!nama) {
        errors.push(`Baris ${i + 2}: Nama sekolah kosong, dilewati`);
        skipped++;
        continue;
      }

      try {
        // Skip duplicate by nama_sekolah
        const [[existing]] = await db.query(
          'SELECT id FROM master_asal_sekolah WHERE nama_sekolah = ? LIMIT 1',
          [nama]
        );
        if (existing) {
          skipped++;
          continue;
        }
        await db.query(
          'INSERT INTO master_asal_sekolah (nama_sekolah, npsn, tipe) VALUES (?, ?, ?)',
          [nama, npsn || null, tipeValid]
        );
        inserted++;
      } catch (rowErr) {
        errors.push(`Baris ${i + 2}: ${rowErr.message}`);
        skipped++;
      }
    }

    res.json({
      message: `Import selesai: ${inserted} ditambahkan, ${skipped} dilewati`,
      inserted,
      skipped,
      errors: errors.slice(0, 20), // max 20 error messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

// PUT /admin/asal-sekolah/:id
router.put('/asal-sekolah/:id', panitiaMiddleware, async (req, res) => {
  try {
    const { nama_sekolah, npsn, tipe } = req.body;
    if (!nama_sekolah) return res.status(400).json({ message: 'Nama sekolah wajib diisi' });
    await db.query(
      'UPDATE master_asal_sekolah SET nama_sekolah=?, npsn=?, tipe=? WHERE id=?',
      [nama_sekolah.trim(), npsn?.trim() || null, tipe || 'Negeri', req.params.id]
    );
    res.json({ message: 'Berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /admin/asal-sekolah/:id
router.delete('/asal-sekolah/:id', panitiaMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM master_asal_sekolah WHERE id=?', [req.params.id]);
    res.json({ message: 'Berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ─── PENGATURAN FORMULIR ───────────────────────────────────────────────────
const FORM_FIELD_DEFAULTS = [
  { field_key: 'nik',           label: 'NIK (16 digit)',        section: 'data_diri',    is_required: 1, is_enabled: 1 },
  { field_key: 'tempat_lahir',  label: 'Tempat Lahir',          section: 'data_diri',    is_required: 1, is_enabled: 1 },
  { field_key: 'tanggal_lahir', label: 'Tanggal Lahir',         section: 'data_diri',    is_required: 1, is_enabled: 1 },
  { field_key: 'jenis_kelamin', label: 'Jenis Kelamin',         section: 'data_diri',    is_required: 1, is_enabled: 1 },
  { field_key: 'agama',         label: 'Agama',                 section: 'data_diri',    is_required: 1, is_enabled: 1 },
  { field_key: 'asal_sekolah',  label: 'Asal Sekolah',          section: 'data_sekolah', is_required: 1, is_enabled: 1 },
  { field_key: 'nilai_rata_rata', label: 'Nilai Rata-rata Rapor', section: 'data_sekolah', is_required: 1, is_enabled: 1 },
  { field_key: 'no_telp',       label: 'No. Telepon',           section: 'data_sekolah', is_required: 1, is_enabled: 1 },
  { field_key: 'alamat',        label: 'Alamat Lengkap',        section: 'data_sekolah', is_required: 1, is_enabled: 1 },
  { field_key: 'pilihan2',      label: 'Pilihan Jurusan 2',     section: 'data_sekolah', is_required: 0, is_enabled: 1 },
  { field_key: 'foto',          label: 'Pas Foto 3x4',          section: 'dokumen',      is_required: 1, is_enabled: 1 },
  { field_key: 'ijazah',        label: 'Ijazah / SKL',          section: 'dokumen',      is_required: 1, is_enabled: 1 },
  { field_key: 'kk',            label: 'Kartu Keluarga',        section: 'dokumen',      is_required: 1, is_enabled: 1 },
];

async function ensureFormSettingsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS form_field_settings (
      field_key  VARCHAR(50) PRIMARY KEY,
      label      VARCHAR(100) NOT NULL,
      section    VARCHAR(50)  NOT NULL,
      is_required TINYINT(1) DEFAULT 1,
      is_enabled  TINYINT(1) DEFAULT 1
    )
  `);
  for (const f of FORM_FIELD_DEFAULTS) {
    await db.query(
      `INSERT IGNORE INTO form_field_settings (field_key, label, section, is_required, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [f.field_key, f.label, f.section, f.is_required, f.is_enabled]
    );
  }
}

// GET /admin/form-settings
router.get('/form-settings', panitiaMiddleware, async (req, res) => {
  try {
    await ensureFormSettingsTable();
    const [rows] = await db.query(
      `SELECT * FROM form_field_settings
       ORDER BY FIELD(section,'data_diri','data_sekolah','dokumen'), field_key`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /admin/form-settings
router.put('/form-settings', panitiaMiddleware, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) return res.status(400).json({ message: 'Format tidak valid' });
    for (const s of settings) {
      await db.query(
        'UPDATE form_field_settings SET is_required=?, is_enabled=? WHERE field_key=?',
        [s.is_required ? 1 : 0, s.is_enabled ? 1 : 0, s.field_key]
      );
    }
    res.json({ message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ─── PEMBAYARAN ─────────────────────────────────────────────────────────────
async function ensurePembayaranTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pembayaran (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      pendaftaran_id  INT NOT NULL,
      nominal         DECIMAL(15,2) NOT NULL DEFAULT 0,
      keterangan      VARCHAR(255) DEFAULT NULL,
      cicilan_ke      INT DEFAULT NULL,
      metode_bayar    ENUM('Tunai','Transfer','QRIS','Lainnya') DEFAULT 'Tunai',
      status          ENUM('belum_bayar','cicilan','lunas') DEFAULT 'belum_bayar',
      tanggal_bayar   DATE DEFAULT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran(id) ON DELETE CASCADE
    )
  `);
}

// GET /admin/pembayaran/statistik — dashboard bendahara
router.get('/pembayaran/statistik', bendaharaMiddleware, async (req, res) => {
  try {
    await ensurePembayaranTable();
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    const [[hari]] = await db.query(
      `SELECT COUNT(*) as total_transaksi, COALESCE(SUM(nominal),0) as total_nominal
       FROM pembayaran WHERE DATE(created_at) = ?`, [today]
    );
    const [[bulan]] = await db.query(
      `SELECT COUNT(*) as total_transaksi, COALESCE(SUM(nominal),0) as total_nominal
       FROM pembayaran WHERE DATE_FORMAT(created_at,'%Y-%m') = ?`, [month]
    );
    const [perStatus] = await db.query(
      `SELECT status, COUNT(*) as jumlah, COALESCE(SUM(nominal),0) as total
       FROM pembayaran GROUP BY status ORDER BY FIELD(status,'lunas','cicilan','belum_bayar')`
    );
    const [terbaru] = await db.query(
      `SELECT pb.id, pb.nominal, pb.status, pb.metode_bayar, pb.keterangan, pb.created_at,
              pd.nama_lengkap, pd.nomor_pendaftaran, j.kode as jurusan_kode
       FROM pembayaran pb
       JOIN pendaftaran pd ON pb.pendaftaran_id = pd.id
       LEFT JOIN jurusan j ON pd.pilihan1 = j.id
       ORDER BY pb.created_at DESC LIMIT 8`
    );
    res.json({ hari, bulan, perStatus, terbaru });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/pembayaran  — list semua + summary
router.get('/pembayaran', bendaharaMiddleware, async (req, res) => {
  try {
    await ensurePembayaranTable();
    const search = req.query.q || '';
    const statusFilter = req.query.status || '';

    let sql = `
      SELECT pb.*,
             p.nama_lengkap, p.nomor_pendaftaran, p.status AS status_pendaftaran,
             j.nama AS jurusan_nama, j.kode AS jurusan_kode
      FROM pembayaran pb
      JOIN pendaftaran p ON pb.pendaftaran_id = p.id
      LEFT JOIN jurusan j ON p.pilihan1 = j.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ` AND (p.nama_lengkap LIKE ? OR p.nomor_pendaftaran LIKE ? OR pb.keterangan LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (statusFilter) {
      sql += ` AND pb.status = ?`;
      params.push(statusFilter);
    }
    sql += ` ORDER BY pb.created_at DESC`;

    const [rows] = await db.query(sql, params);

    // summary
    const [[{ total_nominal }]] = await db.query(
      `SELECT COALESCE(SUM(nominal),0) AS total_nominal FROM pembayaran WHERE status='lunas'`
    );
    const [[{ total_siswa }]] = await db.query(
      `SELECT COUNT(DISTINCT pendaftaran_id) AS total_siswa FROM pembayaran`
    );
    const [[{ belum_bayar }]] = await db.query(
      `SELECT COUNT(*) AS belum_bayar FROM pembayaran WHERE status='belum_bayar'`
    );

    res.json({ rows, summary: { total_nominal, total_siswa, belum_bayar } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /admin/pembayaran/siswa — daftar siswa terdaftar (sebagai lookup)
router.get('/pembayaran/siswa', bendaharaMiddleware, async (req, res) => {
  try {
    const q = req.query.q || '';
    const [rows] = await db.query(
      `SELECT p.id, p.nama_lengkap, p.nomor_pendaftaran, p.status,
              j.nama AS jurusan_nama, j.kode AS jurusan_kode
       FROM pendaftaran p
       LEFT JOIN jurusan j ON p.pilihan1 = j.id
       WHERE p.nama_lengkap LIKE ? OR p.nomor_pendaftaran LIKE ?
       ORDER BY p.nama_lengkap
       LIMIT 50`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /admin/pembayaran/laporan-harian?tanggal=YYYY-MM-DD
router.get('/pembayaran/laporan-harian', bendaharaMiddleware, async (req, res) => {
  try {
    await ensurePembayaranTable();
    const tanggal = req.query.tanggal || new Date().toISOString().slice(0, 10);

    // Transaksi pada tanggal tersebut
    const [transaksi] = await db.query(`
      SELECT pb.*,
             p.nama_lengkap, p.nomor_pendaftaran,
             j.nama AS jurusan_nama, j.kode AS jurusan_kode
      FROM pembayaran pb
      JOIN pendaftaran p ON pb.pendaftaran_id = p.id
      LEFT JOIN jurusan j ON p.pilihan1 = j.id
      WHERE DATE(pb.tanggal_bayar) = ?
      ORDER BY pb.tanggal_bayar ASC, pb.id ASC
    `, [tanggal]);

    // Total nominal semua transaksi hari itu
    const [[{ total_nominal }]] = await db.query(
      `SELECT COALESCE(SUM(nominal), 0) AS total_nominal
       FROM pembayaran WHERE DATE(tanggal_bayar) = ?`, [tanggal]
    );

    // Total nominal lunas hari itu
    const [[{ total_lunas }]] = await db.query(
      `SELECT COALESCE(SUM(nominal), 0) AS total_lunas
       FROM pembayaran WHERE DATE(tanggal_bayar) = ? AND status = 'lunas'`, [tanggal]
    );

    // Breakdown per metode bayar
    const [perMetode] = await db.query(`
      SELECT metode_bayar, COUNT(*) AS jumlah, COALESCE(SUM(nominal), 0) AS total
      FROM pembayaran WHERE DATE(tanggal_bayar) = ?
      GROUP BY metode_bayar ORDER BY total DESC
    `, [tanggal]);

    // Breakdown per status
    const [perStatus] = await db.query(`
      SELECT status, COUNT(*) AS jumlah, COALESCE(SUM(nominal), 0) AS total
      FROM pembayaran WHERE DATE(tanggal_bayar) = ?
      GROUP BY status
    `, [tanggal]);

    res.json({
      tanggal,
      transaksi,
      summary: {
        total_transaksi: transaksi.length,
        total_nominal,
        total_lunas,
      },
      per_metode: perMetode,
      per_status: perStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /admin/pembayaran
router.post('/pembayaran', bendaharaMiddleware, async (req, res) => {
  try {
    await ensurePembayaranTable();
    const { pendaftaran_id, nominal, keterangan, metode_bayar, status, tanggal_bayar, cicilan_ke } = req.body;
    if (!pendaftaran_id || nominal === undefined || nominal === '') {
      return res.status(400).json({ message: 'Siswa dan nominal wajib diisi' });
    }
    const [result] = await db.query(
      `INSERT INTO pembayaran (pendaftaran_id, nominal, keterangan, cicilan_ke, metode_bayar, status, tanggal_bayar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pendaftaran_id,
        parseFloat(nominal),
        keterangan || null,
        (status === 'cicilan' && cicilan_ke) ? parseInt(cicilan_ke) : null,
        metode_bayar || 'Tunai',
        status || 'belum_bayar',
        tanggal_bayar || null,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Pembayaran berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /admin/pembayaran/:id
router.put('/pembayaran/:id', bendaharaMiddleware, async (req, res) => {
  try {
    const { nominal, keterangan, metode_bayar, status, tanggal_bayar, cicilan_ke } = req.body;
    await db.query(
      `UPDATE pembayaran SET nominal=?, keterangan=?, cicilan_ke=?, metode_bayar=?, status=?, tanggal_bayar=? WHERE id=?`,
      [
        parseFloat(nominal),
        keterangan || null,
        (status === 'cicilan' && cicilan_ke) ? parseInt(cicilan_ke) : null,
        metode_bayar || 'Tunai',
        status || 'belum_bayar',
        tanggal_bayar || null,
        req.params.id,
      ]
    );
    res.json({ message: 'Berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /admin/pembayaran/:id
router.delete('/pembayaran/:id', bendaharaMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM pembayaran WHERE id=?', [req.params.id]);
    res.json({ message: 'Berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ─── Manajemen User (admin only) ────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT id, nama, email, role, is_verified, created_at FROM users';
    const params = [];
    if (q) {
      sql += ' WHERE nama LIKE ? OR email LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /api/admin/users
router.post('/users', adminMiddleware, async (req, res) => {
  const bcrypt = require('bcryptjs');
  try {
    const { nama, email, password, role } = req.body;
    if (!nama || !email || !password || !role) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }
    const validRoles = ['admin', 'panitia', 'bendahara', 'siswa'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    const hashed = await bcrypt.hash(password, 10);
    // siswa yang dibuat admin langsung diaktifkan
    const isVerified = role === 'siswa' ? 1 : 1;
    const [result] = await db.query(
      'INSERT INTO users (nama, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashed, role, isVerified]
    );
    res.status(201).json({ message: 'User berhasil ditambahkan', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', adminMiddleware, async (req, res) => {
  const bcrypt = require('bcryptjs');
  try {
    const { nama, email, role, password } = req.body;
    const validRoles = ['admin', 'panitia', 'bendahara', 'siswa'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }
    // Cek duplikat email
    if (email) {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.params.id]);
      if (existing.length > 0) return res.status(400).json({ message: 'Email sudah digunakan' });
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET nama=?, email=?, role=?, password=? WHERE id=?',
        [nama, email, role, hashed, req.params.id]);
    } else {
      await db.query('UPDATE users SET nama=?, email=?, role=? WHERE id=?',
        [nama, email, role, req.params.id]);
    }
    res.json({ message: 'User berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/admin/users/:id/verify — toggle aktivasi siswa (panitia & admin)
router.patch('/users/:id/verify', panitiaMiddleware, async (req, res) => {
  try {
    const { is_verified } = req.body;
    if (is_verified === undefined) {
      return res.status(400).json({ message: 'is_verified wajib disertakan' });
    }
    // Hanya boleh aktivasi siswa, bukan staff
    const [[target]] = await db.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (!target) return res.status(404).json({ message: 'User tidak ditemukan' });
    if (target.role !== 'siswa') return res.status(400).json({ message: 'Hanya akun siswa yang dapat diaktivasi' });
    await db.query('UPDATE users SET is_verified = ? WHERE id = ?', [is_verified ? 1 : 0, req.params.id]);
    res.json({ message: is_verified ? 'Akun siswa berhasil diaktifkan' : 'Akun siswa berhasil dinonaktifkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/admin/users/unverified — daftar siswa belum aktif (panitia & admin)
router.get('/users/unverified', panitiaMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nama, email, created_at FROM users
       WHERE role = 'siswa' AND is_verified = 0
       ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    // Jangan biarkan admin menghapus dirinya sendiri
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun sendiri' });
    }
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;

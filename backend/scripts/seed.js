const mysql2 = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function seed() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('🔧 Membuat database dan tabel...');

  // Buat database
  await conn.query(`CREATE DATABASE IF NOT EXISTS spmb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE spmb_db`);

  // Hapus tabel lama jika ada (urutan penting karena foreign key)
  await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);
  await conn.query(`DROP TABLE IF EXISTS pendaftaran`);
  await conn.query(`DROP TABLE IF EXISTS jurusan`);
  await conn.query(`DROP TABLE IF EXISTS users`);
  await conn.query(`SET FOREIGN_KEY_CHECKS = 1`);

  // Buat tabel users
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nama VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'siswa') DEFAULT 'siswa',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Buat tabel jurusan
  await conn.query(`
    CREATE TABLE IF NOT EXISTS jurusan (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nama VARCHAR(100) NOT NULL,
      kode VARCHAR(10) UNIQUE NOT NULL,
      kuota INT NOT NULL DEFAULT 30,
      deskripsi TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Buat tabel pendaftaran
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pendaftaran (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      nomor_pendaftaran VARCHAR(25) UNIQUE NOT NULL,

      -- Identitas Pribadi
      nama_lengkap VARCHAR(100) NOT NULL,
      nik VARCHAR(16) NOT NULL,
      nisn VARCHAR(10),
      tempat_lahir VARCHAR(50) NOT NULL,
      tanggal_lahir DATE NOT NULL,
      jenis_kelamin ENUM('L', 'P') NOT NULL,
      agama VARCHAR(20) NOT NULL,
      kewarganegaraan VARCHAR(30) DEFAULT 'WNI',
      berkebutuhan_khusus VARCHAR(50) DEFAULT 'Tidak',

      -- Tempat Tinggal
      alamat TEXT NOT NULL,
      rt VARCHAR(5),
      rw VARCHAR(5),
      dusun VARCHAR(50),
      kelurahan VARCHAR(50),
      kecamatan VARCHAR(50),
      kabupaten VARCHAR(50),
      provinsi VARCHAR(50),
      kode_pos VARCHAR(10),
      jarak_rumah VARCHAR(20),
      transportasi VARCHAR(50),

      -- Kontak
      no_telp VARCHAR(15) NOT NULL,
      email_siswa VARCHAR(100),

      -- Data Orang Tua - Ayah
      nama_ayah VARCHAR(100),
      nik_ayah VARCHAR(16),
      pendidikan_ayah VARCHAR(30),
      pekerjaan_ayah VARCHAR(50),
      penghasilan_ayah VARCHAR(30),
      no_hp_ayah VARCHAR(15),

      -- Data Orang Tua - Ibu
      nama_ibu VARCHAR(100),
      nik_ibu VARCHAR(16),
      pendidikan_ibu VARCHAR(30),
      pekerjaan_ibu VARCHAR(50),
      penghasilan_ibu VARCHAR(30),
      no_hp_ibu VARCHAR(15),

      -- Data Wali
      nama_wali VARCHAR(100),
      no_hp_wali VARCHAR(15),

      -- Asal Sekolah
      asal_sekolah VARCHAR(100) NOT NULL,
      npsn_asal VARCHAR(10),
      kabupaten_asal VARCHAR(50),
      tahun_lulus YEAR,

      -- Data Pendaftaran
      nilai_rata_rata DECIMAL(4,2) NOT NULL,
      pilihan1 INT,
      pilihan2 INT,
      jalur_pendaftaran VARCHAR(50) DEFAULT 'muhammadiyah',

      -- Status & Berkas
      status ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending',
      catatan TEXT,
      foto VARCHAR(255),
      ijazah VARCHAR(255),
      kk VARCHAR(255),

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pilihan1) REFERENCES jurusan(id),
      FOREIGN KEY (pilihan2) REFERENCES jurusan(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('✅ Tabel berhasil dibuat');

  // Seed jurusan
  const jurusan = [
    ['Teknik Komputer dan Jaringan', 'TKJ', 36, 'Mempelajari jaringan komputer, instalasi, dan pemeliharaan sistem komputer'],
    ['Rekayasa Perangkat Lunak', 'RPL', 36, 'Mempelajari pengembangan perangkat lunak, pemrograman, dan database'],
    ['Multimedia', 'MM', 36, 'Mempelajari desain grafis, editing video, dan produksi multimedia'],
    ['Akuntansi dan Keuangan', 'AK', 36, 'Mempelajari akuntansi, keuangan bisnis, dan perpajakan'],
    ['Administrasi Perkantoran', 'AP', 36, 'Mempelajari manajemen perkantoran, kearsipan, dan korespondensi'],
    ['Bisnis Daring dan Pemasaran', 'BDP', 36, 'Mempelajari pemasaran digital, e-commerce, dan manajemen bisnis'],
  ];

  for (const [nama, kode, kuota, deskripsi] of jurusan) {
    await conn.query(
      'INSERT IGNORE INTO jurusan (nama, kode, kuota, deskripsi) VALUES (?, ?, ?, ?)',
      [nama, kode, kuota, deskripsi]
    );
  }

  console.log('✅ Data jurusan berhasil ditambahkan');

  // Seed admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await conn.query(
    'INSERT IGNORE INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
    ['Administrator', 'admin@spmb.sch.id', adminPassword, 'admin']
  );

  console.log('✅ Akun admin berhasil dibuat');
  console.log('');
  console.log('📋 Informasi Login Admin:');
  console.log('   Email   : admin@spmb.sch.id');
  console.log('   Password: admin123');
  console.log('');
  console.log('🎉 Seed database selesai!');

  await conn.end();
}

seed().catch(err => {
  console.error('❌ Error saat seed:', err.message);
  process.exit(1);
});

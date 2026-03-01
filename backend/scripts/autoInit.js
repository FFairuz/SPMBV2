/**
 * autoInit.js — Dipanggil otomatis saat server start.
 * Membuat semua tabel yang diperlukan (CREATE TABLE IF NOT EXISTS)
 * dan mengisi data default jika belum ada.
 * AMAN dijalankan berkali-kali — tidak menghapus data yang sudah ada.
 */
const bcrypt = require('bcryptjs');

module.exports = async function autoInit(db) {
  console.log('🔧 Inisialisasi database...');

  // ── USERS ────────────────────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT PRIMARY KEY AUTO_INCREMENT,
      nama          VARCHAR(100) NOT NULL,
      email         VARCHAR(100) UNIQUE NOT NULL,
      password      VARCHAR(255) NOT NULL,
      role          ENUM('admin','panitia','bendahara','staff','siswa') DEFAULT 'siswa',
      is_verified   TINYINT(1) DEFAULT 0,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── JURUSAN ──────────────────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS jurusan (
      id          INT PRIMARY KEY AUTO_INCREMENT,
      nama        VARCHAR(100) NOT NULL,
      kode        VARCHAR(10)  UNIQUE NOT NULL,
      kuota       INT NOT NULL DEFAULT 30,
      deskripsi   TEXT,
      logo        VARCHAR(255),
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── PENDAFTARAN ───────────────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS pendaftaran (
      id                  INT PRIMARY KEY AUTO_INCREMENT,
      user_id             INT NOT NULL,
      nomor_pendaftaran   VARCHAR(25) UNIQUE NOT NULL,
      nama_lengkap        VARCHAR(100) NOT NULL,
      nik                 VARCHAR(16) NOT NULL,
      nisn                VARCHAR(10),
      tempat_lahir        VARCHAR(50) NOT NULL,
      tanggal_lahir       DATE NOT NULL,
      jenis_kelamin       ENUM('L','P') NOT NULL,
      agama               VARCHAR(20) NOT NULL,
      kewarganegaraan     VARCHAR(30) DEFAULT 'WNI',
      berkebutuhan_khusus VARCHAR(50) DEFAULT 'Tidak',
      alamat              TEXT NOT NULL,
      rt                  VARCHAR(5),
      rw                  VARCHAR(5),
      dusun               VARCHAR(60),
      kelurahan           VARCHAR(60),
      kecamatan           VARCHAR(60),
      kabupaten           VARCHAR(60),
      provinsi            VARCHAR(60),
      kode_pos            VARCHAR(10),
      jarak_rumah         VARCHAR(20),
      transportasi        VARCHAR(50),
      no_telp             VARCHAR(15) NOT NULL,
      email_siswa         VARCHAR(100),
      nama_ayah           VARCHAR(100),
      nik_ayah            VARCHAR(20),
      pendidikan_ayah     VARCHAR(30),
      pekerjaan_ayah      VARCHAR(60),
      penghasilan_ayah    VARCHAR(30),
      no_hp_ayah          VARCHAR(15),
      nama_ibu            VARCHAR(100),
      nik_ibu             VARCHAR(20),
      pendidikan_ibu      VARCHAR(30),
      pekerjaan_ibu       VARCHAR(60),
      penghasilan_ibu     VARCHAR(30),
      no_hp_ibu           VARCHAR(15),
      nama_wali           VARCHAR(100),
      no_hp_wali          VARCHAR(15),
      asal_sekolah        VARCHAR(100) NOT NULL,
      npsn_asal           VARCHAR(10),
      kabupaten_asal      VARCHAR(60),
      tahun_lulus         YEAR,
      nilai_rata_rata     DECIMAL(4,2),
      pilihan1            INT,
      pilihan2            INT,
      jalur_pendaftaran   VARCHAR(50) DEFAULT 'reguler',
      status              ENUM('pending','diterima','ditolak') DEFAULT 'pending',
      catatan             TEXT,
      foto                VARCHAR(255),
      ijazah              VARCHAR(255),
      kk                  VARCHAR(255),
      is_verified         TINYINT(1) DEFAULT 0,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pilihan1)  REFERENCES jurusan(id),
      FOREIGN KEY (pilihan2)  REFERENCES jurusan(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── SEKOLAH ───────────────────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS sekolah (
      id              INT PRIMARY KEY AUTO_INCREMENT,
      nama_sekolah    VARCHAR(150) NOT NULL,
      npsn            VARCHAR(10),
      kepala_sekolah  VARCHAR(100),
      alamat          TEXT,
      kota            VARCHAR(60),
      provinsi        VARCHAR(60),
      telpon          VARCHAR(20),
      email           VARCHAR(100),
      website         VARCHAR(150),
      logo            VARCHAR(255),
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── MASTER ASAL SEKOLAH ───────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS master_asal_sekolah (
      id            INT PRIMARY KEY AUTO_INCREMENT,
      nama_sekolah  VARCHAR(150) NOT NULL,
      npsn          VARCHAR(10),
      tipe          ENUM('Negeri','Swasta') DEFAULT 'Negeri',
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── PEMBAYARAN ────────────────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS pembayaran (
      id                INT PRIMARY KEY AUTO_INCREMENT,
      pendaftaran_id    INT NOT NULL,
      nominal           DECIMAL(12,2) NOT NULL,
      status            ENUM('belum_bayar','lunas','cicilan') DEFAULT 'belum_bayar',
      tanggal_bayar     DATE,
      keterangan        TEXT,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── PENGATURAN PENDAFTARAN ────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS pengaturan_pendaftaran (
      id              INT PRIMARY KEY AUTO_INCREMENT,
      is_open         TINYINT(1) DEFAULT 1,
      tanggal_buka    DATE,
      tanggal_tutup   DATE,
      biaya_pendaftaran DECIMAL(12,2) DEFAULT 0,
      pengumuman      TEXT,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── FORM FIELD SETTINGS ───────────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS form_field_settings (
      field_key   VARCHAR(50) PRIMARY KEY,
      label       VARCHAR(100) NOT NULL,
      section     VARCHAR(50)  NOT NULL,
      is_required TINYINT(1) DEFAULT 1,
      is_enabled  TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── DEFAULT DATA ──────────────────────────────────────────────────────────

  // Admin default
  const [[adminExists]] = await db.query(
    "SELECT id FROM users WHERE email = 'admin@spmb.sch.id' LIMIT 1"
  );
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await db.query(
      'INSERT INTO users (nama, email, password, role, is_verified) VALUES (?,?,?,?,1)',
      ['Administrator', 'admin@spmb.sch.id', hash, 'admin']
    );
    console.log('✅ Akun admin dibuat: admin@spmb.sch.id / admin123');
  }

  // Sekolah default
  const [[sekolahExists]] = await db.query('SELECT id FROM sekolah WHERE id=1 LIMIT 1');
  if (!sekolahExists) {
    await db.query(
      `INSERT INTO sekolah (id, nama_sekolah, kota) VALUES (1, 'Sekolah Kami', 'Kota')
       ON DUPLICATE KEY UPDATE nama_sekolah=nama_sekolah`
    );
  }

  // Jurusan default
  const defaultJurusan = [
    ['Teknik Komputer dan Jaringan', 'TKJ', 36, 'Mempelajari jaringan komputer dan sistem'],
    ['Rekayasa Perangkat Lunak',     'RPL', 36, 'Mempelajari pengembangan perangkat lunak'],
    ['Multimedia',                   'MM',  36, 'Mempelajari desain grafis dan produksi media'],
    ['Akuntansi dan Keuangan',        'AK',  36, 'Mempelajari akuntansi dan keuangan bisnis'],
    ['Administrasi Perkantoran',      'AP',  36, 'Mempelajari manajemen perkantoran'],
    ['Bisnis Daring dan Pemasaran',   'BDP', 36, 'Mempelajari pemasaran digital dan e-commerce'],
  ];
  for (const [nama, kode, kuota, deskripsi] of defaultJurusan) {
    await db.query(
      'INSERT IGNORE INTO jurusan (nama, kode, kuota, deskripsi) VALUES (?,?,?,?)',
      [nama, kode, kuota, deskripsi]
    );
  }

  // Pengaturan default
  const [[pengaturanExists]] = await db.query('SELECT id FROM pengaturan_pendaftaran LIMIT 1');
  if (!pengaturanExists) {
    await db.query('INSERT INTO pengaturan_pendaftaran (is_open) VALUES (1)');
  }

  console.log('✅ Database siap digunakan');
};

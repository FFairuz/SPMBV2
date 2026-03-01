const mysql2 = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function migrate() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spmb_db',
  });

  console.log('🔧 Menjalankan migrasi kolom baru...');

  const alterColumns = [
    // Identitas Pribadi
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS nisn VARCHAR(10) AFTER nik",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS kewarganegaraan VARCHAR(30) DEFAULT 'WNI' AFTER agama",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS berkebutuhan_khusus VARCHAR(50) DEFAULT 'Tidak' AFTER kewarganegaraan",

    // Data Tempat Tinggal
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS rt VARCHAR(5) AFTER alamat",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS rw VARCHAR(5) AFTER rt",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS dusun VARCHAR(60) AFTER rw",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS kelurahan VARCHAR(60) AFTER dusun",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(60) AFTER kelurahan",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS kabupaten VARCHAR(60) AFTER kecamatan",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS provinsi VARCHAR(60) AFTER kabupaten",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS kode_pos VARCHAR(10) AFTER provinsi",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS jarak_rumah VARCHAR(20) AFTER kode_pos",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS transportasi VARCHAR(50) AFTER jarak_rumah",

    // Kontak
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS email_siswa VARCHAR(100) AFTER no_telp",

    // Data Orang Tua
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS nama_ayah VARCHAR(100) AFTER email_siswa",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS nik_ayah VARCHAR(20) AFTER nama_ayah",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS pendidikan_ayah VARCHAR(30) AFTER nik_ayah",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS pekerjaan_ayah VARCHAR(60) AFTER pendidikan_ayah",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS penghasilan_ayah VARCHAR(30) AFTER pekerjaan_ayah",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS no_hp_ayah VARCHAR(15) AFTER penghasilan_ayah",

    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS nama_ibu VARCHAR(100) AFTER no_hp_ayah",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS nik_ibu VARCHAR(20) AFTER nama_ibu",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS pendidikan_ibu VARCHAR(30) AFTER nik_ibu",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS pekerjaan_ibu VARCHAR(60) AFTER pendidikan_ibu",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS penghasilan_ibu VARCHAR(30) AFTER pekerjaan_ibu",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS no_hp_ibu VARCHAR(15) AFTER penghasilan_ibu",

    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS nama_wali VARCHAR(100) AFTER no_hp_ibu",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS no_hp_wali VARCHAR(15) AFTER nama_wali",

    // Asal Sekolah
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS npsn_asal VARCHAR(10) AFTER asal_sekolah",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS kabupaten_asal VARCHAR(60) AFTER npsn_asal",
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS tahun_lulus YEAR AFTER kabupaten_asal",

    // Pendaftaran
    "ALTER TABLE pendaftaran ADD COLUMN IF NOT EXISTS jalur_pendaftaran ENUM('reguler','prestasi','zonasi','afirmasi') DEFAULT 'reguler' AFTER pilihan2",
  ];

  for (const sql of alterColumns) {
    try {
      await conn.query(sql);
    } catch (e) {
      if (!e.message.includes('Duplicate column')) {
        console.warn('  ⚠️ ', e.message);
      }
    }
  }

  console.log('✅ Migrasi selesai!');
  await conn.end();
}

migrate().catch(err => {
  console.error('❌ Migrasi gagal:', err.message);
  process.exit(1);
});

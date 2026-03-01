const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function run() {
  const [[user]] = await db.query("SELECT id FROM users WHERE email='budi.santoso@siswa.spmb.id'");
  let uid = user?.id;
  if (!uid) {
    const hash = await bcrypt.hash('123456', 10);
    const [r] = await db.query(
      "INSERT INTO users (nama, email, password, role) VALUES ('Budi Santoso', 'budi.santoso@siswa.spmb.id', ?, 'siswa')",
      [hash]
    );
    uid = r.insertId;
    console.log('✅ User created id:', uid);
  } else {
    console.log('ℹ️  User exists id:', uid);
  }

  const [[existing]] = await db.query('SELECT id FROM pendaftaran WHERE user_id=?', [uid]);
  if (existing) {
    console.log('ℹ️  Pendaftaran already exists id:', existing.id);
    process.exit(0);
  }

  const [[j]] = await db.query('SELECT id FROM jurusan LIMIT 1');
  if (!j) { console.error('❌ No jurusan found'); process.exit(1); }

  const [ins] = await db.query(
    `INSERT INTO pendaftaran (user_id, nomor_pendaftaran, nama_lengkap, nik, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, kewarganegaraan, berkebutuhan_khusus, alamat, rt, rw, kelurahan, kecamatan, kabupaten, provinsi, kode_pos, jarak_rumah, transportasi, no_telp, email_siswa, nama_ayah, nama_ibu, asal_sekolah, tahun_lulus, nilai_rata_rata, pilihan1, jalur_pendaftaran, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      uid, 'SPMB-202602-0001', 'Budi Santoso', '3201010101090001',
      'Jakarta', '2009-01-01', 'L', 'Islam', 'WNI', 'Tidak',
      'Jl. Merdeka No. 1', '001', '002', 'Merdeka', 'Gambir',
      'Jakarta Pusat', 'DKI Jakarta', '10110', '2 km', 'Sepeda motor',
      '081234567890', 'budi.santoso@siswa.spmb.id',
      'Santoso', 'Dewi', 'SMP Negeri 1 Jakarta',
      2025, 88.75, j.id, 'muhammadiyah', 'pending'
    ]
  );
  console.log('✅ Pendaftaran created id:', ins.insertId);
  process.exit(0);
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });

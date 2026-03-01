const db = require('../config/database');
const bcrypt = require('bcryptjs');

const jurusans = [
  { id: 1, kode: 'TJKT' },
  { id: 7, kode: 'TKL' },
  { id: 8, kode: 'TO' },
  { id: 10, kode: 'TUNAS' },
];

const dummies = [
  {
    jurusanId: 1,
    email: 'andi.pratama@siswa.spmb.id',
    nama: 'Andi Pratama',
    nik: '3201010101010001',
    nisn: '0011223344',
    tempat_lahir: 'Bandung',
    tanggal_lahir: '2009-03-15',
    jenis_kelamin: 'L',
    agama: 'Islam',
    alamat: 'Jl. Merdeka No. 12',
    kelurahan: 'Sukasari',
    kecamatan: 'Bandung Wetan',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    kode_pos: '40117',
    no_telp: '081211110001',
    asal_sekolah: 'SMP Negeri 1 Bandung',
    tahun_lulus: 2025,
    nilai_rata_rata: 87.50,
    jalur: 'reguler',
    status: 'diterima',
  },
  {
    jurusanId: 7,
    email: 'siti.rahayu@siswa.spmb.id',
    nama: 'Siti Rahayu',
    nik: '3201020202020002',
    nisn: '0022334455',
    tempat_lahir: 'Bekasi',
    tanggal_lahir: '2009-06-20',
    jenis_kelamin: 'P',
    agama: 'Islam',
    alamat: 'Jl. Pahlawan No. 45',
    kelurahan: 'Margahayu',
    kecamatan: 'Bekasi Selatan',
    kabupaten: 'Kota Bekasi',
    provinsi: 'Jawa Barat',
    kode_pos: '17142',
    no_telp: '081222220002',
    asal_sekolah: 'SMP Negeri 3 Bekasi',
    tahun_lulus: 2025,
    nilai_rata_rata: 84.25,
    jalur: 'reguler',
    status: 'pending',
  },
  {
    jurusanId: 8,
    email: 'rizky.firmansyah@siswa.spmb.id',
    nama: 'Rizky Firmansyah',
    nik: '3201030303030003',
    nisn: '0033445566',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '2009-09-10',
    jenis_kelamin: 'L',
    agama: 'Kristen',
    alamat: 'Jl. Sudirman No. 7',
    kelurahan: 'Tanah Abang',
    kecamatan: 'Tanah Abang',
    kabupaten: 'Jakarta Pusat',
    provinsi: 'DKI Jakarta',
    kode_pos: '10250',
    no_telp: '081233330003',
    asal_sekolah: 'SMP Swasta Budi Mulia',
    tahun_lulus: 2025,
    nilai_rata_rata: 81.00,
    jalur: 'prestasi',
    status: 'diterima',
  },
  {
    jurusanId: 10,
    email: 'dewi.kusuma@siswa.spmb.id',
    nama: 'Dewi Kusuma Wardani',
    nik: '3201040404040004',
    nisn: '0044556677',
    tempat_lahir: 'Surabaya',
    tanggal_lahir: '2009-12-05',
    jenis_kelamin: 'P',
    agama: 'Katolik',
    alamat: 'Jl. Diponegoro No. 88',
    kelurahan: 'Gubeng',
    kecamatan: 'Gubeng',
    kabupaten: 'Surabaya',
    provinsi: 'Jawa Timur',
    kode_pos: '60281',
    no_telp: '081244440004',
    asal_sekolah: 'SMP Negeri 5 Surabaya',
    tahun_lulus: 2025,
    nilai_rata_rata: 88.75,
    jalur: 'prestasi',
    status: 'pending',
  },
];

async function seed() {
  const passwordHash = await bcrypt.hash('123456', 10);
  let inserted = 0;

  for (const d of dummies) {
    // Skip if user already exists
    const [[existing]] = await db.query('SELECT id FROM users WHERE email=?', [d.email]);
    if (existing) {
      console.log(`⏭️  Skip (sudah ada): ${d.email}`);
      continue;
    }

    // Create user
    const [userResult] = await db.query(
      'INSERT INTO users (email, password, role) VALUES (?, ?, "siswa")',
      [d.email, passwordHash]
    );
    const userId = userResult.insertId;

    // Generate nomor pendaftaran: SPMB-YYYYMM-XXXX
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) as cnt FROM pendaftaran');
    const nomorUrut = String(cnt + 1).padStart(4, '0');
    const nomorPendaftaran = `SPMB-${ym}-${nomorUrut}`;

    // Insert pendaftaran
    await db.query(
      `INSERT INTO pendaftaran (
        user_id, nomor_pendaftaran, nama_lengkap, nik, nisn,
        tempat_lahir, tanggal_lahir, jenis_kelamin, agama,
        alamat, kelurahan, kecamatan, kabupaten, provinsi, kode_pos,
        no_telp, asal_sekolah, tahun_lulus, nilai_rata_rata,
        pilihan1, jalur_pendaftaran, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId, nomorPendaftaran, d.nama, d.nik, d.nisn,
        d.tempat_lahir, d.tanggal_lahir, d.jenis_kelamin, d.agama,
        d.alamat, d.kelurahan, d.kecamatan, d.kabupaten, d.provinsi, d.kode_pos,
        d.no_telp, d.asal_sekolah, d.tahun_lulus, d.nilai_rata_rata,
        d.jurusanId, d.jalur, d.status,
      ]
    );

    console.log(`✅ ${nomorPendaftaran} — ${d.nama} (${d.email}) → Jurusan ID ${d.jurusanId} [${d.status}]`);
    inserted++;
  }

  console.log(`\n🎉 Selesai! ${inserted} data dummy ditambahkan.`);
  process.exit(0);
}

seed().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });

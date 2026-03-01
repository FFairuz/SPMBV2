const mysql2 = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const data = [
  // Negeri
  { nama_sekolah: 'SMP Negeri 1 Kota',        npsn: '20101001', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 2 Kota',        npsn: '20101002', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 3 Kota',        npsn: '20101003', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 4 Kota',        npsn: '20101004', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 5 Kota',        npsn: '20101005', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 1 Kabupaten',   npsn: '20102001', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 2 Kabupaten',   npsn: '20102002', tipe: 'Negeri' },
  { nama_sekolah: 'SMP Negeri 3 Kabupaten',   npsn: '20102003', tipe: 'Negeri' },
  { nama_sekolah: 'MTs Negeri 1 Kota',        npsn: '20203001', tipe: 'Negeri' },
  { nama_sekolah: 'MTs Negeri 2 Kota',        npsn: '20203002', tipe: 'Negeri' },
  { nama_sekolah: 'MTs Negeri 1 Kabupaten',   npsn: '20204001', tipe: 'Negeri' },
  // Swasta
  { nama_sekolah: 'SMP Muhammadiyah 1',       npsn: '20301001', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Muhammadiyah 2',       npsn: '20301002', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Muhammadiyah 3',       npsn: '20301003', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Islam Terpadu Al-Hikmah', npsn: '20302001', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Islam Terpadu Nurul Fikri', npsn: '20302002', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Kristen Pelita Bangsa', npsn: '20303001', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Santo Yusuf',          npsn: '20303002', tipe: 'Swasta' },
  { nama_sekolah: 'SMP PGRI 1',               npsn: '20304001', tipe: 'Swasta' },
  { nama_sekolah: 'SMP PGRI 2',               npsn: '20304002', tipe: 'Swasta' },
  { nama_sekolah: 'MTs Muhammadiyah 1',       npsn: '20305001', tipe: 'Swasta' },
  { nama_sekolah: 'MTs Muhammadiyah 2',       npsn: '20305002', tipe: 'Swasta' },
  { nama_sekolah: 'MTs Al-Ikhlas',            npsn: '20306001', tipe: 'Swasta' },
  { nama_sekolah: 'MTs Darul Ulum',           npsn: '20306002', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Advent',               npsn: '20307001', tipe: 'Swasta' },
  { nama_sekolah: 'SMP Cendekia Muda',        npsn: '20308001', tipe: 'Swasta' },
];

async function seed() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spmb_db',
  });

  console.log('🏫 Seeding data asal sekolah...');

  // Buat tabel jika belum ada
  await conn.query(`
    CREATE TABLE IF NOT EXISTS master_asal_sekolah (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama_sekolah VARCHAR(255) NOT NULL,
      npsn VARCHAR(20) DEFAULT NULL,
      tipe ENUM('Negeri','Swasta') DEFAULT 'Negeri',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Kosongkan dulu supaya tidak duplikat
  await conn.query(`TRUNCATE TABLE master_asal_sekolah`);

  for (const row of data) {
    await conn.query(
      'INSERT INTO master_asal_sekolah (nama_sekolah, npsn, tipe) VALUES (?, ?, ?)',
      [row.nama_sekolah, row.npsn, row.tipe]
    );
  }

  console.log(`✅ ${data.length} data sekolah berhasil ditambahkan.`);
  await conn.end();
}

seed().catch(err => {
  console.error('❌ Gagal:', err.message);
  process.exit(1);
});

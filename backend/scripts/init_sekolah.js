const db = require('../config/database');

async function init() {
  await db.query(`CREATE TABLE IF NOT EXISTS sekolah (
    id INT NOT NULL DEFAULT 1,
    nama VARCHAR(255) NOT NULL DEFAULT 'Sekolah Menengah Kejuruan',
    npsn VARCHAR(20) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    kota VARCHAR(100) DEFAULT NULL,
    provinsi VARCHAR(100) DEFAULT NULL,
    telepon VARCHAR(30) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    website VARCHAR(100) DEFAULT NULL,
    logo VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const [[row]] = await db.query('SELECT id FROM sekolah WHERE id=1');
  if (!row) {
    await db.query("INSERT INTO sekolah (id, nama) VALUES (1, 'Sekolah Menengah Kejuruan')");
    console.log('✅ Default row inserted');
  } else {
    console.log('ℹ️  Row already exists');
  }
  console.log('✅ Table sekolah OK');
  process.exit(0);
}

init().catch(e => { console.error(e); process.exit(1); });

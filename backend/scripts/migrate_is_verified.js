const db = require('../config/database');

async function run() {
  try {
    // Add is_verified column (1 = active, 0 = waiting activation)
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 1
    `);
    console.log('✅ Kolom is_verified berhasil ditambahkan');

    // All existing siswa accounts default to verified (so existing data is unaffected)
    // New siswa registrations will be set to 0 via the register endpoint
    // Staff (admin, panitia, bendahara) remain 1 (already default)
    console.log('✅ Migrasi selesai');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migrasi gagal:', err.message);
    process.exit(1);
  }
}

run();

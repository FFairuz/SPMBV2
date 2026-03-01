/**
 * Migration: Tambah role panitia & bendahara
 * Jalankan: node scripts/migrate_roles.js
 */
const db = require('../config/database');

async function migrateRoles() {
  try {
    console.log('🔄 Migrasi role pengguna...');

    // Ubah ENUM users.role
    await db.query(`
      ALTER TABLE users
        MODIFY COLUMN role ENUM('admin','panitia','bendahara','siswa') NOT NULL DEFAULT 'siswa'
    `);
    console.log('✅ Kolom role berhasil diperbarui (admin, panitia, bendahara, siswa)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migrasi gagal:', err.message);
    process.exit(1);
  }
}

migrateRoles();

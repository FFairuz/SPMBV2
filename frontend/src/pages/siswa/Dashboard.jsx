import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, ArrowRight, User, ShieldAlert } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getUser } from '../../utils/auth';
import api from '../../utils/api';

const statusConfig = {
  pending: { label: 'Menunggu Verifikasi', icon: <Clock size={20} />, color: 'warning' },
  diterima: { label: 'Diterima', icon: <CheckCircle size={20} />, color: 'success' },
  ditolak: { label: 'Ditolak', icon: <XCircle size={20} />, color: 'danger' },
};

export default function SiswaDashboard() {
  const user = getUser();
  const [pendaftaran, setPendaftaran] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pendaftaran/saya')
      .then(res => setPendaftaran(res.data))
      .catch(() => setPendaftaran(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const isVerified = user?.is_verified !== false;

  return (
    <Layout>
        {/* Banner akun belum aktif */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fef9c3', border: '1.5px solid #fde047', borderRadius: 12,
              padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14
            }}
          >
            <ShieldAlert size={24} style={{ color: '#ca8a04', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#92400e', fontSize: 15, marginBottom: 4 }}>
                Akun Anda Belum Diaktifkan
              </div>
              <div style={{ color: '#78350f', fontSize: 14 }}>
                Untuk dapat mengisi formulir pendaftaran, akun Anda perlu diaktifkan terlebih dahulu
                oleh panitia atau admin. Silakan hubungi panitia sekolah untuk aktivasi.
              </div>
            </div>
          </motion.div>
        )}
        {/* Welcome */}
        <motion.div
          className="welcome-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="welcome-icon"><User size={32} /></div>
          <div>
            <h2>Selamat Datang, {user?.nama}! 👋</h2>
            <p>Ini adalah dashboard pendaftaran SPMB Online Anda.</p>
          </div>
        </motion.div>

        {/* Status Card */}
        {pendaftaran ? (
          <motion.div
            className="status-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="status-header">
              <h3>Status Pendaftaran</h3>
              <span className={`badge badge-${statusConfig[pendaftaran.status]?.color}`}>
                {statusConfig[pendaftaran.status]?.icon}
                {statusConfig[pendaftaran.status]?.label}
              </span>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nomor Pendaftaran</span>
                <span className="info-value mono">{pendaftaran.nomor_pendaftaran}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Nama Lengkap</span>
                <span className="info-value">{pendaftaran.nama_lengkap}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Pilihan Jurusan 1</span>
                <span className="info-value">{pendaftaran.jurusan1}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Pilihan Jurusan 2</span>
                <span className="info-value">{pendaftaran.jurusan2 || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Nilai Rata-rata</span>
                <span className="info-value">{pendaftaran.nilai_rata_rata}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tanggal Daftar</span>
                <span className="info-value">
                  {new Date(pendaftaran.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            {pendaftaran.catatan && (
              <div className="catatan-box">
                <strong>Catatan dari Admin:</strong>
                <p>{pendaftaran.catatan}</p>
              </div>
            )}
            <Link to="/status" className="btn-link">
              Lihat Detail Lengkap <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="empty-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FileText size={56} className="empty-icon" />
            <h3>Belum Ada Pendaftaran</h3>
            {isVerified ? (
              <>
                <p>Anda belum mengisi formulir pendaftaran. Segera lengkapi data Anda!</p>
                <Link to="/pendaftaran" className="btn-primary-lg">
                  Mulai Pendaftaran <ArrowRight size={18} />
                </Link>
              </>
            ) : (
              <p style={{ color: '#ca8a04', fontWeight: 600 }}>Akun belum aktif — hubungi panitia untuk aktivasi.</p>
            )}
          </motion.div>
        )}

        {/* Quick Links */}
        <div className="quick-links">
          {isVerified ? (
            <Link to="/pendaftaran" className={`quick-card ${pendaftaran ? 'disabled' : ''}`}>
              <FileText size={24} />
              <span>{pendaftaran ? 'Formulir Terisi' : 'Isi Formulir'}</span>
            </Link>
          ) : (
            <div className="quick-card" style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
              <FileText size={24} />
              <span>Formulir (Terkunci)</span>
            </div>
          )}
          <Link to="/status" className="quick-card">
            <Clock size={24} />
            <span>Cek Status</span>
          </Link>
        </div>
    </Layout>
  );
}

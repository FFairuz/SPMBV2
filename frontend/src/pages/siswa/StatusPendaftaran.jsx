import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, FileText, User, School, Hash } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

const statusConfig = {
  pending: {
    label: 'Menunggu Verifikasi',
    icon: <Clock size={28} />,
    color: 'warning',
    desc: 'Berkas Anda sedang dalam proses verifikasi oleh panitia. Harap bersabar.',
    bg: '#fffbeb'
  },
  diterima: {
    label: 'DITERIMA ✓',
    icon: <CheckCircle size={28} />,
    color: 'success',
    desc: 'Selamat! Anda diterima. Harap melakukan daftar ulang sesuai jadwal yang ditentukan.',
    bg: '#f0fdf4'
  },
  ditolak: {
    label: 'Tidak Diterima',
    icon: <XCircle size={28} />,
    color: 'danger',
    desc: 'Maaf, Anda tidak diterima pada seleksi ini. Semangat dan terus berusaha!',
    bg: '#fff1f2'
  },
};

export default function StatusPendaftaran() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pendaftaran/saya')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const status = data ? statusConfig[data.status] : null;

  return (
    <Layout>
        <motion.div
          className="status-page"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="page-title">Status Pendaftaran</h2>

          {!data ? (
            <div className="empty-card">
              <FileText size={56} className="empty-icon" />
              <h3>Belum Ada Pendaftaran</h3>
              <p>Anda belum mengisi formulir pendaftaran.</p>
              <a href="/pendaftaran" className="btn-primary-lg">Mulai Pendaftaran</a>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className={`status-banner ${status.color}`} style={{ background: status.bg }}>
                <div className={`status-banner-icon ${status.color}`}>{status.icon}</div>
                <div>
                  <h3>{status.label}</h3>
                  <p>{status.desc}</p>
                  {data.catatan && (
                    <div className="catatan-box mt">
                      <strong>Catatan Panitia:</strong> {data.catatan}
                    </div>
                  )}
                </div>
              </div>

              {/* Nomor Pendaftaran */}
              <div className="nomor-card">
                <Hash size={18} />
                <span>Nomor Pendaftaran: </span>
                <strong className="mono">{data.nomor_pendaftaran}</strong>
              </div>

              {/* Detail */}
              <div className="detail-sections">
                <div className="detail-section">
                  <h4><User size={16} /> Data Diri</h4>
                  <table className="detail-table">
                    <tbody>
                      <tr><td>Nama Lengkap</td><td>{data.nama_lengkap}</td></tr>
                      <tr><td>NIK</td><td>{data.nik}</td></tr>
                      <tr><td>Tempat, Tgl Lahir</td><td>{data.tempat_lahir}, {new Date(data.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                      <tr><td>Jenis Kelamin</td><td>{data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                      <tr><td>Agama</td><td>{data.agama}</td></tr>
                      <tr><td>Alamat</td><td>{data.alamat}</td></tr>
                      <tr><td>No. Telepon</td><td>{data.no_telp}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="detail-section">
                  <h4><School size={16} /> Data Sekolah & Jurusan</h4>
                  <table className="detail-table">
                    <tbody>
                      <tr><td>Asal Sekolah</td><td>{data.asal_sekolah}</td></tr>
                      <tr><td>Nilai Rata-rata</td><td>{data.nilai_rata_rata}</td></tr>
                      <tr><td>Pilihan Jurusan 1</td><td><strong>{data.kode1} - {data.jurusan1}</strong></td></tr>
                      <tr><td>Pilihan Jurusan 2</td><td>{data.jurusan2 ? `${data.kode2} - ${data.jurusan2}` : '-'}</td></tr>
                      <tr><td>Tanggal Daftar</td><td>{new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
    </Layout>
  );
}

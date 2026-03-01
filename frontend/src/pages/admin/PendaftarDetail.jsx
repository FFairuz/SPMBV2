import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Clock, Save, FileImage, Pencil, Printer, KeyRound, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function PendaftarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    api.get(`/admin/pendaftar/${id}`)
      .then(res => {
        setData(res.data);
        setStatus(res.data.status);
        setCatatan(res.data.catatan || '');
      })
      .catch(() => toast.error('Data tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/pendaftar/${id}/status`, { status, catatan });
      toast.success('Status berhasil diperbarui');
      setData(prev => ({ ...prev, status, catatan }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!data) return <Layout><p style={{padding:40,color:'#6b7280'}}>Data tidak ditemukan</p></Layout>;

  const fileUrl = (filename) => filename ? `${API_URL}/uploads/${filename}` : null;

  return (
    <Layout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header">
            <button className="btn-back-nav" onClick={() => navigate('/admin/pendaftar')}>
              <ArrowLeft size={18} /> Kembali
            </button>
            <div>
              <h2>Detail Pendaftar</h2>
              <p className="mono">{data.nomor_pendaftaran}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <Link to={`/admin/pendaftar/${id}/cetak`} className="btn-action-cetak">
                <Printer size={15} /> Cetak Formulir
              </Link>
              <Link to={`/admin/pendaftar/${id}/edit`} className="btn-action-edit">
                <Pencil size={15} /> Edit Formulir
              </Link>
            </div>
          </div>

          <div className="detail-layout">
            {/* Left: Info */}
            <div className="detail-main">
              {/* Identitas */}
              <div className="detail-section">
                <h4>Data Diri</h4>
                <table className="detail-table">
                  <tbody>
                    <tr><td>Nama Lengkap</td><td><strong>{data.nama_lengkap}</strong></td></tr>
                    <tr><td>NIK</td><td className="mono">{data.nik}</td></tr>
                    <tr><td>Email</td><td>{data.email}</td></tr>
                    <tr><td>Tempat, Tgl Lahir</td><td>{data.tempat_lahir}, {new Date(data.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                    <tr><td>Jenis Kelamin</td><td>{data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                    <tr><td>Agama</td><td>{data.agama}</td></tr>
                    <tr><td>Alamat</td><td>{data.alamat}</td></tr>
                    <tr><td>No. Telepon</td><td>{data.no_telp}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Akademik */}
              <div className="detail-section">
                <h4>Data Sekolah & Jurusan</h4>
                <table className="detail-table">
                  <tbody>
                    <tr><td>Asal Sekolah</td><td>{data.asal_sekolah}</td></tr>
                    <tr><td>Nilai Rata-rata</td><td><strong>{data.nilai_rata_rata}</strong></td></tr>
                    <tr><td>Pilihan Jurusan 1</td><td><strong>{data.kode1} - {data.jurusan1}</strong></td></tr>
                    <tr><td>Pilihan Jurusan 2</td><td>{data.jurusan2 ? `${data.kode2} - ${data.jurusan2}` : '-'}</td></tr>
                    <tr><td>Tanggal Daftar</td><td>{new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Dokumen */}
              <div className="detail-section">
                <h4>Dokumen</h4>
                <div className="doc-grid">
                  {[
                    { label: 'Pas Foto', file: data.foto },
                    { label: 'Ijazah/SKL', file: data.ijazah },
                    { label: 'Kartu Keluarga', file: data.kk }
                  ].map(({ label, file }) => (
                    <div key={label} className="doc-item">
                      <p>{label}</p>
                      {file ? (
                        <a href={fileUrl(file)} target="_blank" rel="noopener noreferrer" className="doc-link">
                          <FileImage size={16} /> Lihat Dokumen
                        </a>
                      ) : (
                        <span className="doc-empty">Belum diupload</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Verifikasi */}
            <div className="detail-sidebar">
              <div className="verifikasi-card">
                <h4>Verifikasi Status</h4>
                <p>Status saat ini:</p>
                <span className={`badge badge-lg badge-${data.status === 'pending' ? 'warning' : data.status === 'diterima' ? 'success' : 'danger'}`}>
                  {data.status === 'pending' ? <Clock size={16} /> : data.status === 'diterima' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {data.status}
                </span>

                <div className="form-group mt">
                  <label>Ubah Status</label>
                  <div className="status-radio">
                    {['pending', 'diterima', 'ditolak'].map(s => (
                      <label key={s} className={`radio-option ${status === s ? 'selected-' + s : ''}`}>
                        <input type="radio" name="status" value={s}
                          checked={status === s} onChange={() => setStatus(s)} />
                        {s === 'pending' ? '⏳' : s === 'diterima' ? '✅' : '❌'} {s.charAt(0).toUpperCase() + s.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Catatan (opsional)</label>
                  <textarea
                    value={catatan}
                    onChange={e => setCatatan(e.target.value)}
                    placeholder="Tambahkan catatan untuk siswa..."
                    rows={4}
                  />
                </div>

                <button
                  className="btn-save"
                  onClick={handleUpdateStatus}
                  disabled={saving}
                >
                  {saving ? <><span className="spinner-sm" /> Menyimpan...</> : <><Save size={16} /> Simpan Perubahan</>}
                </button>
              </div>

              {/* Login Info Card */}
              <div className="verifikasi-card" style={{ marginTop: 16 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <KeyRound size={16} /> Info Login Siswa
                </h4>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
                  Kredensial ini digunakan siswa untuk login ke portal.
                </p>
                {[{
                  label: 'Email',
                  value: data.email,
                }, {
                  label: 'Password',
                  value: data.nisn || data.nik?.slice(-6) || '—',
                  hint: data.nisn ? 'dari NISN' : '6 digit terakhir NIK',
                }].map(({ label, value, hint }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gray-500)', marginBottom: 3 }}>
                      {label}{hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 4, color: '#94a3b8' }}>({hint})</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ flex: 1, background: 'var(--gray-100)', borderRadius: 6, padding: '5px 10px', fontSize: 13, wordBreak: 'break-all' }}>
                        {value}
                      </code>
                      <button
                        type="button"
                        title="Salin"
                        onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} disalin`); }}
                        style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: 'var(--gray-500)', flexShrink: 0 }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
    </Layout>
  );
}

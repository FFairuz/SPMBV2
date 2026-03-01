import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users, Clock, CheckCircle, XCircle,
  ClipboardList, ChevronRight, GraduationCap, TrendingUp,
  ShieldCheck, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{ color, background: `${color}18`, borderRadius: 10, padding: 10, display: 'flex' }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', margin: 0, marginBottom: 4 }}>{label}</p>
      <h3 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', margin: 0 }}>{value}</h3>
    </div>
  </div>
);

const STATUS_MAP = {
  pending:  { label: 'Menunggu',  color: '#f59e0b', bg: '#fffbeb' },
  diterima: { label: 'Diterima',  color: '#10b981', bg: '#f0fdf4' },
  ditolak:  { label: 'Ditolak',   color: '#ef4444', bg: '#fef2f2' },
};

export default function PanitaDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unverified, setUnverified] = useState([]);
  const [verifying, setVerifying] = useState(null);
  const user = getUser();

  const fetchUnverified = () => {
    api.get('/admin/users/unverified').then(res => setUnverified(res.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchUnverified();
  }, []);

  const handleActivate = async (row) => {
    setVerifying(row.id);
    try {
      await api.patch(`/admin/users/${row.id}/verify`, { is_verified: true });
      toast.success(`Akun ${row.nama} berhasil diaktifkan`);
      fetchUnverified();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengaktifkan');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const chartData = stats?.jurusanStats?.map(j => ({
    name: j.kode,
    pendaftar: parseInt(j.total_pendaftar),
    diterima: parseInt(j.diterima),
    kuota: j.kuota,
  })) || [];

  return (
    <Layout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: 0 }}>
            📋 Dashboard Panitia
          </h2>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            Selamat datang, <strong>{user?.nama}</strong>! Berikut ringkasan data pendaftaran.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard icon={<Users size={24} />}       label="Total Pendaftar" value={stats?.total || 0}    color="#6366f1" />
          <StatCard icon={<Clock size={24} />}        label="Menunggu"        value={stats?.pending || 0}  color="#f59e0b" />
          <StatCard icon={<CheckCircle size={24} />}  label="Diterima"        value={stats?.diterima || 0} color="#10b981" />
          <StatCard icon={<XCircle size={24} />}      label="Ditolak"         value={stats?.ditolak || 0}  color="#ef4444" />
        </div>

        {/* Chart & Quick Links – side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, marginBottom: 24, alignItems: 'start' }}>
          {/* Bar Chart */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '20px 20px 12px' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} /> Statistik per Jurusan
            </div>
            {chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Belum ada data jurusan</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="pendaftar" name="Pendaftar" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diterima"  name="Diterima"  fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Links */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardList size={16} /> Menu Panitia
            </div>
            {[
              { to: '/admin/pendaftar',       label: 'Data Pendaftar',     desc: 'Kelola data siswa',      color: '#6366f1' },
              { to: '/admin/pendaftar?status=pending',  label: 'Perlu Verifikasi', desc: `${stats?.pending || 0} menunggu`, color: '#f59e0b' },
              { to: '/admin/jurusan',          label: 'Jurusan',            desc: 'Kelola jurusan & kuota', color: '#10b981' },
              { to: '/admin/asal-sekolah',     label: 'Asal Sekolah',      desc: 'Kelola asal sekolah',    color: '#0ea5e9' },
              { to: '/admin/pengaturan-formulir', label: 'Pengaturan Formulir', desc: 'Konfigurasi form',  color: '#8b5cf6' },
            ].map(item => (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 10px', borderRadius: 8, marginBottom: 6, textDecoration: 'none',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: item.color }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.desc}</div>
                </div>
                <ChevronRight size={14} color="#cbd5e1" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Pendaftar */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GraduationCap size={16} /> Pendaftar Terbaru
            </div>
            <Link to="/admin/pendaftar" style={{ fontSize: 13, color: '#6366f1', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Pendaftaran</th>
                  <th>Nama</th>
                  <th>Asal Sekolah</th>
                  <th>Pilihan 1</th>
                  <th>Nilai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.terbaru?.length ? (
                  <tr><td colSpan={6} className="td-empty">Belum ada data pendaftar</td></tr>
                ) : stats.terbaru.map(p => {
                  const st = STATUS_MAP[p.status] || { label: p.status, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.nomor_pendaftaran}</td>
                      <td style={{ fontWeight: 600 }}>{p.nama_lengkap}</td>
                      <td style={{ color: '#64748b' }}>{p.asal_sekolah}</td>
                      <td>{p.jurusan1 || '—'}</td>
                      <td>{p.nilai_rata_rata}</td>
                      <td>
                        <span style={{ background: st.bg, color: st.color, fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Siswa Menunggu Aktivasi */}
        {unverified.length > 0 && (
          <div style={{ background: '#fff', border: '1.5px solid #fde047', borderRadius: 12, overflow: 'hidden', marginTop: 24 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #fef9c3', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#92400e', display: 'flex', alignItems: 'center', gap: 7 }}>
                <ShieldAlert size={16} /> Siswa Menunggu Aktivasi
              </div>
              <span style={{ background: '#fde047', color: '#78350f', fontWeight: 800, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>
                {unverified.length} akun
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fefce8', textAlign: 'left', fontSize: 12, color: '#78350f' }}>
                    <th style={{ padding: '9px 16px' }}>Nama</th>
                    <th style={{ padding: '9px 16px' }}>Email</th>
                    <th style={{ padding: '9px 16px' }}>Mendaftar</th>
                    <th style={{ padding: '9px 16px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {unverified.map(row => (
                    <tr key={row.id} style={{ borderTop: '1px solid #fef9c3', fontSize: 13 }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>{row.nama}</td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>{row.email}</td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>
                        {new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleActivate(row)}
                          disabled={verifying === row.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: verifying === row.id ? 'not-allowed' : 'pointer', opacity: verifying === row.id ? 0.6 : 1 }}
                        >
                          <ShieldCheck size={14} /> {verifying === row.id ? 'Memproses...' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

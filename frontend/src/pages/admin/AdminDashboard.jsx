import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Clock, CheckCircle, XCircle,
  TrendingUp, GraduationCap, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

const STATUS_COLORS = {
  pending: '#f59e0b',
  diterima: '#10b981',
  ditolak: '#ef4444'
};

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div
    className="stat-card"
    style={{ borderLeft: `4px solid ${color}` }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <div className="stat-icon" style={{ color }}>{icon}</div>
    <div>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const chartData = stats?.jurusanStats?.map(j => ({
    name: j.kode,
    pendaftar: parseInt(j.total_pendaftar),
    diterima: parseInt(j.diterima),
    kuota: j.kuota
  })) || [];

  return (
    <Layout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="page-header">
            <h2>Dashboard Admin</h2>
            <p>Ringkasan data SPMB</p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatCard icon={<Users size={28} />} label="Total Pendaftar" value={stats?.total || 0} color="#6366f1" delay={0} />
            <StatCard icon={<Clock size={28} />} label="Menunggu" value={stats?.pending || 0} color="#f59e0b" delay={0.1} />
            <StatCard icon={<CheckCircle size={28} />} label="Diterima" value={stats?.diterima || 0} color="#10b981" delay={0.2} />
            <StatCard icon={<XCircle size={28} />} label="Ditolak" value={stats?.ditolak || 0} color="#ef4444" delay={0.3} />
          </div>

          {/* Chart */}
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3><TrendingUp size={18} /> Statistik per Jurusan</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pendaftar" name="Pendaftar" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="diterima" name="Diterima" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent */}
          <motion.div
            className="table-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="table-header">
              <h3><GraduationCap size={18} /> Pendaftar Terbaru</h3>
              <Link to="/admin/pendaftar" className="btn-text">
                Lihat Semua <ChevronRight size={16} />
              </Link>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Pendaftaran</th>
                    <th>Nama</th>
                    <th>Asal Sekolah</th>
                    <th>Jurusan 1</th>
                    <th>Nilai</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.terbaru?.length === 0 ? (
                    <tr><td colSpan={6} className="td-empty">Belum ada data pendaftar</td></tr>
                  ) : (
                    stats?.terbaru?.map(p => (
                      <tr key={p.id}>
                        <td className="mono">{p.nomor_pendaftaran}</td>
                        <td>{p.nama_lengkap}</td>
                        <td>{p.asal_sekolah}</td>
                        <td>{p.jurusan1}</td>
                        <td>{p.nilai_rata_rata}</td>
                        <td>
                          <span className={`badge badge-${p.status === 'pending' ? 'warning' : p.status === 'diterima' ? 'success' : 'danger'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
    </Layout>
  );
}

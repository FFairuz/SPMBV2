import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, TrendingUp, BadgeCheck, Clock,
  Wallet, ChevronRight, Download, AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

const fmt = (n) =>
  'Rp ' + Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 0 });

const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '20px 22px', borderLeft: `4px solid ${color}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ color, background: `${color}18`, borderRadius: 9, padding: 9, display: 'flex' }}>{icon}</div>
      <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{label}</p>
    </div>
    <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
  </div>
);

const STATUS_CONFIG = {
  lunas:      { label: 'Lunas',      color: '#16a34a', bg: '#f0fdf4' },
  cicilan:    { label: 'Cicilan',    color: '#f59e0b', bg: '#fffbeb' },
  belum_bayar:{ label: 'Belum Bayar',color: '#ef4444', bg: '#fef2f2' },
};

export default function BendaharaDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    api.get('/admin/pembayaran/statistik')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const totalLunas    = data?.perStatus?.find(s => s.status === 'lunas');
  const totalCicilan  = data?.perStatus?.find(s => s.status === 'cicilan');
  const totalBelum    = data?.perStatus?.find(s => s.status === 'belum_bayar');

  return (
    <Layout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: 0 }}>
            💰 Dashboard Bendahara
          </h2>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            Selamat datang, <strong>{user?.nama}</strong>! Berikut ringkasan keuangan SPMB.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard
            icon={<TrendingUp size={22} />}
            label="Pendapatan Hari Ini"
            value={fmt(data?.hari?.total_nominal)}
            sub={`${data?.hari?.total_transaksi || 0} transaksi`}
            color="#6366f1"
          />
          <StatCard
            icon={<CreditCard size={22} />}
            label="Pendapatan Bulan Ini"
            value={fmt(data?.bulan?.total_nominal)}
            sub={`${data?.bulan?.total_transaksi || 0} transaksi`}
            color="#0ea5e9"
          />
          <StatCard
            icon={<BadgeCheck size={22} />}
            label="Total Lunas"
            value={fmt(totalLunas?.total)}
            sub={`${totalLunas?.jumlah || 0} siswa`}
            color="#16a34a"
          />
          <StatCard
            icon={<AlertCircle size={22} />}
            label="Belum Bayar"
            value={fmt(totalBelum?.total)}
            sub={`${totalBelum?.jumlah || 0} siswa`}
            color="#ef4444"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, marginBottom: 24, alignItems: 'start' }}>
          {/* Per Status Breakdown */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={16} /> Rekap Status Pembayaran
            </div>
            {data?.perStatus?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>Belum ada transaksi</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['lunas', 'cicilan', 'belum_bayar'].map(s => {
                  const row = data?.perStatus?.find(x => x.status === s);
                  const cfg = STATUS_CONFIG[s];
                  const jumlah = row?.jumlah || 0;
                  const total  = row?.total || 0;
                  const maxTotal = Math.max(...(data?.perStatus?.map(x => Number(x.total)) || [1]));
                  const pct = maxTotal > 0 ? (Number(total) / maxTotal) * 100 : 0;
                  return (
                    <div key={s}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 6 }}>
                          {cfg.label}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>{fmt(total)}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>{jumlah} transaksi</span>
                        </div>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 4, transition: 'width .5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={16} /> Menu Bendahara
            </div>
            {[
              { to: '/admin/pembayaran',        label: 'Data Pembayaran',   desc: 'Kelola transaksi', color: '#6366f1' },
              { to: '/admin/pembayaran',         label: 'Laporan Harian',    desc: 'Export Excel per hari', color: '#16a34a', tab: 'laporan' },
            ].map((item, i) => (
              <Link key={i} to={item.to} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 10px', borderRadius: 8, marginBottom: 6, textDecoration: 'none',
                background: '#f8fafc', border: '1px solid #e2e8f0',
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

            {/* Cicilan info */}
            {(totalCicilan?.jumlah > 0) && (
              <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} /> Cicilan Berjalan
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#78350f', marginTop: 3 }}>
                  {totalCicilan?.jumlah} siswa — {fmt(totalCicilan?.total)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={16} /> Transaksi Terbaru
            </div>
            <Link to="/admin/pembayaran" style={{ fontSize: 13, color: '#6366f1', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Jur</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {!data?.terbaru?.length ? (
                  <tr><td colSpan={6} className="td-empty">Belum ada transaksi</td></tr>
                ) : data.terbaru.map(row => {
                  const cfg = STATUS_CONFIG[row.status] || { label: row.status, color: '#64748b', bg: '#f1f5f9' };
                  const tgl = new Date(row.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={row.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{row.nama_lengkap}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{row.nomor_pendaftaran}</div>
                      </td>
                      <td>{row.jurusan_kode ? <span className="badge badge-info">{row.jurusan_kode}</span> : '—'}</td>
                      <td><span className="badge badge-secondary">{row.metode_bayar}</span></td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(row.nominal)}</td>
                      <td>
                        <span style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{tgl}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

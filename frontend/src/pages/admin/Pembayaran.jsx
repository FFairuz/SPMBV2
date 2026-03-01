import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Plus, Pencil, Trash2, X, Search, CreditCard,
  BadgeCheck, Clock, AlertCircle, Wallet, Printer,
  Banknote, Send, Smartphone, MoreHorizontal,
  CalendarDays, FileText, Download,
} from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_OPTS = [
  { value: 'belum_bayar', label: 'Belum Bayar', color: '#ef4444', bg: '#fef2f2' },
  { value: 'cicilan',     label: 'Cicilan',      color: '#f59e0b', bg: '#fffbeb' },
  { value: 'lunas',       label: 'Lunas',        color: '#16a34a', bg: '#f0fdf4' },
];

const emptyForm = {
  pendaftaran_id: '',
  nominal: '',
  keterangan: '',
  cicilan_ke: '',
  metode_bayar: 'Tunai',
  status: 'belum_bayar',
  tanggal_bayar: '',
};

function fmt(n) {
  return Number(n).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
}

function StatusBadge({ status }) {
  const s = STATUS_OPTS.find(x => x.value === status) || STATUS_OPTS[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, background: s.bg, color: s.color,
    }}>
      {status === 'lunas' ? <BadgeCheck size={12} /> : status === 'cicilan' ? <Clock size={12} /> : <AlertCircle size={12} />}
      {s.label}
    </span>
  );
}

export default function Pembayaran() {
  const [rows, setRows]           = useState([]);
  const [summary, setSummary]     = useState({ total_nominal: 0, total_siswa: 0, belum_bayar: 0 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sekolah, setSekolah]     = useState(null);

  // Modal state
  const [showModal, setShowModal]   = useState(false);
  const [editData, setEditData]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Tab aktif
  const [activeTab, setActiveTab] = useState('data');

  // Student lookup
  const [siswaList, setSiswaList]   = useState([]);
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaLoading, setSiswaLoading] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);

  // Laporan harian
  const todayStr = new Date().toISOString().slice(0, 10);
  const [laporanTgl, setLaporanTgl]       = useState(todayStr);
  const [exporting, setExporting]         = useState(false);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/pembayaran/laporan-harian', { params: { tanggal: laporanTgl } });
      const data = res.data;
      const tglLabel = new Date(laporanTgl + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const namaSekolah = sekolah?.nama_sekolah || 'SEKOLAH';

      const wb = XLSX.utils.book_new();

      // ── Sheet 1: RINCIAN TRANSAKSI ──────────────────────────────
      const rincianRows = [
        [namaSekolah],
        ['Laporan Pembayaran Harian'],
        [tglLabel],
        [],
        ['RINCIAN TRANSAKSI'],
        ['No', 'Nama Siswa', 'No. Pendaftaran', 'Jurusan', 'Keterangan', 'Metode', 'Nominal', 'Status'],
        ...data.transaksi.map((t, i) => [
          i + 1,
          t.nama_lengkap,
          t.nomor_pendaftaran,
          t.jurusan_nama || '-',
          t.keterangan || 'Pembayaran Pendaftaran',
          t.metode_bayar,
          Number(t.nominal),
          t.status === 'lunas' ? 'Lunas' : t.status === 'cicilan' ? `Cicilan ke-${t.cicilan_ke || '?'}` : 'Belum Bayar',
        ]),
        ['', '', '', '', '', 'TOTAL', data.transaksi.reduce((s, t) => s + Number(t.nominal), 0), ''],
        [],
        ['REKAP PENDAPATAN PER STATUS'],
        ['Status', 'Jumlah Transaksi', 'Total Nominal'],
        ...(() => {
          const statusMap = { lunas: 'Lunas', cicilan: 'Cicilan', belum_bayar: 'Belum Bayar' };
          return data.per_status.map(s => [
            statusMap[s.status] || s.status,
            Number(s.jumlah),
            Number(s.total),
          ]);
        })(),
        ['TOTAL KESELURUHAN', data.summary.total_transaksi, Number(data.summary.total_nominal)],
        [],
        ['REKAP PER METODE PEMBAYARAN'],
        ['Metode', 'Jumlah Transaksi', 'Total Nominal'],
        ...data.per_metode.map(m => [m.metode_bayar, Number(m.jumlah), Number(m.total)]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(rincianRows);

      // Lebar kolom
      ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 15 }, { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 14 }];

      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Harian');

      const filename = `Laporan_Pembayaran_${laporanTgl}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`File ${filename} berhasil diunduh`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengekspor laporan');
    } finally {
      setExporting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pembayaran', {
        params: { q: search, status: filterStatus },
      });
      setRows(res.data.rows);
      setSummary(res.data.summary);
    } catch {
      toast.error('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    api.get('/admin/sekolah').then(r => setSekolah(r.data)).catch(() => {});
  }, []);

  // Debounced student search
  useEffect(() => {
    if (!showModal || editData) return;
    const t = setTimeout(async () => {
      setSiswaLoading(true);
      try {
        const res = await api.get('/admin/pembayaran/siswa', { params: { q: siswaSearch } });
        setSiswaList(res.data);
      } catch { /* ignore */ }
      finally { setSiswaLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [siswaSearch, showModal, editData]);

  const openAdd = async () => {
    setEditData(null);
    setForm(emptyForm);
    setSelectedSiswa(null);
    setSiswaSearch('');
    setSiswaList([]);
    setShowModal(true);
    // Load initial student list
    const res = await api.get('/admin/pembayaran/siswa', { params: { q: '' } });
    setSiswaList(res.data);
  };

  const openEdit = (row) => {
    setEditData(row);
    setSelectedSiswa({ id: row.pendaftaran_id, nama_lengkap: row.nama_lengkap, nomor_pendaftaran: row.nomor_pendaftaran });
    setForm({
      pendaftaran_id: row.pendaftaran_id,
      nominal: row.nominal,
      keterangan: row.keterangan || '',
      cicilan_ke: row.cicilan_ke || '',
      metode_bayar: row.metode_bayar || 'Tunai',
      status: row.status,
      tanggal_bayar: row.tanggal_bayar ? row.tanggal_bayar.slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditData(null); };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Cetak Kwitansi ──────────────────────────────────────────────────────
  const cetakKwitansi = (row) => {
    const tgl = row.tanggal_bayar
      ? new Date(row.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const noKwitansi = `KWT-${String(row.id).padStart(5, '0')}`;
    const logoUrl   = sekolah?.logo ? `${API_BASE}${sekolah.logo}` : '';
    const namaSekolah = sekolah?.nama_sekolah || 'SEKOLAH';
    const alamatSekolah = [sekolah?.alamat, sekolah?.kota].filter(Boolean).join(', ');
    const teleponSekolah = sekolah?.telepon || '';
    const cicilanInfo = row.status === 'cicilan' && row.cicilan_ke
      ? `<div style="margin-top:4px;font-size:12px;color:#d97706;font-weight:600;">Cicilan ke-${row.cicilan_ke}</div>` : '';

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
<title>Kwitansi ${noKwitansi}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A5 landscape; margin: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; background:#fff; }
  .page { width: 210mm; height: 148mm; padding: 10mm 14mm; position:relative; display:flex; flex-direction:column; overflow:hidden; }
  .header { display:flex; align-items:center; gap:12px; border-bottom:2.5px solid #1e293b; padding-bottom:8px; margin-bottom:8px; }
  .logo { width:52px; height:52px; object-fit:contain; }
  .logo-placeholder { width:52px;height:52px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:8px;font-size:20px; }
  .school-name { font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:.5px; }
  .school-sub { font-size:10.5px; color:#475569; margin-top:2px; }
  .content-row { display:flex; gap:16px; flex:1; }
  .left-col { flex:1.2; }
  .right-col { flex:.8; display:flex; flex-direction:column; justify-content:space-between; }
  .title-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .kwitansi-title { font-size:19px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#1e293b; }
  .no-kwitansi { font-size:10.5px; color:#64748b; margin-top:2px; font-family:monospace; }
  .body-table { width:100%; border-collapse:collapse; }
  .body-table td { padding:4px 5px; vertical-align:top; font-size:12px; }
  .body-table .label { width:38%; color:#475569; }
  .body-table .sep    { width:4%; text-align:center; }
  .body-table .value  { font-weight:600; }
  .nominal-box { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:6px; padding:8px 12px; }
  .nominal-label { font-size:10.5px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
  .nominal-value { font-size:20px; font-weight:900; color:#1e293b; margin-top:2px; }
  .status-badge { margin-top:8px; display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700;
    ${row.status === 'lunas' ? 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;' : row.status === 'cicilan' ? 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;' : 'background:#fef2f2;color:#ef4444;border:1px solid #fecaca;'} }
  .footer { text-align:right; margin-top:8px; }
  .sign-box { display:inline-block; text-align:center; }
  .sign-date { font-size:10.5px; color:#64748b; margin-bottom:36px; }
  .sign-name { border-top:1px solid #1e293b; padding-top:4px; font-size:11.5px; font-weight:700; min-width:120px; }
  .stamp { position:absolute; right:56px; bottom:32px; border:4px solid #16a34a; border-radius:50%; width:86px; height:86px;
    display:flex; align-items:center; justify-content:center; transform:rotate(-20deg); opacity:.85; }
  .stamp span { color:#16a34a; font-size:16px; font-weight:900; letter-spacing:1px; }
  @media print { body{margin:0;} .page{width:210mm;height:148mm;} }
</style></head><body>
<div class="page">
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : `<div class="logo-placeholder">🏫</div>`}
    <div style="flex:1;">
      <div class="school-name">${namaSekolah}</div>
      ${alamatSekolah ? `<div class="school-sub">${alamatSekolah}</div>` : ''}
      ${teleponSekolah ? `<div class="school-sub">Telp: ${teleponSekolah}</div>` : ''}
    </div>
    <div style="text-align:right;font-size:11px;color:#475569;">
      <div class="kwitansi-title" style="font-size:16px;">KWITANSI</div>
      <div style="font-family:monospace;font-size:10.5px;color:#64748b;margin-top:2px;">No. ${noKwitansi}</div>
    </div>
  </div>
  <div class="content-row">
    <div class="left-col">
      <table class="body-table">
        <tr><td class="label">Diterima dari</td><td class="sep">:</td><td class="value">${row.nama_lengkap}</td></tr>
        <tr><td class="label">No. Pendaftaran</td><td class="sep">:</td><td class="value" style="font-family:monospace;">${row.nomor_pendaftaran}</td></tr>
        <tr><td class="label">Jurusan</td><td class="sep">:</td><td class="value">${row.jurusan_nama || '-'}</td></tr>
        <tr><td class="label">Keterangan</td><td class="sep">:</td><td class="value">${row.keterangan || 'Pembayaran Pendaftaran'}${cicilanInfo}</td></tr>
        <tr><td class="label">Metode Bayar</td><td class="sep">:</td><td class="value">${row.metode_bayar}</td></tr>
        <tr><td class="label">Tanggal</td><td class="sep">:</td><td class="value">${tgl}</td></tr>
      </table>
    </div>
    <div class="right-col">
      <div>
        <div class="nominal-box">
          <div class="nominal-label">Jumlah Pembayaran</div>
          <div class="nominal-value">${fmt(row.nominal)}</div>
        </div>
        <div><span class="status-badge">${row.status === 'lunas' ? '✓ LUNAS' : row.status === 'cicilan' ? '◑ CICILAN' : '✗ BELUM BAYAR'}</span></div>
      </div>
      <div class="footer">
        <div class="sign-box">
          <div class="sign-date">${tgl}</div>
          <div class="sign-name">Petugas / Bendahara</div>
        </div>
      </div>
    </div>
  </div>
  ${row.status === 'lunas' ? `<div class="stamp"><span>LUNAS</span></div>` : ''}
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=820,height=620');
    w.document.write(html);
    w.document.close();
  };

  const selectSiswa = (s) => {
    setSelectedSiswa(s);
    setForm(prev => ({ ...prev, pendaftaran_id: s.id }));
    setSiswaList([]);
    setSiswaSearch(s.nama_lengkap);
  };

  const handleSave = async () => {
    if (!form.pendaftaran_id) { toast.error('Pilih siswa terlebih dahulu'); return; }
    if (!form.nominal || isNaN(parseFloat(form.nominal))) { toast.error('Nominal harus diisi'); return; }
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/admin/pembayaran/${editData.id}`, form);
        toast.success('Pembayaran berhasil diperbarui');
      } else {
        await api.post('/admin/pembayaran', form);
        toast.success('Pembayaran berhasil ditambahkan');
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/pembayaran/${deleteTarget.id}`);
      toast.success('Data pembayaran dihapus');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const METODE_ICON = { Tunai: <Banknote size={15}/>, Transfer: <Send size={15}/>, QRIS: <Smartphone size={15}/>, Lainnya: <MoreHorizontal size={15}/> };

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <CreditCard size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Pembayaran
            </h1>
            <p className="page-subtitle">Kelola transaksi & laporan pembayaran siswa</p>
          </div>
          {activeTab === 'data' && (
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Tambah Pembayaran
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
          {[
            { key: 'data',    label: 'Data Pembayaran', icon: <CreditCard size={15}/> },
            { key: 'laporan', label: 'Laporan Harian',  icon: <CalendarDays size={15}/> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, borderRadius: '8px 8px 0 0',
                marginBottom: -2,
                background: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? '#0284c7' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #0284c7' : '2px solid transparent',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: DATA PEMBAYARAN ──────────────────────────────── */}
        {activeTab === 'data' && (<>
        {/* Summary Cards */}
        <div className="pmb-summary-grid">
          <div className="pmb-summary-card" style={{ '--pmb-color': '#6366f1', '--pmb-bg': '#eef2ff' }}>
            <div className="pmb-summary-icon"><Wallet size={22} /></div>
            <div>
              <div className="pmb-summary-label">Total Terkumpul (Lunas)</div>
              <div className="pmb-summary-value">{fmt(summary.total_nominal)}</div>
            </div>
          </div>
          <div className="pmb-summary-card" style={{ '--pmb-color': '#0284c7', '--pmb-bg': '#f0f9ff' }}>
            <div className="pmb-summary-icon"><BadgeCheck size={22} /></div>
            <div>
              <div className="pmb-summary-label">Siswa Tercatat</div>
              <div className="pmb-summary-value">{summary.total_siswa}</div>
            </div>
          </div>
          <div className="pmb-summary-card" style={{ '--pmb-color': '#ef4444', '--pmb-bg': '#fef2f2' }}>
            <div className="pmb-summary-icon"><AlertCircle size={22} /></div>
            <div>
              <div className="pmb-summary-label">Belum Bayar</div>
              <div className="pmb-summary-value">{summary.belum_bayar}</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama siswa, no. pendaftaran..."
            />
          </div>
          <div className="pmb-filter-status">
            {[{ value: '', label: 'Semua Status' }, ...STATUS_OPTS].map(s => (
              <button
                key={s.value}
                className={`pmb-filter-btn ${filterStatus === s.value ? 'active' : ''}`}
                style={filterStatus === s.value && s.color
                  ? { background: s.bg, color: s.color, borderColor: s.color }
                  : {}}
                onClick={() => setFilterStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="table-loading">Memuat data...</div>
          ) : rows.length === 0 ? (
            <div className="table-empty">
              <CreditCard size={40} style={{ color: '#cbd5e1', marginBottom: 8 }} />
              <p>Belum ada data pembayaran</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Siswa</th>
                  <th>Jurusan</th>
                  <th>Keterangan</th>
                  <th>Nominal</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Cicilan ke</th>
                  <th>Tgl Bayar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{row.nama_lengkap}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{row.nomor_pendaftaran}</div>
                    </td>
                    <td>
                      {row.jurusan_kode
                        ? <span className="badge badge-info">{row.jurusan_kode}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{row.keterangan || '—'}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmt(row.nominal)}</td>
                    <td>
                      <span className="badge badge-secondary">{row.metode_bayar}</span>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                    <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#d97706' }}>
                      {row.status === 'cicilan' && row.cicilan_ke ? `ke-${row.cicilan_ke}` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {row.tanggal_bayar
                        ? new Date(row.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="td-btn td-btn-edit" onClick={() => openEdit(row)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="td-btn" style={{ color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd' }} onClick={() => cetakKwitansi(row)} title="Cetak Kwitansi">
                          <Printer size={14} />
                        </button>
                        <button className="td-btn td-btn-delete" onClick={() => setDeleteTarget(row)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="pmb-modal-overlay" onClick={closeModal}>
            <div className="pmb-modal" onClick={e => e.stopPropagation()}>

              {/* ── Header ── */}
              <div className="pmb-modal-header">
                <div className="pmb-modal-header-icon">
                  <CreditCard size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 className="pmb-modal-title">{editData ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</h2>
                  <p className="pmb-modal-subtitle">Isi data transaksi pembayaran siswa</p>
                </div>
                <button className="pmb-modal-close" onClick={closeModal}><X size={18} /></button>
              </div>

              <div className="pmb-modal-body">

                {/* ── Section 1: Siswa ── */}
                <div className="pmb-modal-section">
                  <div className="pmb-section-label">
                    <span className="pmb-section-num">1</span>
                    Pilih Siswa
                  </div>

                  {editData ? (
                    <div className="pmb-student-chip">
                      <div className="pmb-student-avatar">{selectedSiswa?.nama_lengkap?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="pmb-student-name">{selectedSiswa?.nama_lengkap}</div>
                        <div className="pmb-student-no">{selectedSiswa?.nomor_pendaftaran}</div>
                      </div>
                    </div>
                  ) : selectedSiswa ? (
                    <div className="pmb-student-chip">
                      <div className="pmb-student-avatar">{selectedSiswa.nama_lengkap[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div className="pmb-student-name">{selectedSiswa.nama_lengkap}</div>
                        <div className="pmb-student-no">{selectedSiswa.nomor_pendaftaran}</div>
                      </div>
                      <button
                        className="pmb-student-clear"
                        onClick={() => { setSelectedSiswa(null); setSiswaSearch(''); setForm(p => ({ ...p, pendaftaran_id: '' })); }}
                        title="Ganti siswa"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="pmb-siswa-search">
                      <div className="pmb-search-input-wrap">
                        <Search size={15} className="pmb-search-icon" />
                        <input
                          value={siswaSearch}
                          onChange={e => { setSiswaSearch(e.target.value); setSelectedSiswa(null); setForm(p => ({ ...p, pendaftaran_id: '' })); }}
                          className="pmb-search-input"
                          placeholder="Ketik nama atau no. pendaftaran siswa..."
                          autoFocus
                        />
                        {siswaLoading && <span className="pmb-search-spinner" />}
                      </div>
                      {siswaList.length > 0 && (
                        <div className="pmb-siswa-dropdown">
                          {siswaList.map(s => (
                            <div key={s.id} className="pmb-siswa-item" onClick={() => selectSiswa(s)}>
                              <div className="pmb-siswa-item-avatar">{s.nama_lengkap[0]?.toUpperCase()}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.nama_lengkap}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{s.nomor_pendaftaran}</div>
                              </div>
                              {s.jurusan_kode && <span className="badge badge-info" style={{ fontSize: 10 }}>{s.jurusan_kode}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Section 2: Detail Transaksi ── */}
                <div className="pmb-modal-section">
                  <div className="pmb-section-label">
                    <span className="pmb-section-num">2</span>
                    Detail Transaksi
                  </div>
                  <div className="pmb-row">
                    <div className="pmb-field">
                      <label className="pmb-label">Nominal <span style={{ color: '#ef4444' }}>*</span></label>
                      <div className="pmb-nominal-wrap">
                        <span className="pmb-nominal-prefix">Rp</span>
                        <input
                          type="number"
                          name="nominal"
                          value={form.nominal}
                          onChange={handleChange}
                          className="pmb-input pmb-input-nominal"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      {form.nominal > 0 && (
                        <div className="pmb-nominal-preview">{fmt(form.nominal)}</div>
                      )}
                    </div>
                    <div className="pmb-field">
                      <label className="pmb-label">Tanggal Bayar</label>
                      <input
                        type="date"
                        name="tanggal_bayar"
                        value={form.tanggal_bayar}
                        onChange={handleChange}
                        className="pmb-input"
                      />
                    </div>
                  </div>
                  <div className="pmb-field">
                    <label className="pmb-label">Keterangan</label>
                    <input
                      type="text"
                      name="keterangan"
                      value={form.keterangan}
                      onChange={handleChange}
                      className="pmb-input"
                      placeholder="cth: SPP, Uang Gedung, Daftar Ulang..."
                    />
                  </div>
                </div>

                {/* ── Section 3: Metode ── */}
                <div className="pmb-modal-section">
                  <div className="pmb-section-label">
                    <span className="pmb-section-num">3</span>
                    Metode Pembayaran
                  </div>
                  <div className="pmb-metode-grid">
                    {[
                      { value: 'Tunai',    icon: <Banknote size={18} /> },
                      { value: 'Transfer', icon: <Send size={18} /> },
                      { value: 'QRIS',     icon: <Smartphone size={18} /> },
                      { value: 'Lainnya',  icon: <MoreHorizontal size={18} /> },
                    ].map(m => (
                      <button
                        key={m.value}
                        type="button"
                        className={`pmb-metode-btn${form.metode_bayar === m.value ? ' active' : ''}`}
                        onClick={() => setForm(p => ({ ...p, metode_bayar: m.value }))}
                      >
                        {m.icon}
                        <span>{m.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Section 4: Status ── */}
                <div className="pmb-modal-section" style={{ marginBottom: 0 }}>
                  <div className="pmb-section-label">
                    <span className="pmb-section-num">4</span>
                    Status Pembayaran
                  </div>
                  <div className="pmb-status-grid">
                    {STATUS_OPTS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        className={`pmb-status-btn${form.status === s.value ? ' active' : ''}`}
                        style={form.status === s.value
                          ? { '--sc': s.color, '--sb': s.bg, borderColor: s.color, background: s.bg, color: s.color }
                          : {}}
                        onClick={() => setForm(p => ({ ...p, status: s.value, cicilan_ke: s.value !== 'cicilan' ? '' : p.cicilan_ke }))}
                      >
                        {s.value === 'lunas'
                          ? <BadgeCheck size={16} />
                          : s.value === 'cicilan'
                            ? <Clock size={16} />
                            : <AlertCircle size={16} />}
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {form.status === 'cicilan' && (
                    <div className="pmb-cicilan-box">
                      <label className="pmb-label">
                        Cicilan ke- <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="cicilan_ke"
                        value={form.cicilan_ke}
                        onChange={handleChange}
                        className="pmb-input"
                        placeholder="Masukkan urutan cicilan (1, 2, 3...)"
                        min="1"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

              </div>{/* end modal-body */}

              <div className="pmb-modal-footer">
                <button className="btn-cancel" onClick={closeModal}>Batal</button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteTarget && (
          <div className="delete-modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="delete-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Hapus Pembayaran</h3>
                <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <p>Hapus data pembayaran <strong>{fmt(deleteTarget.nominal)}</strong> milik <strong>{deleteTarget.nama_lengkap}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Batal</button>
                <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
        </>)}

        {/* ─── TAB: LAPORAN HARIAN ─────────────────────────────────── */}
        {activeTab === 'laporan' && (
          <div style={{ maxWidth: 520 }}>
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 28 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 7 }}>
                <CalendarDays size={17} /> Ekspor Laporan Harian
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 6 }}>Pilih Tanggal</label>
                <input
                  type="date"
                  value={laporanTgl}
                  max={todayStr}
                  onChange={e => setLaporanTgl(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>
              <button
                onClick={exportExcel}
                disabled={exporting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: exporting ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: exporting ? 'not-allowed' : 'pointer', width: '100%', justifyContent: 'center' }}
              >
                <Download size={16} /> {exporting ? 'Mengekspor...' : 'Export Excel'}
              </button>
              <p style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                File Excel akan berisi rincian transaksi, rekap per status, dan rekap per metode pembayaran.
              </p>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}

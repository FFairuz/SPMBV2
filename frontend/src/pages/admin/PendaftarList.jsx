import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Filter, ChevronLeft, ChevronRight, UserPlus, Pencil, Printer, Trash2, TriangleAlert, X, User } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const STATUS_TABS = ['semua', 'pending', 'diterima', 'ditolak'];

export default function PendaftarList() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('semua');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pendaftar', {
        params: { status, search, page, limit }
      });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatus = (s) => {
    setStatus(s);
    setPage(1);
  };

  const handleDelete = (p) => {
    setDeleteTarget(p);
    setDeleteConfirmed(false);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmed || !deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/pendaftar/${deleteTarget.id}`);
      toast.success('Data pendaftar berhasil dihapus');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus data');
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteConfirmed(false);
  };

  return (
    <Layout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header">
            <div>
              <h2>Daftar Pendaftar</h2>
              <p>Total: <strong>{total}</strong> pendaftar</p>
            </div>
            <Link to="/admin/pendaftar/tambah" className="btn-tambah-siswa">
              <UserPlus size={16} /> Tambah Siswa
            </Link>
          </div>

          {/* Filter & Search */}
          <div className="list-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Cari nama, nomor pendaftaran, atau sekolah..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            <div className="status-tabs">
              <Filter size={16} />
              {STATUS_TABS.map(s => (
                <button
                  key={s}
                  className={`tab-btn ${status === s ? 'active' : ''}`}
                  onClick={() => handleStatus(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="table-card">
            {loading ? (
              <LoadingSpinner text="Memuat data..." />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>No. Pendaftaran</th>
                      <th>Nama Lengkap</th>
                      <th>JK</th>
                      <th>Asal Sekolah</th>
                      <th>Pilihan 1</th>
                      <th>Nilai</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={9} className="td-empty">Tidak ada data ditemukan</td></tr>
                    ) : (
                      data.map((p, i) => (
                        <tr key={p.id}>
                          <td>{(page - 1) * limit + i + 1}</td>
                          <td className="mono">{p.nomor_pendaftaran}</td>
                          <td>{p.nama_lengkap}</td>
                          <td>
                            <User 
                              size={18} 
                              strokeWidth={2.5}
                              style={{ 
                                color: p.jenis_kelamin === 'L' ? '#3b82f6' : '#ec4899'
                              }}
                            />
                          </td>
                          <td>{p.asal_sekolah}</td>
                          <td>{p.jurusan1}</td>
                          <td>{p.nilai_rata_rata}</td>
                          <td>
                            <span className={`badge badge-${p.status === 'pending' ? 'warning' : p.status === 'diterima' ? 'success' : 'danger'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <Link to={`/admin/pendaftar/${p.id}`} className="td-btn td-btn-view" title="Detail">
                                <Eye size={14} />
                              </Link>
                              <Link to={`/admin/pendaftar/${p.id}/edit`} className="td-btn td-btn-edit" title="Edit">
                                <Pencil size={14} />
                              </Link>
                              <Link to={`/admin/pendaftar/${p.id}/cetak`} className="td-btn td-btn-cetak" title="Cetak">
                                <Printer size={14} />
                              </Link>
                              <button onClick={() => handleDelete(p)} className="td-btn td-btn-delete" title="Hapus">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="page-btn"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="page-btn"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </motion.div>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="delete-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="delete-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="delete-modal-close" onClick={closeModal} disabled={deleting}>
                <X size={18} />
              </button>

              <div className="delete-modal-icon">
                <TriangleAlert size={36} />
              </div>

              <h3 className="delete-modal-title">Hapus Data Pendaftar?</h3>
              <p className="delete-modal-sub">Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.</p>

              <div className="delete-modal-info">
                <div className="delete-modal-info-row">
                  <span className="delete-modal-info-label">Nama</span>
                  <span className="delete-modal-info-val">{deleteTarget.nama_lengkap}</span>
                </div>
                <div className="delete-modal-info-row">
                  <span className="delete-modal-info-label">No. Pendaftaran</span>
                  <span className="delete-modal-info-val mono">{deleteTarget.nomor_pendaftaran}</span>
                </div>
                <div className="delete-modal-info-row">
                  <span className="delete-modal-info-label">Asal Sekolah</span>
                  <span className="delete-modal-info-val">{deleteTarget.asal_sekolah}</span>
                </div>
                <div className="delete-modal-info-row">
                  <span className="delete-modal-info-label">Status</span>
                  <span className={`badge badge-${deleteTarget.status === 'pending' ? 'warning' : deleteTarget.status === 'diterima' ? 'success' : 'danger'}`}>{deleteTarget.status}</span>
                </div>
              </div>

              <label className="delete-modal-checkbox">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={e => setDeleteConfirmed(e.target.checked)}
                  disabled={deleting}
                />
                <span>Saya mengerti bahwa data ini akan <strong>dihapus secara permanen</strong></span>
              </label>

              <div className="delete-modal-actions">
                <button className="delete-modal-btn-cancel" onClick={closeModal} disabled={deleting}>
                  Batal
                </button>
                <button
                  className="delete-modal-btn-confirm"
                  onClick={confirmDelete}
                  disabled={!deleteConfirmed || deleting}
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Eye, Loader2, GraduationCap, Upload, ImageOff } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const emptyForm = { nama: '', kode: '', kuota: '', deskripsi: '' };

function LogoImg({ src, alt, className, style }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className={`jurusan-logo-placeholder ${className || ''}`} style={style}>
      <GraduationCap size={24} />
    </div>
  );
  return <img src={`${API_BASE}${src}`} alt={alt} className={className} style={style} onError={() => setErr(true)} />;
}

export default function Jurusan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(null);
  const logoInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/jurusan');
      setData(res.data);
    } catch {
      toast.error('Gagal memuat data jurusan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };
  const openEdit = (j) => {
    setEditData(j);
    setForm({ nama: j.nama, kode: j.kode, kuota: j.kuota, deskripsi: j.deskripsi || '' });
    setLogoFile(null);
    setLogoPreview(j.logo ? `${API_BASE}${j.logo}` : null);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditData(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
  };
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Hanya file gambar yang diizinkan'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran file maksimal 2MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.kode || !form.kuota) { toast.error('Nama, kode, dan kuota wajib diisi'); return; }
    setSaving(true);
    try {
      let jurusanId = editData?.id;
      if (editData) {
        await api.put(`/admin/jurusan/${editData.id}`, form);
        toast.success('Jurusan berhasil diperbarui');
      } else {
        const res = await api.post('/admin/jurusan', form);
        jurusanId = res.data.id;
        toast.success('Jurusan berhasil ditambahkan');
      }
      if (logoFile && jurusanId) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        await api.post(`/admin/jurusan/${jurusanId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      if (editData && editData.logo && !logoPreview && !logoFile) {
        await api.delete(`/admin/jurusan/${editData.id}/logo`);
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/jurusan/${deleteTarget.id}`);
      toast.success('Jurusan berhasil dihapus');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus jurusan');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickLogoUpload = async (e, jurusanId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Hanya file gambar'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Maks 2MB'); return; }
    setUploadingLogo(jurusanId);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      await api.post(`/admin/jurusan/${jurusanId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Logo berhasil diupload');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload logo');
    } finally {
      setUploadingLogo(null);
    }
  };

  const pct = (diterima, kuota) => {
    if (!kuota || kuota === 0) return 0;
    return Math.min(100, Math.round(((diterima || 0) / kuota) * 100));
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <div>
            <h2>Data Jurusan</h2>
            <p>Total: <strong>{data.length}</strong> jurusan terdaftar</p>
          </div>
          <button className="btn-tambah-siswa" onClick={openAdd}>
            <Plus size={16} /> Tambah Jurusan
          </button>
        </div>

        <div className="table-card">
          {loading ? (
            <div className="loading-center"><Loader2 size={28} className="spin" /></div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                  <thead>
                  <tr>
                    <th style={{ width: 44 }}>No.</th>
                    <th style={{ width: 64 }}>Logo</th>
                    <th style={{ width: 70 }}>Kode</th>
                    <th>Nama Jurusan</th>
                    <th>Deskripsi</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Kuota</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Pendaftar</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Diterima</th>
                    <th style={{ width: 140 }}>Terisi</th>
                    <th style={{ width: 110 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                        <td colSpan={10} className="td-empty">Belum ada data jurusan</td>
                      </tr>
                    ) : data.map((j, i) => (
                      <tr key={j.id}>
                        <td style={{ textAlign: 'center', color: 'var(--gray-400)' }}>{i + 1}</td>
                        <td>
                          <div className="jurusan-logo-cell">
                            <LogoImg src={j.logo} alt={j.nama} className="jurusan-logo-thumb" />
                            <label className="jurusan-logo-upload-btn" title="Upload Logo">
                              {uploadingLogo === j.id ? <Loader2 size={11} className="spin" /> : <Upload size={11} />}
                              <input type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={e => handleQuickLogoUpload(e, j.id)}
                                disabled={uploadingLogo === j.id} />
                            </label>
                          </div>
                        </td>
                        <td><span className="badge-kode">{j.kode}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{j.nama}</div>
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.deskripsi || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{j.kuota}</td>
                      <td style={{ textAlign: 'center' }}>{j.total_pendaftar || 0}</td>
                      <td style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>{j.diterima || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--gray-100)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct(j.diterima, j.kuota)}%`, background: 'linear-gradient(90deg, var(--primary), #818cf8)', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{pct(j.diterima, j.kuota)}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="td-btn td-btn-view" title="Lihat Detail" onClick={() => setViewData(j)}><Eye size={14} /></button>
                          <button className="td-btn td-btn-edit" title="Edit" onClick={() => openEdit(j)}><Pencil size={14} /></button>
                          <button className="td-btn td-btn-delete" title="Hapus" onClick={() => setDeleteTarget(j)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal View */}
      <AnimatePresence>
        {viewData && (
          <div className="modal-overlay" onClick={() => setViewData(null)}>
            <motion.div className="modal-card" onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h3>Detail Jurusan</h3>
                <button className="modal-close" onClick={() => setViewData(null)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                  <LogoImg src={viewData.logo} alt={viewData.nama} className="jurusan-logo-detail" />
                </div>
                <div className="view-kode-badge">{viewData.kode}</div>
                <h2 className="view-nama">{viewData.nama}</h2>
                <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>{viewData.deskripsi || 'Tidak ada deskripsi.'}</p>
                <div className="view-stats-row">
                  <div className="view-stat-box">
                    <span className="vsb-label">Kuota</span>
                    <span className="vsb-value">{viewData.kuota}</span>
                  </div>
                  <div className="view-stat-box">
                    <span className="vsb-label">Pendaftar</span>
                    <span className="vsb-value">{viewData.total_pendaftar || 0}</span>
                  </div>
                  <div className="view-stat-box">
                    <span className="vsb-label">Diterima</span>
                    <span className="vsb-value" style={{ color: 'var(--success)' }}>{viewData.diterima || 0}</span>
                  </div>
                  <div className="view-stat-box">
                    <span className="vsb-label">Sisa Kuota</span>
                    <span className="vsb-value" style={{ color: 'var(--primary)' }}>{viewData.kuota - (viewData.diterima || 0)}</span>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>
                    <span>Pengisian Kuota</span>
                    <span>{viewData.diterima || 0} / {viewData.kuota} ({pct(viewData.diterima, viewData.kuota)}%)</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--gray-100)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct(viewData.diterima, viewData.kuota)}%`, background: 'linear-gradient(90deg, var(--primary), #818cf8)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-ts-back" onClick={() => setViewData(null)}>Tutup</button>
                <button className="btn-ts-next" onClick={() => { setViewData(null); openEdit(viewData); }}>
                  <Pencil size={15} /> Edit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <motion.div className="modal-card" onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h3>{editData ? 'Edit Jurusan' : 'Tambah Jurusan'}</h3>
                <button className="modal-close" onClick={closeModal}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body">

                {/* Logo Upload Area */}
                <div className="jurusan-logo-upload-area">
                  <div className="jurusan-logo-preview-wrap">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="preview" className="jurusan-logo-preview-img" />
                        <button type="button" className="jurusan-logo-remove" onClick={handleRemoveLogo}><X size={13} /></button>
                      </>
                    ) : (
                      <div className="jurusan-logo-empty">
                        <GraduationCap size={32} />
                        <span>Belum ada logo</span>
                      </div>
                    )}
                  </div>
                  <div className="jurusan-logo-upload-controls">
                    <p className="jurusan-logo-upload-label">Logo Jurusan</p>
                    <p className="jurusan-logo-upload-hint">Format: JPG, PNG, SVG, WebP · Maks 2MB</p>
                    <label className="jurusan-logo-upload-trigger">
                      <Upload size={14} />
                      {logoPreview ? 'Ganti Logo' : 'Upload Logo'}
                      <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                    </label>
                    {logoPreview && (
                      <button type="button" className="jurusan-logo-upload-remove-btn" onClick={handleRemoveLogo}>
                        <ImageOff size={13} /> Hapus Logo
                      </button>
                    )}
                  </div>
                </div>

                <div className="ts-grid-2">
                  <div className="ts-field">
                    <label className="ts-label">Nama Jurusan <span className="ts-required">*</span></label>
                    <input name="nama" value={form.nama} onChange={handleChange} className="ts-input" placeholder="cth: Rekayasa Perangkat Lunak" />
                  </div>
                  <div className="ts-field">
                    <label className="ts-label">Kode <span className="ts-required">*</span></label>
                    <input name="kode" value={form.kode} onChange={handleChange} className="ts-input" placeholder="cth: RPL" maxLength={10} style={{ textTransform: 'uppercase' }} />
                  </div>
                </div>
                <div className="ts-field">
                  <label className="ts-label">Kuota Siswa <span className="ts-required">*</span></label>
                  <input name="kuota" type="number" value={form.kuota} onChange={handleChange} className="ts-input" placeholder="cth: 36" min={1} />
                </div>
                <div className="ts-field">
                  <label className="ts-label">Deskripsi</label>
                  <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} className="ts-input ts-textarea" placeholder="Deskripsi singkat jurusan..." rows={3} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-ts-back" onClick={closeModal}>Batal</button>
                  <button type="submit" className="btn-ts-next" disabled={saving}>
                    {saving ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : editData ? 'Simpan Perubahan' : 'Tambah Jurusan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hapus */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <motion.div className="modal-card modal-sm" onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h3>Hapus Jurusan</h3>
                <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <p>Yakin ingin menghapus jurusan <strong>{deleteTarget.nama}</strong>?</p>
                <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 6 }}>
                  Jurusan yang masih dipilih pendaftar tidak dapat dihapus.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-ts-back" onClick={() => setDeleteTarget(null)}>Batal</button>
                <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><Loader2 size={16} className="spin" /> Menghapus...</> : <><Trash2 size={16} /> Hapus</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

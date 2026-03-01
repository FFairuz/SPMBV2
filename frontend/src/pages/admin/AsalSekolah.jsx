import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, X, Building2, Hash, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

const emptyForm = { nama_sekolah: '', npsn: '', tipe: 'Negeri' };

export default function AsalSekolah() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null); // null = tambah, obj = edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Import state ---
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { inserted, skipped, errors }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const openImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportModal(true);
  };

  const closeImport = () => {
    setImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.post('/admin/asal-sekolah/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      toast.success(res.data.message);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor file');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const header = 'nama_sekolah,npsn,tipe\n';
    const sample =
      'SMP Negeri 1 Contoh,12345678,Negeri\nSMP Swasta Contoh,87654321,Swasta\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_asal_sekolah.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/asal-sekolah');
      setList(res.data);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openTambah = () => {
    setEditData(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (item) => {
    setEditData(item);
    setForm({ nama_sekolah: item.nama_sekolah, npsn: item.npsn || '', tipe: item.tipe });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditData(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.nama_sekolah.trim()) {
      toast.error('Nama sekolah wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/admin/asal-sekolah/${editData.id}`, form);
        toast.success('Data berhasil diperbarui');
      } else {
        await api.post('/admin/asal-sekolah', form);
        toast.success('Sekolah berhasil ditambahkan');
      }
      closeModal();
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/asal-sekolah/${deleteTarget.id}`);
      toast.success('Data berhasil dihapus');
      setDeleteTarget(null);
      fetchList();
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = list.filter(
    (s) =>
      s.nama_sekolah.toLowerCase().includes(search.toLowerCase()) ||
      (s.npsn && s.npsn.includes(search))
  );

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <h2>Data Asal Sekolah</h2>
            <p>Total: <strong>{filtered.length}</strong> sekolah terdaftar</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={downloadTemplate}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, border: '1.5px solid #d1d5db',
                background: '#fff', color: '#374151', fontWeight: 500,
                fontSize: 14, cursor: 'pointer', transition: 'all .15s',
              }}
              title="Unduh template CSV"
            >
              <Download size={15} /> Template
            </button>
            <button
              onClick={openImport}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, border: '1.5px solid #2563eb',
                background: '#eff6ff', color: '#2563eb', fontWeight: 500,
                fontSize: 14, cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <Upload size={15} /> Import
            </button>
            <button className="btn-tambah-siswa" onClick={openTambah}>
              <Plus size={16} /> Tambah Sekolah
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="list-controls" style={{ marginBottom: 16 }}>
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama sekolah atau NPSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>No</th>
                    <th>Nama Sekolah</th>
                    <th style={{ width: 140 }}>NPSN</th>
                    <th style={{ width: 110 }}>Tipe</th>
                    <th style={{ width: 110 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="td-empty">
                        {search ? 'Tidak ada sekolah yang cocok' : 'Belum ada data sekolah. Klik "Tambah Sekolah" untuk memulai.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center', color: '#888' }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{item.nama_sekolah}</span>
                          </div>
                        </td>
                        <td>
                          {item.npsn ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Hash size={13} style={{ color: '#aaa' }} />
                              <span className="mono">{item.npsn}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#ccc' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${item.tipe === 'Negeri' ? 'badge-success' : 'badge-warning'}`}>
                            {item.tipe}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="td-btn td-btn-edit"
                              title="Edit"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="td-btn td-btn-delete"
                              title="Hapus"
                              onClick={() => setDeleteTarget(item)}
                            >
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
          </div>
        )}

        {/* Modal Tambah / Edit */}
        <AnimatePresence>
          {modal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              <motion.div
                className="modal-box"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 480 }}
              >
                <div className="modal-header">
                  <h3>{editData ? 'Edit Sekolah' : 'Tambah Sekolah'}</h3>
                  <button className="modal-close" onClick={closeModal}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label>Nama Sekolah *</label>
                    <input
                      type="text"
                      placeholder="Contoh: SMP Negeri 1 Kota"
                      value={form.nama_sekolah}
                      onChange={(e) => setForm({ ...form, nama_sekolah: e.target.value })}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label>NPSN</label>
                    <input
                      type="text"
                      placeholder="8 digit angka (opsional)"
                      value={form.npsn}
                      onChange={(e) => setForm({ ...form, npsn: e.target.value })}
                      maxLength={20}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipe Sekolah *</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['Negeri', 'Swasta'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, tipe: t })}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: 8,
                            border: `2px solid ${form.tipe === t ? (t === 'Negeri' ? '#2563eb' : '#9333ea') : '#e5e7eb'}`,
                            background: form.tipe === t ? (t === 'Negeri' ? '#eff6ff' : '#fdf4ff') : '#fff',
                            color: form.tipe === t ? (t === 'Negeri' ? '#2563eb' : '#9333ea') : '#666',
                            fontWeight: form.tipe === t ? 700 : 400,
                            cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-cancel" onClick={closeModal}>Batal</button>
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambahkan'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Import */}
        <AnimatePresence>
          {importModal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeImport}
            >
              <motion.div
                className="modal-box"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 500 }}
              >
                <div className="modal-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileSpreadsheet size={18} style={{ color: '#2563eb' }} />
                    Import Data Sekolah
                  </h3>
                  <button className="modal-close" onClick={closeImport}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Format info */}
                  <div style={{
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0369a1', lineHeight: 1.6,
                  }}>
                    <strong>Format kolom:</strong> <code>nama_sekolah</code>, <code>npsn</code> (opsional), <code>tipe</code> (Negeri/Swasta)<br />
                    <span style={{ color: '#0284c7' }}>File yang didukung: <strong>.xlsx, .xls, .csv</strong></span>
                    &nbsp;·&nbsp;
                    <button
                      onClick={downloadTemplate}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 13 }}
                    >
                      <Download size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      Unduh template
                    </button>
                  </div>

                  {/* Drop zone */}
                  {!importResult && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? '#2563eb' : importFile ? '#22c55e' : '#d1d5db'}`,
                        borderRadius: 12, padding: '32px 20px', textAlign: 'center',
                        cursor: 'pointer', transition: 'all .2s',
                        background: dragOver ? '#eff6ff' : importFile ? '#f0fdf4' : '#fafafa',
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        style={{ display: 'none' }}
                        onChange={(e) => setImportFile(e.target.files[0] || null)}
                      />
                      {importFile ? (
                        <>
                          <FileSpreadsheet size={32} style={{ color: '#22c55e', margin: '0 auto 8px' }} />
                          <p style={{ fontWeight: 600, color: '#16a34a', margin: 0 }}>{importFile.name}</p>
                          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                            {(importFile.size / 1024).toFixed(1)} KB · Klik untuk ganti file
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                          <p style={{ fontWeight: 500, color: '#374151', margin: 0 }}>Seret file ke sini atau klik untuk memilih</p>
                          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>.xlsx &nbsp;·&nbsp; .xls &nbsp;·&nbsp; .csv</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Result */}
                  {importResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{
                        display: 'flex', gap: 12,
                      }}>
                        <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                          <CheckCircle2 size={22} style={{ color: '#16a34a', margin: '0 auto 4px' }} />
                          <div style={{ fontSize: 26, fontWeight: 700, color: '#15803d' }}>{importResult.inserted}</div>
                          <div style={{ fontSize: 13, color: '#16a34a' }}>Ditambahkan</div>
                        </div>
                        <div style={{ flex: 1, background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                          <AlertCircle size={22} style={{ color: '#ca8a04', margin: '0 auto 4px' }} />
                          <div style={{ fontSize: 26, fontWeight: 700, color: '#a16207' }}>{importResult.skipped}</div>
                          <div style={{ fontSize: 13, color: '#ca8a04' }}>Dilewati</div>
                        </div>
                      </div>
                      {importResult.errors?.length > 0 && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                          <strong>Detail:</strong>
                          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                            {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn-cancel" onClick={closeImport}>
                    {importResult ? 'Tutup' : 'Batal'}
                  </button>
                  {!importResult && (
                    <button
                      className="btn-save"
                      onClick={handleImport}
                      disabled={!importFile || importing}
                    >
                      {importing ? 'Mengimpor...' : 'Import Sekarang'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Konfirmasi Hapus */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              className="delete-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                className="delete-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="delete-modal-close" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  <X size={18} />
                </button>
                <div className="delete-modal-icon"><Trash2 size={28} /></div>
                <h3 className="delete-modal-title">Hapus Sekolah?</h3>
                <p className="delete-modal-sub">Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.</p>
                <div className="delete-modal-info">
                  <div className="delete-modal-info-row">
                    <span className="delete-modal-info-label">Nama</span>
                    <span className="delete-modal-info-val">{deleteTarget.nama_sekolah}</span>
                  </div>
                  {deleteTarget.npsn && (
                    <div className="delete-modal-info-row">
                      <span className="delete-modal-info-label">NPSN</span>
                      <span className="delete-modal-info-val mono">{deleteTarget.npsn}</span>
                    </div>
                  )}
                  <div className="delete-modal-info-row">
                    <span className="delete-modal-info-label">Tipe</span>
                    <span className="delete-modal-info-val">{deleteTarget.tipe}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button style={{ flex: 1 }} className="btn-ts-back" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button>
                  <button style={{ flex: 1 }} className="btn-delete-confirm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}

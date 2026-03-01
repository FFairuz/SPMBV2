import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, CalendarDays, FileCheck, Save, Plus, Trash2,
  Pencil, X, Check, ToggleLeft, ToggleRight, GripVertical
} from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const TABS = [
  { key: 'umum', label: 'Tahun Ajaran & Status', icon: <Settings size={16} /> },
  { key: 'jadwal', label: 'Jadwal Pendaftaran', icon: <CalendarDays size={16} /> },
  { key: 'persyaratan', label: 'Persyaratan', icon: <FileCheck size={16} /> },
];

export default function PengaturanPendaftaran() {
  const [activeTab, setActiveTab] = useState('umum');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pengaturan umum & jadwal
  const [form, setForm] = useState({
    tahun_ajaran: '',
    status_pendaftaran: 'tutup',
    tgl_mulai: '',
    tgl_selesai: '',
    tgl_pengumuman: '',
    tgl_daftar_ulang: '',
    catatan: '',
  });

  // Persyaratan
  const [persyaratan, setPersyaratan] = useState([]);
  const [modalPersyaratan, setModalPersyaratan] = useState(null); // null | 'tambah' | {edit obj}
  const [formPersyaratan, setFormPersyaratan] = useState({ dokumen: '', keterangan: '', wajib: true, urutan: 0 });
  const [savingPersyaratan, setSavingPersyaratan] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pengaturan');
      if (res.data.pengaturan) {
        const p = res.data.pengaturan;
        setForm({
          tahun_ajaran: p.tahun_ajaran || '',
          status_pendaftaran: p.status_pendaftaran || 'tutup',
          tgl_mulai: p.tgl_mulai ? p.tgl_mulai.split('T')[0] : '',
          tgl_selesai: p.tgl_selesai ? p.tgl_selesai.split('T')[0] : '',
          tgl_pengumuman: p.tgl_pengumuman ? p.tgl_pengumuman.split('T')[0] : '',
          tgl_daftar_ulang: p.tgl_daftar_ulang ? p.tgl_daftar_ulang.split('T')[0] : '',
          catatan: p.catatan || '',
        });
      }
      setPersyaratan(res.data.persyaratan || []);
    } catch {
      toast.error('Gagal memuat data pengaturan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.tahun_ajaran) return toast.error('Tahun ajaran wajib diisi');
    setSaving(true);
    try {
      await api.put('/admin/pengaturan', form);
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const openTambahPersyaratan = () => {
    setFormPersyaratan({ dokumen: '', keterangan: '', wajib: true, urutan: persyaratan.length });
    setModalPersyaratan('tambah');
  };

  const openEditPersyaratan = (item) => {
    setFormPersyaratan({ dokumen: item.dokumen, keterangan: item.keterangan || '', wajib: !!item.wajib, urutan: item.urutan });
    setModalPersyaratan(item);
  };

  const savePersyaratan = async () => {
    if (!formPersyaratan.dokumen.trim()) return toast.error('Nama dokumen wajib diisi');
    setSavingPersyaratan(true);
    try {
      if (modalPersyaratan === 'tambah') {
        await api.post('/admin/pengaturan/persyaratan', formPersyaratan);
        toast.success('Persyaratan berhasil ditambahkan');
      } else {
        await api.put(`/admin/pengaturan/persyaratan/${modalPersyaratan.id}`, formPersyaratan);
        toast.success('Persyaratan berhasil diperbarui');
      }
      setModalPersyaratan(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSavingPersyaratan(false);
    }
  };

  const deletePersyaratan = async (id) => {
    if (!confirm('Hapus persyaratan ini?')) return;
    try {
      await api.delete(`/admin/pengaturan/persyaratan/${id}`);
      toast.success('Persyaratan dihapus');
      fetchData();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  const isOpen = form.status_pendaftaran === 'buka';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <div>
            <h2>Pengaturan Pendaftaran</h2>
            <p>Kelola tahun ajaran, jadwal, dan persyaratan pendaftaran</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="pengaturan-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`pengaturan-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── Tab: Tahun Ajaran & Status ─── */}
          {activeTab === 'umum' && (
            <div className="pengaturan-card">
              <div className="pengaturan-section-title">
                <Settings size={18} /> Tahun Ajaran & Status Pendaftaran
              </div>

              <div className="pengaturan-field">
                <label>Tahun Ajaran <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: 2025/2026"
                  value={form.tahun_ajaran}
                  onChange={e => setForm(f => ({ ...f, tahun_ajaran: e.target.value }))}
                  className="pengaturan-input"
                />
                <small>Format: YYYY/YYYY (e.g., 2025/2026)</small>
              </div>

              <div className="pengaturan-field">
                <label>Status Pendaftaran</label>
                <div
                  className={`status-toggle ${isOpen ? 'open' : 'closed'}`}
                  onClick={() => setForm(f => ({ ...f, status_pendaftaran: isOpen ? 'tutup' : 'buka' }))}
                >
                  {isOpen
                    ? <><ToggleRight size={28} /> <span>Pendaftaran <strong>DIBUKA</strong></span></>
                    : <><ToggleLeft size={28} /> <span>Pendaftaran <strong>DITUTUP</strong></span></>
                  }
                </div>
              </div>

              <div className="pengaturan-field">
                <label>Catatan / Informasi Tambahan</label>
                <textarea
                  placeholder="Catatan untuk calon pendaftar..."
                  value={form.catatan}
                  onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                  className="pengaturan-textarea"
                  rows={4}
                />
              </div>

              <div className="pengaturan-actions">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Tab: Jadwal Pendaftaran ─── */}
          {activeTab === 'jadwal' && (
            <div className="pengaturan-card">
              <div className="pengaturan-section-title">
                <CalendarDays size={18} /> Jadwal / Periode Pendaftaran
              </div>

              <div className="jadwal-grid">
                <div className="pengaturan-field">
                  <label>Tanggal Mulai Pendaftaran</label>
                  <input
                    type="date"
                    value={form.tgl_mulai}
                    onChange={e => setForm(f => ({ ...f, tgl_mulai: e.target.value }))}
                    className="pengaturan-input"
                  />
                </div>
                <div className="pengaturan-field">
                  <label>Tanggal Selesai Pendaftaran</label>
                  <input
                    type="date"
                    value={form.tgl_selesai}
                    onChange={e => setForm(f => ({ ...f, tgl_selesai: e.target.value }))}
                    className="pengaturan-input"
                  />
                </div>
                <div className="pengaturan-field">
                  <label>Tanggal Pengumuman</label>
                  <input
                    type="date"
                    value={form.tgl_pengumuman}
                    onChange={e => setForm(f => ({ ...f, tgl_pengumuman: e.target.value }))}
                    className="pengaturan-input"
                  />
                </div>
                <div className="pengaturan-field">
                  <label>Tanggal Daftar Ulang</label>
                  <input
                    type="date"
                    value={form.tgl_daftar_ulang}
                    onChange={e => setForm(f => ({ ...f, tgl_daftar_ulang: e.target.value }))}
                    className="pengaturan-input"
                  />
                </div>
              </div>

              {/* Timeline preview */}
              {(form.tgl_mulai || form.tgl_selesai || form.tgl_pengumuman || form.tgl_daftar_ulang) && (
                <div className="timeline-preview">
                  <div className="timeline-title">Preview Timeline</div>
                  {[
                    { label: 'Mulai Pendaftaran', date: form.tgl_mulai, color: '#6366f1' },
                    { label: 'Selesai Pendaftaran', date: form.tgl_selesai, color: '#f59e0b' },
                    { label: 'Pengumuman', date: form.tgl_pengumuman, color: '#10b981' },
                    { label: 'Daftar Ulang', date: form.tgl_daftar_ulang, color: '#3b82f6' },
                  ].filter(t => t.date).map(t => (
                    <div key={t.label} className="timeline-item">
                      <span className="timeline-dot" style={{ backgroundColor: t.color }} />
                      <span className="timeline-label">{t.label}</span>
                      <span className="timeline-date">
                        {new Date(t.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pengaturan-actions">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Tab: Persyaratan ─── */}
          {activeTab === 'persyaratan' && (
            <div className="pengaturan-card">
              <div className="pengaturan-section-title" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck size={18} /> Persyaratan Pendaftaran
                </span>
                <button className="btn-tambah-persyaratan" onClick={openTambahPersyaratan}>
                  <Plus size={15} /> Tambah Persyaratan
                </button>
              </div>

              {persyaratan.length === 0 ? (
                <div className="empty-persyaratan">
                  <FileCheck size={40} opacity={0.3} />
                  <p>Belum ada persyaratan. Klik tombol di atas untuk menambahkan.</p>
                </div>
              ) : (
                <div className="persyaratan-list">
                  {persyaratan.map((item, idx) => (
                    <div key={item.id} className="persyaratan-item">
                      <span className="persyaratan-no">{idx + 1}</span>
                      <div className="persyaratan-body">
                        <div className="persyaratan-dokumen">
                          {item.dokumen}
                          {item.wajib
                            ? <span className="badge-wajib">Wajib</span>
                            : <span className="badge-opsional">Opsional</span>
                          }
                        </div>
                        {item.keterangan && <div className="persyaratan-ket">{item.keterangan}</div>}
                      </div>
                      <div className="persyaratan-actions">
                        <button className="td-btn td-btn-edit" onClick={() => openEditPersyaratan(item)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="td-btn td-btn-delete" onClick={() => deletePersyaratan(item.id)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modal Persyaratan */}
      {modalPersyaratan && (
        <div className="modal-overlay" onClick={() => setModalPersyaratan(null)}>
          <motion.div
            className="modal-box"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="modal-header">
              <h3>{modalPersyaratan === 'tambah' ? 'Tambah Persyaratan' : 'Edit Persyaratan'}</h3>
              <button className="modal-close" onClick={() => setModalPersyaratan(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="pengaturan-field">
                <label>Nama Dokumen <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Fotokopi Ijazah"
                  value={formPersyaratan.dokumen}
                  onChange={e => setFormPersyaratan(f => ({ ...f, dokumen: e.target.value }))}
                  className="pengaturan-input"
                  autoFocus
                />
              </div>
              <div className="pengaturan-field">
                <label>Keterangan <small>(opsional)</small></label>
                <textarea
                  placeholder="Keterangan tambahan, misal: 2 lembar, legalisir..."
                  value={formPersyaratan.keterangan}
                  onChange={e => setFormPersyaratan(f => ({ ...f, keterangan: e.target.value }))}
                  className="pengaturan-textarea"
                  rows={3}
                />
              </div>
              <div className="pengaturan-field">
                <label>Urutan</label>
                <input
                  type="number"
                  min={0}
                  value={formPersyaratan.urutan}
                  onChange={e => setFormPersyaratan(f => ({ ...f, urutan: parseInt(e.target.value) || 0 }))}
                  className="pengaturan-input"
                  style={{ width: 100 }}
                />
              </div>
              <div className="pengaturan-field">
                <label>Status</label>
                <div className="wajib-toggle">
                  <button
                    className={`wajib-btn ${formPersyaratan.wajib ? 'active' : ''}`}
                    onClick={() => setFormPersyaratan(f => ({ ...f, wajib: true }))}
                  >
                    <Check size={14} /> Wajib
                  </button>
                  <button
                    className={`wajib-btn ${!formPersyaratan.wajib ? 'active' : ''}`}
                    onClick={() => setFormPersyaratan(f => ({ ...f, wajib: false }))}
                  >
                    Opsional
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModalPersyaratan(null)}>Batal</button>
              <button className="btn-save" onClick={savePersyaratan} disabled={savingPersyaratan}>
                <Save size={15} /> {savingPersyaratan ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}

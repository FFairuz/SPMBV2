import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Users, Plus, Pencil, Trash2, X, Search, Shield, ClipboardList, Banknote, GraduationCap, ShieldCheck, ShieldAlert } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

const ROLES = [
  { value: 'admin',     label: 'Administrator', icon: <Shield size={13} />,       color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'panitia',  label: 'Panitia',        icon: <ClipboardList size={13} />, color: '#0284c7', bg: '#f0f9ff' },
  { value: 'bendahara',label: 'Bendahara',      icon: <Banknote size={13} />,      color: '#16a34a', bg: '#f0fdf4' },
  { value: 'siswa',    label: 'Siswa',           icon: <GraduationCap size={13} />, color: '#d97706', bg: '#fffbeb' },
];

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.value === role) || ROLES[3];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 700, padding: '3px 10px',
      borderRadius: 20, background: r.bg, color: r.color,
    }}>
      {r.icon} {r.label}
    </span>
  );
}

const emptyForm = { nama: '', email: '', password: '', role: 'panitia' };

export default function ManajemenUser() {
  const me = getUser();
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [verifying, setVerifying] = useState(null);  // id currently being toggled

  const handleVerify = async (row) => {
    setVerifying(row.id);
    const newVal = !row.is_verified;
    try {
      await api.patch(`/admin/users/${row.id}/verify`, { is_verified: newVal });
      toast.success(newVal ? `Akun ${row.nama} berhasil diaktifkan` : `Akun ${row.nama} dinonaktifkan`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    } finally {
      setVerifying(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { q: search } });
      setRows(res.data);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditData(row);
    setForm({ nama: row.nama, email: row.email, password: '', role: row.role });
    setShowPass(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.email || !form.role) {
      return toast.error('Nama, email, dan role wajib diisi');
    }
    if (!editData && !form.password) {
      return toast.error('Password wajib diisi untuk user baru');
    }
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/admin/users/${editData.id}`, form);
        toast.success('User berhasil diperbarui');
      } else {
        await api.post('/admin/users', form);
        toast.success('User berhasil ditambahkan');
      }
      setShowModal(false);
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
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success('User berhasil dihapus');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const tgl = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const staffRows = rows.filter(r => r.role !== 'siswa');
  const siswaRows = rows.filter(r => r.role === 'siswa');

  const filtered = (arr) =>
    search ? arr.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())) : arr;

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={22} /> Manajemen Pengguna
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Kelola akun admin, panitia, dan bendahara</p>
          </div>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            <Plus size={16} /> Tambah User
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Memuat data...</p>
        ) : (
          <>
            {/* Staff Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569' }}>
                Staff Sekolah ({filtered(staffRows).length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', fontSize: 12, color: '#64748b' }}>
                    <th style={{ padding: '10px 16px' }}>Nama</th>
                    <th style={{ padding: '10px 16px' }}>Email</th>
                    <th style={{ padding: '10px 16px' }}>Role</th>
                    <th style={{ padding: '10px 16px' }}>Terdaftar</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(staffRows).length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Tidak ada data staff</td></tr>
                  ) : filtered(staffRows).map(row => (
                    <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9', fontSize: 13 }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>{row.nama}</td>
                      <td style={{ padding: '10px 16px', color: '#475569' }}>{row.email}</td>
                      <td style={{ padding: '10px 16px' }}><RoleBadge role={row.role} /></td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{tgl(row.created_at)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => openEdit(row)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#475569' }}>
                            <Pencil size={13} />
                          </button>
                          {me?.id !== row.id && (
                            <button onClick={() => setDeleteTarget(row)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Siswa Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Akun Siswa ({filtered(siswaRows).length})</span>
                {siswaRows.filter(r => !r.is_verified).length > 0 && (
                  <span style={{ background: '#fef9c3', color: '#92400e', fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>
                    {siswaRows.filter(r => !r.is_verified).length} belum aktif
                  </span>
                )}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', fontSize: 12, color: '#64748b' }}>
                    <th style={{ padding: '10px 16px' }}>Nama</th>
                    <th style={{ padding: '10px 16px' }}>Email</th>
                    <th style={{ padding: '10px 16px' }}>Status</th>
                    <th style={{ padding: '10px 16px' }}>Terdaftar</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered(siswaRows).length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Tidak ada data siswa</td></tr>
                  ) : filtered(siswaRows).map(row => (
                    <tr key={row.id} style={{ borderTop: '1px solid #f1f5f9', fontSize: 13, background: row.is_verified ? '#fff' : '#fffbeb' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e293b' }}>{row.nama}</td>
                      <td style={{ padding: '10px 16px', color: '#475569' }}>{row.email}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {row.is_verified
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}><ShieldCheck size={12} /> Aktif</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef9c3', color: '#92400e', fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}><ShieldAlert size={12} /> Belum Aktif</span>
                        }
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{tgl(row.created_at)}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleVerify(row)}
                            disabled={verifying === row.id}
                            title={row.is_verified ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: row.is_verified ? '#fef9c3' : '#f0fdf4', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: row.is_verified ? '#92400e' : '#16a34a', fontWeight: 700, fontSize: 12 }}
                          >
                            {row.is_verified ? <><ShieldAlert size={13} /> Nonaktifkan</> : <><ShieldCheck size={13} /> Aktifkan</>}
                          </button>
                          <button onClick={() => openEdit(row)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#475569' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(row)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', margin: 0 }}>{editData ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['nama', 'email'].map(field => (
                <div key={field}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>{field}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    type={field === 'email' ? 'email' : 'text'}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  Password {editData && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  type={showPass ? 'text' : 'password'}
                  placeholder={editData ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                  style={{ width: '100%', marginTop: 4, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '2px 0', marginTop: 2 }}>
                  {showPass ? 'Sembunyikan' : 'Tampilkan'} password
                </button>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', marginTop: 4, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', color: '#475569' }}>Batal</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', background: '#7c3aed', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', color: '#fff', opacity: saving ? .7 : 1 }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <Trash2 size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Hapus User?</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              Akun <strong>{deleteTarget.nama}</strong> akan dihapus permanen.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

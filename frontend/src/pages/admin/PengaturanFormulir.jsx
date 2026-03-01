import { useState, useEffect } from 'react';
import { Lock, ToggleLeft, ToggleRight, ClipboardCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const SECTION_LABELS = {
  data_diri:    'Data Diri Siswa',
  data_sekolah: 'Data Sekolah & Pilihan Jurusan',
  dokumen:      'Dokumen Upload',
};

// Fields that are always active and cannot be changed
const ALWAYS_REQUIRED = [
  { field_key: 'nama_lengkap', label: 'Nama Lengkap',      section: 'data_diri' },
  { field_key: 'pilihan1',     label: 'Pilihan Jurusan 1', section: 'data_sekolah' },
];

export default function PengaturanFormulir() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/form-settings')
      .then(res => setSettings(res.data))
      .catch(() => toast.error('Gagal memuat pengaturan'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field_key, attr) => {
    setSettings(prev => prev.map(s =>
      s.field_key === field_key
        ? {
            ...s,
            [attr]: s[attr] ? 0 : 1,
            // If disabling field, also make it not required
            ...(attr === 'is_enabled' && s.is_enabled ? { is_required: 0 } : {}),
          }
        : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/form-settings', { settings });
      toast.success('Pengaturan formulir berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-container">
          <p style={{ color: '#888', padding: 32 }}>Memuat pengaturan...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <ClipboardCheck size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Pengaturan Formulir
            </h1>
            <p className="page-subtitle">
              Kelola field yang <strong>ditampilkan</strong> dan <strong>wajib diisi</strong> pada formulir pendaftaran siswa
            </p>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>

        {/* Info banner */}
        <div className="pf-info-banner">
          <span>💡</span>
          <span>
            Jika <strong>Tampilkan</strong> dimatikan, field tidak akan muncul di formulir.
            Jika <strong>Wajib Diisi</strong> dimatikan, field opsional (boleh dikosongkan).
            Field berlabel <span className="pf-lock-badge">Selalu Aktif</span> tidak dapat diubah.
          </span>
        </div>

        {/* Sections */}
        {Object.entries(SECTION_LABELS).map(([sectionKey, sectionLabel]) => {
          const alwaysFields   = ALWAYS_REQUIRED.filter(f => f.section === sectionKey);
          const configFields   = settings.filter(s => s.section === sectionKey);

          return (
            <div key={sectionKey} className="pf-section-card">
              <h3 className="pf-section-title">{sectionLabel}</h3>
              <div className="pf-table">
                {/* Header */}
                <div className="pf-table-head">
                  <span>Nama Field</span>
                  <span className="pf-col-center">Tampilkan</span>
                  <span className="pf-col-center">Wajib Diisi</span>
                </div>

                {/* Always-required rows */}
                {alwaysFields.map(f => (
                  <div key={f.field_key} className="pf-table-row pf-row-locked">
                    <span className="pf-row-label">
                      <Lock size={12} className="pf-lock-icon" />
                      {f.label}
                      <span className="pf-lock-badge">Selalu Aktif</span>
                    </span>
                    <span className="pf-col-center pf-check-on">✓</span>
                    <span className="pf-col-center pf-check-on">✓</span>
                  </div>
                ))}

                {/* Configurable rows */}
                {configFields.map(s => (
                  <div key={s.field_key} className={`pf-table-row ${!s.is_enabled ? 'pf-row-disabled' : ''}`}>
                    <span className="pf-row-label">{s.label}</span>

                    {/* Tampilkan toggle */}
                    <span className="pf-col-center">
                      <button
                        type="button"
                        className={`pf-toggle ${s.is_enabled ? 'pf-toggle-on' : 'pf-toggle-off'}`}
                        onClick={() => toggle(s.field_key, 'is_enabled')}
                        title={s.is_enabled ? 'Klik untuk sembunyikan' : 'Klik untuk tampilkan'}
                      >
                        {s.is_enabled
                          ? <ToggleRight size={30} />
                          : <ToggleLeft  size={30} />}
                      </button>
                    </span>

                    {/* Wajib Diisi toggle */}
                    <span className="pf-col-center">
                      <button
                        type="button"
                        className={`pf-toggle ${s.is_required ? 'pf-toggle-on' : 'pf-toggle-off'} ${!s.is_enabled ? 'pf-toggle-disabled' : ''}`}
                        onClick={() => s.is_enabled && toggle(s.field_key, 'is_required')}
                        disabled={!s.is_enabled}
                        title={!s.is_enabled ? 'Field dinonaktifkan' : s.is_required ? 'Klik untuk jadikan opsional' : 'Klik untuk jadikan wajib'}
                      >
                        {s.is_required
                          ? <ToggleRight size={30} />
                          : <ToggleLeft  size={30} />}
                      </button>
                    </span>
                  </div>
                ))}

                {configFields.length === 0 && alwaysFields.length === 0 && (
                  <div className="pf-table-empty">Tidak ada field di bagian ini</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 180 }}>
            <Save size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

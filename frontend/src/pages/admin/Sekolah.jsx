import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  School, Upload, X, Loader2, Save, ImageOff, Globe,
  Phone, Mail, MapPin, Hash, User2, Building2
} from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const emptyForm = {
  nama_sekolah: '',
  npsn: '',
  kepala_sekolah: '',
  alamat: '',
  kota: '',
  provinsi: '',
  telpon: '',
  email: '',
  website: '',
};

export default function Sekolah() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);       // saved logo URL from DB
  const [logoFile, setLogoFile] = useState(null);     // pending file to upload
  const [logoPreview, setLogoPreview] = useState(null); // object URL for preview
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  const logoInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sekolah');
      const d = res.data;
      setForm({
        nama_sekolah: d.nama_sekolah || '',
        npsn: d.npsn || '',
        kepala_sekolah: d.kepala_sekolah || '',
        alamat: d.alamat || '',
        kota: d.kota || '',
        provinsi: d.provinsi || '',
        telpon: d.telpon || '',
        email: d.email || '',
        website: d.website || '',
      });
      setLogoSrc(d.logo || null);
      setLogoPreview(d.logo ? `${API_BASE}${d.logo}` : null);
      setLogoErr(false);
    } catch {
      toast.error('Gagal memuat data sekolah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Hanya file gambar yang diizinkan'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoErr(false);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const res = await api.post('/admin/sekolah/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLogoSrc(res.data.logo);
      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      toast.success('Logo sekolah berhasil diupload');
      // Notify sidebar to refresh
      window.dispatchEvent(new Event('sekolah-updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoSrc && !logoFile) return;
    if (logoFile) {
      setLogoFile(null);
      setLogoPreview(logoSrc ? `${API_BASE}${logoSrc}` : null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    try {
      await api.delete('/admin/sekolah/logo');
      setLogoSrc(null);
      setLogoPreview(null);
      setLogoErr(false);
      toast.success('Logo berhasil dihapus');
      window.dispatchEvent(new Event('sekolah-updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus logo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_sekolah) { toast.error('Nama sekolah wajib diisi'); return; }
    setSaving(true);
    try {
      await api.put('/admin/sekolah', form);
      if (logoFile) await handleUploadLogo();
      else toast.success('Identitas sekolah berhasil disimpan');
      window.dispatchEvent(new Event('sekolah-updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="loading-center" style={{ minHeight: 300 }}>
        <Loader2 size={32} className="spin" />
      </div>
    </Layout>
  );

  const logoDisplay = logoPreview && !logoErr;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-header">
          <div>
            <h2>Profil Sekolah</h2>
            <p>Atur identitas dan logo sekolah yang tampil di seluruh aplikasi</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sekolah-layout">

            {/* LEFT: Logo */}
            <div className="sekolah-logo-card">
              <h3 className="sekolah-section-title"><School size={16} /> Logo Sekolah</h3>
              <p className="sekolah-section-sub">Logo akan tampil di sidebar dan header aplikasi</p>

              <div className="sekolah-logo-wrap">
                {logoDisplay ? (
                  <img
                    src={logoPreview}
                    alt="Logo Sekolah"
                    className="sekolah-logo-img"
                    onError={() => setLogoErr(true)}
                  />
                ) : (
                  <div className="sekolah-logo-empty">
                    <Building2 size={52} />
                    <span>Belum ada logo</span>
                  </div>
                )}
              </div>

              <div className="sekolah-logo-actions">
                <label className="btn-sekolah-upload">
                  <Upload size={15} />
                  {logoDisplay ? 'Ganti Logo' : 'Upload Logo'}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoChange}
                  />
                </label>
                {(logoDisplay || logoFile) && (
                  <button type="button" className="btn-sekolah-remove-logo" onClick={handleRemoveLogo}>
                    <ImageOff size={14} /> Hapus
                  </button>
                )}
              </div>

              {logoFile && (
                <div className="sekolah-logo-pending">
                  <span>⚠️ Logo belum tersimpan</span>
                  <button type="button" className="btn-sekolah-save-logo" onClick={handleUploadLogo} disabled={uploadingLogo}>
                    {uploadingLogo ? <><Loader2 size={13} className="spin" /> Mengupload...</> : <><Upload size={13} /> Simpan Logo</>}
                  </button>
                </div>
              )}

              <p className="sekolah-logo-hint">Format: PNG, JPG, SVG, WebP · Maks 5MB<br />Disarankan ukuran persegi (misal 256×256px)</p>
            </div>

            {/* RIGHT: Identity Form */}
            <div className="sekolah-form-card">
              <h3 className="sekolah-section-title"><Building2 size={16} /> Identitas Sekolah</h3>

              <div className="ts-field">
                <label className="ts-label">Nama Sekolah <span className="ts-required">*</span></label>
                <div className="sekolah-input-wrap">
                  <School size={15} className="sekolah-input-icon" />
                  <input name="nama_sekolah" value={form.nama_sekolah} onChange={handleChange}
                    className="ts-input sekolah-input-with-icon" placeholder="cth: SMK Negeri 1 Kota" />
                </div>
              </div>

              <div className="ts-grid-2">
                <div className="ts-field">
                  <label className="ts-label">NPSN</label>
                  <div className="sekolah-input-wrap">
                    <Hash size={15} className="sekolah-input-icon" />
                    <input name="npsn" value={form.npsn} onChange={handleChange}
                      className="ts-input sekolah-input-with-icon" placeholder="cth: 20401234" maxLength={20} />
                  </div>
                </div>
                <div className="ts-field">
                  <label className="ts-label">Kepala Sekolah</label>
                  <div className="sekolah-input-wrap">
                    <User2 size={15} className="sekolah-input-icon" />
                    <input name="kepala_sekolah" value={form.kepala_sekolah} onChange={handleChange}
                      className="ts-input sekolah-input-with-icon" placeholder="cth: Drs. Budi Santoso, M.Pd" />
                  </div>
                </div>
              </div>

              <div className="ts-field">
                <label className="ts-label">Alamat</label>
                <div className="sekolah-input-wrap">
                  <MapPin size={15} className="sekolah-input-icon" style={{ top: 14 }} />
                  <textarea name="alamat" value={form.alamat} onChange={handleChange}
                    className="ts-input ts-textarea sekolah-input-with-icon" placeholder="Jl. Pendidikan No. 1" rows={2} />
                </div>
              </div>

              <div className="ts-grid-2">
                <div className="ts-field">
                  <label className="ts-label">Kota / Kabupaten</label>
                  <input name="kota" value={form.kota} onChange={handleChange}
                    className="ts-input" placeholder="cth: Bandung" />
                </div>
                <div className="ts-field">
                  <label className="ts-label">Provinsi</label>
                  <input name="provinsi" value={form.provinsi} onChange={handleChange}
                    className="ts-input" placeholder="cth: Jawa Barat" />
                </div>
              </div>

              <div className="ts-grid-2">
                <div className="ts-field">
                  <label className="ts-label">Telepon</label>
                  <div className="sekolah-input-wrap">
                    <Phone size={15} className="sekolah-input-icon" />
                    <input name="telpon" value={form.telpon} onChange={handleChange}
                      className="ts-input sekolah-input-with-icon" placeholder="cth: 022-1234567" />
                  </div>
                </div>
                <div className="ts-field">
                  <label className="ts-label">Email</label>
                  <div className="sekolah-input-wrap">
                    <Mail size={15} className="sekolah-input-icon" />
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className="ts-input sekolah-input-with-icon" placeholder="cth: info@smkn1.sch.id" />
                  </div>
                </div>
              </div>

              <div className="ts-field">
                <label className="ts-label">Website</label>
                <div className="sekolah-input-wrap">
                  <Globe size={15} className="sekolah-input-icon" />
                  <input name="website" value={form.website} onChange={handleChange}
                    className="ts-input sekolah-input-with-icon" placeholder="cth: https://smkn1.sch.id" />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-ts-next" disabled={saving} style={{ minWidth: 160 }}>
                  {saving
                    ? <><Loader2 size={16} className="spin" /> Menyimpan...</>
                    : <><Save size={16} /> Simpan Identitas</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}

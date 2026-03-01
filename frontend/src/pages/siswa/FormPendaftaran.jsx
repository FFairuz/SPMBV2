import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Home, Phone, Users, FileText, ChevronRight, ChevronLeft, Check, Loader2, GraduationCap, Upload, ShieldAlert } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STEPS = [
  { id: 1, label: 'Identitas Pribadi', icon: User },
  { id: 2, label: 'Tempat Tinggal',   icon: Home },
  { id: 3, label: 'Kontak & Ortu',    icon: Users },
  { id: 4, label: 'Dokumen & Kirim',  icon: FileText },
];

const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const PENDIDIKAN = ['Tidak Sekolah','SD/Sederajat','SMP/Sederajat','SMA/Sederajat','D1','D2','D3','D4/S1','S2','S3'];
const PENGHASILAN = [
  'Tidak Berpenghasilan',
  'Kurang dari Rp 1.000.000',
  'Rp 1.000.000 - Rp 2.000.000',
  'Rp 2.000.000 - Rp 3.000.000',
  'Rp 3.000.000 - Rp 5.000.000',
  'Lebih dari Rp 5.000.000',
];
const TRANSPORTASI = ['Jalan kaki','Sepeda','Sepeda motor','Mobil pribadi','Angkutan umum','Ojek','Lainnya'];

const JALUR_OPTIONS = [
  { value: 'muhammadiyah',     label: 'Muhammadiyah',     desc: 'Jalur khusus calon siswa dari keluarga Muhammadiyah',           icon: '🕌', color: '#059669', bg: '#ecfdf5' },
  { value: 'non_muhammadiyah', label: 'Non Muhammadiyah', desc: 'Jalur umum untuk calon siswa di luar keluarga Muhammadiyah',    icon: '🏫', color: '#2563eb', bg: '#eff6ff' },
  { value: 'spmb_bersama',     label: 'SPMB Bersama',     desc: 'Jalur penerimaan bersama lintas sekolah dan yayasan',           icon: '🤝', color: '#7c3aed', bg: '#f5f3ff' },
];

const JURUSAN_COLORS = [
  { color: '#0284c7', bg: '#f0f9ff' },
  { color: '#dc2626', bg: '#fef2f2' },
  { color: '#d97706', bg: '#fffbeb' },
  { color: '#059669', bg: '#ecfdf5' },
  { color: '#7c3aed', bg: '#f5f3ff' },
  { color: '#db2777', bg: '#fdf2f8' },
];

const initialForm = {
  jalur_pendaftaran: '',
  nama_lengkap: '', nik: '', nisn: '', tempat_lahir: '',
  tanggal_lahir: '', jenis_kelamin: '', agama: '',
  kewarganegaraan: 'WNI', berkebutuhan_khusus: 'Tidak',
  asal_sekolah: '', npsn_asal: '', kabupaten_asal: '', tahun_lulus: '',
  nilai_rata_rata: '',
  tinggi_badan: '', berat_badan: '', lingkar_kepala: '',
  pernah_paud: 'Tidak', nama_paud: '', hobi: '', cita_cita: '',
  alamat: '', rt: '', rw: '', kelurahan: '',
  kecamatan: '', kabupaten: '', provinsi: '', kode_pos: '',
  jarak_rumah: '', transportasi: '',
  no_telp: '', email_siswa: '',
  nama_ayah: '', nik_ayah: '', pendidikan_ayah: '', pekerjaan_ayah: '', penghasilan_ayah: '', no_hp_ayah: '',
  nama_ibu: '', nik_ibu: '', pendidikan_ibu: '', pekerjaan_ibu: '', penghasilan_ibu: '', no_hp_ibu: '',
  nama_wali: '', no_hp_wali: '',
  pilihan1: '',
};

export default function FormPendaftaran() {
  const navigate = useNavigate();
  const user = getUser();
  const DRAFT_KEY = `spmb_draft_${user?.id || 'guest'}`;
  const [jalurDipilih, setJalurDipilih] = useState(null);
  const [jurusanDipilih, setJurusanDipilih] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({ foto: null, ijazah: null, kk: null });
  const [jurusan, setJurusan] = useState([]);
  const [asalSekolahList, setAsalSekolahList] = useState([]);
  const [sudahDaftar, setSudahDaftar] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [slideDir, setSlideDir] = useState('next');

  useEffect(() => {
    api.get('/pendaftaran/saya')
      .then(() => setSudahDaftar(true))
      .catch(() => {
        setSudahDaftar(false);
        try {
          const saved = localStorage.getItem(DRAFT_KEY);
          if (saved) {
            const { form: f, jalur, jurusan: jur } = JSON.parse(saved);
            if (f) setForm(f);
            if (jalur) setJalurDipilih(jalur);
            if (jur) setJurusanDipilih(jur);
            setHasDraft(true);
          }
        } catch {}
      })
      .finally(() => setCheckLoading(false));
    api.get('/pendaftaran/jurusan').then(r => setJurusan(r.data)).catch(() => {});
    api.get('/pendaftaran/sekolah-asal').then(r => setAsalSekolahList(r.data)).catch(() => {});
  }, []);

  // Auto-save draft setiap ada perubahan form
  useEffect(() => {
    if (checkLoading || sudahDaftar) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, jalur: jalurDipilih, jurusan: jurusanDipilih }));
    } catch {}
  }, [form, jalurDipilih, jurusanDipilih]);

  const pilihJalur = (val) => {
    setJalurDipilih(val);
    setForm(prev => ({ ...prev, jalur_pendaftaran: val }));
  };
  const gantiJalur = () => {
    setJalurDipilih(null);
    setJurusanDipilih(null);
    setForm(prev => ({ ...prev, jalur_pendaftaran: '', pilihan1: '' }));
  };
  const requestGantiJalur = () => setConfirmModal({
    title: 'Ganti Jalur Pendaftaran?',
    message: 'Mengganti jalur akan mereset pilihan jurusan. Lanjutkan?',
    onConfirm: () => { gantiJalur(); setConfirmModal(null); },
  });
  const pilihJurusan = (j) => {
    setJurusanDipilih(j);
    setForm(prev => ({ ...prev, pilihan1: j.id }));
  };
  const gantiJurusan = () => {
    setJurusanDipilih(null);
    setForm(prev => ({ ...prev, pilihan1: '' }));
  };
  const requestGantiJurusan = () => setConfirmModal({
    title: 'Ganti Jurusan?',
    message: 'Pilihan jurusan Anda akan direset. Lanjutkan?',
    onConfirm: () => { gantiJurusan(); setConfirmModal(null); },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  const handleFile = (e) => {
    setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const getStepErrors = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.nama_lengkap)               errs.nama_lengkap  = 'Nama Lengkap';
      if (!form.nik || form.nik.length < 16) errs.nik           = 'NIK (harus 16 digit)';
      if (!form.tempat_lahir)               errs.tempat_lahir  = 'Tempat Lahir';
      if (!form.tanggal_lahir)              errs.tanggal_lahir = 'Tanggal Lahir';
      if (!form.jenis_kelamin)              errs.jenis_kelamin = 'Jenis Kelamin';
      if (!form.agama)                      errs.agama         = 'Agama';
      if (!form.asal_sekolah)               errs.asal_sekolah  = 'Asal Sekolah';
    }
    if (s === 2) {
      if (!form.alamat) errs.alamat = 'Alamat';
    }
    if (s === 3) {
      if (!form.no_telp)   errs.no_telp   = 'No. Telepon';
      if (!form.nama_ayah) errs.nama_ayah = 'Nama Ayah';
      if (!form.nama_ibu)  errs.nama_ibu  = 'Nama Ibu';
    }
    return errs;
  };

  const validateStep = () => {
    const errs = getStepErrors(step);
    const display = {};
    Object.keys(errs).forEach(k => { display[k] = k === 'nik' ? 'NIK harus 16 digit' : 'Wajib diisi'; });
    setErrors(display);
    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const el = document.querySelector('.ts-input-error');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { setSlideDir('next'); if (validateStep()) { setStep(s => s + 1); window.scrollTo(0, 0); } };
  const handleBack = () => { setSlideDir('back'); setStep(s => s - 1); window.scrollTo(0, 0); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allErrs = {};
    const missingByStep = {};
    for (let s = 1; s <= 3; s++) {
      const stepErrs = getStepErrors(s);
      if (Object.keys(stepErrs).length > 0) {
        missingByStep[s] = Object.values(stepErrs);
        Object.keys(stepErrs).forEach(k => { allErrs[k] = k === 'nik' ? 'NIK harus 16 digit' : 'Wajib diisi'; });
      }
    }
    if (Object.keys(allErrs).length > 0) {
      setErrors(allErrs);
      const firstBad = [1, 2, 3].find(s => missingByStep[s]);
      if (firstBad) setStep(firstBad);
      const lines = Object.entries(missingByStep).map(([s, f]) => `Step ${s}: ${f.join(', ')}`).join(' | ');
      toast.error(`Field belum lengkap — ${lines}`, { duration: 6000 });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v ?? ''));
    if (files.foto)   formData.append('foto',   files.foto);
    if (files.ijazah) formData.append('ijazah', files.ijazah);
    if (files.kk)     formData.append('kk',     files.kk);
    try {
      const res = await api.post('/pendaftaran', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      localStorage.removeItem(DRAFT_KEY);
      toast.success(`Pendaftaran berhasil! No: ${res.data.nomor_pendaftaran}`);
      navigate('/status');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  /* ── helpers ── */
  const Field = ({ label, name, type = 'text', required, children, hint }) => (
    <div className="ts-field">
      <label className="ts-label">{label}{required && <span className="ts-required"> *</span>}</label>
      {children || (
        <input type={type} name={name} value={form[name]} onChange={handleChange}
          className={`ts-input${errors[name] ? ' ts-input-error' : ''}`}
          placeholder={hint || `Masukkan ${label.toLowerCase()}`}
          inputMode={type === 'tel' || type === 'number' ? 'numeric' : undefined} />
      )}
      {errors[name] && <span className="ts-error-msg">{errors[name]}</span>}
    </div>
  );
  const Sel = ({ label, name, options, required }) => (
    <div className="ts-field">
      <label className="ts-label">{label}{required && <span className="ts-required"> *</span>}</label>
      <select name={name} value={form[name]} onChange={handleChange}
        className={`ts-input${errors[name] ? ' ts-input-error' : ''}`}>
        <option value="">Pilih...</option>
        {options.map(opt => typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {errors[name] && <span className="ts-error-msg">{errors[name]}</span>}
    </div>
  );

  /* ── Guards ── */
  if (checkLoading) return <Layout><LoadingSpinner /></Layout>;

  if (user?.is_verified === false) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>Akses Terkunci</h3>
          <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
            Akun Anda belum diaktifkan oleh panitia. Anda tidak dapat mengisi formulir sebelum akun diaktifkan.
          </p>
          <div style={{ background: '#fef9c3', border: '1.5px solid #fde047', borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={16} /> Cara Aktivasi Akun
            </div>
            <p style={{ color: '#78350f', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Hubungi panitia sekolah dan berikan email yang Anda gunakan untuk mendaftar.
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')}
            style={{ background: '#6366f1', color: '#fff', padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Kembali ke Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  if (sudahDaftar) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>Anda Sudah Mendaftar</h3>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Formulir pendaftaran Anda sudah terisi. Pantau status di halaman status.</p>
          <button onClick={() => navigate('/status')}
            style={{ background: '#6366f1', color: '#fff', padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Lihat Status Pendaftaran
          </button>
        </div>
      </Layout>
    );
  }

  /* ── Screen: Pilih Jalur ── */
  if (!jalurDipilih) {
    return (
      <Layout>
        <div className="jalur-select-page">
          <div className="jalur-select-header">
            <h1 className="jalur-select-title">Pilih Jalur Pendaftaran</h1>
            <p className="jalur-select-sub">Tentukan jalur pendaftaran sebelum mengisi data</p>
          </div>
          <div className="jalur-cards">
            {JALUR_OPTIONS.map(j => (
              <button key={j.value} className="jalur-card"
                style={{ '--jalur-color': j.color, '--jalur-bg': j.bg }}
                onClick={() => pilihJalur(j.value)}>
                <span className="jalur-card-icon">{j.icon}</span>
                <span className="jalur-card-label">{j.label}</span>
                <span className="jalur-card-desc">{j.desc}</span>
                <span className="jalur-card-cta">Pilih Jalur →</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-ts-cancel" onClick={() => navigate('/dashboard')}>← Kembali ke Dashboard</button>
          </div>
        </div>
      </Layout>
    );
  }

  const jalurInfo = JALUR_OPTIONS.find(j => j.value === jalurDipilih);

  /* ── Screen: Pilih Jurusan ── */
  if (!jurusanDipilih) {
    return (
      <Layout>
        <div className="jalur-select-page">
          <div className="jalur-select-header">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: jalurInfo.bg, color: jalurInfo.color, border: `1.5px solid ${jalurInfo.color}`, borderRadius: 20, padding: '6px 16px', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              <span>{jalurInfo.icon}</span>
              <span>Jalur: <strong>{jalurInfo.label}</strong></span>
            </div>
            <h1 className="jalur-select-title">Pilih Jurusan</h1>
            <p className="jalur-select-sub">Pilih jurusan yang ingin Anda daftarkan</p>
          </div>
          {jurusan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Belum Ada Jurusan Tersedia</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>Data jurusan belum tersedia. Hubungi panitia untuk informasi lebih lanjut.</p>
            </div>
          ) : (
          <div className="jurusan-select-cards">
            {jurusan.map((j, i) => {
              const clr   = JURUSAN_COLORS[i % JURUSAN_COLORS.length];
              const terisi = Number(j.total_pendaftar) || 0;
              const kuota  = Number(j.kuota) || 0;
              const pct    = kuota > 0 ? Math.min((terisi / kuota) * 100, 100) : 0;
              const penuh  = kuota > 0 && terisi >= kuota;
              return (
                <button key={j.id}
                  className={`jurusan-card${penuh ? ' jurusan-card-penuh' : ''}`}
                  style={{ '--jalur-color': clr.color, '--jalur-bg': clr.bg }}
                  onClick={() => !penuh && pilihJurusan(j)}
                  disabled={penuh}>
                  <span className="jurusan-card-icon">
                    {j.logo
                      ? <img src={`${API_BASE}${j.logo}`} alt={j.nama} className="jurusan-card-logo-img"
                          onError={e => { e.target.style.display = 'none'; }} />
                      : <GraduationCap size={40} />}
                  </span>
                  <span className="jurusan-card-label">{j.nama}</span>
                  <span className="jurusan-card-kode">{j.kode}</span>
                  <div className="jurusan-card-kuota">
                    <div className="kuota-info">
                      <span>Terisi: <strong>{terisi}</strong></span>
                      <span>Kuota: <strong>{kuota}</strong></span>
                    </div>
                    <div className="kuota-bar">
                      <div className="kuota-fill" style={{ width: `${pct}%`, background: clr.color }} />
                    </div>
                    <div className="kuota-sisa" style={{ color: penuh ? '#dc2626' : clr.color }}>
                      {penuh ? '⚠️ Kuota Penuh' : `Sisa ${kuota - terisi} kursi`}
                    </div>
                  </div>
                  {!penuh && <span className="jalur-card-cta">Pilih Jurusan →</span>}
                </button>
              );
            })}
          </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-ts-cancel" onClick={gantiJalur}>← Ganti Jalur Pendaftaran</button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Main 4-step Form ── */
  return (
    <Layout>
      <div className="ts-page">
        <div className="ts-header">
          <h1 className="ts-title">Formulir Pendaftaran</h1>
          <p className="ts-subtitle">Isi data lengkap sesuai dokumen resmi</p>
        </div>

        {/* Active Jalur + Jurusan banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: jalurInfo.bg, border: `1.5px solid ${jalurInfo.color}`, borderRadius: 10, padding: '10px 16px', marginBottom: 18, fontSize: 14 }}>
          <span style={{ fontSize: 20 }}>{jalurInfo.icon}</span>
          <span style={{ color: jalurInfo.color, fontWeight: 700 }}>Jalur: {jalurInfo.label}</span>
          <button type="button" onClick={requestGantiJalur}
            style={{ color: jalurInfo.color, background: 'none', border: `1px solid ${jalurInfo.color}`, borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Ganti
          </button>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ color: '#1e293b', fontWeight: 700 }}>🎓 {jurusanDipilih.nama} ({jurusanDipilih.kode})</span>
          <button type="button" onClick={requestGantiJurusan}
            style={{ color: '#7c3aed', background: 'none', border: '1px solid #7c3aed', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Ganti
          </button>
        </div>

        {/* Draft restore banner */}
        {hasDraft && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#fffbeb', border: '1.5px solid #fde047', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 14 }}>
            <span>✏️</span>
            <span style={{ color: '#92400e', fontWeight: 600, flex: 1 }}>Draft tersimpan dipulihkan — data Anda dilanjutkan dari sesi sebelumnya.</span>
            <button type="button"
              onClick={() => { setForm(initialForm); gantiJalur(); localStorage.removeItem(DRAFT_KEY); setHasDraft(false); }}
              style={{ color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: 6, padding: '2px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Hapus Draft
            </button>
          </div>
        )}

        {/* Step indicator - desktop */}
        <div className="ts-steps fp-steps-desktop">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone   = step > s.id;
            return (
              <div key={s.id} className="ts-step-wrapper">
                <div className={`ts-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                  <div className="ts-step-icon">{isDone ? <Check size={16} /> : <Icon size={16} />}</div>
                  <span className="ts-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`ts-step-line${isDone ? ' done' : ''}`} />}
              </div>
            );
          })}
        </div>
        {/* Step indicator - mobile */}
        <div className="fp-steps-mobile">
          <div className="fp-steps-mobile-label">
            <span className="fp-steps-mobile-badge">{step}/{STEPS.length}</span>
            <span className="fp-steps-mobile-name">{STEPS[step - 1]?.label}</span>
          </div>
          <div className="fp-steps-mobile-bar">
            <div className="fp-steps-mobile-fill" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <form className="ts-form-card" onSubmit={handleSubmit}>
          <div key={step} className={`fp-slide-in-${slideDir}`}>

          {/* ── STEP 1: Identitas ── */}
          {step === 1 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><User size={20} /> Data Identitas Pribadi</h2>
              <div className="ts-grid-2">
                <Field label="Nama Lengkap"         name="nama_lengkap"   required />
                <div className="ts-field">
                  <label className="ts-label">NIK<span className="ts-required"> *</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" name="nik" value={form.nik} maxLength={16}
                      onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 16); setForm(p => ({ ...p, nik: v })); if (errors.nik) setErrors(p => ({ ...p, nik: '' })); }}
                      className={`ts-input${errors.nik ? ' ts-input-error' : ''}`}
                      placeholder="16 digit NIK" style={{ paddingRight: 60 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: form.nik.length === 16 ? '#16a34a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                      {form.nik.length}/16{form.nik.length === 16 ? ' ✓' : ''}
                    </span>
                  </div>
                  {errors.nik && <span className="ts-error-msg">{errors.nik}</span>}
                </div>
                <Field label="NISN"                 name="nisn"           hint="10 digit NISN (opsional)" />
                <Field label="Tempat Lahir"         name="tempat_lahir"   required />
                <Field label="Tanggal Lahir"        name="tanggal_lahir"  type="date" required />
                <Sel   label="Jenis Kelamin"        name="jenis_kelamin"  required
                  options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                <Sel   label="Agama"                name="agama"          required options={AGAMA} />
                <Sel   label="Kewarganegaraan"      name="kewarganegaraan" options={['WNI', 'WNA']} />
                <div className="ts-field">
                  <label className="ts-label">Berkebutuhan Khusus</label>
                  <select name="berkebutuhan_khusus" value={form.berkebutuhan_khusus} onChange={handleChange} className="ts-input">
                    <option value="Tidak">Tidak</option>
                    <option value="Tuna Netra">Tuna Netra</option>
                    <option value="Tuna Rungu">Tuna Rungu</option>
                    <option value="Tuna Wicara">Tuna Wicara</option>
                    <option value="Tuna Grahita">Tuna Grahita</option>
                    <option value="Tuna Daksa">Tuna Daksa</option>
                    <option value="Autis">Autis</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <Field label="Nilai Rata-rata Rapor" name="nilai_rata_rata" type="number" hint="0 – 100" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>📏 Data Fisik & Lainnya</h2>
              <div className="ts-grid-3">
                <Field label="Tinggi Badan (cm)" name="tinggi_badan" type="number" hint="cth: 155" />
                <Field label="Berat Badan (kg)"  name="berat_badan"  type="number" hint="cth: 45" />
                <Field label="Lingkar Kepala (cm)" name="lingkar_kepala" type="number" hint="cth: 52" />
              </div>
              <div className="ts-grid-2">
                <div className="ts-field">
                  <label className="ts-label">Pernah PAUD/TK</label>
                  <select name="pernah_paud" value={form.pernah_paud} onChange={handleChange} className="ts-input">
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya</option>
                  </select>
                </div>
                {form.pernah_paud === 'Ya' && (
                  <Field label="Nama PAUD/TK" name="nama_paud" hint="Masukkan nama PAUD atau TK" />
                )}
                <Field label="Hobi"      name="hobi"      hint="cth: Membaca, Olahraga" />
                <Field label="Cita-cita" name="cita_cita" hint="cth: Dokter, Insinyur" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>🏫 Data Asal Sekolah</h2>
              <div className="ts-grid-2">
                <div className="ts-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="ts-label">Nama Sekolah Asal <span className="ts-required">*</span></label>
                  {asalSekolahList.length > 0 ? (
                    <select name="asal_sekolah" value={form.asal_sekolah}
                      onChange={e => { handleChange(e); if (errors.asal_sekolah) setErrors(p => ({ ...p, asal_sekolah: '' })); }}
                      className={`ts-input${errors.asal_sekolah ? ' ts-input-error' : ''}`}>
                      <option value="">-- Pilih sekolah asal --</option>
                      {asalSekolahList.map(s => (
                        <option key={s.id} value={s.nama_sekolah}>
                          {s.nama_sekolah}{s.npsn ? ` (${s.npsn})` : ''} — {s.tipe}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input name="asal_sekolah" value={form.asal_sekolah} onChange={handleChange}
                      className={`ts-input${errors.asal_sekolah ? ' ts-input-error' : ''}`}
                      placeholder="Nama SMP/MTs asal" />
                  )}
                  {errors.asal_sekolah && <span className="ts-error-msg">{errors.asal_sekolah}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Tempat Tinggal ── */}
          {step === 2 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><Home size={20} /> Data Tempat Tinggal</h2>
              <div className="ts-grid-1">
                <div className="ts-field">
                  <label className="ts-label">Alamat Lengkap <span className="ts-required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={3} maxLength={300}
                      className={`ts-input ts-textarea${errors.alamat ? ' ts-input-error' : ''}`}
                      placeholder="Masukkan alamat lengkap" style={{ paddingBottom: 28 }} />
                    <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 11, color: form.alamat.length > 260 ? '#dc2626' : '#94a3b8', fontWeight: 500 }}>
                      {form.alamat.length}/300
                    </span>
                  </div>
                  {errors.alamat && <span className="ts-error-msg">{errors.alamat}</span>}
                </div>
              </div>
              <div className="ts-grid-3">
                <Field label="RT"       name="rt"       hint="001" />
                <Field label="RW"       name="rw"       hint="002" />
                <Field label="Kode Pos" name="kode_pos" hint="12345" />
              </div>
              <div className="ts-grid-3">
                <Field label="Kelurahan/Desa" name="kelurahan" />
                <Field label="Kecamatan"      name="kecamatan" />
                <Field label="Kabupaten/Kota" name="kabupaten" />
              </div>
              <div className="ts-grid-3">
                <Field label="Provinsi"          name="provinsi" />
                <Field label="Jarak ke Sekolah"  name="jarak_rumah" hint="cth: 2 km" />
                <Sel   label="Moda Transportasi" name="transportasi" options={TRANSPORTASI} />
              </div>
            </div>
          )}

          {/* ── STEP 3: Kontak & Ortu ── */}
          {step === 3 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><Phone size={20} /> Data Kontak Siswa</h2>
              <div className="ts-grid-2">
                <Field label="No. HP / Telepon" name="no_telp"     type="tel"   required hint="08xxxxxxxxxx" />
                <Field label="Email Siswa"       name="email_siswa" type="email" hint="Email siswa (opsional)" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Users size={20} /> Data Ayah</h2>
              <div className="ts-grid-2">
                <Field label="Nama Ayah"       name="nama_ayah"       required />
                <Field label="NIK Ayah"        name="nik_ayah"        hint="16 digit NIK" />
                <Sel   label="Pendidikan Ayah" name="pendidikan_ayah" options={PENDIDIKAN} />
                <Field label="Pekerjaan Ayah"  name="pekerjaan_ayah" />
                <Sel   label="Penghasilan Ayah" name="penghasilan_ayah" options={PENGHASILAN} />
                <Field label="No. HP Ayah"     name="no_hp_ayah"      type="tel" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Users size={20} /> Data Ibu</h2>
              <div className="ts-grid-2">
                <Field label="Nama Ibu"       name="nama_ibu"       required />
                <Field label="NIK Ibu"        name="nik_ibu"        hint="16 digit NIK" />
                <Sel   label="Pendidikan Ibu" name="pendidikan_ibu" options={PENDIDIKAN} />
                <Field label="Pekerjaan Ibu"  name="pekerjaan_ibu" />
                <Sel   label="Penghasilan Ibu" name="penghasilan_ibu" options={PENGHASILAN} />
                <Field label="No. HP Ibu"     name="no_hp_ibu"      type="tel" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Users size={20} /> Data Wali (Jika Ada)</h2>
              <div className="ts-grid-2">
                <Field label="Nama Wali"    name="nama_wali"  hint="Kosongkan jika tidak ada" />
                <Field label="No. HP Wali"  name="no_hp_wali" type="tel" />
              </div>
            </div>
          )}

          {/* ── STEP 4: Dokumen & Review ── */}
          {step === 4 && (() => {
            const checkItems = [
              { step: 1, label: 'Identitas Pribadi',  fields: getStepErrors(1) },
              { step: 2, label: 'Tempat Tinggal',     fields: getStepErrors(2) },
              { step: 3, label: 'Kontak & Orang Tua', fields: getStepErrors(3) },
            ];
            const hasAnyError = checkItems.some(c => Object.keys(c.fields).length > 0);
            return (
              <div className="ts-section">
                <h2 className="ts-section-title"><Check size={20} /> Kelengkapan Data</h2>
                <div className="ts-checklist">
                  {checkItems.map(c => {
                    const missing = Object.values(c.fields);
                    const ok = missing.length === 0;
                    return (
                      <div key={c.step} className={`ts-checklist-row${ok ? ' ts-cl-ok' : ' ts-cl-err'}`}>
                        <div className="ts-cl-left">
                          <span className="ts-cl-badge">{ok ? '✓' : '✗'}</span>
                          <span className="ts-cl-step-label">{c.label}</span>
                        </div>
                        {ok ? (
                          <span className="ts-cl-status-ok">Lengkap</span>
                        ) : (
                          <div className="ts-cl-right">
                            <span className="ts-cl-status-err">Belum lengkap:</span>
                            <div className="ts-cl-fields">
                              {missing.map(f => <span key={f} className="ts-cl-field-tag">{f}</span>)}
                            </div>
                            <button type="button" className="ts-cl-fix-btn"
                              onClick={() => { setStep(c.step); setErrors({}); }}>
                              Lengkapi →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {hasAnyError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13, marginTop: 12 }}>
                    ⚠️ Masih ada data yang belum lengkap. Klik <strong>Lengkapi →</strong> untuk memperbaiki.
                  </div>
                )}

                <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Upload size={20} /> Upload Dokumen</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Format: JPG, PNG, atau PDF. Maksimal 5MB per file.</p>
                <div className="upload-grid">
                  {[
                    { name: 'foto',   label: 'Pas Foto 3×4 *', accept: 'image/*' },
                    { name: 'ijazah', label: 'Ijazah / SKL',   accept: 'image/*,application/pdf' },
                    { name: 'kk',     label: 'Kartu Keluarga', accept: 'image/*,application/pdf' },
                  ].map(({ name, label, accept }) => (
                    <div key={name} className="upload-box">
                      <label className="upload-label">
                        <Upload size={28} />
                        <span>{label}</span>
                        {files[name]
                          ? <span className="upload-filename">✅ {files[name].name}</span>
                          : <span className="upload-hint">Klik untuk pilih file</span>}
                        <input type="file" name={name} accept={accept} onChange={handleFile} hidden />
                      </label>
                    </div>
                  ))}
                </div>

                <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>📋 Ringkasan</h2>
                <table className="summary-table">
                  <tbody>
                    <tr><td>Jalur</td>           <td>{jalurInfo?.label}</td></tr>
                    <tr><td>Jurusan</td>          <td>{jurusanDipilih?.nama} ({jurusanDipilih?.kode})</td></tr>
                    <tr><td>Nama</td>             <td>{form.nama_lengkap}</td></tr>
                    <tr><td>NIK</td>              <td>{form.nik}</td></tr>
                    <tr><td>Tempat, Tgl Lahir</td><td>{form.tempat_lahir}, {form.tanggal_lahir}</td></tr>
                    <tr><td>Asal Sekolah</td>     <td>{form.asal_sekolah}</td></tr>
                    <tr><td>Nilai Rata-rata</td>  <td>{form.nilai_rata_rata || '—'}</td></tr>
                    <tr><td>No. Telepon</td>      <td>{form.no_telp}</td></tr>
                  </tbody>
                </table>
              </div>
            );
          })()}

          </div>{/* end animation wrapper */}

          {/* Navigation */}
          <div className="ts-nav">
            {step > 1 ? (
              <button type="button" className="btn-ts-back" onClick={handleBack}>
                <ChevronLeft size={18} /> Sebelumnya
              </button>
            ) : (
              <button type="button" className="btn-ts-cancel" onClick={() => navigate('/dashboard')}>Batal</button>
            )}
            {step < STEPS.length ? (() => {
              const errCount = Object.keys(getStepErrors(step)).length;
              return (
                <button type="button" className="btn-ts-next" onClick={handleNext}>
                  {errCount > 0 && (
                    <span style={{ background: '#f97316', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700, marginRight: 6 }}>
                      {errCount} kosong
                    </span>
                  )}
                  Selanjutnya <ChevronRight size={18} />
                </button>
              );
            })() : (
              <button type="submit" className="btn-ts-submit" disabled={loading}>
                {loading
                  ? <><Loader2 size={18} className="spin" /> Mengirim...</>
                  : <><Check size={18} /> Kirim Pendaftaran</>}
              </button>
            )}
          </div>
        </form>
        {/* Confirm Modal */}
        {confirmModal && (
          <div className="fp-modal-overlay" onClick={() => setConfirmModal(null)}>
            <div className="fp-modal" onClick={e => e.stopPropagation()}>
              <h3 className="fp-modal-title">{confirmModal.title}</h3>
              <p className="fp-modal-msg">{confirmModal.message}</p>
              <div className="fp-modal-actions">
                <button type="button" className="fp-modal-cancel" onClick={() => setConfirmModal(null)}>Batal</button>
                <button type="button" className="fp-modal-confirm" onClick={confirmModal.onConfirm}>Ya, Lanjutkan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

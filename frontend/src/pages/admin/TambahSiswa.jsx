import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  User, Home, Phone, Users, School, FileText,
  ChevronRight, ChevronLeft, Check, Loader2, GraduationCap
} from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STEPS = [
  { id: 1, label: 'Identitas Pribadi', icon: User },
  { id: 2, label: 'Tempat Tinggal', icon: Home },
  { id: 3, label: 'Kontak & Orang Tua', icon: Users },
  { id: 4, label: 'Status & Submit', icon: FileText },
];

const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const PENDIDIKAN = ['Tidak Sekolah', 'SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3'];
const PENGHASILAN = [
  'Tidak Berpenghasilan',
  'Kurang dari Rp 1.000.000',
  'Rp 1.000.000 - Rp 2.000.000',
  'Rp 2.000.000 - Rp 3.000.000',
  'Rp 3.000.000 - Rp 5.000.000',
  'Lebih dari Rp 5.000.000',
];
const TRANSPORTASI = [
  'Jalan kaki', 'Sepeda', 'Sepeda motor', 'Mobil pribadi',
  'Angkutan umum', 'Ojek', 'Lainnya'
];
const JALUR_OPTIONS = [
  {
    value: 'muhammadiyah',
    label: 'Muhammadiyah',
    desc: 'Jalur khusus calon siswa dari keluarga Muhammadiyah',
    icon: '🕌',
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    value: 'non_muhammadiyah',
    label: 'Non Muhammadiyah',
    desc: 'Jalur umum untuk calon siswa di luar keluarga Muhammadiyah',
    icon: '🏫',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    value: 'spmb_bersama',
    label: 'SPMB Bersama',
    desc: 'Jalur penerimaan bersama lintas sekolah dan yayasan',
    icon: '🤝',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
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
  // Step 1: Identitas
  nama_lengkap: '', nik: '', nisn: '', tempat_lahir: '',
  tanggal_lahir: '', jenis_kelamin: '', agama: '',
  kewarganegaraan: 'WNI', berkebutuhan_khusus: 'Tidak',
  tinggi_badan: '', berat_badan: '', lingkar_kepala: '',
  pernah_paud: 'Tidak', nama_paud: '', hobi: '', cita_cita: '',
  // Step 2: Tempat Tinggal
  alamat: '', rt: '', rw: '', kelurahan: '',
  kecamatan: '', kabupaten: '', provinsi: '', kode_pos: '',
  jarak_rumah: '', transportasi: '',
  // Step 3: Kontak & Ortu
  no_telp: '', email_siswa: '',
  nama_ayah: '', nik_ayah: '', pendidikan_ayah: '', pekerjaan_ayah: '', penghasilan_ayah: '', no_hp_ayah: '',
  nama_ibu: '', nik_ibu: '', pendidikan_ibu: '', pekerjaan_ibu: '', penghasilan_ibu: '', no_hp_ibu: '',
  nama_wali: '', no_hp_wali: '',
  // Step 4: Sekolah & Pendaftaran
  asal_sekolah: '', npsn_asal: '', kabupaten_asal: '', tahun_lulus: '',
  nilai_rata_rata: '', pilihan1: '', jalur_pendaftaran: '',
  status_input: 'pending'
};

export default function TambahSiswa() {
  const navigate = useNavigate();
  const [jalurDipilih, setJalurDipilih] = useState(null);
  const [jurusanDipilih, setJurusanDipilih] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [jurusan, setJurusan] = useState([]);
  const [asalSekolahList, setAsalSekolahList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/admin/jurusan').then(r => setJurusan(r.data)).catch(() => {});
    api.get('/admin/asal-sekolah').then(r => setAsalSekolahList(r.data)).catch(() => {});
  }, []);

  const pilihJalur = (val) => {
    setJalurDipilih(val);
    setForm(prev => ({ ...prev, jalur_pendaftaran: val }));
  };

  const gantiJalur = () => {
    setJalurDipilih(null);
    setJurusanDipilih(null);
    setForm(prev => ({ ...prev, jalur_pendaftaran: '', pilihan1: '' }));
  };

  const pilihJurusan = (j) => {
    setJurusanDipilih(j);
    setForm(prev => ({ ...prev, pilihan1: j.id }));
  };

  const gantiJurusan = () => {
    setJurusanDipilih(null);
    setForm(prev => ({ ...prev, pilihan1: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Rules extracted so they can be reused by both per-step and full validation
  const getStepErrors = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.nama_lengkap) errs.nama_lengkap = 'Nama Lengkap';
      if (!form.nik || form.nik.length < 16) errs.nik = 'NIK (harus 16 digit)';
      if (!form.tempat_lahir) errs.tempat_lahir = 'Tempat Lahir';
      if (!form.tanggal_lahir) errs.tanggal_lahir = 'Tanggal Lahir';
      if (!form.jenis_kelamin) errs.jenis_kelamin = 'Jenis Kelamin';
      if (!form.agama) errs.agama = 'Agama';
      if (!form.asal_sekolah) errs.asal_sekolah = 'Sekolah Asal';
    }
    if (s === 2) {
      if (!form.alamat) errs.alamat = 'Alamat';
    }
    if (s === 3) {
      if (!form.no_telp) errs.no_telp = 'No. Telepon';
      if (!form.nama_ayah) errs.nama_ayah = 'Nama Ayah';
      if (!form.nama_ibu) errs.nama_ibu = 'Nama Ibu';
    }
    return errs;
  };

  const validateStep = () => {
    const errs = getStepErrors(step);
    // Convert field-name values to "Wajib diisi" messages for inline display
    const displayErrs = {};
    Object.keys(errs).forEach(k => {
      displayErrs[k] = k === 'nik' ? 'NIK harus 16 digit' : 'Wajib diisi';
    });
    setErrors(displayErrs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate ALL steps before submitting
    const allErrs = {};
    const missingByStep = {};
    for (let s = 1; s <= 3; s++) {
      const stepErrs = getStepErrors(s);
      if (Object.keys(stepErrs).length > 0) {
        missingByStep[s] = Object.values(stepErrs);
        Object.keys(stepErrs).forEach(k => {
          allErrs[k] = k === 'nik' ? 'NIK harus 16 digit' : 'Wajib diisi';
        });
      }
    }

    if (Object.keys(allErrs).length > 0) {
      setErrors(allErrs);
      // Navigate to first step that has errors
      const firstBadStep = [1, 2, 3].find(s => missingByStep[s]);
      if (firstBadStep) setStep(firstBadStep);
      // Show specific field names
      const lines = Object.entries(missingByStep)
        .map(([s, fields]) => `Step ${s}: ${fields.join(', ')}`)
        .join(' | ');
      toast.error(`Field belum lengkap — ${lines}`, { duration: 6000 });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/tambah-siswa', {
        ...form,
        nik: form.nik,
        nilai_rata_rata: form.nilai_rata_rata ? parseFloat(form.nilai_rata_rata) : null,
        pilihan1: parseInt(form.pilihan1),
        pilihan2: null,
        tahun_lulus: form.tahun_lulus || null,
        status: form.status_input,
      });
      toast.success(`Pendaftaran berhasil! No: ${res.data.nomor_pendaftaran}`);
      toast(`Login siswa: ${res.data.login.email} / ${res.data.login.password}`, {
        icon: '🔑', duration: 8000
      });
      navigate('/admin/pendaftar');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', required, children, hint }) => (
    <div className="ts-field">
      <label className="ts-label">
        {label} {required && <span className="ts-required">*</span>}
      </label>
      {children || (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={`ts-input ${errors[name] ? 'ts-input-error' : ''}`}
          placeholder={hint || `Masukkan ${label.toLowerCase()}`}
        />
      )}
      {errors[name] && <span className="ts-error-msg">{errors[name]}</span>}
    </div>
  );

  const Select = ({ label, name, options, required, placeholder = 'Pilih...' }) => (
    <div className="ts-field">
      <label className="ts-label">
        {label} {required && <span className="ts-required">*</span>}
      </label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`ts-input ${errors[name] ? 'ts-input-error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
      {errors[name] && <span className="ts-error-msg">{errors[name]}</span>}
    </div>
  );

  // Jalur belum dipilih → tampilkan halaman pilih jalur
  if (!jalurDipilih) {
    return (
      <Layout>
        <div className="jalur-select-page">
          <div className="jalur-select-header">
            <h1 className="jalur-select-title">Pilih Jalur Pendaftaran</h1>
            <p className="jalur-select-sub">Tentukan jalur pendaftaran sebelum mengisi data siswa</p>
          </div>
          <div className="jalur-cards">
            {JALUR_OPTIONS.map(j => (
              <button
                key={j.value}
                className="jalur-card"
                style={{ '--jalur-color': j.color, '--jalur-bg': j.bg }}
                onClick={() => pilihJalur(j.value)}
              >
                <span className="jalur-card-icon">{j.icon}</span>
                <span className="jalur-card-label">{j.label}</span>
                <span className="jalur-card-desc">{j.desc}</span>
                <span className="jalur-card-cta">Pilih Jalur →</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-ts-cancel" onClick={() => navigate('/admin/pendaftar')}>
              ← Kembali ke Daftar Pendaftar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const jalurInfo = JALUR_OPTIONS.find(j => j.value === jalurDipilih);

  // Jurusan belum dipilih → tampilkan halaman pilih jurusan
  if (!jurusanDipilih) {
    return (
      <Layout>
        <div className="jalur-select-page">
          <div className="jalur-select-header">
            <div className="jurusan-select-jalur-badge" style={{ '--jalur-color': jalurInfo.color, '--jalur-bg': jalurInfo.bg }}>
              <span>{jalurInfo.icon}</span>
              <span>Jalur: <strong>{jalurInfo.label}</strong></span>
            </div>
            <h1 className="jalur-select-title">Pilih Jurusan</h1>
            <p className="jalur-select-sub">Pilih jurusan yang akan didaftarkan untuk siswa ini</p>
          </div>
          <div className="jurusan-select-cards">
            {jurusan.map((j, i) => {
              const clr = JURUSAN_COLORS[i % JURUSAN_COLORS.length];
              const terisi = Number(j.total_pendaftar) || 0;
              const kuota = Number(j.kuota) || 0;
              const pct = kuota > 0 ? Math.min((terisi / kuota) * 100, 100) : 0;
              const penuh = kuota > 0 && terisi >= kuota;
              return (
                <button
                  key={j.id}
                  className={`jurusan-card ${penuh ? 'jurusan-card-penuh' : ''}`}
                  style={{ '--jalur-color': clr.color, '--jalur-bg': clr.bg }}
                  onClick={() => !penuh && pilihJurusan(j)}
                  disabled={penuh}
                >
                  <span className="jurusan-card-icon">
                    {j.logo
                      ? <img src={`${API_BASE}${j.logo}`} alt={j.nama} className="jurusan-card-logo-img" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                      : null}
                    <span className="jurusan-card-logo-fallback" style={{ display: j.logo ? 'none' : 'flex' }}><GraduationCap size={40} /></span>
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
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-ts-cancel" onClick={gantiJalur}>
              ← Ganti Jalur Pendaftaran
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ts-page">
        <div className="ts-header">
          <h1 className="ts-title">Tambah Siswa Baru</h1>
          <p className="ts-subtitle">Isi data lengkap siswa sesuai dokumen Dapodik</p>
        </div>

        {/* Jalur & Jurusan Banner */}
        <div className="jalur-active-banner" style={{ '--jalur-color': jalurInfo.color, '--jalur-bg': jalurInfo.bg }}>
          <span className="jalur-active-icon">{jalurInfo.icon}</span>
          <span>Jalur: <strong>{jalurInfo.label}</strong></span>
          <button type="button" className="jalur-change-link" onClick={gantiJalur}>Ganti Jalur</button>
          <span className="banner-sep">|</span>
          <span>🎓 Jurusan: <strong>{jurusanDipilih.nama} ({jurusanDipilih.kode})</strong></span>
          <button type="button" className="jalur-change-link" onClick={gantiJurusan}>Ganti Jurusan</button>
        </div>

        {/* Step Indicator */}
        <div className="ts-steps">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="ts-step-wrapper">
                <div className={`ts-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <div className="ts-step-icon">
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className="ts-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`ts-step-line ${isDone ? 'done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <form className="ts-form-card" onSubmit={handleSubmit}>

          {/* ===== STEP 1: IDENTITAS PRIBADI ===== */}
          {step === 1 && (
            <div className="ts-section">
              <h2 className="ts-section-title">
                <User size={20} /> Data Identitas Pribadi
              </h2>
              <div className="ts-grid-2">
                <Field label="Nama Lengkap" name="nama_lengkap" required />
                <Field label="NIK" name="nik" required hint="16 digit NIK" />
                <Field label="NISN" name="nisn" hint="10 digit NISN (opsional)" />
                <Field label="Tempat Lahir" name="tempat_lahir" required />
                <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
                <Select
                  label="Jenis Kelamin" name="jenis_kelamin" required
                  options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]}
                />
                <Select label="Agama" name="agama" required options={AGAMA} />
                <Select
                  label="Kewarganegaraan" name="kewarganegaraan"
                  options={['WNI', 'WNA']}
                />
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
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>📏 Data Fisik &amp; Lainnya</h2>
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

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>
                <School size={20} /> Data Asal Sekolah
              </h2>
              <div className="ts-grid-2">
                <div className="ts-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="ts-label">Nama Sekolah Asal <span className="ts-required">*</span></label>
                  <select
                    name="asal_sekolah"
                    value={form.asal_sekolah}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.asal_sekolah) setErrors(prev => ({ ...prev, asal_sekolah: '' }));
                    }}
                    className={`ts-input ${errors.asal_sekolah ? 'ts-input-error' : ''}`}
                  >
                    {asalSekolahList.length === 0 ? (
                      <option value="" disabled>— Belum ada data. Tambahkan di menu Asal Sekolah —</option>
                    ) : (
                      <>
                        <option value="">-- Pilih sekolah asal --</option>
                        {asalSekolahList.map(s => (
                          <option key={s.id} value={s.nama_sekolah}>
                            {s.nama_sekolah}{s.npsn ? ` (${s.npsn})` : ''} — {s.tipe}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.asal_sekolah && <span className="ts-error-msg">{errors.asal_sekolah}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2: TEMPAT TINGGAL ===== */}
          {step === 2 && (
            <div className="ts-section">
              <h2 className="ts-section-title">
                <Home size={20} /> Data Tempat Tinggal
              </h2>
              <div className="ts-grid-1">
                <Field label="Alamat Lengkap" name="alamat" required>
                  <textarea
                    name="alamat"
                    value={form.alamat}
                    onChange={handleChange}
                    className={`ts-input ts-textarea ${errors.alamat ? 'ts-input-error' : ''}`}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                  />
                  {errors.alamat && <span className="ts-error-msg">{errors.alamat}</span>}
                </Field>
              </div>
              <div className="ts-grid-3">
                <Field label="RT" name="rt" hint="001" />
                <Field label="RW" name="rw" hint="002" />
                <Field label="Kode Pos" name="kode_pos" hint="12345" />
              </div>
              <div className="ts-grid-3">
                <Field label="Kelurahan/Desa" name="kelurahan" />
                <Field label="Kecamatan" name="kecamatan" />
                <Field label="Kabupaten/Kota" name="kabupaten" />
              </div>
              <div className="ts-grid-3">
                <Field label="Provinsi" name="provinsi" />
                <Field label="Jarak ke Sekolah" name="jarak_rumah" hint="cth: 2 km" />
                <Select label="Moda Transportasi" name="transportasi" options={TRANSPORTASI} />
              </div>
            </div>
          )}

          {/* ===== STEP 3: KONTAK & ORANG TUA ===== */}
          {step === 3 && (
            <div className="ts-section">
              <h2 className="ts-section-title">
                <Phone size={20} /> Data Kontak Siswa
              </h2>
              <div className="ts-grid-2">
                <Field label="No. HP / Telepon" name="no_telp" type="tel" required hint="08xxxxxxxxxx" />
                <Field label="Email Siswa" name="email_siswa" type="email" hint="Email siswa (opsional)" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>
                <Users size={20} /> Data Ayah
              </h2>
              <div className="ts-grid-2">
                <Field label="Nama Ayah" name="nama_ayah" required />
                <Field label="NIK Ayah" name="nik_ayah" hint="16 digit NIK" />
                <Select label="Pendidikan Ayah" name="pendidikan_ayah" options={PENDIDIKAN} />
                <Field label="Pekerjaan Ayah" name="pekerjaan_ayah" />
                <Select label="Penghasilan Ayah" name="penghasilan_ayah" options={PENGHASILAN} />
                <Field label="No. HP Ayah" name="no_hp_ayah" type="tel" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>
                <Users size={20} /> Data Ibu
              </h2>
              <div className="ts-grid-2">
                <Field label="Nama Ibu" name="nama_ibu" required />
                <Field label="NIK Ibu" name="nik_ibu" hint="16 digit NIK" />
                <Select label="Pendidikan Ibu" name="pendidikan_ibu" options={PENDIDIKAN} />
                <Field label="Pekerjaan Ibu" name="pekerjaan_ibu" />
                <Select label="Penghasilan Ibu" name="penghasilan_ibu" options={PENGHASILAN} />
                <Field label="No. HP Ibu" name="no_hp_ibu" type="tel" />
              </div>

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>
                <Users size={20} /> Data Wali (Jika Ada)
              </h2>
              <div className="ts-grid-2">
                <Field label="Nama Wali" name="nama_wali" hint="Kosongkan jika tidak ada" />
                <Field label="No. HP Wali" name="no_hp_wali" type="tel" />
              </div>
            </div>
          )}

          {/* ===== STEP 4: STATUS & SUBMIT ===== */}
          {step === 4 && (() => {
            // Build live checklist
            const checkItems = [
              { step: 1, label: 'Identitas Pribadi', fields: getStepErrors(1) },
              { step: 2, label: 'Tempat Tinggal',   fields: getStepErrors(2) },
              { step: 3, label: 'Kontak & Orang Tua', fields: getStepErrors(3) },
            ];
            const hasAnyError = checkItems.some(c => Object.keys(c.fields).length > 0);
            return (
            <div className="ts-section">
              {/* Validation checklist */}
              <h2 className="ts-section-title">
                <Check size={20} /> Ringkasan Kelengkapan Data
              </h2>
              <div className="ts-checklist">
                {checkItems.map(c => {
                  const missing = Object.values(c.fields);
                  const ok = missing.length === 0;
                  return (
                    <div key={c.step} className={`ts-checklist-row ${ok ? 'ts-cl-ok' : 'ts-cl-err'}`}>
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
                            {missing.map(f => (
                              <span key={f} className="ts-cl-field-tag">{f}</span>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="ts-cl-fix-btn"
                            onClick={() => { setStep(c.step); setErrors({}); }}
                          >
                            Lengkapi →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasAnyError && (
                <div className="ts-checklist-warning">
                  ⚠️ Masih ada data yang belum lengkap. Klik <strong>Lengkapi →</strong> pada bagian yang bermasalah, atau klik <strong>Simpan</strong> — sistem akan otomatis mengarahkan ke field yang kurang.
                </div>
              )}

              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}>
                <FileText size={20} /> Status Setelah Input
              </h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {[
                  { value: 'pending', label: 'Pending', desc: 'Perlu diverifikasi lebih lanjut', color: '#f59e0b', bg: '#fffbeb' },
                  { value: 'diterima', label: 'Langsung Diterima', desc: 'Siswa langsung diterima (cek kuota otomatis)', color: '#10b981', bg: '#ecfdf5' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setForm(prev => ({ ...prev, status_input: opt.value }))}
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${form.status_input === opt.value ? opt.color : 'var(--gray-200)'}`,
                      background: form.status_input === opt.value ? opt.bg : 'var(--gray-50)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: opt.color, fontSize: '0.9rem' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 3 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            );
          })()}

          {/* Navigation Buttons */}
          <div className="ts-nav">
            {step > 1 ? (
              <button type="button" className="btn-ts-back" onClick={handleBack}>
                <ChevronLeft size={18} /> Sebelumnya
              </button>
            ) : (
              <button type="button" className="btn-ts-cancel" onClick={() => navigate('/admin/pendaftar')}>
                Batal
              </button>
            )}

            {step < STEPS.length ? (
              <button type="button" className="btn-ts-next" onClick={handleNext}>
                Selanjutnya <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn-ts-submit" disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Menyimpan...</> : <><Check size={18} /> Simpan Pendaftaran</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

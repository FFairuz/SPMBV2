import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  User, Home, Phone, Users, School, FileText,
  ChevronRight, ChevronLeft, Check, Loader2, ArrowLeft, GraduationCap
} from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STEPS = [
  { id: 1, label: 'Identitas Pribadi', icon: User },
  { id: 2, label: 'Tempat Tinggal', icon: Home },
  { id: 3, label: 'Kontak & Orang Tua', icon: Users },
  { id: 4, label: 'Sekolah & Pendaftaran', icon: School },
];

const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const PENDIDIKAN = ['Tidak Sekolah', 'SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3'];
const PENGHASILAN = [
  'Tidak Berpenghasilan', 'Kurang dari Rp 1.000.000',
  'Rp 1.000.000 - Rp 2.000.000', 'Rp 2.000.000 - Rp 3.000.000',
  'Rp 3.000.000 - Rp 5.000.000', 'Lebih dari Rp 5.000.000',
];
const TRANSPORTASI = ['Jalan kaki', 'Sepeda', 'Sepeda motor', 'Mobil pribadi', 'Angkutan umum', 'Ojek', 'Lainnya'];
const JALUR_OPTIONS = [
  { value: 'muhammadiyah', label: 'Muhammadiyah', icon: '🕌', color: '#059669', bg: '#ecfdf5' },
  { value: 'non_muhammadiyah', label: 'Non Muhammadiyah', icon: '🏫', color: '#2563eb', bg: '#eff6ff' },
  { value: 'spmb_bersama', label: 'SPMB Bersama', icon: '🤝', color: '#7c3aed', bg: '#f5f3ff' },
];

const JURUSAN_COLORS = [
  { color: '#0284c7', bg: '#f0f9ff' },
  { color: '#dc2626', bg: '#fef2f2' },
  { color: '#d97706', bg: '#fffbeb' },
  { color: '#059669', bg: '#ecfdf5' },
  { color: '#7c3aed', bg: '#f5f3ff' },
  { color: '#db2777', bg: '#fdf2f8' },
];

const emptyForm = {
  nama_lengkap: '', nik: '', nisn: '', tempat_lahir: '',
  tanggal_lahir: '', jenis_kelamin: '', agama: '',
  kewarganegaraan: 'WNI', berkebutuhan_khusus: 'Tidak',
  tinggi_badan: '', berat_badan: '', lingkar_kepala: '',
  pernah_paud: 'Tidak', nama_paud: '', hobi: '', cita_cita: '',
  alamat: '', rt: '', rw: '', kelurahan: '',
  kecamatan: '', kabupaten: '', provinsi: '', kode_pos: '',
  jarak_rumah: '', transportasi: '',
  no_telp: '', email_siswa: '',
  nama_ayah: '', nik_ayah: '', pendidikan_ayah: '', pekerjaan_ayah: '', penghasilan_ayah: '', no_hp_ayah: '',
  nama_ibu: '', nik_ibu: '', pendidikan_ibu: '', pekerjaan_ibu: '', penghasilan_ibu: '', no_hp_ibu: '',
  nama_wali: '', no_hp_wali: '',
  asal_sekolah: '', npsn_asal: '', kabupaten_asal: '', tahun_lulus: '',
  nilai_rata_rata: '', pilihan1: '', jalur_pendaftaran: 'muhammadiyah',
};

export default function EditSiswa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jalurDipilih, setJalurDipilih] = useState(null);
  const [jurusanDipilih, setJurusanDipilih] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [namaAsli, setNamaAsli] = useState('');
  const [nomorPendaftaran, setNomorPendaftaran] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/admin/pendaftar/${id}`),
      api.get('/admin/jurusan'),
    ]).then(([detailRes, jurusanRes]) => {
      const d = detailRes.data;
      setNamaAsli(d.nama_lengkap);
      setNomorPendaftaran(d.nomor_pendaftaran);
      setJurusan(jurusanRes.data);
      setJalurDipilih(d.jalur_pendaftaran || 'muhammadiyah');
      const foundJurusan = jurusanRes.data.find(j => String(j.id) === String(d.pilihan1));
      setJurusanDipilih(foundJurusan || null);
      setForm({
        nama_lengkap: d.nama_lengkap || '',
        nik: d.nik || '',
        nisn: d.nisn || '',
        tempat_lahir: d.tempat_lahir || '',
        tanggal_lahir: d.tanggal_lahir ? d.tanggal_lahir.slice(0, 10) : '',
        jenis_kelamin: d.jenis_kelamin || '',
        agama: d.agama || '',
        kewarganegaraan: d.kewarganegaraan || 'WNI',
        berkebutuhan_khusus: d.berkebutuhan_khusus || 'Tidak',
        tinggi_badan: d.tinggi_badan || '',
        berat_badan: d.berat_badan || '',
        lingkar_kepala: d.lingkar_kepala || '',
        pernah_paud: d.pernah_paud || 'Tidak',
        nama_paud: d.nama_paud || '',
        hobi: d.hobi || '',
        cita_cita: d.cita_cita || '',
        alamat: d.alamat || '',
        rt: d.rt || '',
        rw: d.rw || '',

        kelurahan: d.kelurahan || '',
        kecamatan: d.kecamatan || '',
        kabupaten: d.kabupaten || '',
        provinsi: d.provinsi || '',
        kode_pos: d.kode_pos || '',
        jarak_rumah: d.jarak_rumah || '',
        transportasi: d.transportasi || '',
        no_telp: d.no_telp || '',
        email_siswa: d.email_siswa || '',
        nama_ayah: d.nama_ayah || '',
        nik_ayah: d.nik_ayah || '',
        pendidikan_ayah: d.pendidikan_ayah || '',
        pekerjaan_ayah: d.pekerjaan_ayah || '',
        penghasilan_ayah: d.penghasilan_ayah || '',
        no_hp_ayah: d.no_hp_ayah || '',
        nama_ibu: d.nama_ibu || '',
        nik_ibu: d.nik_ibu || '',
        pendidikan_ibu: d.pendidikan_ibu || '',
        pekerjaan_ibu: d.pekerjaan_ibu || '',
        penghasilan_ibu: d.penghasilan_ibu || '',
        no_hp_ibu: d.no_hp_ibu || '',
        nama_wali: d.nama_wali || '',
        no_hp_wali: d.no_hp_wali || '',
        asal_sekolah: d.asal_sekolah || '',
        npsn_asal: d.npsn_asal || '',
        kabupaten_asal: d.kabupaten_asal || '',
        tahun_lulus: d.tahun_lulus || '',
        nilai_rata_rata: d.nilai_rata_rata || '',
        pilihan1: d.pilihan1 || '',

        jalur_pendaftaran: d.jalur_pendaftaran || 'muhammadiyah',
      });
    }).catch(() => {
      toast.error('Gagal memuat data');
      navigate(`/admin/pendaftar/${id}`);
    }).finally(() => setLoading(false));
  }, [id]);

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

  const validateStep = () => {
    const errs = {};
    if (step === 1) {
      if (!form.nama_lengkap) errs.nama_lengkap = 'Wajib diisi';
      if (!form.nik || form.nik.length < 16) errs.nik = 'NIK harus 16 digit';
      if (!form.tempat_lahir) errs.tempat_lahir = 'Wajib diisi';
      if (!form.tanggal_lahir) errs.tanggal_lahir = 'Wajib diisi';
      if (!form.jenis_kelamin) errs.jenis_kelamin = 'Wajib dipilih';
      if (!form.agama) errs.agama = 'Wajib dipilih';
    }
    if (step === 2) {
      if (!form.alamat) errs.alamat = 'Wajib diisi';
    }
    if (step === 3) {
      if (!form.no_telp) errs.no_telp = 'Wajib diisi';
      if (!form.nama_ayah) errs.nama_ayah = 'Wajib diisi';
      if (!form.nama_ibu) errs.nama_ibu = 'Wajib diisi';
    }
    if (step === 4) {
      if (!form.asal_sekolah) errs.asal_sekolah = 'Wajib diisi';
      if (!form.tahun_lulus) errs.tahun_lulus = 'Wajib diisi';
      if (!form.nilai_rata_rata) errs.nilai_rata_rata = 'Wajib diisi';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSaving(true);
    try {
      await api.put(`/admin/pendaftar/${id}`, {
        ...form,
        nilai_rata_rata: parseFloat(form.nilai_rata_rata),
        pilihan1: parseInt(form.pilihan1),
        pilihan2: null,
        tahun_lulus: form.tahun_lulus || null,
      });
      toast.success('Data pendaftaran berhasil diperbarui');
      navigate(`/admin/pendaftar/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
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

  if (loading) return (
    <Layout>
      <div className="loading-center" style={{ paddingTop: 80 }}>
        <Loader2 size={32} className="spin" />
      </div>
    </Layout>
  );

  const jalurInfo = JALUR_OPTIONS.find(j => j.value === jalurDipilih) || JALUR_OPTIONS[0];

  if (!jalurDipilih) {
    return (
      <Layout>
        <div className="jalur-select-page">
          <div className="jalur-select-header">
            <h1 className="jalur-select-title">Pilih Jalur Pendaftaran</h1>
            <p className="jalur-select-sub">Ganti jalur pendaftaran siswa</p>
          </div>
          <div className="jalur-cards">
            {JALUR_OPTIONS.map(j => (
              <button key={j.value} className="jalur-card"
                style={{ '--jalur-color': j.color, '--jalur-bg': j.bg }}
                onClick={() => pilihJalur(j.value)}
              >
                <span className="jalur-card-icon">{j.icon}</span>
                <span className="jalur-card-label">{j.label}</span>
                <span className="jalur-card-cta">Pilih Jalur →</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button className="btn-ts-cancel" onClick={() => navigate(`/admin/pendaftar/${id}`)}>← Kembali ke Detail</button>
          </div>
        </div>
      </Layout>
    );
  }

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
            <p className="jalur-select-sub">Ganti jurusan pendaftaran siswa</p>
          </div>
          <div className="jurusan-select-cards">
            {jurusan.map((j, i) => {
              const clr = JURUSAN_COLORS[i % JURUSAN_COLORS.length];
              const terisi = Number(j.total_pendaftar) || 0;
              const kuota = Number(j.kuota) || 0;
              const pct = kuota > 0 ? Math.min((terisi / kuota) * 100, 100) : 0;
              const penuh = kuota > 0 && terisi >= kuota;
              return (
                <button key={j.id}
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
            <button className="btn-ts-cancel" onClick={gantiJalur}>← Ganti Jalur Pendaftaran</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ts-page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn-back-nav" onClick={() => navigate(`/admin/pendaftar/${id}`)}>
            <ArrowLeft size={18} /> Kembali
          </button>
          <div>
            <h1 className="ts-title" style={{ fontSize: 20, marginBottom: 2 }}>Edit Formulir Pendaftaran</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
              <span className="mono">{nomorPendaftaran}</span> — {namaAsli}
            </p>
          </div>
        </div>

        {/* Jalur & Jurusan Banner */}
        <div className="jalur-active-banner" style={{ '--jalur-color': jalurInfo.color, '--jalur-bg': jalurInfo.bg, marginBottom: 22 }}>
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
                {i < STEPS.length - 1 && <div className={`ts-step-line ${isDone ? 'done' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* Form */}
        <form className="ts-form-card" onSubmit={handleSubmit}>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><User size={20} /> Data Identitas Pribadi</h2>
              <div className="ts-grid-2">
                <Field label="Nama Lengkap" name="nama_lengkap" required />
                <Field label="NIK" name="nik" required hint="16 digit NIK" />
                <Field label="NISN" name="nisn" hint="10 digit NISN" />
                <Field label="Tempat Lahir" name="tempat_lahir" required />
                <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
                <Select label="Jenis Kelamin" name="jenis_kelamin" required
                  options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                <Select label="Agama" name="agama" required options={AGAMA} />
                <Select label="Kewarganegaraan" name="kewarganegaraan" options={['WNI', 'WNA']} />
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
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><Home size={20} /> Data Tempat Tinggal</h2>
              <div className="ts-grid-1">
                <Field label="Alamat Lengkap" name="alamat" required>
                  <textarea name="alamat" value={form.alamat} onChange={handleChange}
                    className={`ts-input ts-textarea ${errors.alamat ? 'ts-input-error' : ''}`}
                    placeholder="Masukkan alamat lengkap" rows={3} />
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

          {/* STEP 3 */}
          {step === 3 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><Phone size={20} /> Data Kontak Siswa</h2>
              <div className="ts-grid-2">
                <Field label="No. HP / Telepon" name="no_telp" type="tel" required />
                <Field label="Email Siswa" name="email_siswa" type="email" />
              </div>
              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Users size={20} /> Data Ayah</h2>
              <div className="ts-grid-2">
                <Field label="Nama Ayah" name="nama_ayah" required />
                <Field label="NIK Ayah" name="nik_ayah" />
                <Select label="Pendidikan Ayah" name="pendidikan_ayah" options={PENDIDIKAN} />
                <Field label="Pekerjaan Ayah" name="pekerjaan_ayah" />
                <Select label="Penghasilan Ayah" name="penghasilan_ayah" options={PENGHASILAN} />
                <Field label="No. HP Ayah" name="no_hp_ayah" type="tel" />
              </div>
              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Users size={20} /> Data Ibu</h2>
              <div className="ts-grid-2">
                <Field label="Nama Ibu" name="nama_ibu" required />
                <Field label="NIK Ibu" name="nik_ibu" />
                <Select label="Pendidikan Ibu" name="pendidikan_ibu" options={PENDIDIKAN} />
                <Field label="Pekerjaan Ibu" name="pekerjaan_ibu" />
                <Select label="Penghasilan Ibu" name="penghasilan_ibu" options={PENGHASILAN} />
                <Field label="No. HP Ibu" name="no_hp_ibu" type="tel" />
              </div>
              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><Users size={20} /> Data Wali</h2>
              <div className="ts-grid-2">
                <Field label="Nama Wali" name="nama_wali" hint="Kosongkan jika tidak ada" />
                <Field label="No. HP Wali" name="no_hp_wali" type="tel" />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="ts-section">
              <h2 className="ts-section-title"><School size={20} /> Data Asal Sekolah</h2>
              <div className="ts-grid-2">
                <Field label="Nama Sekolah Asal" name="asal_sekolah" required />
                <Field label="NPSN Sekolah Asal" name="npsn_asal" hint="8 digit NPSN" />
                <Field label="Kabupaten Sekolah Asal" name="kabupaten_asal" />
                <Field label="Tahun Lulus" name="tahun_lulus" type="number" required hint="cth: 2025" />
              </div>
              <h2 className="ts-section-title" style={{ marginTop: '1.5rem' }}><FileText size={20} /> Data Pendaftaran</h2>
              <div className="ts-grid-2">
                <Field label="Nilai Rata-rata Rapor" name="nilai_rata_rata" required>
                  <input type="number" name="nilai_rata_rata" value={form.nilai_rata_rata} onChange={handleChange}
                    className={`ts-input ${errors.nilai_rata_rata ? 'ts-input-error' : ''}`}
                    placeholder="cth: 85.50" step="0.01" min="0" max="100" />
                  {errors.nilai_rata_rata && <span className="ts-error-msg">{errors.nilai_rata_rata}</span>}
                </Field>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="ts-nav">
            {step > 1 ? (
              <button type="button" className="btn-ts-back" onClick={handleBack}>
                <ChevronLeft size={18} /> Sebelumnya
              </button>
            ) : (
              <button type="button" className="btn-ts-cancel" onClick={() => navigate(`/admin/pendaftar/${id}`)}>
                Batal
              </button>
            )}
            {step < STEPS.length ? (
              <button type="button" className="btn-ts-next" onClick={handleNext}>
                Selanjutnya <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn-ts-submit" disabled={saving}>
                {saving ? <><Loader2 size={18} className="spin" /> Menyimpan...</> : <><Check size={18} /> Simpan Perubahan</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

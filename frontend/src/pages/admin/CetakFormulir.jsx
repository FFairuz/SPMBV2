import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const JALUR_LABEL = {
  muhammadiyah: 'Muhammadiyah',
  non_muhammadiyah: 'Non Muhammadiyah',
  spmb_bersama: 'SPMB Bersama',
};

const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Row = ({ label, value }) => (
  <tr>
    <td className="cetak-label">{label}</td>
    <td className="cetak-sep">:</td>
    <td className="cetak-value">{value || '-'}</td>
  </tr>
);

export default function CetakFormulir() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [sekolah, setSekolah] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminUser = getUser();

  useEffect(() => {
    Promise.all([
      api.get(`/admin/pendaftar/${id}`),
      api.get('/sekolah').catch(() => ({ data: null }))
    ])
      .then(([pendaftarRes, sekolahRes]) => {
        setData(pendaftarRes.data);
        setSekolah(sekolahRes.data);
      })
      .catch(() => navigate(`/admin/pendaftar/${id}`))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout>
      <div className="loading-center" style={{ paddingTop: 80 }}>
        <Loader2 size={32} className="spin" />
      </div>
    </Layout>
  );

  if (!data) return null;

  const jk = data.jenis_kelamin === 'L' ? 'Laki-laki' : data.jenis_kelamin === 'P' ? 'Perempuan' : '-';

  return (
    <Layout>
      {/* Tombol aksi (tidak dicetak) */}
      <div className="cetak-toolbar no-print">
        <button className="btn-back-nav" onClick={() => navigate(`/admin/pendaftar/${id}`)}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <button className="btn-cetak" onClick={() => window.print()}>
          <Printer size={16} /> Cetak Formulir
        </button>
      </div>

      {/* Formulir Cetak */}
      <div className="cetak-page" id="cetak-area">

        {/* Kop */}
        <div className="cetak-kop">
          <div className="cetak-kop-logo">
            {sekolah?.logo
              ? <img src={`${API_BASE}${sekolah.logo}`} alt={sekolah.nama_sekolah} />
              : <span>🏫</span>
            }
          </div>
          <div className="cetak-kop-text">
            <h1>FORMULIR PENDAFTARAN SISWA BARU</h1>
            <h2>{sekolah?.nama_sekolah || 'SPMB — Sistem Penerimaan Murid Baru'}</h2>
            <p>
              {[sekolah?.alamat, sekolah?.kota, sekolah?.provinsi].filter(Boolean).join(', ') || 'Sistem Penerimaan Murid Baru'}
              {sekolah?.telpon ? ` • Telp. ${sekolah.telpon}` : ''}
            </p>
          </div>
          <div className="cetak-foto-box">
            <span>FOTO<br />3×4</span>
          </div>
        </div>
        <div className="cetak-kop-line" />

        {/* Meta bar */}
        <div className="cetak-meta">
          <div>
            <span className="cetak-meta-label">Nomor Pendaftaran</span>
            <span className="cetak-meta-value">{data.nomor_pendaftaran}</span>
          </div>
          <div>
            <span className="cetak-meta-label">Jalur Pendaftaran</span>
            <span className="cetak-meta-value">{JALUR_LABEL[data.jalur_pendaftaran] || data.jalur_pendaftaran}</span>
          </div>
          <div>
            <span className="cetak-meta-label">Status</span>
            <span className={`cetak-status cetak-status-${data.status}`}>{data.status?.toUpperCase()}</span>
          </div>
          <div>
            <span className="cetak-meta-label">Tanggal Daftar</span>
            <span className="cetak-meta-value">{fmtDate(data.created_at)}</span>
          </div>
        </div>

        {/* Section A+B: 2 kolom */}
        <div className="cetak-cols">
          {/* Section A: Identitas Diri */}
          <div className="cetak-section">
            <div className="cetak-section-title">A. IDENTITAS DIRI</div>
            <table className="cetak-table">
              <tbody>
                <Row label="Nama Lengkap" value={data.nama_lengkap} />
                <Row label="NIK" value={data.nik} />
                <Row label="NISN" value={data.nisn} />
                <Row label="Tempat, Tgl. Lahir" value={`${data.tempat_lahir || '-'}, ${fmtDate(data.tanggal_lahir)}`} />
                <Row label="Jenis Kelamin" value={jk} />
                <Row label="Agama" value={data.agama} />
                <Row label="Kewarganegaraan" value={data.kewarganegaraan} />
                <Row label="Berkebutuhan Khusus" value={data.berkebutuhan_khusus} />
                <Row label="No. Telepon / HP" value={data.no_telp} />
              </tbody>
            </table>
          </div>

          {/* Section B+C: Sekolah & Jurusan */}
          <div className="cetak-col-right">
            <div className="cetak-section">
              <div className="cetak-section-title">B. DATA ASAL SEKOLAH</div>
              <table className="cetak-table">
                <tbody>
                  <Row label="Asal Sekolah" value={data.asal_sekolah} />
                  <Row label="NPSN" value={data.npsn_asal} />
                  <Row label="Kabupaten" value={data.kabupaten_asal} />
                  <Row label="Tahun Lulus" value={data.tahun_lulus} />
                  <Row label="Nilai Rata-rata" value={data.nilai_rata_rata} />
                </tbody>
              </table>
            </div>
            <div className="cetak-section">
              <div className="cetak-section-title">C. PILIHAN JURUSAN</div>
              <table className="cetak-table">
                <tbody>
                  <Row label="Jalur Pendaftaran" value={JALUR_LABEL[data.jalur_pendaftaran] || data.jalur_pendaftaran} />
                  <Row label="Pilihan Jurusan" value={data.jurusan1 ? `${data.kode1} — ${data.jurusan1}` : '-'} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="cetak-ttd">
          <div className="cetak-ttd-box">
            <p className="cetak-ttd-role">Orang Tua / Wali</p>
            <div className="cetak-ttd-space" />
            <div className="cetak-ttd-line" />
            <p className="cetak-ttd-name">( ................................... )</p>
          </div>
          <div className="cetak-ttd-box">
            <p className="cetak-ttd-city">....................., .....................</p>
            <p className="cetak-ttd-role">Panitia SPMB</p>
            <div className="cetak-ttd-space" />
            <div className="cetak-ttd-line" />
            <p className="cetak-ttd-name">( {adminUser?.nama || adminUser?.email || '...................................'} )</p>
          </div>
          <div className="cetak-ttd-box">
            <p className="cetak-ttd-role">Calon Siswa</p>
            <div className="cetak-ttd-space" />
            <div className="cetak-ttd-line" />
            <p className="cetak-ttd-name">( {data.nama_lengkap} )</p>
          </div>
        </div>

        <div className="cetak-footer">
          <p>Dicetak melalui Sistem SPMB &bull; {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </Layout>
  );
}

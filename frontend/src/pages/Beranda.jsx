import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, FileText, Clock, Award, ArrowRight, GraduationCap } from 'lucide-react';

const steps = [
  { icon: <FileText size={28} />, title: 'Buat Akun', desc: 'Daftarkan email dan buat akun siswa Anda' },
  { icon: <CheckCircle size={28} />, title: 'Isi Formulir', desc: 'Lengkapi data diri dan pilih jurusan' },
  { icon: <Clock size={28} />, title: 'Tunggu Verifikasi', desc: 'Admin akan memverifikasi berkas Anda' },
  { icon: <Award size={28} />, title: 'Pengumuman', desc: 'Cek hasil seleksi penerimaan' },
];

const jurusan = [
  { kode: 'TKJ', nama: 'Teknik Komputer & Jaringan', icon: '💻' },
  { kode: 'RPL', nama: 'Rekayasa Perangkat Lunak', icon: '⚙️' },
  { kode: 'MM', nama: 'Multimedia', icon: '🎨' },
  { kode: 'AK', nama: 'Akuntansi & Keuangan', icon: '📊' },
  { kode: 'AP', nama: 'Administrasi Perkantoran', icon: '🗂️' },
  { kode: 'BDP', nama: 'Bisnis Daring & Pemasaran', icon: '🛒' },
];

export default function Beranda() {
  return (
    <div className="beranda">
      {/* Hero */}
      <header className="beranda-header">
        <nav className="beranda-nav">
          <div className="beranda-brand">
            <GraduationCap size={28} />
            <span>SPMB <strong>Online</strong></span>
          </div>
          <div className="beranda-nav-links">
            <Link to="/login" className="btn-outline">Masuk</Link>
            <Link to="/register" className="btn-primary">Daftar Sekarang</Link>
          </div>
        </nav>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="hero-badge">Tahun Ajaran 2025/2026</span>
          <h1>Selamat Datang di<br /><span>SPMB Online</span></h1>
          <p>
            Sistem Penerimaan Murid Baru yang mudah, cepat, dan transparan.
            Daftarkan dirimu sekarang dan raih masa depan cerahmu!
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-hero-primary">
              Mulai Pendaftaran <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-hero-secondary">
              Sudah Punya Akun?
            </Link>
          </div>
        </motion.div>
      </header>

      {/* Steps */}
      <section className="beranda-section">
        <h2 className="section-title">Cara Mendaftar</h2>
        <p className="section-subtitle">4 langkah mudah untuk mendaftar</p>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="step-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Jurusan */}
      <section className="beranda-section bg-light">
        <h2 className="section-title">Program Keahlian</h2>
        <p className="section-subtitle">Pilih jurusan yang sesuai dengan minat dan bakatmu</p>
        <div className="jurusan-grid">
          {jurusan.map((j, i) => (
            <motion.div
              key={j.kode}
              className="jurusan-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <span className="jurusan-icon">{j.icon}</span>
              <span className="jurusan-kode">{j.kode}</span>
              <p>{j.nama}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="beranda-cta">
        <h2>Siap Bergabung?</h2>
        <p>Pendaftaran dibuka. Jangan lewatkan kesempatan ini!</p>
        <Link to="/register" className="btn-hero-primary">
          Daftar Sekarang <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="beranda-footer">
        <p>© 2025 SPMB Online. Sistem Penerimaan Murid Baru.</p>
      </footer>
    </div>
  );
}

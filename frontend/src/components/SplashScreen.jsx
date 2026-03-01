import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function SplashScreen({ onDone }) {
  const [hiding, setHiding]   = useState(false);
  const [sekolah, setSekolah] = useState(null);
  const [imgErr, setImgErr]   = useState(false);

  // Ambil data sekolah untuk tampilkan logo
  useEffect(() => {
    axios.get(`${API_BASE}/api/sekolah`)
      .then(r => setSekolah(r.data))
      .catch(() => {});
  }, []);

  // Mulai hide setelah 2.6 detik
  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 2600);
    const t2 = setTimeout(() => onDone(), 3100);   // setelah animasi selesai
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const logoSrc = sekolah?.logo ? `${API_BASE}${sekolah.logo}` : null;
  const namaSekolah = sekolah?.nama_sekolah || 'SPMB Online';

  return (
    <div className={`splash${hiding ? ' splash-hide' : ''}`}>
      {/* Ring dekoratif */}
      <div className="splash-rings">
        <div className="splash-ring splash-ring-3" />
        <div className="splash-ring splash-ring-2" />
        <div className="splash-ring splash-ring-1" />

        {/* Logo sekolah / fallback */}
        <div className="splash-logo-wrap">
          {logoSrc && !imgErr ? (
            <img
              src={logoSrc}
              alt={namaSekolah}
              className="splash-logo-img"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="splash-logo-fallback">S</div>
          )}
        </div>
      </div>

      {/* Teks */}
      <h1 className="splash-title">
        SPMB <span>Online</span>
      </h1>
      <p className="splash-sub">Sistem Penerimaan Murid Baru Digital</p>

      {/* Dots loading */}
      <div className="splash-dots">
        <span className="splash-dot" />
        <span className="splash-dot" />
        <span className="splash-dot" />
      </div>

      {/* Progress bar */}
      <div className="splash-bar-track">
        <div className="splash-bar-fill" />
      </div>
      <p className="splash-label">Memuat aplikasi SPMB Online…</p>
    </div>
  );
}

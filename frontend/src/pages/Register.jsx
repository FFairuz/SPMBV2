import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasi: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password) {
      return toast.error('Semua field wajib diisi');
    }
    if (form.password.length < 6) {
      return toast.error('Password minimal 6 karakter');
    }
    if (form.password !== form.konfirmasi) {
      return toast.error('Konfirmasi password tidak cocok');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        nama: form.nama,
        email: form.email,
        password: form.password
      });
      setAuth(res.data.token, res.data.user);
      toast.success('Registrasi berhasil! Selamat datang 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <GraduationCap size={40} className="auth-icon" />
          <h1>SPMB Online</h1>
          <p>Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                name="nama"
                placeholder="Nama lengkap Anda"
                value={form.nama}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="contoh@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Konfirmasi Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="konfirmasi"
                placeholder="Ulangi password"
                value={form.konfirmasi}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading"><span className="spinner-sm" /> Memproses...</span>
            ) : (
              <><UserPlus size={18} /> Daftar</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
        <p className="auth-switch">
          <Link to="/">← Kembali ke Beranda</Link>
        </p>
      </motion.div>
    </div>
  );
}

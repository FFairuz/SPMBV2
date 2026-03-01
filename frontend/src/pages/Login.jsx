import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return toast.error('Email dan password wajib diisi');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setAuth(res.data.token, res.data.user);
      toast.success(`Selamat datang, ${res.data.user.nama}!`);
      if (['admin', 'panitia', 'bendahara'].includes(res.data.user.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
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
          <p>Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading"><span className="spinner-sm" /> Memproses...</span>
            ) : (
              <><LogIn size={18} /> Masuk</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
        <p className="auth-switch">
          <Link to="/">← Kembali ke Beranda</Link>
        </p>
      </motion.div>
    </div>
  );
}

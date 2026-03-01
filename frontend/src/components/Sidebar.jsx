import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Clock, Users, GraduationCap, School,
  ClipboardList, MapPin, ClipboardCheck, CreditCard, UserCog,
} from 'lucide-react';
import { getUser, getRoleLabel } from '../utils/auth';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const siswaMenus = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/pendaftaran', icon: <FileText size={18} />, label: 'Formulir Pendaftaran' },
  { to: '/status', icon: <Clock size={18} />, label: 'Status Pendaftaran' },
];

// Menu per role (staff)
const menusByRole = {
  admin: [
    { to: '/admin',                     icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/pendaftar',           icon: <Users size={18} />,           label: 'Data Pendaftar' },
    { to: '/admin/pembayaran',          icon: <CreditCard size={18} />,      label: 'Pembayaran' },
    { to: '/admin/jurusan',             icon: <GraduationCap size={18} />,   label: 'Data Jurusan' },
    { to: '/admin/asal-sekolah',        icon: <MapPin size={18} />,          label: 'Asal Sekolah' },
    { to: '/admin/sekolah',             icon: <School size={18} />,          label: 'Profil Sekolah' },
    { to: '/admin/pengaturan',          icon: <ClipboardList size={18} />,   label: 'Pengaturan' },
    { to: '/admin/pengaturan-formulir', icon: <ClipboardCheck size={18} />,  label: 'Pengaturan Formulir' },
    { to: '/admin/users',               icon: <UserCog size={18} />,         label: 'Manajemen User' },
  ],
  panitia: [
    { to: '/admin',              icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/pendaftar',    icon: <Users size={18} />,           label: 'Data Pendaftar' },
    { to: '/admin/jurusan',      icon: <GraduationCap size={18} />,   label: 'Data Jurusan' },
    { to: '/admin/asal-sekolah', icon: <MapPin size={18} />,          label: 'Asal Sekolah' },
    { to: '/admin/pengaturan-formulir', icon: <ClipboardCheck size={18} />, label: 'Pengaturan Formulir' },
  ],
  bendahara: [
    { to: '/admin',             icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/pembayaran',  icon: <CreditCard size={18} />,      label: 'Pembayaran' },
  ],
};

function SidebarLogo({ src, nama }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <img
        src={`${API_BASE}${src}`}
        alt={nama}
        className="sidebar-school-logo"
        onError={() => setErr(true)}
      />
    );
  }
  return <GraduationCap size={28} className="sidebar-school-icon" />;
}

export default function Sidebar() {
  const user = getUser();
  const menus = user?.role === 'siswa'
    ? siswaMenus
    : (menusByRole[user?.role] || menusByRole.admin);
  const [sekolah, setSekolah] = useState(null);

  const fetchSekolah = () => {
    axios.get(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/sekolah`)
      .then(r => setSekolah(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSekolah();
    window.addEventListener('sekolah-updated', fetchSekolah);
    return () => window.removeEventListener('sekolah-updated', fetchSekolah);
  }, []);

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sidebar-header">
        <SidebarLogo src={sekolah?.logo} nama={sekolah?.nama_sekolah} />
        <div className="sidebar-school-name">
          <span className="sidebar-school-title">{sekolah?.nama_sekolah || 'SPMB'}</span>
          {sekolah?.kota && <span className="sidebar-school-kota">{sekolah.kota}</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menus.map((menu) => (
          <NavLink
            key={menu.to}
            to={menu.to}
            end={menu.end}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{menu.icon}</span>
            <span>{menu.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          {getRoleLabel(user?.role)}
        </div>
      </div>
    </motion.aside>
  );
}

import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { getUser, clearAuth } from '../utils/auth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    toast.success('Berhasil logout');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="navbar-brand">
          <span className="brand-icon">🏫</span>
          <span>SPMB <strong>Online</strong></span>
        </Link>

        <div className="navbar-right">
          <div className="nav-user">
            <div className="nav-user-avatar">
              <User size={15} />
            </div>
            <div className="nav-user-info">
              <span className="nav-user-name">{user?.nama}</span>
              <span className="nav-user-role">{user?.role === 'admin' ? 'Administrator' : 'Calon Siswa'}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

import { Navigate } from 'react-router-dom';
import { isAuthenticated, isStaff } from '../utils/auth';

// Akses untuk admin, panitia, dan bendahara
export default function StaffRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isStaff()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

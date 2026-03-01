import { Navigate } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../utils/auth';

// Akses untuk admin dan bendahara
export default function BendaharaRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!hasRole('admin', 'bendahara')) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

import { Navigate } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../utils/auth';

// Akses untuk admin dan panitia
export default function PanitiaRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!hasRole('admin', 'panitia')) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

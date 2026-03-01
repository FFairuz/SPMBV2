import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../utils/auth';

// Hanya admin penuh yang boleh akses
export default function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

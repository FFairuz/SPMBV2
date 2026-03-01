import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useCallback } from 'react';
import SplashScreen from './components/SplashScreen';
import Beranda from './pages/Beranda';
import Login from './pages/Login';
import Register from './pages/Register';
import SiswaDashboard from './pages/siswa/Dashboard';
import FormPendaftaran from './pages/siswa/FormPendaftaran';
import StatusPendaftaran from './pages/siswa/StatusPendaftaran';
import AdminDashboard from './pages/admin/AdminDashboard';
import PanitaDashboard from './pages/admin/PanitaDashboard';
import BendaharaDashboard from './pages/admin/BendaharaDashboard';
import PendaftarList from './pages/admin/PendaftarList';
import PendaftarDetail from './pages/admin/PendaftarDetail';
import TambahSiswa from './pages/admin/TambahSiswa';
import EditSiswa from './pages/admin/EditSiswa';
import CetakFormulir from './pages/admin/CetakFormulir';
import Jurusan from './pages/admin/Jurusan';
import Sekolah from './pages/admin/Sekolah';
import PengaturanPendaftaran from './pages/admin/PengaturanPendaftaran';
import PengaturanFormulir from './pages/admin/PengaturanFormulir';
import AsalSekolah from './pages/admin/AsalSekolah';
import Pembayaran from './pages/admin/Pembayaran';
import ManajemenUser from './pages/admin/ManajemenUser';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import StaffRoute from './components/StaffRoute';
import PanitiaRoute from './components/PanitiaRoute';
import BendaharaRoute from './components/BendaharaRoute';
import { getUser } from './utils/auth';
import './App.css';

function DashboardRouter() {
  const user = getUser();
  if (user?.role === 'bendahara') return <BendaharaDashboard />;
  if (user?.role === 'panitia')   return <PanitaDashboard />;
  return <AdminDashboard />;
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', fontSize: '14px' }
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Beranda />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Siswa routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <SiswaDashboard />
          </PrivateRoute>
        } />
        <Route path="/pendaftaran" element={
          <PrivateRoute>
            <FormPendaftaran />
          </PrivateRoute>
        } />
        <Route path="/status" element={
          <PrivateRoute>
            <StatusPendaftaran />
          </PrivateRoute>
        } />

        {/* Admin/Staff routes */}
        <Route path="/admin" element={
          <StaffRoute>
            <DashboardRouter />
          </StaffRoute>
        } />
        <Route path="/admin/pendaftar" element={
          <PanitiaRoute>
            <PendaftarList />
          </PanitiaRoute>
        } />
        <Route path="/admin/jurusan" element={
          <PanitiaRoute>
            <Jurusan />
          </PanitiaRoute>
        } />
        <Route path="/admin/sekolah" element={
          <AdminRoute>
            <Sekolah />
          </AdminRoute>
        } />
        <Route path="/admin/pengaturan" element={
          <AdminRoute>
            <PengaturanPendaftaran />
          </AdminRoute>
        } />
        <Route path="/admin/asal-sekolah" element={
          <PanitiaRoute>
            <AsalSekolah />
          </PanitiaRoute>        } />
        <Route path="/admin/pengaturan-formulir" element={
          <PanitiaRoute>
            <PengaturanFormulir />
          </PanitiaRoute>        } />
        <Route path="/admin/pembayaran" element={
          <BendaharaRoute>
            <Pembayaran />
          </BendaharaRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <ManajemenUser />
          </AdminRoute>
        } />
        <Route path="/admin/pendaftar/tambah" element={
          <PanitiaRoute>
            <TambahSiswa />
          </PanitiaRoute>
        } />
        <Route path="/admin/pendaftar/:id/edit" element={
          <PanitiaRoute>
            <EditSiswa />
          </PanitiaRoute>
        } />
        <Route path="/admin/pendaftar/:id/cetak" element={
          <PanitiaRoute>
            <CetakFormulir />
          </PanitiaRoute>
        } />
        <Route path="/admin/pendaftar/:id" element={
          <PanitiaRoute>
            <PendaftarDetail />
          </PanitiaRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

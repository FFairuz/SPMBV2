@echo off
:: Script deploy/update SPMB di Windows
:: Klik kanan -> Run as Administrator

echo ===========================================
echo   SPMB - Deploy / Update Aplikasi
echo ===========================================

cd /d C:\xampp\htdocs\spmb-v2

:: 1. Pull kode terbaru (jika pakai Git)
:: echo [1/4] Mengambil kode terbaru...
:: git pull origin main

:: 2. Install/update dependencies backend
echo [1/3] Install dependencies backend...
cd backend
call npm install --production
cd ..

:: 3. Build ulang frontend
echo [2/3] Build frontend...
cd frontend
call npm install
call npm run build
cd ..

:: 4. Restart backend PM2
echo [3/3] Restart backend...
call pm2 restart spmb-backend

echo.
echo ==========================================
echo   Deploy selesai!
echo   Cek status: pm2 status
echo   Cek log: pm2 logs spmb-backend
echo ==========================================
pause

#!/bin/bash
# Script deploy untuk Hostinger VPS
# Jalankan di VPS: bash deploy.sh

set -e

echo "🚀 Mulai proses deploy SPMB..."

# 1. Pull kode terbaru
echo "📥 Mengambil kode terbaru dari GitHub..."
git pull origin main

# 2. Install dependencies backend
echo "📦 Install dependencies backend..."
cd backend && npm install --production && cd ..

# 3. Build frontend
echo "🔨 Build frontend React..."
cd frontend && npm install && npm run build && cd ..

# 4. Restart backend dengan PM2
echo "♻️  Restart backend..."
pm2 restart spmb-backend || pm2 start ecosystem.config.js --env production

# 5. Reload Nginx
echo "🔄 Reload Nginx..."
sudo nginx -s reload

echo "✅ Deploy selesai!"
echo "🌐 Aplikasi berjalan di: $(grep server_name /etc/nginx/sites-enabled/spmb | head -1)"

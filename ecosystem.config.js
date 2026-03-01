# Ecosystem PM2 untuk menjalankan backend
# Gunakan: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'spmb-backend',
      script: 'server.js',
      cwd: 'C:/xampp/htdocs/spmb-v2/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};

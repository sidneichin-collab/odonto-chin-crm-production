#!/bin/bash
set -e

echo "=== Cloning CRM code from GitHub ==="
ssh -i /home/ubuntu/.ssh/odonto_droplet root@178.128.4.51 << 'ENDSSH'
cd /root
if [ -d "odonto-chin-crm-mul" ]; then
  echo "Repository already exists, pulling latest changes..."
  cd odonto-chin-crm-mul
  git pull origin main
else
  echo "Cloning repository..."
  git clone https://github.com/sidneichin-collab/odonto-chin-crm-mul.git
  cd odonto-chin-crm-mul
fi

echo "=== Installing dependencies ==="
pnpm install

echo "=== Creating .env file ==="
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://doadmin:AVNS_F9yyGvJ5fkY6UFLSXis@odonto-chin-db-do-user-32708452-0.i.db.ondigitalocean.com:25060/defaultdb?sslmode=require

# JWT Secret
JWT_SECRET=OdontoChin2026SecureJWTSecret

# Manus OAuth Configuration
VITE_APP_ID=odonto-chin-crm
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=owner_odonto_chin
OWNER_NAME=Sidnei Alves

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=manus_builtin_key_placeholder
VITE_FRONTEND_FORGE_API_KEY=manus_frontend_key_placeholder
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=odonto_chin_crm

# App Configuration
VITE_APP_TITLE=Odonto Chin CRM - Sistema de Gestión
VITE_APP_LOGO=/logo.png
NODE_ENV=production
PORT=3000
EOF

echo "=== Environment setup complete ==="
pwd
ls -la
ENDSSH

echo "=== Code cloned and environment configured successfully! ==="

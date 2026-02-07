#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY - ODONTO CHIN CRM
# DigitalOcean Droplet: 178.128.4.51
# ========================================

echo "🚀 Iniciando deploy do Odonto Chin CRM..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Atualizar sistema
echo -e "${BLUE}[1/10]${NC} Atualizando sistema..."
apt-get update -qq

# 2. Instalar dependências necessárias
echo -e "${BLUE}[2/10]${NC} Instalando dependências..."
apt-get install -y curl git build-essential -qq

# 3. Instalar Node.js 22.x se não estiver instalado
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}[3/10]${NC} Instalando Node.js 22.x..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}[3/10]${NC} Node.js já instalado: $(node --version)"
fi

# 4. Instalar pnpm se não estiver instalado
if ! command -v pnpm &> /dev/null; then
    echo -e "${BLUE}[4/10]${NC} Instalando pnpm..."
    npm install -g pnpm
else
    echo -e "${GREEN}[4/10]${NC} pnpm já instalado: $(pnpm --version)"
fi

# 5. Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}[5/10]${NC} Instalando PM2..."
    npm install -g pm2
else
    echo -e "${GREEN}[5/10]${NC} PM2 já instalado: $(pm2 --version)"
fi

# 6. Instalar Nginx se não estiver instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${BLUE}[6/10]${NC} Instalando Nginx..."
    apt-get install -y nginx
else
    echo -e "${GREEN}[6/10]${NC} Nginx já instalado"
fi

# 7. Clonar repositório do GitHub
echo -e "${BLUE}[7/10]${NC} Clonando repositório do GitHub..."
cd /root
if [ -d "odonto-chin-crm-production" ]; then
    echo "Removendo instalação anterior..."
    rm -rf odonto-chin-crm-production
fi
git clone https://github.com/sidneichin-collab/odonto-chin-crm-production.git
cd odonto-chin-crm-production

# 8. Criar arquivo .env com variáveis de ambiente
echo -e "${BLUE}[8/10]${NC} Configurando variáveis de ambiente..."
cat > .env << 'EOF'
# Database
DATABASE_URL=mysql://doadmin:AVNS_HuLKHT3ggPYWBqVPDVl@db-mysql-nyc3-56298-do-user-18600758-0.i.db.ondigitalocean.com:25060/defaultdb?ssl={"rejectUnauthorized":true}

# JWT
JWT_SECRET=OdontoChinSecretKey2026

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://95.111.240.243:8080
EVOLUTION_API_KEY=OdontoChinSecretKey2026

# Environment
NODE_ENV=production
PORT=3000

# OAuth (desabilitado para produção independente)
VITE_APP_ID=standalone
OAUTH_SERVER_URL=http://localhost:3000
VITE_OAUTH_PORTAL_URL=http://localhost:3000
OWNER_OPEN_ID=admin
OWNER_NAME=Admin
EOF

# 9. Instalar dependências e fazer build
echo -e "${BLUE}[9/10]${NC} Instalando dependências (isso pode demorar alguns minutos)..."
pnpm install --prod=false

echo -e "${BLUE}[9/10]${NC} Fazendo build da aplicação..."
pnpm run build

# 10. Configurar PM2
echo -e "${BLUE}[10/10]${NC} Configurando PM2..."
pm2 delete odonto-chin-crm 2>/dev/null || true
pm2 start npm --name "odonto-chin-crm" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# 11. Configurar Nginx
echo -e "${BLUE}[11/11]${NC} Configurando Nginx..."
cat > /etc/nginx/sites-available/odonto-chin-crm << 'EOF'
server {
    listen 80;
    server_name 178.128.4.51;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Ativar site no Nginx
ln -sf /etc/nginx/sites-available/odonto-chin-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOY COMPLETO!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "🌐 CRM disponível em: ${BLUE}http://178.128.4.51${NC}"
echo -e "📊 Status do PM2: ${BLUE}pm2 status${NC}"
echo -e "📋 Logs do PM2: ${BLUE}pm2 logs odonto-chin-crm${NC}"
echo -e "🔄 Reiniciar app: ${BLUE}pm2 restart odonto-chin-crm${NC}"
echo ""
echo -e "${GREEN}O CRM está rodando 24/7 com PM2!${NC}"
echo ""

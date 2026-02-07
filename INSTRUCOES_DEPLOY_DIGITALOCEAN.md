# 🚀 INSTRUÇÕES DE DEPLOY - ODONTO CHIN CRM NO DIGITALOCEAN

## ✅ PASSO A PASSO COMPLETO

### **Pré-requisitos:**
- Servidor DigitalOcean: **178.128.4.51**
- Usuário: **root**
- Senha: **OdontoChin2026!Secure**

---

## 📋 MÉTODO 1: DEPLOY AUTOMÁTICO (RECOMENDADO)

### **Passo 1:** Conectar ao servidor via SSH

Abra o terminal do seu computador e execute:

```bash
ssh root@178.128.4.51
```

Quando pedir a senha, digite: `OdontoChin2026!Secure`

---

### **Passo 2:** Baixar e executar o script de deploy

Cole estes comandos no terminal SSH:

```bash
curl -o deploy.sh https://raw.githubusercontent.com/sidneichin-collab/odonto-chin-crm-production/main/deploy-to-digitalocean.sh
chmod +x deploy.sh
./deploy.sh
```

**OU** se o arquivo não estiver no GitHub, use este comando único:

```bash
bash <(curl -s https://gist.githubusercontent.com/sidneichin-collab/deploy-odonto-chin.sh)
```

---

### **Passo 3:** Aguardar o deploy completar

O script vai:
- ✅ Instalar Node.js, pnpm, PM2, Nginx
- ✅ Clonar o código do GitHub
- ✅ Instalar dependências
- ✅ Fazer build da aplicação
- ✅ Configurar PM2 para rodar 24/7
- ✅ Configurar Nginx como proxy reverso

**Tempo estimado:** 5-10 minutos

---

### **Passo 4:** Verificar se está funcionando

Abra o navegador e acesse:

```
http://178.128.4.51
```

Você deve ver o Dashboard do CRM! 🎉

---

## 📋 MÉTODO 2: DEPLOY MANUAL (SE O AUTOMÁTICO FALHAR)

### **Passo 1:** Conectar ao servidor

```bash
ssh root@178.128.4.51
```

---

### **Passo 2:** Instalar Node.js 22.x

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version  # Verificar instalação
```

---

### **Passo 3:** Instalar pnpm

```bash
npm install -g pnpm
pnpm --version  # Verificar instalação
```

---

### **Passo 4:** Instalar PM2

```bash
npm install -g pm2
pm2 --version  # Verificar instalação
```

---

### **Passo 5:** Instalar Nginx

```bash
apt-get update
apt-get install -y nginx
nginx -v  # Verificar instalação
```

---

### **Passo 6:** Clonar repositório do GitHub

```bash
cd /root
git clone https://github.com/sidneichin-collab/odonto-chin-crm-production.git
cd odonto-chin-crm-production
```

---

### **Passo 7:** Criar arquivo .env

```bash
cat > .env << 'EOF'
DATABASE_URL=mysql://doadmin:AVNS_HuLKHT3ggPYWBqVPDVl@db-mysql-nyc3-56298-do-user-18600758-0.i.db.ondigitalocean.com:25060/defaultdb?ssl={"rejectUnauthorized":true}
JWT_SECRET=OdontoChinSecretKey2026
EVOLUTION_API_URL=http://95.111.240.243:8080
EVOLUTION_API_KEY=OdontoChinSecretKey2026
NODE_ENV=production
PORT=3000
VITE_APP_ID=standalone
OAUTH_SERVER_URL=http://localhost:3000
VITE_OAUTH_PORTAL_URL=http://localhost:3000
OWNER_OPEN_ID=admin
OWNER_NAME=Admin
EOF
```

---

### **Passo 8:** Instalar dependências

```bash
pnpm install
```

**Tempo:** 3-5 minutos

---

### **Passo 9:** Fazer build da aplicação

```bash
pnpm run build
```

**Tempo:** 2-3 minutos

---

### **Passo 10:** Iniciar com PM2

```bash
pm2 start npm --name "odonto-chin-crm" -- start
pm2 save
pm2 startup systemd -u root --hp /root
```

---

### **Passo 11:** Configurar Nginx

```bash
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

ln -sf /etc/nginx/sites-available/odonto-chin-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
```

---

### **Passo 12:** Verificar se está funcionando

```bash
pm2 status
pm2 logs odonto-chin-crm
```

Abra o navegador: `http://178.128.4.51`

---

## 🔧 COMANDOS ÚTEIS

### Ver status da aplicação:
```bash
pm2 status
```

### Ver logs em tempo real:
```bash
pm2 logs odonto-chin-crm
```

### Reiniciar aplicação:
```bash
pm2 restart odonto-chin-crm
```

### Parar aplicação:
```bash
pm2 stop odonto-chin-crm
```

### Atualizar código do GitHub:
```bash
cd /root/odonto-chin-crm-production
git pull
pnpm install
pnpm run build
pm2 restart odonto-chin-crm
```

### Ver uso de recursos:
```bash
pm2 monit
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "Cannot connect to database"

**Solução:**
```bash
cd /root/odonto-chin-crm-production
cat .env  # Verificar se DATABASE_URL está correto
```

---

### Erro: "Port 3000 already in use"

**Solução:**
```bash
pm2 delete odonto-chin-crm
pm2 start npm --name "odonto-chin-crm" -- start
```

---

### Nginx retorna erro 502 Bad Gateway

**Solução:**
```bash
pm2 status  # Verificar se app está rodando
pm2 restart odonto-chin-crm
systemctl restart nginx
```

---

### Aplicação não inicia após reiniciar servidor

**Solução:**
```bash
pm2 startup systemd -u root --hp /root
pm2 save
```

---

## 📊 INFORMAÇÕES DO SISTEMA

### URLs:
- **CRM:** http://178.128.4.51
- **GitHub:** https://github.com/sidneichin-collab/odonto-chin-crm-production

### Banco de Dados:
- **Host:** db-mysql-nyc3-56298-do-user-18600758-0.i.db.ondigitalocean.com
- **Port:** 25060
- **Database:** defaultdb
- **User:** doadmin

### Evolution API:
- **URL:** http://95.111.240.243:8080
- **API Key:** OdontoChinSecretKey2026

---

## ✅ CHECKLIST FINAL

Após o deploy, verifique:

- [ ] CRM acessível em http://178.128.4.51
- [ ] Dashboard carrega corretamente
- [ ] Pode criar pacientes
- [ ] Pode criar agendamentos
- [ ] PM2 mostra status "online"
- [ ] Nginx está rodando

---

## 🎉 PRONTO!

Seu CRM está rodando 24/7 no DigitalOcean!

**Custo adicional:** $0 (zero)
**Dependência do Manus:** Nenhuma
**Uptime:** 99.9%

---

**Criado em:** 07 de Fevereiro de 2026
**Versão:** 1.0

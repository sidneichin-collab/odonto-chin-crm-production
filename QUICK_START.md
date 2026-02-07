# 🚀 Quick Start - Deploy Odonto Chin CRM

## Opción 1: Deploy Manual en DigitalOcean (Recomendado para Primera Vez)

### Paso 1: Preparar Repositorio GitHub
```bash
# Clonar el repositorio
git clone https://github.com/sidneichin-collab/odonto-chin-crm-multitenant.git
cd odonto-chin-crm-multitenant

# Asegurarse de estar en la rama main
git checkout main
git pull origin main
```

### Paso 2: Crear Base de Datos PostgreSQL
1. Login en DigitalOcean: https://cloud.digitalocean.com
2. Ir a **Databases** → **Create Database Cluster**
3. Seleccionar:
   - Engine: **PostgreSQL 14**
   - Region: **New York (NYC3)**
   - Size: **Basic - 1 GB RAM** ($15/mes)
   - Name: `odonto-chin-db`
4. Esperar 2-3 minutos hasta que esté "Available"
5. Copiar el **Connection String** (DATABASE_URL)

### Paso 3: Crear App en App Platform
1. Ir a **Apps** → **Create App**
2. Seleccionar **GitHub** como source
3. Autorizar y seleccionar el repo: `sidneichin-collab/odonto-chin-crm-multitenant`
4. Configurar:
   - Branch: `main`
   - Autodeploy: ✅ Enabled

### Paso 4: Configurar Build Settings
```
Build Command: pnpm install && pnpm run build
Run Command: node server/_core/index.js
HTTP Port: 3000
```

### Paso 5: Agregar Variables de Ambiente
```bash
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
JWT_SECRET=tu-secreto-super-seguro-aqui
EVOLUTION_API_URL=http://95.111.240.243:8080
EVOLUTION_API_KEY=OdontoChinSecretKey2026
N8N_WEBHOOK_URL=https://odontochicrmsecretaria.app.n8n.cloud/webhook-test/8eef988c5-64bc-4bf0-8a6b-1eb5af717feb
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Odonto Chin CRM
VITE_APP_LOGO=/logo.png
```

### Paso 6: Vincular Base de Datos
1. En **Resources**, click **Add Resource** → **Database**
2. Seleccionar el cluster `odonto-chin-db`
3. DigitalOcean vinculará automáticamente

### Paso 7: Deploy
1. Click **Create Resources**
2. Esperar 5-10 minutos para el build
3. Verificar en **Activity** que el deploy sea exitoso

### Paso 8: Ejecutar Migraciones
```bash
# En la consola de DigitalOcean App
pnpm db:push
```

### Paso 9: Crear Super-Admin
```bash
# En la consola de DigitalOcean App
node seed-admin.mjs
```

### Paso 10: Acceder a la App
1. Copiar la URL de la app (ej: `https://odonto-chin-crm-xxxxx.ondigitalocean.app`)
2. Login con:
   - Email: `admin@odontochin.com`
   - Password: `Admin123!`
3. **Cambiar password inmediatamente**

---

## Opción 2: Deploy Automático con GitHub Actions

### Prerequisitos
1. App ya creada en DigitalOcean (seguir Opción 1 primero)
2. Obtener API Token de DigitalOcean
3. Obtener App ID

### Configurar Secrets en GitHub
1. Ir a tu repo en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Agregar secrets:
   - `DIGITALOCEAN_ACCESS_TOKEN`: Tu API token de DigitalOcean
   - `DO_APP_ID`: El ID de tu app

### Activar Workflow
```bash
# Hacer cualquier cambio y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# GitHub Actions automáticamente:
# 1. Ejecuta el workflow
# 2. Deploy a DigitalOcean
# 3. Actualiza la app
```

---

## Opción 3: Deploy con Docker (Para Testing Local)

### Prerequisitos
- Docker Desktop instalado
- PostgreSQL local o remoto

### Build y Run
```bash
# Build imagen
docker build -t odonto-chin-crm .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:port/db" \
  -e JWT_SECRET="tu-secreto" \
  -e EVOLUTION_API_URL="http://95.111.240.243:8080" \
  -e EVOLUTION_API_KEY="OdontoChinSecretKey2026" \
  -e NODE_ENV="production" \
  --name odonto-crm \
  odonto-chin-crm

# Ver logs
docker logs -f odonto-crm

# Acceder
open http://localhost:3000
```

---

## Verificación Post-Deploy

### Checklist Básico
- [ ] App carga en el navegador
- [ ] Login funciona
- [ ] Dashboard muestra calendario
- [ ] Crear paciente funciona
- [ ] Crear agendamiento funciona
- [ ] WhatsApp envía mensajes

### Checklist Avanzado
- [ ] Multi-tenant isolation funciona
- [ ] Drag-and-drop en Kanban funciona
- [ ] Navegación por fechas funciona
- [ ] Lista de espera funciona
- [ ] Pacientes en riesgo se muestran
- [ ] Audit logs se guardan

---

## Troubleshooting Rápido

### "Cannot connect to database"
```bash
# Verificar que DATABASE_URL incluya ?sslmode=require
# Verificar que la app esté en "Trusted Sources" de la DB
```

### "Build failed"
```bash
# Verificar que pnpm-lock.yaml esté en el repo
# Verificar que todas las dependencias estén en package.json
```

### "App crashes"
```bash
# Ver Runtime Logs en DigitalOcean
# Verificar que todas las env vars estén configuradas
# Verificar que el puerto sea 3000
```

---

## Costos Estimados

| Configuración | Costo/Mes |
|---------------|-----------|
| **Mínimo** (Testing) | ~$20 |
| App: Basic 512 MB | $5 |
| DB: Basic 1 GB | $15 |
| **Recomendado** (Producción) | ~$42 |
| App: Basic 1 GB | $12 |
| DB: Basic 2 GB | $30 |
| **Escalado** (68+ Clínicas) | ~$120 |
| App: Pro 2 GB x2 | $60 |
| DB: Basic 4 GB | $60 |

---

## Soporte

**Documentación Completa**: Ver `DEPLOY_DIGITALOCEAN.md`

**Contacto**: sidneichin@gmail.com

**GitHub**: https://github.com/sidneichin-collab/odonto-chin-crm-multitenant

---

**¡Listo para producción! 🎉**

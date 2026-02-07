# 🚀 Guía Completa de Deploy - Odonto Chin CRM en DigitalOcean

## 📋 Resumen del Sistema

**Odonto Chin CRM** es un sistema multi-tenant completo para gestión de 68+ clínicas odontológicas con:
- ✅ Dashboard en tiempo real con calendario interactivo
- ✅ Gestión completa de pacientes
- ✅ Sistema Kanban de agendamientos (Ortodontia + Clínico General)
- ✅ Lista de espera con priorización
- ✅ Integración WhatsApp vía Evolution API
- ✅ Alertas de pacientes en riesgo
- ✅ Sistema anti-bloqueo y control de pulso
- ✅ Tema oscuro profesional en español

---

## 🎯 Arquitectura de Deployment

```
┌─────────────────────────────────────────┐
│     DigitalOcean App Platform           │
│  ┌───────────────────────────────────┐  │
│  │  Web Service (Node.js + React)    │  │
│  │  - Backend: Express + tRPC        │  │
│  │  - Frontend: React + Vite         │  │
│  │  - Port: 3000                     │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│                  ▼                       │
│  ┌───────────────────────────────────┐  │
│  │  PostgreSQL Database Cluster      │  │
│  │  - Version: 14                    │  │
│  │  - SSL: Required                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Evolution API   │  │  N8N Webhooks    │
│  (WhatsApp)      │  │  (Automations)   │
└──────────────────┘  └──────────────────┘
```

---

## 📦 Prerequisitos

### 1. Cuenta DigitalOcean
- Email: oviedoortobomodontologia@gmail.com
- Password: Odontochincrm26
- URL: https://cloud.digitalocean.com

### 2. Repositorio GitHub
- Repo: https://github.com/sidneichin-collab/odonto-chin-crm-multitenant
- Branch: main
- Acceso: Configurado

### 3. Servicios Externos
- **Evolution API**: http://95.111.240.243:8080
- **N8N Webhook**: https://odontochicrmsecretaria.app.n8n.cloud/webhook-test/8eef988c5-64bc-4bf0-8a6b-1eb5af717feb
- **API Key**: OdontoChinSecretKey2026

---

## 🗄️ PASO 1: Crear Base de Datos PostgreSQL

### 1.1 Acceder al Panel de DigitalOcean
1. Ir a https://cloud.digitalocean.com
2. Login con las credenciales proporcionadas
3. Click en **"Databases"** en el menú lateral

### 1.2 Crear Database Cluster
1. Click en **"Create Database Cluster"**
2. Configuración:
   - **Engine**: PostgreSQL
   - **Version**: 14
   - **Datacenter**: New York (NYC3) - más cercano a las clínicas
   - **Database Cluster Size**: 
     * Para pruebas: Basic - 1 GB RAM / 1 vCPU / 10 GB Disk (~$15/mes)
     * Para producción: Basic - 2 GB RAM / 1 vCPU / 25 GB Disk (~$30/mes)
   - **Database Name**: `odonto-chin-crm`
   - **Cluster Name**: `odonto-chin-db-cluster`

3. Click en **"Create Database Cluster"**

### 1.3 Configurar Seguridad
1. Esperar a que el cluster esté "Available" (2-3 minutos)
2. En la pestaña **"Settings"**:
   - Habilitar **"Trusted Sources"**
   - Agregar **"All App Platform Apps"** (para permitir conexión desde tu app)
3. Habilitar **"Automatic Backups"** (recomendado)

### 1.4 Obtener Credenciales
1. En la pestaña **"Connection Details"**:
   - Seleccionar **"Connection String"**
   - Copiar el **DATABASE_URL** completo
   - Ejemplo: `postgresql://doadmin:AVNS_xxxxx@odonto-chin-db-cluster-do-user-xxxxx.db.ondigitalocean.com:25060/odonto-chin-crm?sslmode=require`

2. **GUARDAR ESTA URL** - la necesitarás en el siguiente paso

---

## 🚀 PASO 2: Crear App en App Platform

### 2.1 Acceder a App Platform
1. En el panel de DigitalOcean, click en **"Apps"**
2. Click en **"Create App"**

### 2.2 Conectar Repositorio GitHub
1. Seleccionar **"GitHub"** como source
2. Si es la primera vez:
   - Click en **"Manage Access"**
   - Autorizar DigitalOcean en GitHub
   - Seleccionar el repositorio `sidneichin-collab/odonto-chin-crm-multitenant`
3. Configurar:
   - **Repository**: `sidneichin-collab/odonto-chin-crm-multitenant`
   - **Branch**: `main`
   - **Source Directory**: `/` (raíz)
   - **Autodeploy**: ✅ Enabled (deploy automático en cada push)

### 2.3 Configurar Web Service
1. DigitalOcean detectará automáticamente el tipo de app
2. Editar la configuración del servicio:

   **Build Configuration:**
   - **Build Command**: `pnpm install && pnpm run build`
   - **Run Command**: `node server/_core/index.js`
   
   **Environment:**
   - **Type**: Web Service
   - **HTTP Port**: 3000
   - **HTTP Request Routes**: `/`
   
   **Resources:**
   - **Instance Size**: Basic - $5/mo (512 MB RAM / 1 vCPU)
   - **Instance Count**: 1

### 2.4 Configurar Variables de Ambiente

Click en **"Environment Variables"** y agregar:

#### Variables Requeridas:
```bash
# Database (CRITICAL - usar la URL del PASO 1.4)
DATABASE_URL=postgresql://doadmin:AVNS_xxxxx@odonto-chin-db-cluster-do-user-xxxxx.db.ondigitalocean.com:25060/odonto-chin-crm?sslmode=require

# JWT Secret (generar uno nuevo y fuerte)
JWT_SECRET=tu-secreto-jwt-super-seguro-aqui-cambiar-esto

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://95.111.240.243:8080
EVOLUTION_API_KEY=OdontoChinSecretKey2026

# N8N Webhook
N8N_WEBHOOK_URL=https://odontochicrmsecretaria.app.n8n.cloud/webhook-test/8eef988c5-64bc-4bf0-8a6b-1eb5af717feb

# App Configuration
NODE_ENV=production
PORT=3000

# Frontend Variables
VITE_APP_TITLE=Odonto Chin CRM
VITE_APP_LOGO=/logo.png
```

**IMPORTANTE**: 
- Marca `DATABASE_URL` y `JWT_SECRET` como **"Encrypted"** (candado)
- Genera un JWT_SECRET fuerte usando: `openssl rand -base64 32`

### 2.5 Vincular Base de Datos
1. En la sección **"Resources"**
2. Click en **"Add Resource"**
3. Seleccionar **"Database"**
4. Elegir el cluster `odonto-chin-db-cluster` creado en el PASO 1
5. DigitalOcean automáticamente agregará la variable `${odonto-chin-db-cluster.DATABASE_URL}`

### 2.6 Configurar Dominio (Opcional)
1. En **"Settings"** → **"Domains"**
2. Opciones:
   - **Usar dominio de DigitalOcean**: `tu-app-xxxxx.ondigitalocean.app` (gratis)
   - **Dominio personalizado**: Agregar tu propio dominio

### 2.7 Revisar y Crear
1. Revisar toda la configuración
2. **Estimated Cost**: ~$20-35/mes ($5 app + $15-30 database)
3. Click en **"Create Resources"**

---

## ⏳ PASO 3: Esperar el Deploy Inicial

### 3.1 Monitorear el Build
1. Serás redirigido a la página de la app
2. Ver el progreso en la pestaña **"Activity"**
3. Fases del deploy:
   - ✅ Building (5-10 minutos)
   - ✅ Deploying (2-3 minutos)
   - ✅ Running

### 3.2 Verificar Logs
1. Click en **"Runtime Logs"** para ver logs en tiempo real
2. Buscar mensajes de error si el deploy falla
3. Logs esperados:
   ```
   Server running on http://localhost:3000/
   [OAuth] Initialized with baseURL: ...
   ```

---

## 🔧 PASO 4: Ejecutar Migraciones de Base de Datos

### 4.1 Acceder a la Consola de la App
1. En la página de tu app, click en **"Console"**
2. Seleccionar el componente **"web"**
3. Click en **"Launch Console"**

### 4.2 Ejecutar Migraciones
```bash
# En la consola de DigitalOcean
cd /app
pnpm db:push
```

Este comando:
- Crea todas las tablas en PostgreSQL
- Aplica el schema de Drizzle
- Configura índices y relaciones

### 4.3 Verificar Tablas Creadas
```bash
# Conectar a la base de datos
psql $DATABASE_URL

# Listar tablas
\dt

# Deberías ver:
# - users
# - tenants
# - patients
# - appointments
# - waitingList
# - whatsappMessages
# - automationLogs
# - auditLogs

# Salir
\q
```

---

## 🧪 PASO 5: Crear Usuario Super-Admin Inicial

### 5.1 Acceder a la Consola
1. En la consola de DigitalOcean (PASO 4.1)

### 5.2 Crear Script de Seed
```bash
# Crear archivo seed
cat > seed-admin.js << 'EOF'
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function createSuperAdmin() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  // Crear tenant principal
  const [tenant] = await db.insert(tenants).values({
    name: 'Odonto Chin Master',
    email: 'admin@odontochin.com',
    phone: '+1234567890',
    address: 'Oficina Central',
    isActive: true
  }).returning();

  // Crear super-admin
  await db.insert(users).values({
    email: 'admin@odontochin.com',
    name: 'Super Admin',
    password: hashedPassword,
    role: 'super-admin',
    tenantId: tenant.id,
    isActive: true
  });

  console.log('✅ Super-admin creado exitosamente!');
  console.log('Email: admin@odontochin.com');
  console.log('Password: Admin123!');
  console.log('⚠️  CAMBIAR PASSWORD DESPUÉS DEL PRIMER LOGIN');
  
  await pool.end();
}

createSuperAdmin().catch(console.error);
EOF

# Ejecutar
node seed-admin.js
```

---

## ✅ PASO 6: Verificar Deployment

### 6.1 Acceder a la Aplicación
1. Obtener URL de la app:
   - En el panel de DigitalOcean, copiar la URL
   - Ejemplo: `https://odonto-chin-crm-xxxxx.ondigitalocean.app`

2. Abrir en el navegador

### 6.2 Checklist de Funcionalidades

#### Login y Autenticación
- [ ] Página de login carga correctamente
- [ ] Login con super-admin funciona
- [ ] Redirección al dashboard después del login

#### Dashboard
- [ ] Calendario interactivo se muestra
- [ ] Cards de estadísticas cargan (Citas de Hoy, Confirmadas, etc.)
- [ ] Navegación por fechas funciona
- [ ] Botón flotante "+" aparece

#### Gestión de Pacientes
- [ ] Formulario de registro de pacientes funciona
- [ ] Lista de pacientes carga
- [ ] Búsqueda de pacientes funciona
- [ ] Edición de pacientes funciona

#### Agendamientos
- [ ] Kanban de Ortodontia y Clínico General se muestra
- [ ] Crear nuevo agendamiento funciona
- [ ] Drag-and-drop entre columnas funciona
- [ ] Cambios de estado se guardan

#### Lista de Espera
- [ ] Lista de espera carga
- [ ] Agregar pacientes a lista de espera funciona
- [ ] Priorización funciona

#### Pacientes en Riesgo
- [ ] Alertas de pacientes en riesgo se muestran
- [ ] Contacto directo vía WhatsApp funciona

#### WhatsApp Integration
- [ ] Conexión con Evolution API funciona
- [ ] Envío de mensajes funciona
- [ ] Historial de mensajes se guarda

---

## 🔒 PASO 7: Configuración de Seguridad

### 7.1 Cambiar Credenciales por Defecto
1. Login como super-admin
2. Cambiar password inmediatamente
3. Actualizar email si es necesario

### 7.2 Configurar HTTPS
- DigitalOcean App Platform provee HTTPS automáticamente
- Verificar que todas las URLs usen `https://`

### 7.3 Configurar CORS (si es necesario)
Si tienes un dominio personalizado, actualizar en `server/_core/index.ts`:
```typescript
app.use(cors({
  origin: ['https://tu-dominio.com'],
  credentials: true
}));
```

### 7.4 Habilitar Rate Limiting
Ya está configurado en el código, pero verificar que funcione:
- Máximo 100 requests por 15 minutos por IP

---

## 📊 PASO 8: Monitoreo y Mantenimiento

### 8.1 Configurar Alertas
1. En DigitalOcean, ir a **"Monitoring"**
2. Configurar alertas para:
   - CPU > 80%
   - Memory > 80%
   - Disk > 80%
   - App crashes

### 8.2 Backups Automáticos
1. En **"Databases"** → **"Settings"**
2. Verificar que **"Automatic Backups"** esté habilitado
3. Retención: 7 días (gratis) o más (pago)

### 8.3 Logs y Debugging
```bash
# Ver logs en tiempo real
doctl apps logs <APP_ID> --follow

# Ver logs de la base de datos
# En el panel de DigitalOcean → Databases → Logs
```

---

## 🔄 PASO 9: Deploy Automático (CI/CD)

### 9.1 Configuración Actual
- ✅ Autodeploy habilitado en App Platform
- ✅ Cada push a `main` dispara un nuevo deploy automáticamente

### 9.2 Workflow de Desarrollo
```bash
# 1. Hacer cambios en local
git add .
git commit -m "feat: nueva funcionalidad"

# 2. Push a GitHub
git push origin main

# 3. DigitalOcean automáticamente:
#    - Detecta el push
#    - Ejecuta build
#    - Ejecuta tests
#    - Deploy a producción (si todo pasa)
```

### 9.3 Rollback en Caso de Error
1. En DigitalOcean, ir a **"Activity"**
2. Ver historial de deploys
3. Click en **"Rollback"** en el deploy anterior estable

---

## 💰 Costos Estimados Mensuales

| Recurso | Configuración | Costo Mensual |
|---------|---------------|---------------|
| App Platform | Basic (512 MB RAM) | $5.00 |
| PostgreSQL | Basic (1 GB RAM) | $15.00 |
| Bandwidth | ~100 GB incluido | $0.00 |
| **TOTAL** | | **~$20.00/mes** |

**Escalamiento para producción:**
- App Platform: $12/mes (1 GB RAM)
- PostgreSQL: $30/mes (2 GB RAM)
- **Total**: ~$42/mes

---

## 🆘 Troubleshooting

### Error: "Connection to database failed"
**Solución:**
1. Verificar que `DATABASE_URL` esté correcta
2. Verificar que incluya `?sslmode=require`
3. Verificar que la app esté en "Trusted Sources" de la DB

### Error: "Build failed"
**Solución:**
1. Ver logs de build en **"Activity"**
2. Verificar que `pnpm-lock.yaml` esté en el repo
3. Verificar que todas las dependencias estén en `package.json`

### Error: "App crashes on startup"
**Solución:**
1. Ver **"Runtime Logs"**
2. Verificar que todas las variables de ambiente estén configuradas
3. Verificar que el puerto sea 3000

### WhatsApp no envía mensajes
**Solución:**
1. Verificar que Evolution API esté accesible: `curl http://95.111.240.243:8080`
2. Verificar que `EVOLUTION_API_KEY` sea correcta
3. Ver logs de la app para errores de API

---

## 📞 Soporte

### Contacto
- **Email**: sidneichin@gmail.com
- **GitHub**: https://github.com/sidneichin-collab/odonto-chin-crm-multitenant

### Recursos
- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Drizzle ORM**: https://orm.drizzle.team/
- **tRPC**: https://trpc.io/

---

## ✨ Próximos Pasos Recomendados

1. **Configurar Dominio Personalizado**
   - Comprar dominio (ej: `odontochin.com`)
   - Configurar DNS en DigitalOcean
   - Habilitar SSL automático

2. **Implementar Monitoreo Avanzado**
   - Integrar Sentry para error tracking
   - Configurar Google Analytics
   - Implementar health checks

3. **Optimizar Performance**
   - Configurar CDN para assets estáticos
   - Implementar Redis para caché
   - Optimizar queries de base de datos

4. **Escalar para 68+ Clínicas**
   - Aumentar recursos de la app (2 GB RAM)
   - Aumentar recursos de la DB (4 GB RAM)
   - Configurar load balancing

---

**🎉 ¡Deployment Completado!**

Tu CRM Odonto Chin está ahora en producción en DigitalOcean, listo para gestionar 68+ clínicas odontológicas con todas las funcionalidades implementadas.

**Desarrollado con ❤️ para Odonto Chin**

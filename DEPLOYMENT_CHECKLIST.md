# ✅ Checklist de Deployment - Odonto Chin CRM

## Pre-Deployment

### Código y Repositorio
- [x] Código completo en GitHub: `sidneichin-collab/odonto-chin-crm-multitenant`
- [x] Branch `main` actualizada con últimos cambios
- [x] Todos los tests pasando (8/8)
- [x] Sin errores de TypeScript
- [x] Sin errores de build
- [x] Archivos de deployment creados (.do/app.yaml, Dockerfile)
- [x] Documentación completa (DEPLOY_DIGITALOCEAN.md, QUICK_START.md)

### Credenciales y Accesos
- [x] Cuenta DigitalOcean: oviedoortobomodontologia@gmail.com
- [x] Password DigitalOcean: Odontochincrm26
- [x] Repositorio GitHub accesible
- [x] Evolution API configurada: http://95.111.240.243:8080
- [x] API Key Evolution: OdontoChinSecretKey2026
- [x] N8N Webhook URL configurada

---

## Deployment en DigitalOcean

### Paso 1: Base de Datos PostgreSQL
- [ ] Login en DigitalOcean
- [ ] Crear Database Cluster
  - [ ] Engine: PostgreSQL 14
  - [ ] Region: New York (NYC3)
  - [ ] Size: Basic 1 GB RAM ($15/mes) o 2 GB RAM ($30/mes)
  - [ ] Name: `odonto-chin-db`
- [ ] Esperar hasta que esté "Available"
- [ ] Copiar DATABASE_URL completa
- [ ] Verificar que incluya `?sslmode=require`
- [ ] Configurar "Trusted Sources" → Agregar "All App Platform Apps"
- [ ] Habilitar "Automatic Backups"

### Paso 2: App Platform
- [ ] Ir a Apps → Create App
- [ ] Conectar GitHub repository
  - [ ] Autorizar DigitalOcean en GitHub
  - [ ] Seleccionar: `sidneichin-collab/odonto-chin-crm-multitenant`
  - [ ] Branch: `main`
  - [ ] Autodeploy: ✅ Enabled
- [ ] Configurar Build Settings
  - [ ] Build Command: `pnpm install && pnpm run build`
  - [ ] Run Command: `node server/_core/index.js`
  - [ ] HTTP Port: `3000`
- [ ] Configurar Resources
  - [ ] Instance Size: Basic - $5/mo (512 MB) o $12/mo (1 GB)
  - [ ] Instance Count: 1

### Paso 3: Variables de Ambiente
- [ ] Agregar todas las variables requeridas:
  ```
  DATABASE_URL=postgresql://... (copiar del Paso 1)
  JWT_SECRET=generar-secreto-fuerte-aqui
  EVOLUTION_API_URL=http://95.111.240.243:8080
  EVOLUTION_API_KEY=OdontoChinSecretKey2026
  N8N_WEBHOOK_URL=https://odontochicrmsecretaria.app.n8n.cloud/webhook-test/8eef988c5-64bc-4bf0-8a6b-1eb5af717feb
  NODE_ENV=production
  PORT=3000
  VITE_APP_TITLE=Odonto Chin CRM
  VITE_APP_LOGO=/logo.png
  ```
- [ ] Marcar DATABASE_URL como "Encrypted"
- [ ] Marcar JWT_SECRET como "Encrypted"
- [ ] Generar JWT_SECRET fuerte: `openssl rand -base64 32`

### Paso 4: Vincular Base de Datos
- [ ] En Resources → Add Resource → Database
- [ ] Seleccionar cluster `odonto-chin-db`
- [ ] Verificar vinculación exitosa

### Paso 5: Crear App
- [ ] Revisar configuración completa
- [ ] Verificar costos estimados (~$20-42/mes)
- [ ] Click "Create Resources"
- [ ] Esperar build (5-10 minutos)

---

## Post-Deployment

### Paso 6: Verificar Build
- [ ] Ir a Activity tab
- [ ] Verificar que build sea exitoso
- [ ] Ver Runtime Logs
- [ ] Buscar mensaje: "Server running on http://localhost:3000/"
- [ ] Copiar URL de la app

### Paso 7: Ejecutar Migraciones
- [ ] Abrir Console de la app
- [ ] Ejecutar: `pnpm db:push`
- [ ] Verificar que todas las tablas se crearon:
  - [ ] users
  - [ ] tenants
  - [ ] patients
  - [ ] appointments
  - [ ] waitingList
  - [ ] whatsappMessages
  - [ ] automationLogs
  - [ ] auditLogs

### Paso 8: Crear Super-Admin
- [ ] En Console, ejecutar: `node seed-admin.mjs`
- [ ] Verificar mensaje de éxito
- [ ] Guardar credenciales:
  - Email: admin@odontochin.com
  - Password: Admin123!

---

## Testing en Producción

### Paso 9: Verificación Básica
- [ ] Abrir URL de la app en navegador
- [ ] Verificar que página de login carga
- [ ] Login con super-admin
- [ ] Verificar redirección al dashboard
- [ ] Cambiar password del super-admin

### Paso 10: Testing de Funcionalidades

#### Dashboard
- [ ] Calendario interactivo se muestra correctamente
- [ ] Cards de estadísticas cargan (Citas de Hoy, Confirmadas, Pendientes, Completadas)
- [ ] Navegación por fechas funciona
- [ ] Botón "Hoy" funciona
- [ ] Botón flotante "+" aparece
- [ ] Sección "Citas de Mañana" se muestra

#### Gestión de Pacientes
- [ ] Abrir módulo "Pacientes Activos"
- [ ] Formulario de registro se muestra
- [ ] Crear nuevo paciente funciona
- [ ] Lista de pacientes carga
- [ ] Búsqueda de pacientes funciona
- [ ] Editar paciente funciona
- [ ] Datos se guardan correctamente

#### Agendamientos
- [ ] Abrir módulo "Agendamientos"
- [ ] Kanban de Ortodontia se muestra
- [ ] Kanban de Clínico General se muestra
- [ ] Crear nuevo agendamiento desde botón "+"
- [ ] Crear agendamiento desde Kanban
- [ ] Drag-and-drop entre columnas funciona
- [ ] Cambios de estado se guardan
- [ ] Agendamientos aparecen en dashboard

#### Lista de Espera
- [ ] Abrir módulo "Lista de Espera"
- [ ] Lista se muestra correctamente
- [ ] Agregar paciente a lista funciona
- [ ] Priorización funciona
- [ ] Remover de lista funciona

#### Pacientes en Riesgo
- [ ] Abrir módulo "Pacientes en Riesgo"
- [ ] Alertas se muestran
- [ ] Botón de contacto WhatsApp funciona
- [ ] Marcar como contactado funciona

#### WhatsApp Integration
- [ ] Abrir módulo "Canales WhatsApp"
- [ ] Conexión con Evolution API funciona
- [ ] Enviar mensaje de prueba
- [ ] Verificar que mensaje se envía
- [ ] Historial de mensajes se guarda
- [ ] Ver mensajes enviados

#### Multi-Tenant
- [ ] Crear nuevo tenant desde super-admin
- [ ] Crear usuario admin para el tenant
- [ ] Login con usuario del tenant
- [ ] Verificar que solo ve datos de su tenant
- [ ] Crear paciente en tenant
- [ ] Verificar aislamiento de datos

---

## Seguridad y Configuración

### Paso 11: Configuración de Seguridad
- [ ] Cambiar password de super-admin
- [ ] Verificar que HTTPS esté habilitado
- [ ] Verificar que DATABASE_URL use SSL
- [ ] Verificar rate limiting funciona
- [ ] Revisar logs de seguridad

### Paso 12: Monitoreo
- [ ] Configurar alertas en DigitalOcean:
  - [ ] CPU > 80%
  - [ ] Memory > 80%
  - [ ] Disk > 80%
  - [ ] App crashes
- [ ] Verificar que backups automáticos estén habilitados
- [ ] Configurar notificaciones por email

### Paso 13: Performance
- [ ] Verificar tiempo de carga de dashboard (<2s)
- [ ] Verificar tiempo de respuesta de API (<500ms)
- [ ] Verificar que calendario carga rápido
- [ ] Verificar que Kanban drag-and-drop es fluido

---

## Documentación y Handoff

### Paso 14: Documentación
- [ ] Crear documento con credenciales de producción
- [ ] Documentar URLs de producción:
  - [ ] App URL: _________________
  - [ ] Database URL: _________________
  - [ ] Evolution API: http://95.111.240.243:8080
  - [ ] N8N Webhook: https://odontochicrmsecretaria.app.n8n.cloud/webhook-test/...
- [ ] Documentar credenciales de super-admin
- [ ] Crear guía de usuario para secretarias

### Paso 15: Backup y Rollback
- [ ] Verificar que backups automáticos funcionan
- [ ] Documentar proceso de rollback
- [ ] Crear snapshot de la base de datos
- [ ] Guardar configuración de la app

---

## Escalamiento Futuro

### Para 68+ Clínicas
- [ ] Aumentar recursos de App Platform:
  - [ ] Instance Size: Pro - 2 GB RAM
  - [ ] Instance Count: 2 (load balancing)
- [ ] Aumentar recursos de Database:
  - [ ] Size: 4 GB RAM / 2 vCPU
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar Redis para caché
- [ ] Configurar monitoring avanzado (Sentry, DataDog)

---

## Costos Finales

### Configuración Actual
| Recurso | Configuración | Costo/Mes |
|---------|---------------|-----------|
| App Platform | Basic 512 MB | $5 |
| PostgreSQL | Basic 1 GB | $15 |
| **TOTAL** | | **$20** |

### Configuración Recomendada (Producción)
| Recurso | Configuración | Costo/Mes |
|---------|---------------|-----------|
| App Platform | Basic 1 GB | $12 |
| PostgreSQL | Basic 2 GB | $30 |
| **TOTAL** | | **$42** |

### Configuración Escalada (68+ Clínicas)
| Recurso | Configuración | Costo/Mes |
|---------|---------------|-----------|
| App Platform | Pro 2 GB x2 | $60 |
| PostgreSQL | Basic 4 GB | $60 |
| **TOTAL** | | **$120** |

---

## Contacto y Soporte

**Desarrollador**: Sidnei Chin
**Email**: sidneichin@gmail.com
**GitHub**: https://github.com/sidneichin-collab/odonto-chin-crm-multitenant

**Cliente**: Odonto Chin
**Email**: oviedoortobomodontologia@gmail.com

---

## Notas Finales

- ✅ Sistema completamente funcional en Manus platform
- ✅ Todos los tests pasando (8/8)
- ✅ Sin errores de TypeScript
- ✅ Documentación completa
- ✅ Listo para deployment en DigitalOcean

**Próximo Paso**: Seguir DEPLOY_DIGITALOCEAN.md o QUICK_START.md para deployment

**Fecha de Preparación**: 07 de Febrero de 2026

---

**¡Sistema listo para producción! 🚀**

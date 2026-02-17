# Guía de Configuración del Webhook Evolution API

## Información del Servidor

**Evolution API Server:**
- URL: `http://95.111.240.243:8080`
- Manager: `http://95.111.240.243:8080/manager`
- API Key: `OdontoChinSecretKey2026`

**CRM Webhook Endpoint:**
- URL: `https://[YOUR-CRM-DOMAIN]/api/webhook/evolution`
- Método: `POST`
- Content-Type: `application/json`

---

## Paso 1: Acceder al Manager de Evolution API

1. Abrir navegador y acceder a: `http://95.111.240.243:8080/manager`
2. Iniciar sesión con las credenciales del servidor
3. Navegar a la sección "Instancias" o "Instances"

---

## Paso 2: Configurar Instancia de WhatsApp

### 2.1 Crear Nueva Instancia (si no existe)

```bash
POST http://95.111.240.243:8080/instance/create
Headers:
  apikey: OdontoChinSecretKey2026
  Content-Type: application/json

Body:
{
  "instanceName": "odonto-chin-crm",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}
```

### 2.2 Conectar WhatsApp

1. Generar QR Code:
```bash
GET http://95.111.240.243:8080/instance/connect/odonto-chin-crm
Headers:
  apikey: OdontoChinSecretKey2026
```

2. Escanear el QR Code con WhatsApp (Dispositivos Vinculados)
3. Esperar confirmación de conexión

---

## Paso 3: Configurar Webhook para Mensajes Recibidas

### 3.1 Configurar Webhook via API

```bash
POST http://95.111.240.243:8080/webhook/set/odonto-chin-crm
Headers:
  apikey: OdontoChinSecretKey2026
  Content-Type: application/json

Body:
{
  "url": "https://[YOUR-CRM-DOMAIN]/api/webhook/evolution",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```

### 3.2 Configurar via Manager (Alternativa)

1. En el Manager, seleccionar la instancia `odonto-chin-crm`
2. Ir a "Webhooks" o "Configuración"
3. Ingresar URL del webhook: `https://[YOUR-CRM-DOMAIN]/api/webhook/evolution`
4. Seleccionar eventos:
   - ✅ MESSAGES_UPSERT (mensajes nuevos)
   - ✅ MESSAGES_UPDATE (actualizaciones)
   - ✅ CONNECTION_UPDATE (estado de conexión)
5. Guardar configuración

---

## Paso 4: Verificar Configuración

### 4.1 Verificar Estado de la Instancia

```bash
GET http://95.111.240.243:8080/instance/connectionState/odonto-chin-crm
Headers:
  apikey: OdontoChinSecretKey2026
```

**Respuesta esperada:**
```json
{
  "instance": "odonto-chin-crm",
  "state": "open"
}
```

### 4.2 Verificar Webhook Configurado

```bash
GET http://95.111.240.243:8080/webhook/find/odonto-chin-crm
Headers:
  apikey: OdontoChinSecretKey2026
```

**Respuesta esperada:**
```json
{
  "url": "https://[YOUR-CRM-DOMAIN]/api/webhook/evolution",
  "enabled": true,
  "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"]
}
```

---

## Paso 5: Probar Envío y Recepción

### 5.1 Enviar Mensaje de Prueba

```bash
POST http://95.111.240.243:8080/message/sendText/odonto-chin-crm
Headers:
  apikey: OdontoChinSecretKey2026
  Content-Type: application/json

Body:
{
  "number": "5491112345678",
  "text": "Hola! Este es un mensaje de prueba del CRM Odonto Chin."
}
```

### 5.2 Responder desde WhatsApp

1. Desde el teléfono vinculado, responder al mensaje con: **"Sí"**
2. Verificar en los logs del CRM que el webhook recibió el mensaje
3. Verificar que el sistema detectó la confirmación

### 5.3 Verificar Logs del CRM

```bash
# En el servidor del CRM
tail -f .manus-logs/devserver.log | grep "Webhook"
```

**Log esperado:**
```
[2026-02-16T00:00:00.000Z] [Webhook] Received message from 5491112345678: "Sí"
[2026-02-16T00:00:00.100Z] [Confirmation] Detected confirmation for appointment
[2026-02-16T00:00:00.200Z] [Database] Updated appointment status to 'Confirmada'
```

---

## Formato de Mensajes Recibidas (Webhook Payload)

El CRM espera recibir mensajes en el siguiente formato:

```json
{
  "event": "messages.upsert",
  "instance": "odonto-chin-crm",
  "data": {
    "key": {
      "remoteJid": "5491112345678@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "message": {
      "conversation": "Sí"
    },
    "messageTimestamp": "1708041600",
    "pushName": "Juan Pérez"
  }
}
```

---

## Troubleshooting

### Problema: Webhook no recibe mensajes

**Solución:**
1. Verificar que la URL del webhook es accesible públicamente
2. Verificar que el firewall permite conexiones desde 95.111.240.243
3. Revisar logs del Evolution API: `docker logs evolution-api`
4. Verificar que los eventos están correctamente configurados

### Problema: Mensajes no se detectan como confirmación

**Solución:**
1. Verificar que el mensaje contiene palabras clave: "sí", "si", "yes", "confirmo", etc.
2. Revisar logs del CRM en `.manus-logs/devserver.log`
3. Ejecutar test de detección:
```bash
cd /home/ubuntu/odonto-chin-dashboard
pnpm test confirmationDetector.test.ts
```

### Problema: Instancia desconectada

**Solución:**
1. Verificar estado de conexión:
```bash
GET http://95.111.240.243:8080/instance/connectionState/odonto-chin-crm
```

2. Reconectar si es necesario:
```bash
GET http://95.111.240.243:8080/instance/connect/odonto-chin-crm
```

3. Escanear nuevo QR Code si se solicita

### Problema: API Key inválida

**Solución:**
1. Verificar que el API Key es correcto: `OdontoChinSecretKey2026`
2. Verificar que el header es: `apikey: OdontoChinSecretKey2026` (no `Authorization`)
3. Verificar configuración del Evolution API en el servidor

---

## Monitoreo y Mantenimiento

### Verificar Salud del Sistema (Diario)

```bash
# 1. Estado de la instancia
curl -H "apikey: OdontoChinSecretKey2026" \
  http://95.111.240.243:8080/instance/connectionState/odonto-chin-crm

# 2. Verificar webhook configurado
curl -H "apikey: OdontoChinSecretKey2026" \
  http://95.111.240.243:8080/webhook/find/odonto-chin-crm

# 3. Verificar logs del CRM
tail -100 /home/ubuntu/odonto-chin-dashboard/.manus-logs/devserver.log
```

### Reiniciar Instancia (si es necesario)

```bash
# Desconectar
curl -X DELETE -H "apikey: OdontoChinSecretKey2026" \
  http://95.111.240.243:8080/instance/logout/odonto-chin-crm

# Reconectar
curl -H "apikey: OdontoChinSecretKey2026" \
  http://95.111.240.243:8080/instance/connect/odonto-chin-crm
```

---

## Seguridad

1. **Nunca exponer el API Key** en código frontend o repositorios públicos
2. **Usar HTTPS** para el webhook endpoint en producción
3. **Validar firma del webhook** (si Evolution API lo soporta)
4. **Limitar IPs** que pueden acceder al webhook (whitelist 95.111.240.243)
5. **Rotar API Key** periódicamente (cada 3-6 meses)

---

## Documentación Oficial

- Evolution API Docs: https://doc.evolution-api.com
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

---

## Contacto de Soporte

- Email: oviedoortobomodontologia@gmail.com
- Servidor VPS: root@95.111.240.243

---

**Última actualización:** 16 de febrero de 2026

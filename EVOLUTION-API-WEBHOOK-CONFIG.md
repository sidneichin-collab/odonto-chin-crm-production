# Configuração do Webhook Evolution API

## 📋 Informações do Servidor

**Evolution API:**
- URL: `http://95.111.240.243:8080`
- API Key: `OdontoChinSecretKey2026`
- Status: ✅ Servidor já configurado

**CRM Webhook Endpoint:**
- URL: `https://[SEU-DOMINIO-CRM]/api/webhook/evolution`
- Método: `POST`
- Content-Type: `application/json`

---

## 🔧 Passo 1: Acessar Evolution API Manager

1. Abra o navegador e acesse: `http://95.111.240.243:8080/manager`
2. Faça login com as credenciais do administrador

---

## 🔧 Passo 2: Configurar Webhook na Instância

### Via Interface Web:

1. Navegue para **Instâncias** no menu lateral
2. Selecione sua instância WhatsApp
3. Clique em **Configurações** ou **Webhooks**
4. Configure os seguintes campos:

**Webhook URL:**
```
https://[SEU-DOMINIO-CRM]/api/webhook/evolution
```

**Eventos para escutar:**
- ✅ `messages.upsert` (mensagens recebidas)
- ✅ `messages.update` (atualizações de mensagens)

**Headers (opcional):**
```json
{
  "x-api-key": "OdontoChinSecretKey2026"
}
```

5. Clique em **Salvar** ou **Ativar Webhook**

---

### Via API (Alternativa):

Se preferir configurar via API, use este comando:

```bash
curl -X POST http://95.111.240.243:8080/webhook/set \
  -H "Content-Type: application/json" \
  -H "apikey: OdontoChinSecretKey2026" \
  -d '{
    "webhook": {
      "url": "https://[SEU-DOMINIO-CRM]/api/webhook/evolution",
      "events": ["messages.upsert", "messages.update"],
      "webhook_by_events": false
    }
  }'
```

---

## 🔧 Passo 3: Testar Webhook

### Teste Manual:

1. Envie uma mensagem de teste para o número WhatsApp conectado
2. Verifique os logs do CRM:

```bash
# No servidor do CRM
tail -f /home/ubuntu/odonto-chin-dashboard/.manus-logs/devserver.log | grep "EvolutionWebhook"
```

3. Você deve ver algo como:
```
[EvolutionWebhook] Received: { event: 'messages.upsert', ... }
[EvolutionWebhook] Processing message from 5551999999999: "Sí"
[ConfirmationDetector] ✅ Appointment 123 confirmed!
```

---

## 📊 Estrutura do Payload

O Evolution API envia payloads neste formato:

```json
{
  "event": "messages.upsert",
  "instance": "odonto-chin-instance",
  "data": {
    "key": {
      "remoteJid": "5551999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "pushName": "João Silva",
    "message": {
      "conversation": "Sí"
    },
    "messageType": "conversation",
    "messageTimestamp": 1708041600
  }
}
```

---

## ✅ Validação

Após configurar, teste enviando estas mensagens:

1. **Confirmação:** "Sí" ou "Si" ou "Confirmo"
   - ✅ Deve mover agendamento para "Confirmada"
   - ✅ Deve parar envio de recordatorios

2. **Reagendamento:** "No puedo" ou "Reagendar"
   - ✅ Deve enviar resposta automática ao paciente
   - ✅ Deve notificar WhatsApp corporativo
   - ✅ Deve mostrar popup sonoro no dashboard

---

## 🔍 Troubleshooting

### Webhook não está recebendo mensagens:

1. Verifique se o webhook está ativo:
```bash
curl -X GET http://95.111.240.243:8080/webhook/find \
  -H "apikey: OdontoChinSecretKey2026"
```

2. Verifique se a URL está acessível:
```bash
curl -X POST https://[SEU-DOMINIO-CRM]/api/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

3. Verifique logs do Evolution API:
```bash
ssh root@95.111.240.243
docker logs evolution-api -f
```

### Mensagens não estão sendo detectadas:

1. Verifique logs do CRM
2. Teste padrões regex manualmente
3. Verifique se o telefone do paciente está cadastrado no CRM

---

## 📝 Notas Importantes

- ✅ Webhook já está implementado no CRM
- ✅ Detecção de confirmação e reagendamento funcionando
- ✅ Scheduler automático rodando a cada hora
- ⚠️ Certifique-se de que o domínio do CRM está acessível publicamente
- ⚠️ Use HTTPS para segurança (Evolution API aceita HTTP para testes)

---

## 🔐 Segurança

**Recomendações:**

1. Use HTTPS no webhook endpoint
2. Valide o API key nos headers
3. Implemente rate limiting
4. Monitore logs para atividades suspeitas

---

## 📞 Suporte

Em caso de problemas:
- Logs do CRM: `/home/ubuntu/odonto-chin-dashboard/.manus-logs/`
- Logs do Evolution API: `docker logs evolution-api`
- Documentação Evolution API: https://doc.evolution-api.com/

# 🚀 Odonto Chin CRM - Guia de Produção

## 📋 Resumo

Este é o **Odonto Chin CRM**, um sistema de gestão completo para clínicas odontológicas com suporte a múltiplas clínicas, integração com WhatsApp e agendamento automático.

**Status**: ✅ Pronto para produção

## 🎯 Funcionalidades

- ✅ Autenticação segura com JWT
- ✅ Gestão de pacientes
- ✅ Agendamento de consultas
- ✅ Integração com WhatsApp (Evolution API)
- ✅ Alertas automáticos
- ✅ Dashboard administrativo
- ✅ Suporte a múltiplas clínicas
- ✅ Backup automático
- ✅ SSL/HTTPS

## 🔐 Credenciais de Acesso

**Usuário Admin:**
- Email: `admin@odontochin.com`
- Senha: `Admin@2026`

⚠️ **IMPORTANTE**: Altere a senha do admin imediatamente após o primeiro acesso!

## 🚀 Deploy Rápido

### Opção 1: DigitalOcean App Platform (Recomendado)

1. Acesse https://cloud.digitalocean.com/apps
2. Clique em "Create App"
3. Selecione GitHub como source
4. Autorize e selecione este repositório
5. Cole o conteúdo do arquivo `app.yaml`
6. Configure as variáveis de ambiente (veja `DEPLOYMENT_GUIDE.md`)
7. Clique em "Deploy"

### Opção 2: Docker Compose Local

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Opção 3: Manual

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
export DATABASE_URL="mysql://root:root@localhost:3306/odonto_chin_crm"
pnpm db:push

# Iniciar servidor
NODE_ENV=production JWT_SECRET="seu-secret-aqui" pnpm run dev
```

## 📚 Documentação

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guia detalhado de deploy
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Checklist pré-produção
- **[TODO-ANALYSIS.md](./TODO-ANALYSIS.md)** - Análise de funcionalidades
- **[QUICK-START.md](./QUICK-START.md)** - Guia rápido

## 🛠️ Stack Tecnológico

- **Frontend**: React + TypeScript + TailwindCSS + Vite
- **Backend**: Express + tRPC + TypeScript
- **Database**: MySQL 8.0 + Drizzle ORM
- **Auth**: JWT + Manus OAuth
- **Deployment**: Docker + DigitalOcean App Platform
- **CI/CD**: GitHub Actions

## 📞 Suporte

Para suporte, entre em contato com: **oviedoortobomodontologia@gmail.com**

## 📝 Licença

Propriedade de Ortobom Odontologia

---

**Última atualização**: Fevereiro 2026

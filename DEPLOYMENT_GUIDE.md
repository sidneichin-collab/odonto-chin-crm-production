# 🚀 Guia de Deploy - Odonto Chin CRM

## Pré-requisitos

1. **Conta DigitalOcean** com acesso a App Platform
2. **GitHub** com o repositório do projeto
3. **Domínio** (opcional - usaremos `odontochin-crm.app`)

## Passo 1: Preparar o Repositório GitHub

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/odonto-chin-crm.git
cd odonto-chin-crm

# Adicionar arquivos de produção
git add .env.production Dockerfile.prod docker-compose.prod.yml app.yaml .github/workflows/deploy.yml
git commit -m "Add production deployment configuration"
git push origin main
```

## Passo 2: Criar App no DigitalOcean

1. Acesse https://cloud.digitalocean.com/apps
2. Clique em "Create App"
3. Selecione "GitHub" como source
4. Autorize e selecione o repositório `odonto-chin-crm`
5. Selecione a branch `main`
6. Cole o conteúdo do arquivo `app.yaml` na configuração

## Passo 3: Configurar Variáveis de Ambiente

No DigitalOcean App Platform, adicione as seguintes variáveis:

```
NODE_ENV=production
JWT_SECRET=odonto-chin-jwt-secret-key-2026-super-secure-production
OAUTH_SERVER_URL=https://odontochin-crm.app
DATABASE_URL=mysql://root:${DB_PASSWORD}@db:3306/odonto_chin_crm
ADMIN_EMAIL=oviedoortobomodontologia@gmail.com
EVOLUTION_API_URL=http://95.111.240.243:8080
EVOLUTION_API_KEY=OdontoChinSecretKey2026
```

## Passo 4: Configurar Banco de Dados

1. No DigitalOcean, crie um MySQL Database Cluster
2. Configure o backup automático (diário)
3. Configure a replicação para alta disponibilidade
4. Atualize a `DATABASE_URL` com as credenciais corretas

## Passo 5: Deploy

1. Clique em "Deploy" no DigitalOcean
2. Aguarde o build e deploy (5-10 minutos)
3. Acesse https://odontochin-crm.app

## Passo 6: Configurar Domínio Customizado

1. Adicione um novo domínio no DigitalOcean
2. Configure os DNS records apontando para o App
3. Ative SSL automático

## Monitoramento

- **Logs**: Acesse em App > Logs
- **Métricas**: Acesse em App > Metrics
- **Alertas**: Configure em App > Alerts

## Backup e Recuperação

Backups automáticos são realizados diariamente às 2:00 AM UTC.

Para restaurar:
```bash
# Conectar ao banco de dados
mysql -h db-host -u root -p odonto_chin_crm < backup.sql
```

## Scaling

Para aumentar a capacidade:

1. Aumente o tamanho da instância do App
2. Aumente o tamanho do banco de dados
3. Configure auto-scaling (opcional)

## Troubleshooting

### Erro de conexão com banco de dados
- Verifique a `DATABASE_URL`
- Verifique se o banco está rodando
- Verifique firewall rules

### Erro 502 Bad Gateway
- Verifique os logs do app
- Reinicie o app
- Verifique a saúde do banco de dados

### Lentidão
- Verifique CPU/Memory usage
- Otimize queries do banco
- Aumente o tamanho da instância

## Suporte

Para suporte, entre em contato com: oviedoortobomodontologia@gmail.com

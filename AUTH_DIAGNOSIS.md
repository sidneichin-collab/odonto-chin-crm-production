# Diagnóstico do Problema de Autenticação - Odonto Chin CRM

## Problema Identificado

Ao tentar fazer login com as credenciais `admin@odontochin.com / Admin@2026`, o sistema retorna:
```
Error al iniciar sesión: undefined
```

## Análise do Código

### 1. Fluxo de Autenticação
- **Rota de Login**: `/api/trpc` (mutation `login`)
- **Arquivo**: `server/routers.ts` (linhas 67-145)

### 2. Problemas Encontrados

#### Problema 1: Usuário não existe no banco de dados
- A função `getUserByEmail()` procura o usuário por email na tabela `users`
- Se o usuário não for encontrado, retorna `undefined`
- O erro "undefined" é lançado como `TRPCError` com código `UNAUTHORIZED`

#### Problema 2: Campo `passwordHash` não preenchido
- O usuário admin pode existir, mas sem `passwordHash` configurado
- O código verifica: `if (!user.passwordHash)` e retorna erro
- Mensagem: "Este usuário não possui senha configurada. Use login com Google."

#### Problema 3: Status da conta
- A tabela `users` tem um campo `accountStatus` com valores:
  - `pending` (padrão)
  - `approved`
  - `rejected`
  - `suspended`
- O código verifica o status e bloqueia login se não for `approved`

#### Problema 4: Erro genérico no frontend
- O erro "undefined" sugere que a resposta do servidor não está sendo tratada corretamente
- Pode ser um erro de serialização do erro tRPC

## Soluções Necessárias

1. **Criar/Atualizar usuário admin no banco de dados com:**
   - Email: `admin@odontochin.com`
   - Senha hash: hash de `Admin@2026`
   - Status: `approved`
   - Role: `admin`

2. **Verificar se o banco de dados está inicializado**
   - Executar migrations
   - Seed do banco com dados iniciais

3. **Melhorar tratamento de erros no frontend**
   - Extrair mensagem de erro corretamente
   - Exibir mensagem específica ao usuário

## Próximos Passos

1. Verificar se o banco de dados está conectado
2. Criar script para seed do usuário admin
3. Testar autenticação novamente

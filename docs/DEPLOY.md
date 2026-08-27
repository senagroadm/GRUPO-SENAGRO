# 🚀 GUIA OFICIAL DE DEPLOY & PROVISIONAMENTO EM PRODUÇÃO (V1)
## SISTEMA NEXUS ERP — GRUPO TRITECH (5 CNPJs)

**Versão do Documento:** 1.0.0  
**Ambiente Alvo:** Produção (Cloud Run / VPS / Cluster Kubernetes) + PostgreSQL 16 com RLS + Redis 7  
**Nível de Confidencialidade:** Interno / Operações de Engenharia  

---

### 1. ARQUITETURA DE IMPLANTAÇÃO

O NEXUS ERP opera em arquitetura desacoplada de alto desempenho, orientada a microprocessos conteinerizados e segurança multi-tenant:

```
[ Usuários / Operadores Fabris ]
              │ (HTTPS / TLS 1.3 - Porta 443)
              ▼
    [ Cloudflare / Reverse Proxy ]
              │ (Rate Limit: 100 req/min por IP + WAF)
              ▼
   [ Gateway / Applet Container (Port 3000) ]
        ├── Next.js App Router (Frontend SSR/Client)
        └── Node.js Backend API Routes (/api/*)
              │
      ┌───────┴────────────────────────┐
      ▼                                ▼
[ PostgreSQL 16 (RLS Ativo) ]    [ Redis Cluster (BullMQ) ]
  • Pooling via pgBouncer          • Filas de Mensageria & Jobs
  • WAL Archiving (PITR)           • Cache de Sessão & Locks
  • Storage WORM para Auditoria    • Rate Limiting Distribuído
```

---

### 2. PRÉ-REQUISITOS & MATRIZ DE VARIÁVEIS DE AMBIENTE (`.env.production`)

Antes de iniciar o deploy, valide se todas as variáveis estão devidamente provisionadas no gerenciador de segredos da nuvem (GCP Secret Manager / Vault). **Nunca insira segredos em texto puro no repositório.**

| Variável | Descrição / Exemplo | Obrigatório |
| :--- | :--- | :---: |
| `NODE_ENV` | `production` | Sim |
| `PORT` | `3000` (porta padrão obrigatória de runtime) | Sim |
| `DATABASE_URL` | `postgres://nexus_prod_user:<PASSWORD>@postgres-pool.tritech.internal:5432/nexus_erp_prod?sslmode=require` | Sim |
| `DATABASE_DIRECT_URL` | `postgres://nexus_prod_admin:<PASSWORD>@postgres-primary.tritech.internal:5432/nexus_erp_prod?sslmode=require` | Sim (Migrations) |
| `REDIS_URL` | `rediss://default:<PASSWORD>@redis.tritech.internal:6379` | Sim |
| `JWT_SECRET` | Chave RSA-4096 / HMAC-SHA256 de alta entropia (mínimo 64 caracteres) | Sim |
| `GEMINI_API_KEY` | Chave server-side para recursos da Tritech AI Bridge | Sim |
| `STORAGE_WORM_ENDPOINT` | Endpoint compatível S3 com Object Lock ativado para logs de auditoria e NF-e | Sim |
| `STORAGE_BUCKET_NAME` | `nexus-erp-production-worm-vault` | Sim |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Provedor transacional corporativo (SendGrid / AWS SES) | Sim |
| `SEFAZ_ENVIRONMENT` | `PRODUCAO` ou `HOMOLOGACAO` (para certificados dos 5 CNPJs) | Sim |

---

### 3. PROVISIONAMENTO DO BANCO DE DADOS & SEGURANÇA MULTI-TENANT

#### 3.1. Validação do PostgreSQL & Row Level Security (RLS)
Execute a inicialização das extensões necessárias com o usuário DBA:

```sql
-- Conectar como superusuário de banco
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Validar usuário de aplicação (sem privilégios DDL)
CREATE USER nexus_prod_user WITH PASSWORD '<STRONG_PASSWORD>';
GRANT CONNECT ON DATABASE nexus_erp_prod TO nexus_prod_user;
GRANT USAGE ON SCHEMA public TO nexus_prod_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO nexus_prod_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_prod_user;

-- Revogar permissões perigosas (Não-Destrutivo)
REVOKE DELETE, TRUNCATE, DROP ON ALL TABLES IN SCHEMA public FROM nexus_prod_user;
```

#### 3.2. Regra Crítica: Execução de Migrations Não-Destrutivas
> ⚠️ **REGRA DE SEGURANÇA:** É terminantemente proibido executar `drizzle-kit push --force` ou migrações que removam tabelas/colunas na produção.

1. **Gerar Snapshot de Backup Imediato:**
   ```bash
   pg_dump -h postgres-primary.tritech.internal -U nexus_prod_admin -d nexus_erp_prod -F c -b -v -f /backups/pre-deploy-$(date +%Y%m%d%H%M%S).dump
   ```
2. **Aplicar Migrações Incrementais:**
   ```bash
   npm run db:migrate:prod
   ```
3. **Verificar Integridade do Schema:**
   ```bash
   npm run db:validate-integrity
   ```

---

### 4. CRIAÇÃO DO ADMINISTRADOR INICIAL & EMPRESAS BASE (SEED SEGURO)

A inicialização do primeiro usuário mestre e dos 5 CNPJs é realizada via script transacional idempotente que não sobrepõe registros existentes:

```bash
# Executar o seed de bootstrap com credenciais temporárias obrigatórias para troca no primeiro login
npm run db:seed:production-bootstrap
```

**Dados Estruturados Criados pelo Bootstrap:**
- **Empresas do Grupo:** MWAM (01), Tritech Indústria (02), Metalúrgica Regional (03), Tritech Serviços (04), Tritech Participações (05).
- **Perfis de Acesso:** `SUPER_ADMIN_GRUPO`, `DIRETOR_INDUSTRIAL`, `GERENTE_PCP`, `OPERADOR_CHAO_FABRICA`, `AUDITOR_FISCAL`, `DPO_LGPD`.
- **Admin Inicial:** `admin.mestre@tritech.ind.br` com exigência imediata de 2FA (TOTP) e troca de senha no primeiro acesso.

---

### 5. PROCESSO DE COMPILAÇÃO E DISPARO DO CONTAINER

1. **Instalação das Dependências:**
   ```bash
   npm ci --only=production
   ```
2. **Build da Aplicação:**
   ```bash
   npm run build
   ```
3. **Inicialização do Serviço:**
   ```bash
   npm run start
   ```

---

### 6. SMOKE TESTS PÓS-DEPLOY IMEDIATO (VALIDAÇÃO AUTOMÁTICA)

Imediatamente após o tráfego atingir o novo container, a esteira de CI/CD deve executar a suíte de Smoke Tests:

- [ ] **Health Probe:** `GET /api/health/ready` retorna `HTTP 200 OK` com status do banco e redis.
- [ ] **Isolamento de Tenant:** `GET /api/v1/auditoria?empresa_id=01` não retorna nenhum log de outra empresa.
- [ ] **Mascaramento LGPD:** `GET /api/v1/clientes` retorna CPFs no formato `***.***.***-XX` para sessões sem papel de DPO.
- [ ] **Conexão com Storage WORM:** Gravação de arquivo de teste e validação de retenção imutável.

# NEXUS ERP — Esqueleto Executável do Sistema Industrial Multiempresa

Sistema Integrado de Gestão Empresarial (ERP) Multiempresa (5 CNPJs) desenvolvido com **React + TypeScript** no frontend, **Node.js + TypeScript** no backend e **PostgreSQL 16** com **Drizzle ORM**.

---

## 🏛️ Arquitetura e Estrutura de Diretórios

```text
.
├── app/                  # Rotas Next.js App Router (Páginas e /api/v1/*)
├── backend/              # Core do Backend (Ports & Adapters, Config, Logger, Erros, DB)
│   ├── config/           # Parser de ambiente com validação Zod (env.ts)
│   ├── core/             # Logger estruturado, erros RFC 7807, paginação, middlewares
│   ├── db/               # PostgreSQL Pool, Drizzle ORM client e schemas tipados
│   ├── modules/          # Registro dos 20 módulos do ERP
│   └── ports/            # Portas Hexagonais (Fiscal, Banking CNAB, Serasa, Storage)
├── frontend/             # Código do Frontend (Cliente de API tipado, Hooks, Componentes)
│   └── src/
│       ├── api/          # Cliente HTTP com injeção automática de headers e tenant
│       ├── components/   # Componentes modulares (HealthStatusCard, ApiInspector, etc.)
│       ├── hooks/        # React Hooks (useHealth, useTenant)
│       └── types/        # Tipos de resposta, paginação e autenticação
├── database/             # DDL e scripts de banco de dados
├── migrations/           # Migrations versionadas em SQL (0001, 0002, 0003, 0004)
├── tests/                # Suíte de testes unitários e de integração (Vitest)
│   ├── unit/             # Testes de logger, erros, paginação, auth, request-id, tenant
│   └── integration/      # Testes de rotas /api/v1/health, /api/v1/auth/me, /api/v1/companies
├── docs/                 # Documentações técnicas e especificações de integração
├── scripts/              # Scripts utilitários de CLI (migrate, seed, health-check)
├── Dockerfile            # Container multi-stage para produção
├── Dockerfile.dev        # Container para ambiente de desenvolvimento
├── docker-compose.yml    # Orquestração de produção com PostgreSQL 16
├── docker-compose.dev.yml# Orquestração de desenvolvimento com hot-reload
└── .env.example          # Modelo de variáveis de ambiente sem credenciais expostas
```

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js 20+
- PostgreSQL 16 (ou via Docker Compose)

### 2. Instalação e Configuração
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
```

### 3. Execução com Docker Compose (Recomendado)
```bash
# Iniciar banco de dados PostgreSQL e aplicação em modo dev
docker-compose -f docker-compose.dev.yml up -d

# Para produção
docker-compose up --build -d
```

### 4. Execução Local dos Scripts
```bash
# Executar migrations no banco de dados
npm run db:migrate

# Executar seeds iniciais (5 empresas do grupo + superadmin)
npm run db:seed

# Verificar integridade da infraestrutura via CLI
npm run health:check

# Iniciar servidor de desenvolvimento
npm run dev
```

---

## 🧪 Testes e Qualidade de Código

```bash
# Executar todos os testes unitários e de integração
npm run test

# Executar linter ESLint
npm run lint

# Validar compilação do Backend (TypeScript)
npm run build:backend

# Validar compilação do Frontend (Next.js)
npm run build:frontend
```

---

## 📡 Endpoints Base Disponíveis (`/api/v1/*`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/health` | Status de saúde da infraestrutura, latência do PostgreSQL, uptime e memória |
| `GET` | `/api/v1/auth/me` | Resolução do usuário ativo, empresas autorizadas e tenant selecionado |
| `GET` | `/api/v1/companies` | Listagem paginada e filtrada das empresas do grupo |

---

## 🔒 Segurança e Tenant Isolation

- **Request ID & Correlation ID**: Todo request recebe ou gera `x-request-id` e `x-correlation-id` retornados nos headers de resposta.
- **Tenant Context (`x-empresa-id`)**: Validação em middleware garantindo que nenhum usuário opere sobre um CNPJ para o qual não possui permissão explícita.
- **Auditoria Append-Only**: Tabela imutável `audit_logs` registrando estado anterior e novo de alterações.

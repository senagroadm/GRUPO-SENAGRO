# Núcleo Multiempresa & Governança Multi-Tenant
## ERP Industrial Multiempresa (MWAM, Oliveira & Amorim, Senagro, Tritech Corte, Tritech Ind)

Este documento descreve a arquitetura, as regras de negócio, o modelo de isolamento de dados e as operações do núcleo multiempresa da plataforma.

---

## 1. Visão Geral da Arquitetura

O sistema adota o modelo **Shared Database, Shared Schema com Discriminação por Coluna (`empresa_id`) e Validação Estrita em Camadas no Backend**.

```
                           ┌───────────────────────────┐
                           │   Cliente (UI Next.js)    │
                           └─────────────┬─────────────┘
                                         │  (JWT / Session + empresa_id)
                                         ▼
                     ┌───────────────────────────────────────┐
                     │    API Gateway & Auth Middleware      │
                     │  - resolveTenantContext               │
                     │  - enforceTenantAccess                │
                     │  - enforcePermission (RBAC)           │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │        Multi-Tenant Services          │
                     │  - companyService (CNPJ Modulo 11)    │
                     │  - userService (Vínculos e Perfis)    │
                     │  - tenantContextService (Auditoria)   │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ PostgreSQL / Supabase Multiempresa    │
                     │  - empresas (CNPJ UNIQUE)             │
                     │  - usuarios                           │
                     │  - perfis / permissoes                │
                     │  - usuario_empresas                   │
                     │  - empresa_context_audit_logs         │
                     │  - Tabelas de Negócio (empresa_id FK) │
                     └───────────────────────────────────────┘
```

---

## 2. As 7 Regras Fundamentais do Núcleo Multiempresa

1. **CNPJ Único com Validação Módulo 11**:
   - Cada empresa registrada deve possuir um CNPJ brasileiro válido (14 dígitos).
   - O algoritmo Módulo 11 é executado antes de qualquer inserção ou alteração.
   - O campo `cnpj` possui restrição `UNIQUE` no banco de dados e bloqueio prévio em memória.

2. **Transacionalidade Obrigatória com `empresa_id`**:
   - Todas as tabelas de negócio (pedidos, produção, estoque, notas fiscais, contas a pagar/receber) possuem a coluna `empresa_id UUID NOT NULL REFERENCES empresas(id)`.
   - Nenhuma transação pode ser gravada sem a referência do tenant proprietário.

3. **Backend-Authoritative (Nunca confiar no Frontend)**:
   - O backend nunca aceita cegamente o `empresa_id` enviado em requisições de clientes sem antes validar se o usuário autenticado possui vínculo ativo com aquele tenant.

4. **Isolamento Estrito de Leitura e Escrita**:
   - Usuários sem vínculo com a empresa `X` são categoricamente impedidos de ler, criar, editar ou excluir registros dessa empresa.
   - Tentativas não autorizadas disparam exceções `TenantMismatchError` e registram alertas de segurança.

5. **Visão GRUPO e Alternância Autorizada**:
   - Usuários do perfil corporativo (ex: Diretoria, Controladoria, SuperAdmin) têm permissão de acesso a múltiplas ou a todas as empresas do grupo.
   - O usuário pode alternar seu contexto operacional a qualquer momento através do seletor global de empresas ou da API `/api/v1/auth/switch-empresa`.

6. **Auditoria Obrigatória de Troca de Contexto**:
   - Toda alternância de empresa é gravada na tabela `empresa_context_audit_logs` contendo:
     - `usuario_id`, `empresa_origem_id`, `empresa_destino_id`, `motivo`, `ip_origem`, `user_agent`, `correlation_id` e `criado_em`.

7. **Suporte Nativo a Novos CNPJs e Expansão**:
   - O sistema está preparado para receber novas filiais, plantas industriais e CNPJs adicionais sem necessidade de reestruturação do banco de dados ou paradas no ambiente.

---

## 3. Seed Inicial das 5 Empresas do Grupo

| Código | Razão Social | Nome Fantasia | CNPJ | Regime Tributário | Tipo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MWAM** | MWAM Engenharia e Serviços Industrial Ltda | MWAM Engenharia | `44.566.045/0001-01` | Lucro Presumido | Matriz |
| **OLIVEIRA_AMORIM** | Oliveira e Amorim Distribuição Ltda | Oliveira & Amorim Distribuição | `26.200.037/0001-57` | Lucro Real | Filial |
| **SENAGRO** | Senagro Indústria e Comércio Ltda | Senagro Indústria | `23.280.366/0001-67` | Lucro Real | Filial |
| **TRITECH_CORTE** | Tritech Corte Dobra e Fabricação Ltda | Tritech Corte & Dobra | `48.082.502/0001-35` | Lucro Real | Filial |
| **TRITECH_IND** | Tritech Industrial Ltda | Tritech Industrial | `64.036.495/0001-91` | Lucro Real | Filial |

---

## 4. Estrutura de Tabelas & Migrations

As migrações SQL completas estão disponíveis em:
- `backend/db/migrations/001_multi_tenant_core.sql` (Criação de tabelas, índices e restrições)
- `backend/db/migrations/002_seed_initial_data.sql` (Carga inicial das 5 empresas, perfis e usuários)

### DDL Resumido

```sql
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    regime_tributario VARCHAR(50) NOT NULL,
    ramo_atividade TEXT NOT NULL,
    is_matriz BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14),
    cargo VARCHAR(100),
    senha_hash VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
    padrao BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usuario_empresa UNIQUE (usuario_id, empresa_id)
);

CREATE TABLE empresa_context_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    empresa_origem_id UUID REFERENCES empresas(id),
    empresa_destino_id UUID NOT NULL REFERENCES empresas(id),
    motivo VARCHAR(255),
    ip_origem VARCHAR(45),
    user_agent TEXT,
    correlation_id VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Endpoints Administrativos & APIs

| Método | Rota | Descrição | Permissão |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/empresas` | Lista empresas com filtros (`search`, `regime`, `ativo`) | Administrador / SuperAdmin |
| `POST` | `/api/v1/admin/empresas` | Cadastra nova empresa (Valida CNPJ e Unicidade) | Administrador / SuperAdmin |
| `GET` | `/api/v1/admin/empresas/:id` | Obtém detalhes da empresa | Usuário Vinculado / Admin |
| `PUT` | `/api/v1/admin/empresas/:id` | Atualiza dados cadastrais | Administrador / SuperAdmin |
| `DELETE` | `/api/v1/admin/empresas/:id` | Ativa/Inativa empresa (Soft Toggle) | Administrador / SuperAdmin |
| `GET` | `/api/v1/admin/usuarios` | Lista usuários e vínculos multiempresa | Administrador / SuperAdmin |
| `POST` | `/api/v1/admin/usuarios` | Cadastra novo usuário e vincula empresas | Administrador / SuperAdmin |
| `PUT` | `/api/v1/admin/usuarios/:id` | Atualiza dados e vínculos do usuário | Administrador / SuperAdmin |
| `DELETE` | `/api/v1/admin/usuarios/:id` | Ativa/Inativa usuário | Administrador / SuperAdmin |
| `GET` | `/api/v1/admin/perfis` | Lista perfis e catálogo de permissões RBAC | Administrador / SuperAdmin |
| `POST` | `/api/v1/auth/switch-empresa` | Alterna empresa ativa e gera log de auditoria | Usuário com Vínculo / Grupo |
| `GET` | `/api/v1/auth/session` | Obtém contexto da sessão e empresas autorizadas | Autenticado |
| `GET` | `/api/v1/admin/audit-context` | Lista trilha de auditoria de trocas de contexto | Administrador / Auditor |
| `POST` | `/api/v1/admin/tests/run` | Executa a suíte de testes de isolamento | Desenvolvedor / Admin |

---

## 6. Testes de Isolamento & Tentativas de Violação

A suíte em `backend/tests/multi_tenant_isolation.test.ts` executa validações automatizadas:

1. **Validação Módulo 11**: Garante que CNPJs corrompidos não passam.
2. **Rejeição de CNPJ Duplicado**: Garante que o sistema impede conflito de registros.
3. **Tentativa de Acesso Não Autorizado (Expected Failure)**:
   - Usuário `José Senagro` (autorizado apenas em Senagro) tenta acessar a empresa `MWAM`.
   - O backend intercepta e dispara `TenantMismatchError (403/Forbidden)`.
4. **Tentativa de Forçar Switch Não Autorizado (Expected Failure)**:
   - Usuário sem vínculo tenta invocar `/api/v1/auth/switch-empresa` apontando para outra empresa.
   - O backend rejeita e não altera a sessão ativa.
5. **Alternância Válida no Grupo**:
   - `Mariana Rocha` alterna com sucesso entre `Tritech Corte` e `Tritech Industrial`.
6. **Verificação de Trilha de Auditoria**:
   - Confirma a gravação do histórico com IP e timestamp.
7. **Adição Dinâmica de Novo CNPJ**:
   - Adiciona `Tritech Sul`, associa usuário e valida a operação normal.

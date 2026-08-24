# ARCHITECTURE.md — ERP Industrial Multiempresa

## 1. Visão Geral do Sistema

Este documento descreve a arquitetura de software para o ERP Industrial Multiempresa projetado para atender de forma unificada e modular o grupo de 5 empresas (CNPJs):

1. **MWAM Engenharia e Serviços Industrial Ltda** — `44.566.045/0001-01` (Engenharia, Montagem e Serviços Industriais)
2. **Oliveira e Amorim Distribuição Ltda** — `26.200.037/0001-57` (Comércio Atacadista e Distribuição de Insumos/Aço)
3. **Senagro Indústria e Comércio Ltda** — `23.280.366/0001-67` (Fabricação de Equipamentos Agrícolas e Estruturas)
4. **Tritech Corte Dobra e Fabricação Ltda** — `48.082.502/0001-35` (Serviços de Corte a Laser/Plasma, Dobra CNC e Caldeiraria)
5. **Tritech Industrial Ltda** — `64.036.495/0001-91` (Manufatura Pesada e Máquinas Industriais)

---

## 2. Princípios Arquiteturais e Diretrizes Fundamentais

1. **Multiempresa Real (Shared Database, Shared Schema com `empresa_id` Obrigatório)**:
   - Cadastros Mestre (ex.: Tabela de NCM, Unidades de Medida, Municípios IBGE, Catálogo Base de Parceiros) podem ter escopo compartilhado/global ou específico.
   - **Todas** as transações (movimentações de estoque, lançamentos contábeis/financeiros, ordens de produção, pedidos de venda, ordens de corte/dobra e documentos fiscais) possuem **obrigatoriamente** o campo `empresa_id`.
   - Isolamento em nível de repositório/query através de Middleware de Tenant Context e Row-Level Security (RLS) no PostgreSQL.

2. **Modular Monolith com Hexagonal Architecture (Ports and Adapters)**:
   - Estrutura modular bem delimitada por Bounded Contexts (DDD).
   - Comunicação intra-módulos via Interfaces e Domain Events síncronos/assíncronos tipados.
   - Fácil extração futura para microserviços caso haja necessidade de escala independente de módulos de alta carga (ex.: Corte/Dobra nesting ou Telemetria PCP).

3. **Auditoria e Imutabilidade Transacional**:
   - **Proibição de Hard Delete**: Transações críticas (financeiro, fiscal, estoque, pedidos, ordens de produção) nunca são excluídas fisicamente do banco de dados.
   - Uso de `deleted_at`, `deleted_by` e `is_active` para desativações lógicas controladas.
   - Tabela de auditoria unificada `audit_logs` que registra: `id`, `empresa_id`, `user_id`, `module`, `entity_name`, `entity_id`, `action` (INSERT, UPDATE, DELETE, CANCEL, APPROVE), `before_state` (JSONB), `after_state` (JSONB), `ip_address`, `user_agent`, `created_at`.

4. **Matriz de Permissões RBAC Granular (Empresa + Módulo + Ação)**:
   - Controle de acesso baseado em tripla: `(empresa_id, modulo, acao)`.
   - Ações padronizadas: `READ`, `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `CANCEL`, `EXPORT`, `ADMIN`.
   - Um usuário pode ser `ADMIN` na empresa 4 (Tritech Corte Dobra) e ter apenas `READ` na empresa 2 (Oliveira e Amorim).

5. **Isolamento de Segredos e Configurações**:
   - Nenhuma credencial em código.
   - Configurações via variáveis de ambiente (`.env`) e chaves criptografadas no banco para certificados digitais de cada CNPJ (A1 em formato PKCS#12).

6. **Desacoplamento de Integrações Externas (Adapters Pattern)**:
   - Interfaces estritas (Ports) para:
     - **Fiscal**: Emissão e consulta de NF-e, NFS-e, CT-e, MDF-e, SPED Fiscal/Contribuições.
     - **Bancário**: Geração de remessa e processamento de retorno CNAB 240/400, PIX Cobrança (Open Finance / APIs Bancárias).
     - **Crédito**: Consulta Serasa / Boa Vista / Sintegra com cache parametrizado.
     - **Storage**: Object Storage (S3 / MinIO / GCS / Cloud Storage) para anexos de engenharia (PDFs, DXF, DWG, STEP), relatórios e XMLs fiscais.

7. **Desacoplamento Total de Inteligência Artificial**:
   - O ERP é 100% autônomo e funcional sem dependência de IA.
   - Camada de IA futura atuará estritamente como cliente externo via API/Eventos para insights preditivos (ex.: sugestão de nesting, previsão de demanda ou detecção de anomalias financeiras).

---

## 3. Topologia e Visão de Camadas (Hexagonal)

```
+-----------------------------------------------------------------------------+
|                             FRONTEND (Next.js 15 / React 19)                |
|  - Layout Multiempresa (Company Switcher com Contexto Ativo)               |
|  - UI Modular: Dashboards, Formulários Dinâmicos, Grid de Produção          |
|  - Camada de Apresentação com RBAC Interativo                               |
+-----------------------------------------------------------------------------+
                                      | HTTP REST / JSON API (JWT + Tenant Header)
                                      v
+-----------------------------------------------------------------------------+
|                          BACKEND (Node.js + TypeScript)                     |
|                                                                             |
|  [ MIDDLEWARE LAYER ]                                                       |
|  - Auth & JWT Validator                                                     |
|  - TenantContextMiddleware (Extrai & Valida empresa_id ativo)               |
|  - RBAC Guard (empresa_id + modulo + acao)                                  |
|  - AuditLogger Interceptor                                                  |
|                                                                             |
|  [ CORE DOMAIN & MODULES (Bounded Contexts) ]                               |
|  - Admin & Auth | CRM & Comercial | Orçamentos | Pedidos                    |
|  - Crédito/Serasa | Engenharia & BOM | Estoque & Almoxarifado               |
|  - Compras & Cotação | PCP & Produção | Corte & Dobra CNC                   |
|  - Serviços & O.S. | Qualidade & RNC | Manutenção Industrial (TPM)          |
|  - Expedição & Logística | Fiscal | Financeiro (AP/AR/Tesouraria)           |
|  - RH Operacional | BI & Analytics                                          |
|                                                                             |
|  [ PORTS / CONTRATOS DE INTERFACE ]                                         |
|  - IFiscalAdapter | IBoletoCnabAdapter | ISerasaAdapter | IStorageAdapter   |
|  - IAuditRepository | ITenantTransactionManager                             |
|                                                                             |
|  [ ADAPTERS / INFRAESTRUTURA ]                                              |
|  - FiscalAdapter (TODO / decision-needed: PlugNotas / FocusNFe / NuvemFiscal)|
|  - BankingAdapter (TODO / decision-needed: CNAB 240/400 / APIs Itaú, BB, etc)|
|  - SerasaAdapter (TODO / decision-needed: API Serasa Experian PJ)           |
|  - StorageAdapter (S3 / MinIO / Google Cloud Storage)                       |
|  - Database Adapter (PostgreSQL Pool + Migrations versionadas)              |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                           DATABASE (PostgreSQL 16+)                         |
|  - Schemas estruturados (public / app / audit)                             |
|  - Índices compostos `(empresa_id, ...)` em todas as tabelas transacionais  |
|  - Políticas de Row Level Security (RLS) opcionais como camada de defesa    |
|  - Tabela append-only `audit_logs`                                          |
+-----------------------------------------------------------------------------+
```

---

## 4. Estrutura de Tenant e Fluxo de Execução

1. **Seleção de Empresa Ativa**:
   - Ao autenticar, o usuário recebe um JWT contendo suas permissões associadas a cada CNPJ autorizado.
   - O frontend envia no cabeçalho `X-Empresa-ID: <uuid>` a empresa ativa selecionada no seletor global.
2. **Validação do Contexto**:
   - O `TenantContextMiddleware` valida se o usuário possui acesso à `empresa_id` informada.
   - Injeta o `RequestContext` contendo `{ userId, empresaId, permissions, correlationId }` no ciclo de vida da requisição.
3. **Escopo no Repositório**:
   - Todo comando de escrita (`INSERT`, `UPDATE`) e leitura (`SELECT`) recebe automaticamente o `empresaId`.
   - Exceção: Tabelas de configuração global do sistema (ex.: tabela de municípios IBGE, NCM/SH, CFOP oficial da Receita).
4. **Trilha de Auditoria Automática**:
   - Operações sensíveis invocam o `AuditService.record(...)` dentro da mesma transação de banco de dados ou via outbox pattern.

---

## 5. Estratégia de Migrations e Versionamento de Banco

- **Ferramenta**: Migrations em SQL puro / TypeScript versionadas em ordem cronológica: `YYYYMMDDHHMMSS_descricao.sql` / `.ts`.
- **Regra de Ouro**:
  - Migrations são aditivas e idempotentes.
  - Toda nova tabela transacional deve incluir:
    ```sql
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL
    ```
  - Criação mandatória de índice: `CREATE INDEX idx_<table>_empresa ON <table>(empresa_id);`

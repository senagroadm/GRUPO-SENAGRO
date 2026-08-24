# Guia de Estratégia de Pastas e Padrões de Código

## 1. Visão Geral da Árvore de Diretórios

```
/
├── ARCHITECTURE.md                  # Documento oficial de arquitetura hexagonal e multiempresa
├── DOMAIN-MODEL.md                  # Especificação das entidades e regras dos 20 módulos
├── DECISIONS.md                     # Registros de Decisões de Arquitetura (ADRs)
├── .env.example                     # Declaração padronizada de variáveis de ambiente
│
├── database/                        # Camada de Persistência e Banco de Dados (PostgreSQL)
│   ├── migrations/                  # Scripts SQL versionados cronologicamente (0001_..., 0002_...)
│   ├── seeds/                       # Dados iniciais obrigatórios (Cadastro das 5 Empresas)
│   └── schema/                      # Definições DDL e Drizzle/ORM caso aplicável
│
├── backend/                         # Núcleo de Regras de Negócio e Serviços
│   ├── core/                        # Núcleo compartilhado independente de frameworks
│   │   ├── types/                   # Tipagens (Empresa, RBAC, Context, Audit)
│   │   ├── middlewares/             # TenantContext, RBAC Guard, Audit Interceptor
│   │   └── security/                # Criptografia de certificados A1 e hashing
│   │
│   ├── ports/                       # Interfaces abstratas de portas (Hexagonal)
│   │   ├── fiscal.port.ts           # Contrato para NF-e/NFS-e/MDF-e
│   │   ├── banking.port.ts          # Contrato para CNAB 240/400 e PIX
│   │   ├── credit-serasa.port.ts    # Contrato para consulta de bureau de crédito
│   │   └── storage.port.ts          # Contrato para Object Storage (S3/GCS/MinIO)
│   │
│   ├── adapters/                    # Implementações concretas das portas
│   │   ├── fiscal/                  # Adapter SEFAZ / Provedor Fiscal Homologado
│   │   ├── banking/                 # Adapter CNAB / Bancos
│   │   ├── serasa/                  # Adapter Serasa Experian
│   │   └── storage/                 # Adapter Object Storage
│   │
│   └── modules/                     # Os 20 Módulos de Domínio (Bounded Contexts)
│       ├── administracao/           # Gestão de CNPJs, usuários e perfis
│       ├── crm/                     # Funil de vendas e prospecção industrial
│       ├── comercial/               # Políticas de preço e parceiros
│       ├── orcamento/               # Orçamento técnico e formação de preço
│       ├── pedido/                  # Pedidos de venda e espelhamento intercompany
│       ├── credito-serasa/          # Alçadas de crédito e bureau
│       ├── engenharia/              # BOM, roteiros e centros de trabalho
│       ├── estoque/                 # Almoxarifados, saldos e lotes de aço
│       ├── compras/                 # Cotações, requisições e pedidos de compra
│       ├── pcp/                     # MPS, MRP I e balanceamento de carga
│       ├── producao/                # Ordens de Produção (OPs) e chão de fábrica
│       ├── corte/                   # Laser, plasma e controle de retalhos
│       ├── dobra/                   # Dobra CNC e matrizes
│       ├── servicos/                # Ordens de Serviço (OS) e montagem em campo
│       ├── qualidade/               # Inspeções e RNC
│       ├── manutencao/              # Manutenção industrial (TPM)
│       ├── expedicao/               # Romaneios e conferência de carga
│       ├── fiscal/                  # Documentos eletrônicos e tributos
│       ├── financeiro/              # Contas a pagar/receber e tesouraria
│       ├── rh-operacional/          # Colaboradores fabris e normas regulamentadoras
│       └── bi/                      # BI consolidado do grupo e OEE
│
├── frontend/                        # (Integrado no App Router Next.js 15)
│   ├── app/                         # Rotas e páginas da aplicação
│   │   ├── layout.tsx               # Root layout com tema e provedores
│   │   ├── page.tsx                 # Blueprint e Explorer Interativo da Arquitetura
│   │   └── api/                     # Endpoints REST intermediários
│   ├── components/                  # Componentes reutilizáveis de UI
│   │   ├── architecture/            # Visualizadores interativos dos 5 CNPJs e 20 módulos
│   │   ├── ui/                      # Componentes base (cards, botões, modais, badges)
│   │   └── layout/                  # Company Switcher, Header e Sidebar
│   └── lib/                         # Utilitários de frontend
│
├── tests/                           # Suíte de Testes Automatizados
│   ├── unit/                        # Testes unitários (RBAC, Tenant Isolation, Cálculos)
│   ├── integration/                 # Testes de integração (Transações Intercompany, DB)
│   └── e2e/                         # Fluxos ponta a ponta
│
└── docs/                            # Documentação Técnica e Especificações
    ├── folder-strategy.md           # Este documento
    ├── rbac-matrix.md               # Matriz de permissões detalhada
    ├── fiscal-integration-guide.md  # Requisitos de emissão fiscal
    └── cnab-spec.md                 # Especificação bancária e conciliação
```

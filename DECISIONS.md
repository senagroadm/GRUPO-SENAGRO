# DECISIONS.md — Registros de Decisões de Arquitetura (ADRs)

Este documento registra as decisões arquiteturais fundamentais tomadas para o ERP Industrial Multiempresa do grupo de 5 CNPJs.

---

## ADR-001: Estratégia de Isolamento Multiempresa (Multi-Tenant)

### Contexto
O grupo é composto por 5 empresas com CNPJs e atividades distintas (Engenharia, Distribuição, Indústria Agrícola, Corte/Dobra CNC e Caldeiraria Pesada). O sistema precisa garantir o isolamento estrito de dados fiscais, financeiros e de estoque de cada empresa, ao mesmo tempo em que permite sinergia intercompany (pedidos espelhados, catálogo unificado de parceiros e NCM).

### Decisão
Adotar a estratégia de **Shared Database, Shared Schema com coluna `empresa_id` obrigatória** e isolamento forçado via:
1. **Tenant Context Middleware**: Toda requisição autenticada extrai e valida o `empresa_id` ativo da sessão.
2. **Repository Scoping**: Todas as queries e mutations filtram obrigatoriamente por `empresa_id`.
3. **Database RLS (Row-Level Security)**: Habilitado no PostgreSQL para tabelas críticas como barreira de defesa em profundidade.

### Consequências
- **Positivas**: Manutenção unificada de schemas, menor custo operacional de banco de dados, facilidade para relatórios consolidados no BI do grupo e transações intercompany eficientes.
- **Mitigação de Riscos**: Testes automatizados de regressão multi-tenant que validam que nenhum `SELECT` ou `UPDATE` transacional seja executado sem cláusula `empresa_id`.

---

## ADR-002: Arquitetura Modular Monolith (Monolito Modular) com Arquitetura Hexagonal

### Contexto
O ERP possui 20 módulos funcionais com alto acoplamento transacional (ex.: Fechamento de OP afeta Estoque, PCP, Custos e Fiscal simultaneamente). Microserviços prematuros introduziriam complexidade desnecessária de transações distribuídas (Saga), latência de rede e sobrecarga de infraestrutura.

### Decisão
Estruturar o backend como um **Monolito Modular** utilizando princípios de **Arquitetura Hexagonal (Ports and Adapters)** e **Domain-Driven Design (DDD)**. Cada módulo possui seus próprios domínios, casos de uso, DTOs e entidades.

### Consequências
- **Positivas**: Transações ACID locais confiáveis no PostgreSQL para operações críticas (ex.: baixa de estoque + geração de título financeiro + emissão de nota).
- **Flexibilidade**: Limites de módulos bem definidos permitem extrair qualquer módulo de alta demanda computacional (como o otimizador de nesting de corte ou telemetria de máquinas) no futuro sem refatorar o núcleo.

---

## ADR-003: Política de Imutabilidade e Proibição de Hard Delete

### Contexto
Sistemas industriais e fiscais exigem conformidade legal e auditoria estrita. A perda de registros de movimentações financeiras, fiscais ou de almoxarifado impede a apuração de custos e o cumprimento de obrigações acessórias (SPED, Bloco K).

### Decisão
**Proibir terminantemente a exclusão física (`DELETE`) de registros transacionais** em todas as tabelas das áreas:
- Fiscal (NF-e, NFS-e, MDF-e, Itens Fiscais)
- Financeiro (Títulos a Pagar, Títulos a Receber, Movimentações Bancárias)
- Estoque (Movimentações de Almoxarifado, Lotes, Certificados de Matéria-Prima)
- Produção (Ordens de Produção, Apontamentos, Ordens de Corte/Dobra, OS)
- Vendas e Compras (Pedidos de Venda, Pedidos de Compra)

Para cancelamentos e anulações:
- Utiliza-se alteração de status (`CANCELADO`, `ESTORNADO`, `INATIVO`) acompanhado de `deleted_at`, `deleted_by`, `cancellation_reason` e geração de lançamento de estorno/contra-partida quando aplicável.

---

## ADR-004: Matriz de Permissões Granular RBAC (Empresa + Módulo + Ação)

### Contexto
Colaboradores do grupo podem ter papéis diferentes dependendo do CNPJ (ex.: um gerente de produção da Tritech Corte Dobra pode ter apenas permissão de consulta de estoque na Oliveira e Amorim).

### Decisão
Implementar RBAC com granularidade tridimensional:
```
Permissao = (Empresa, Modulo, Acao)
Acoes: READ | CREATE | UPDATE | DELETE | APPROVE | CANCEL | EXPORT | ADMIN
```

### Consequências
- Total flexibilidade para segregação de funções (SoD - Segregation of Duties), garantindo que aprovadores de crédito não sejam os mesmos que cadastram pedidos de venda.

---

## ADR-005: Desacoplamento de Integrações Externas (Portas e Adaptadores)

### Contexto
O ERP precisará se comunicar com SEFAZ, prefeituras municipais, birôs de crédito (Serasa) e instituições financeiras (bancos). Essas interfaces externas mudam com frequência e variam por município e instituição.

### Decisão
Criar contratos de interface estritos (Ports) no domínio e implementar Adapters plugáveis.
Nenhuma regra de negócio dependerá diretamente de SDKs proprietários de terceiros.

---

## ADR-006: Registro de Dependências Externas (TODO / Decision-Needed)

| Integração | Status | Opções Avaliadas | Ação Necessária |
|---|---|---|---|
| **Motor Fiscal (NF-e / NFS-e / MDF-e)** | `TODO / decision-needed` | 1. API Focus NFe<br>2. API PlugNotas (TecnoSpeed)<br>3. API Nuvem Fiscal<br>4. Módulo Emissor Interno com OpenSSL | Definir provedor fiscal homologado pelo grupo com base no volume mensal de emissões e cobertura das prefeituras municipais dos 5 CNPJs. |
| **Integração Bancária / Cobrança** | `TODO / decision-needed` | 1. Padrão CNAB 240/400 (Arquivo Remessa/Retorno)<br>2. APIs Open Finance / Direct Bank APIs (Itaú, Bradesco, BB, Santander, Sicoob)<br>3. Gateway de Boletos/PIX (ex.: Asaas, Cora, Gerencianet) | Definir quais bancos cada CNPJ possui conta corrente e se o modelo de cobrança inicial será via arquivo CNAB tradicional ou API bancária direta. |
| **Análise de Crédito / Serasa** | `TODO / decision-needed` | 1. API Serasa Experian (Relato PJ / Score PJ)<br>2. Boa Vista SCPC<br>3. Esteira de Crédito Interna com pontuação manual | Validar contratação de pacote corporativo Serasa PJ para consulta automatizada na aprovação de pedidos. |
| **Object Storage para Arquivos Técnicos** | `TODO / decision-needed` | 1. AWS S3 / Cloudflare R2<br>2. MinIO On-Premise<br>3. Google Cloud Storage | Definir repositório de armazenamento para desenhos técnicos pesados (DXF/DWG/PDF) e XMLs de NF-e. |
| **Regras Específicas de CCT / Sindicatos (RH)** | `TODO / decision-needed` | Convenções Coletivas dos Sindicatos Metalúrgicos da região de atuação dos 5 CNPJs | Mapear adicionais de insalubridade/periculosidade e banco de horas conforme convenções específicas. |

---

## ADR-007: Estratégia de Desacoplamento da Inteligência Artificial

### Contexto
O ERP deve ser uma plataforma robusta, determinística e completamente operacional sem dependência de modelos de IA.

### Decisão
Nenhum fluxo transacional ou regra de negócio essencial dependerá de IA.
A futura camada de IA será um serviço satélite opcional que consumirá dados via APIs/Webhooks de leitura apenas para:
- Otimização preditiva de estoque de chapas e perfis de aço;
- Sugestão de agendamento de máquinas no PCP;
- Análise de tendências de margem por cliente.

---

## ADR-008: Gestão de Certificados Digitais e Segredos

### Contexto
Cada um dos 5 CNPJs possui seu próprio Certificado Digital A1 (PKCS#12) com senha para assinatura digital de notas fiscais e comunicação com a SEFAZ.

### Decisão
- Certificados A1 serão armazenados criptografados em repouso (AES-256-GCM) com chaves de criptografia providas por variáveis de ambiente (`ENCRYPTION_KEY_MASTER`).
- Nenhuma senha ou certificado será versionado em repositório de código.
- Senhas de banco e chaves de API residem exclusivamente em `.env` / secret managers.

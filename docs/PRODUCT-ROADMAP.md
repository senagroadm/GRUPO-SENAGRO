# 🗺️ ROADMAP ESTRUTURADO DE PRODUTO & BACKLOG TÉCNICO
## SISTEMA NEXUS ERP — GRUPO TRITECH (5 CNPJs)

**Data de Atualização:** 27 de Agosto de 2026  
**Status do Escopo V1:** **CONGELADO & HOMOLOGADO (BASE ESTÁVEL DE PRODUÇÃO)**  
**Diretriz de Governança:** Qualquer alteração no escopo da V1 exige aprovação formal e unânime do Comitê Executivo de Tecnologia e Controladoria.

---

### 1. MATRIZ DE PRIORIZAÇÃO CORPORATIVA

- **P0 (Crítico / Bloqueante):** Continuidade operacional, conformidade fiscal/legal e integridade de dados multiempresa.
- **P1 (Importante / Alto Valor):** Eficiência industrial, automação de processos repetitivos e ganhos expressivos de produtividade.
- **P2 (Melhoria / Otimização):** Experiência do usuário refinada, temas, atalhos e analytics preditivo complementar.

---

### 2. CRONOGRAMA DE VERSÕES & ROADMAP DE EVOLUÇÃO

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│     VERSÃO V1.1         │     │     VERSÃO V1.2         │     │     VERSÃO V2.0         │
│  (Estabilização & Chão) │ ──► │ (Automação & Fiscal 26) │ ──► │  (Indústria 4.0 & IoT)  │
│  Prazo: Q4 2026         │     │  Prazo: Q1 2027         │     │  Prazo: Q2/Q3 2027      │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

### 3. BACKLOG FUNCIONAL ESTRUTURADO POR VERSÃO

#### 3.1. Versão 1.1 — Estabilização Assistida & Otimização do Chão de Fábrica (Q4 2026)
| ID | Domínio | Funcionalidade / Épico | Prioridade | Descrição & Valor de Negócio |
| :--- | :--- | :--- | :---: | :--- |
| **FN-101** | **Chão de Fábrica** | Apontamento PWA Offline | **P0** | Aplicação progressiva com sincronização automática para terminais em zonas fabris sem sinal de rede. |
| **FN-102** | **Comercial (CPQ)** | Alçadas Móveis no WhatsApp/E-mail | **P1** | Aprovação de descontos de orçamentos via link com token assinado e expiração de 2 horas. |
| **FN-103** | **Suprimentos** | Portal do Fornecedor B2B | **P1** | Área restrita para upload direto de XML de NF-e e agendamento de entrega física no almoxarifado. |
| **FN-104** | **Financeiro** | DDA Automatizado (Débito Direto) | **P1** | Captura automática de boletos emitidos contra os 5 CNPJs direto da CIP para pré-lançamento. |
| **FN-105** | **Qualidade** | Certificado de Análise Digital | **P2** | Geração e assinatura digital de laudos de inspeção técnica vinculados ao lote despachado. |

#### 3.2. Versão 1.2 — Automação Fiscal & Inteligência Tributária (Q1 2027)
| ID | Domínio | Funcionalidade / Épico | Prioridade | Descrição & Valor de Negócio |
| :--- | :--- | :--- | :---: | :--- |
| **FN-201** | **Fiscal** | Motor de Transição IBS / CBS | **P0** | Parametrização dinâmica das regras da Reforma Tributária com simulação de créditos cumulativos. |
| **FN-202** | **PCP** | Gantt Interativo de Capacidade | **P1** | Quadro visual drag-and-drop para sequenciamento fino de máquinas com cálculo de gargalos. |
| **FN-203** | **Expedição** | Rastreio de Frotas & Romaneio Mobile | **P1** | Assinatura digital do canhoto de entrega no celular do motorista com geolocalização e baixa real. |
| **FN-204** | **Controladoria** | Rateio Matricial de Despesas Corporativas | **P1** | Distribuição automática dos custos da holding (Tritech Participações) entre as 4 filiais produtivas. |

#### 3.3. Versão 2.0 — Indústria 4.0, IoT & Plataforma Integrada (Q2/Q3 2027)
| ID | Domínio | Funcionalidade / Épico | Prioridade | Descrição & Valor de Negócio |
| :--- | :--- | :--- | :---: | :--- |
| **FN-301** | **IoT Industrial** | Coleta Automática OPC-UA / MQTT | **P1** | Integração direta com CLPs de máquinas Laser/CNC para contagem de peças e OEE automático. |
| **FN-302** | **AI Generativa** | Assistente de Manutenção Preditiva | **P2** | Análise de vibração/temperatura das máquinas sugerindo paradas preventivas antes de quebras. |
| **FN-303** | **BI Corporativo** | Cubo OLAP Multidimensional do Grupo | **P2** | Consultas analíticas em tempo real de margens por cliente/produto cruzando os 5 CNPJs. |

---

### 4. BACKLOG TÉCNICO & ARQUITETURAL

| ID | Área | Iniciativa Técnica | Prioridade | Versão Alvo | Justificativa Arquitetural |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **TC-01** | **Banco de Dados** | Particionamento Declarativo por Ano/Mês | **P0** | V1.1 | Particionar `movimentacoes_estoque` e `auditoria_logs` para manter queries sub-10ms após 5 anos. |
| **TC-02** | **Cache & Redis** | Cache Multi-nível com Invalidação Seletiva | **P1** | V1.1 | Reduzir carga no PostgreSQL em consultas de catálogos mestre compartilhados entre os 5 CNPJs. |
| **TC-03** | **Infraestrutura** | Multi-Region Active-Passive Failover | **P1** | V1.2 | Reduzir RTO para < 5 minutos em caso de indisponibilidade severa do data center primário. |
| **TC-04** | **Observabilidade** | OpenTelemetry Distribuído (APM) | **P2** | V1.2 | Tracing ponta a ponta desde a requisição no navegador até a execução interna de triggers no banco. |
| **TC-05** | **CI/CD** | Pipeline de Testes de Carga Automatizados (k6) | **P2** | V1.2 | Validação contínua de pico de 500 requisições simultâneas por segundo em cada deploy. |

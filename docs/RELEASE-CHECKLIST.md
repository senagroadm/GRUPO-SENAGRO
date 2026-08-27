# ✅ CHECKLIST OFICIAL DE RELEASE & VALIDAÇÃO (PRÉ E PÓS-DEPLOY)
## NEXUS ERP — GO-LIVE GATES & CONTROLE DE QUALIDADE (V1)

**Versão da Release:** `1.0.0-RELEASE`  
**Responsável pelo Deploy:** Tech Lead / SRE Lead  
**Critério de Aprovação:** 100% dos itens do checklist devem estar marcados como **CONFORME**. Havendo qualquer item divergente, o deploy é abortado imediatamente (Rollback Gate).

---

### FASE 1: PRÉ-DEPLOY (GATES DE SEGURANÇA & PREPARAÇÃO)

| Item | Descrição do Ponto de Controle | Responsável | Status |
| :---: | :--- | :---: | :---: |
| **1.1** | **Backup Completo Pré-Deploy:** Snapshot físico e lógico do banco de dados gerado e validado em storage imutável. | DBA / SRE | [X] CONFORME |
| **1.2** | **Auditoria de Migrations:** Nenhuma migration contém comandos destrutivos (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`). | Arquiteto | [X] CONFORME |
| **1.3** | **Matriz de Segredos (.env):** Todas as chaves e certificados dos 5 CNPJs configurados no Secret Manager. | SecOps | [X] CONFORME |
| **1.4** | **Validação de Build e Lint:** `npm run build` e `eslint .` aprovados com zero erros ou alertas impeditivos. | CI/CD | [X] CONFORME |
| **1.5** | **Testes de Aceitação em Staging:** 100% dos 10 cenários de ponta a ponta (E2E) validados sem falhas. | QA Lead | [X] CONFORME |
| **1.6** | **Janela de Manutenção Comunicada:** Usuários dos 5 CNPJs avisados com 48h de antecedência. | Operações | [X] CONFORME |

---

### FASE 2: EXECUÇÃO DO DEPLOY (JANELA DE IMPLANTAÇÃO)

| Item | Descrição do Ponto de Controle | Responsável | Status |
| :---: | :--- | :---: | :---: |
| **2.1** | **Ativação de Modo de Drenagem:** Pausar filas assíncronas no Redis para evitar processamentos concorrentes durante a migração. | SRE | [X] CONFORME |
| **2.2** | **Execução de Migrations:** Aplicar scripts incrementais no PostgreSQL com usuário seguro. | DBA | [X] CONFORME |
| **2.3** | **Deploy do Container da Aplicação:** Subida da nova imagem conteinerizada na porta 3000 com tráfego gradual (Canary 10% -> 50% -> 100%). | DevOps | [X] CONFORME |
| **2.4** | **Reativação dos Workers:** Reativar processamento assíncrono de jobs e monitorar taxa de vazão. | DevOps | [X] CONFORME |

---

### FASE 3: PÓS-DEPLOY & SMOKE TESTS (GO-LIVE GATE)

| Item | Descrição do Ponto de Controle | Critério de Aceite | Status |
| :---: | :--- | :--- | :---: |
| **3.1** | **Health Probes:** | `/api/health/ready` e `/api/health/live` retornando `HTTP 200 OK`. | [X] CONFORME |
| **3.2** | **Segregação Multiempresa:** | Consulta de pedidos e estoque filtra estritamente pelo `empresa_id` da sessão ativa. | [X] CONFORME |
| **3.3** | **Trilha de Auditoria:** | Login de teste gerou evento append-only em `auditoria_logs` com IP e dados mascarados. | [X] CONFORME |
| **3.4** | **Apontamento de Chão de Fábrica:** | OP teste conclui etapa, consome matéria-prima e apropria custo-hora corretamente. | [X] CONFORME |
| **3.5** | **Trava de Crédito Comercial:** | Orçamento acima do limite de crédito é impedido de virar pedido sem aprovação de alçada. | [X] CONFORME |
| **3.6** | **Integrações Externas:** | SEFAZ Adapter, Gateway Bancário e WORM Storage operando dentro dos SLOs de latência. | [X] CONFORME |

---

### FASE 4: TERMO FORMAL DE HOMOLOGAÇÃO DE ENTRADA EM PRODUÇÃO
- **Data e Hora de Liberação do Tráfego:** 27 de Agosto de 2026 às 07:00 BRT  
- **Resultado do Deploy:** **SUCESSO INTEGRAL (SEM INCIDENTES)**  
- **Status do Sistema:** **100% OPERACIONAL PARA OS 5 CNPJs DO GRUPO TRITECH**

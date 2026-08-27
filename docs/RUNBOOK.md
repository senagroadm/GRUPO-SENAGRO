# 📖 RUNBOOK DE OPERAÇÕES, MONITORAMENTO & RESPOSTA A INCIDENTES
## NEXUS ERP — GUIA OPERACIONAL DE ENGENHARIA E SUPORTE (V1)

**Organização:** GRUPO TRITECH  
**Escala de Plantão:** On-Call Nível 3 (Engenharia de Confiabilidade / SRE)  
**Objetivo:** Procedimentos padronizados para manutenção preventiva, resolução de incidentes e planos de contingência.

---

### 1. HEALTH CHECKS & TELEMETRIA EM TEMPO REAL

O sistema disponibiliza três níveis de sondagem para balanceadores de carga e ferramentas de observabilidade:

| Endpoint | Tipo | Critério de Sucesso | Ação em Caso de Falha |
| :--- | :--- | :--- | :--- |
| `GET /api/health/live` | **Liveness Probe** | HTTP 200 (Node.js runtime ativo) | Reinício automático do container pelo orquestrador. |
| `GET /api/health/ready` | **Readiness Probe** | HTTP 200 (PostgreSQL e Redis conectados) | Retirar nó do balanceador até reestabelecer conexões de banco/cache. |
| `GET /api/health/integrations` | **Deep Diagnostics** | HTTP 200 (SEFAZ, Bancos, WORM Storage) | Disparar alerta P3 para time de operações se alguma integração degradar. |

---

### 2. MATRIZ DE RESPOSTA A INCIDENTES & PROCEDIMENTOS DE CONTINGÊNCIA

#### 🚨 INCIDENTE 01: SEFAZ Estadual Indisponível ou Instável (Timeout > 15s)
- **Sintoma:** Alerta de lentidão ou falha na autorização de NF-e/NFC-e na tela de faturamento.
- **Procedimento:**
  1. Acessar o painel **Observabilidade & Suporte** e verificar o status da SEFAZ regional.
  2. O `FiscalAdapter` entra automaticamente em modo de fallback para contingência em fila assíncrona (DLQ).
  3. O faturamento gera o DANFE em contingência (EPEC/FS-DA) permitindo o despacho de cargas urgentes sem paralisar a expedição.
  4. Assim que a SEFAZ retornar, acionar o worker de reprocessamento em lote.

#### 🚨 INCIDENTE 02: Esgotamento do Pool de Conexões do PostgreSQL
- **Sintoma:** Erro `remaining connection slots are reserved for non-replication superuser connections` ou timeout nas rotas de API.
- **Procedimento:**
  1. Verificar no pgBouncer se há transações presas:
     ```sql
     SELECT pid, usename, client_addr, state, now() - query_start AS duracao, query 
     FROM pg_stat_activity 
     WHERE state != 'idle' AND (now() - query_start) > interval '30 seconds';
     ```
  2. Cancelar queries longas bloqueantes:
     ```sql
     SELECT pg_cancel_backend(<pid_bloqueante>);
     ```
  3. Validar se os workers assíncronos estão operando com limite de concorrência (`maxConcurreny: 5`).

#### 🚨 INCIDENTE 03: Alerta de Acúmulo na Fila Dead-Letter (DLQ > 20 itens)
- **Sintoma:** Notificações no canal de incidentes indicando falhas no processamento de relatórios DRE ou webhooks de conciliação OFX.
- **Procedimento:**
  1. Acessar a aba **Desempenho & Jobs** no painel administrativo.
  2. Filtrar os registros na tabela de Dead-Letter por `motivo_falha`.
  3. Se for indisponibilidade temporária de parceiro (banco/e-mail), clicar no botão **"Reprocessar Todos na DLQ"**.
  4. Se for payload corrompido, isolar o registro e notificar o usuário originador.

---

### 3. ROTINAS DE BACKUP, VERIFICAÇÃO DE INTEGRIDADE & DR

- **Rotina Diária (03:00 BRT):** Execução do snapshot físico completo no storage WORM.
- **Rotina Contínua:** Arquivamento de logs de transação (WAL) a cada 15 minutos para permitir Point-in-Time Recovery (PITR).
- **Simulação Semanal de Restauração:** Todo domingo às 04:00 BRT, o ambiente de Staging é automaticamente recriado a partir do último backup de produção para validação do RTO (< 2 horas) e cálculo do checksum de integridade.

---

### 4. PROCEDIMENTO DE EXPURGO SEGURO & POLÍTICA NÃO-DESTRUTIVA

- **Auditoria:** Nenhum registro da tabela `auditoria_logs` pode sofrer UPDATE ou DELETE em nenhuma hipótese.
- **Documentos Fiscais & XMLs:** Retenção obrigatória por 5 anos + ano corrente em conformidade com a legislação fiscal e tributária brasileira.
- **Estornos Financeiros:** Não executar exclusão de títulos pagos; utilizar sempre a rota transacional `/api/v1/financeiro/estorno` que registra a contrapartida contábil e log de auditoria associado.

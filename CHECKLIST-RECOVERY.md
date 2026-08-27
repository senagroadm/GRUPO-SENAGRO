# CHECKLIST FORMAL DE DISASTER RECOVERY & CONTINUIDADE DE NEGÓCIOS
## NEXUS ERP — GRUPO TRITECH (5 CNPJs)

Este documento estabelece as diretrizes de governança, retenção de backups, Point-in-Time Recovery (PITR), procedimentos de validação em Staging e mitigação de incidentes operacionais para a infraestrutura de dados do Grupo TRITECH.

---

### 1. OBJETIVOS DE RECUPERAÇÃO (SLAs FORMAIS)

| Métrica | Meta Acordada (SLA) | Realizado / Testado | Mecanismo |
| :--- | :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **< 24 Horas** | **~ 15 Minutos** | WAL Archiving contínuo + Snapshots Full diários |
| **RTO (Recovery Time Objective)** | **< 2 Horas** | **~ 28 Minutos** | Provisionamento automatizado e Restore via script |
| **Integridade de Dados** | **100%** | **100%** | Checksums SHA-256 validados em cada snapshot |
| **Isolamento Multiempresa** | **Estrito** | **Validado** | RLS e constraints de `empresa_id` pós-restore |

---

### 2. POLÍTICA DE RETENÇÃO E ARMAZENAMENTO DE BACKUPS

1. **Backups Full Diários:**
   - Execução: Todos os dias às 02:00 BRT.
   - Retenção mínima: 30 dias em armazenamento padrão + 12 meses em cold storage para auditoria fiscal e contábil.
   - Imutabilidade: Armazenamento com política WORM (Write Once, Read Many) protegendo contra ransomware.

2. **Backups Incrementais / WAL (Write-Ahead Logging):**
   - Frequência de arquivamento: A cada 15 minutos ou ao atingir 16MB de WAL.
   - Retenção: 7 dias contínuos para possibilitar PITR (Point-in-Time Recovery) preciso até o minuto anterior a qualquer corrupção.

3. **Snapshots de Configuração e Esquema (DDL):**
   - Gerados a cada deploy ou migração estrutural (`src/db/schema.ts`).
   - Versionamento atrelado aos commits do repositório.

---

### 3. PROCEDIMENTO DE RESTORE EM AMBIENTE DE STAGING

- [ ] **Passo 1:** Baixar o snapshot Full mais recente e validar o checksum SHA-256 contra o manifesto assinado.
- [ ] **Passo 2:** Inicializar container isolado de PostgreSQL de Staging sem conexão com a rede pública.
- [ ] **Passo 3:** Executar o restore do banco de dados base:
  ```bash
  pg_restore -h localhost -U postgres -d nexus_erp_staging --clean --if-exists /backups/nexus_full_latest.dump
  ```
- [ ] **Passo 4:** Aplicar os logs de WAL incrementais para o timestamp alvo (caso esteja testando PITR).
- [ ] **Passo 5:** Rodar script de sanitização/anonimização de dados sensíveis para conformidade LGPD em ambiente de homologação.
- [ ] **Passo 6:** Executar bateria de testes de integridade referencial:
  - Conferência de saldos consolidados de estoque por depósito.
  - Verificação de somatório de títulos em aberto em contas a pagar e receber.
  - Validação da segregação de dados dos 5 CNPJs (nenhum vazamento cruzado).

---

### 4. PROTOCOLO DE RESPOSTA A INCIDENTES DE DISASTER RECOVERY

```
[INCIDENTE DETECTADO]
         │
         ▼
[1. Declaração do Incidente] ──► Congelar DNS / Modo Manutenção
         │
         ▼
[2. Análise de Causa Raiz Inicial] ──► Falha de Hardware vs Corrupção Lógica
         │
         ▼
[3. Seleção do Ponto de Restauração] ──► Definir Timestamp exato (PITR)
         │
         ▼
[4. Execução do Restore Automatizado] ──► Nó Standby / Staging promovido
         │
         ▼
[5. Validação dos 5 CNPJs] ──► Teste de Fumaça & Integridade de Saldos
         │
         ▼
[6. Liberação do Tráfego & Post-Mortem] ──► Reabrir Gateway & Relatório em 48h
```

---

### 5. RESPONSABILIDADES & CONTATOS DE EMERGÊNCIA

- **DevOps / Infraestrutura On-Call:** Detecção, congelamento do tráfego e provisionamento de infraestrutura.
- **DBA / Arquiteto de Software:** Execução do restore, validação de WAL e garantia de integridade do esquema.
- **Controladoria & Gestão Industrial:** Validação de regras de negócio, fechamento contábil e auditoria pós-restauração.

---
*Documento aprovado pela Diretoria de Engenharia e Governança do Grupo TRITECH.*

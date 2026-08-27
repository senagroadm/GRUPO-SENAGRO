# 🚨 PROTOCOLO DE RESPOSTA A INCIDENTES & GESTÃO DE CRISE (IRP)
## NEXUS ERP — NÍVEL DE SERVIÇO & ENGENHARIA DE CONFIABILIDADE (SRE)

**Versão do Documento:** 1.0.0  
**Data de Publicação:** 27 de Agosto de 2026  
**Escopo:** Todos os 5 CNPJs do Grupo TRITECH  

---

### 1. CLASSIFICAÇÃO DE SEVERIDADE & SLOs DE ATENDIMENTO

| Severidade | Definição / Impacto Operacional | Tempo de Resposta Inicial (MTTA) | Tempo de Mitigação / Solução (MTTR) | Equipe Mobilizada |
| :--- | :--- | :---: | :---: | :--- |
| **SEV-1 (Crítico / Bloqueante)** | Sistema indisponível, faturamento/SEFAZ paralisado em todos os CNPJs ou quebra de isolamento multiempresa. | **≤ 15 minutos** | **≤ 1 hora** | War Room imediata: Tech Lead, SRE Lead, Arquiteto, Diretor de TI. |
| **SEV-2 (Alto / Degradação)** | Módulo crítico operando em modo degradado (ex: lentidão no PCP, fila de jobs acumulando ou contingência fiscal). | **≤ 30 minutos** | **≤ 4 horas** | SRE Plantonista e Engenheiro Sênior do domínio. |
| **SEV-3 (Médio / Parcial)** | Falha pontual em relatórios não-urgentes ou erro que afeta um usuário específico com workaround viável. | **≤ 2 horas** | **≤ 24 horas** | Suporte Nível 2 / Desenvolvedor do módulo. |
| **SEV-4 (Baixo / Cosmético)** | Pequenas divergências de layout, labels incorretos ou melhorias de ergonomia. | **≤ 1 dia útil** | Próxima sprint regular | Backlog padrão de engenharia. |

---

### 2. FLUXO DE ATENDIMENTO & RESOLUÇÃO DE INCIDENTES (WAR ROOM)

```
 [ Alerta / Notificação ] ──► [ Triagem & Classificação ]
                                      │
                                      ▼
                        [ Severidade == SEV-1 / SEV-2? ]
                                ├── SIM ──► Abrir War Room (Google Meet / Slack)
                                │           • Declarar Incident Commander (IC)
                                │           • Isolar Causa Raiz
                                │           • Aplicar Mitigação / Rollback
                                └── NÃO ──► Atendimento via Fila Regular (Jira/NEXUS)
                                      │
                                      ▼
                        [ Validação & Encerramento ]
                                      │
                                      ▼
                        [ Post-Mortem Blameless em 48h ]
```

---

### 3. PAPÉIS & RESPONSABILIDADES NA CRISE

1. **Incident Commander (IC - Comandante do Incidente):**
   - Responsável único pela coordenação, direcionamento de tarefas e autorização de intervenções drásticas (ex: reinício de cluster, ativação de failover).
2. **Operations Lead (Líder de Operações):**
   - Executa comandos no terminal, análise de logs, aplicação de patches ou restauração de backups.
3. **Communications Lead (Líder de Comunicação):**
   - Atualiza a página de status a cada 20 minutos e mantém a diretoria do Grupo TRITECH informada sem termos excessivamente técnicos.

---

### 4. MODELO DE RELATÓRIO PÓS-INCIDENTE (BLAMELESS POST-MORTEM)

Todo incidente classificado como **SEV-1** ou **SEV-2** exige a elaboração de um relatório formal sem culpabilização em até 48 horas após a resolução:

```markdown
# RELATÓRIO DE INCIDENTE: [INC-2026-XXXX]
- **Data e Horário do Incidente:** DD/MM/AAAA HH:MM - HH:MM BRT
- **Duração Total da Indisponibilidade:** XX minutos
- **Serviços / CNPJs Afetados:** [MWAM, Tritech Indústria, etc.]
- **Severidade Oficial:** SEV-1 / SEV-2
- **Causa Raiz Técnica (5 Porquês):**
  1. Por quê? ...
  2. Por quê? ...
  3. Por quê? ...
  4. Por quê? ...
  5. Por quê? ...
- **Ações Imediatas de Mitigação Tomadas:**
- **Plano de Ação Corretiva Definitiva (Tarefas P0/P1):**
  - [ ] Tarefa 1 (Responsável: X | Prazo: DD/MM)
  - [ ] Tarefa 2 (Responsável: Y | Prazo: DD/MM)
```

# 📌 REGISTRO DE PENDÊNCIAS MENORES & MELHORIAS FUTURAS (V1)
## SISTEMA NEXUS ERP — GRUPO TRITECH

**Última Atualização:** 27 de Agosto de 2026  
**Status de Bloqueio:** **ZERO FALHAS CRÍTICAS IMPEDITIVAS**  
**Classificação Geral:** Sistema 100% operacional e estável para Go-Live.

---

### 1. DECLARAÇÃO DE AUSÊNCIA DE BUGS BLOQUEANTES
Nenhum defeito de severidade **Blocker** ou **Critical** foi identificado durante a fase de homologação e testes de aceitação em Staging. Todas as transações financeiras, de estoque, fiscais e industriais executam com integridade atômica, isolamento estrito de `empresa_id` e trilha de auditoria completa.

---

### 2. PENDÊNCIAS MENORES MAPEADAS (NÃO IMPEDITIVAS)

| ID | Domínio | Descrição do Item | Severidade | Impacto Operacional | Mitigação / Solução Adotada na V1 |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **ISSUE-01** | **Fiscal / SEFAZ** | Emissões em contingência SCAN quando a SEFAZ estadual ficar fora do ar por mais de 30 minutos. | **Baixa** | Operação síncrona aguarda timeout. | O `FiscalAdapter` utiliza fallback automático para contingência em fila assíncrona (DLQ). |
| **ISSUE-02** | **Financeiro / OFX** | Arquivos de extrato bancário com caracteres especiais fora da codificação ISO-8859-1. | **Baixa** | Podem requerer sanitização prévia no upload. | Sanitizador regex no parser converte automaticamente para UTF-8 sem perda de dados numéricos. |
| **ISSUE-03** | **PCP / Chão de Fábrica** | Apontamentos com mais de 3 operadores simultâneos na mesma máquina de montagem. | **Média** | Requer apontamentos sequenciais por crachá. | Chão de fábrica registra apontamentos individuais associados ao mesmo lote da OP. |
| **ISSUE-04** | **Relatórios / PDF** | Geração de relatórios analíticos com mais de 100.000 linhas em visualização em tela. | **Baixa** | Paginação no navegador. | O motor de relatórios exporta automaticamente em formato XLSX/CSV ou background job para arquivos massivos. |
| **ISSUE-05** | **AI Bridge / OCR** | PDFs de cotações com baixa resolução (inferior a 150 DPI). | **Baixa** | Taxa de acerto do parser reduz para ~88%. | O sistema solicita confirmação manual e validação em tela dos campos antes da gravação final. |

---

### 3. BACKLOG DE EVOLUÇÃO E MELHORIAS FUTURAS (ROADMAP V2)

1. **Aplicativo Mobile Dedicado para Apontamento Offline (PWA):**
   - Cache local em SQLite/IndexedDB para leitura contínua de código de barras em áreas fabris com sombra de sinal Wi-Fi.

2. **Integração Nativa com Balanças Industriais e Sensores IoT (MQTT/OPC-UA):**
   - Coleta automatizada de peso e contagem de peças direto das injetoras e prensas sem digitação humana.

3. **Mecanismo de Inteligência Fiscal Preditiva (Reforma Tributária 2026/2027):**
   - Parametrização dinâmica das regras de transição de IBS e CBS com simulações de impacto na margem líquida dos 5 CNPJs.

4. **Painel Interativo de Drag & Drop para Programação Fina da Produção (Gantt Interativo):**
   - Reagendamento visual de ordens de produção com recálculo imediato de capacidade instalada por centro de trabalho.

---

### 4. CANAIS DE SUPORTE E ESCALAÇÃO
- **Plantão Técnico (On-Call):** Suporte nível 3 dedicado para incidentes operacionais.
- **Canal de Melhorias:** Registro de sugestões via módulo interno de suporte e governança.

# 📦 POLÍTICA DE RELEASE, MIGRATIONS SEGURAS & FEATURE FLAGS
## NEXUS ERP — PADRÃO DE ENTREGA CONTÍNUA & GOVERNANÇA DE CÓDIGO (V1)

**Versão da Política:** 1.0.0  
**Data de Publicação:** 27 de Agosto de 2026  
**Status:** Vigente e Obrigatória para todos os times de desenvolvimento  

---

### 1. VERSIONAMENTO SEMÂNTICO (SEMVER 2.0)

O NEXUS ERP adota rigorosamente a nomenclatura `MAJOR.MINOR.PATCH`:

- **MAJOR (v1.0 -> v2.0):** Mudanças estruturais de arquitetura, quebra de contratos de API pública ou migrações amplas de banco de dados.
- **MINOR (v1.0 -> v1.1):** Novas funcionalidades retrocompatíveis (novos relatórios, novas telas de PCP, novos fluxos fiscais).
- **PATCH (v1.0.0 -> v1.0.1):** Correções de bugs, ajustes de performance ou correções de segurança que não alteram a assinatura das rotas.

---

### 2. POLÍTICA ESTRITA DE MIGRATIONS SEGURAS (EXPAND-CONTRACT PATTERN)

> 🛑 **REGRA DE OURO ARQUITETURAL:** Nenhuma migration em produção pode quebrar a versão anterior da aplicação enquanto o deploy está em andamento (Zero Downtime).

#### Passo a Passo da Técnica Expand & Contract:

1. **Fase 1: Expand (Aditiva e Segura)**
   - Criar novas colunas, novas tabelas ou índices sempre com valores default ou permitindo `NULL`.
   - Proibido renomear colunas diretamente (`ALTER TABLE RENAME`).

2. **Fase 2: Deploy da Aplicação (Dual-Write / Leitura Suave)**
   - O código passa a gravar no formato novo e mantém fallback para leitura do formato antigo.

3. **Fase 3: Backfill de Dados Históricos (Background Job)**
   - Um script assíncrono migra os registros antigos em lotes de 1.000 para não travar o banco.

4. **Fase 4: Contract (Limpeza Tardia - Somente na Release Seguinte)**
   - Somente após 100% dos dados migrados e validados, a coluna legada é descontinuada através de soft-deprecation.

---

### 3. GOVERNANÇA DE FEATURE FLAGS & ROLLOUT PROGRESSIVO

Todas as novas funcionalidades de grande porte devem ser encapsuladas por Feature Flags gerenciadas centralmente:

| Flag Name | CNPJs Alvo | Modo de Ativação | Estratégia de Rollout |
| :--- | :--- | :--- | :--- |
| `FEATURE_PWA_CHAO_FABRICA` | `EMP_01`, `EMP_02` | `PERCENTAGE` / `TENANT_LIST` | Início com 10% dos operadores da MWAM até atingir 100% do grupo. |
| `FEATURE_MOTOR_IBS_CBS_2026` | Todos os 5 CNPJs | `DATE_TRIGGER` | Ativação automática no primeiro dia de vigência legal da Reforma. |
| `FEATURE_DDA_AUTOMATIZADO` | `EMP_05` (Holding) | `MANUAL_OVERRIDE` | Teste controlado no financeiro central antes da liberação fabril. |

**Regras de Ciclo de Vida das Flags:**
1. Nenhuma feature flag pode permanecer no código por mais de **90 dias** após a liberação de 100% de tráfego.
2. A remoção da flag (hardcoding da funcionalidade estável) deve ser agendada como tarefa técnica obrigatória no próximo ciclo.

---

### 4. PADRÃO DO REGISTRO DE MUDANÇAS (CHANGELOG)

Todo Pull Request aprovado deve incluir um bloco padronizado seguindo o formato:

```markdown
### [1.1.0] - 2026-10-15
#### ✨ Adicionado (Added)
- Módulo PWA Offline para apontamento de OPs no chão de fábrica sem internet.
- Captura de extratos via DDA integrado com a CIP.

#### ⚡ Melhorias (Changed)
- Otimização das queries de DRE Consolidado com redução de 40% no tempo de processamento.
- Atualização do motor de cálculo de custos para suportar fracionamento em 4 casas decimais.

#### 🔒 Segurança & Correções (Fixed)
- Sanitização adicional de caracteres especiais em uploads de arquivos OFX de bancos regionais.
- Renovação automática dos tokens de acesso das filiais do Grupo TRITECH.
```

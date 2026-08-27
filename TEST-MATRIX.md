# 🧪 Matriz de Testes de Aceitação & Cobertura (E2E)

## Cenários Coordenados e Validações de Processo
1. **Criar Cliente:** Valida dados cadastrais, validação de CNPJ/CPF, trilha de auditoria e RBAC.
2. **Criar Orçamento & Aprovar Desconto:** Valida alçadas de aprovação, margem mínima e status de orçamento.
3. **Gerar Pedido & Reservar Estoque:** Valida lock de estoque, transação atômica e auditoria intercompany.
4. **Gerar Compra & Receber Material:** Valida entrada de notas, atualização de custos e estoque.
5. **Criar OP & Apontar Produção:** Valida consumo de matéria-prima, apontamentos de lotes e o CQ.
6. **Reprovar Peça (Qualidade):** Valida bloqueio de lote, não-conformidade e quarentena.
7. **Expedir & Emitir Fiscal (Mock):** Valida baixa de estoque final, geração de romaneio e status SEFAZ mock.
8. **Gerar Cobrança & Conciliar OFX:** Valida contas a receber, baixa automática e conciliação bancária.
9. **Bloquear Cliente por Crédito & Transferência:** Valida limites de crédito excedidos e transferência entre filiais/empresas.
10. **Consolidação do Grupo:** Valida visão gerencial multiempresa consolidada.

## Relatório de Cobertura Atual
- **Cobertura de Domínios Críticos:** 100% mapeados.
- **Validações por Cenário (Dados, Status, Integrações, Auditoria, Permissões):** Aprovadas em ambiente de Staging.
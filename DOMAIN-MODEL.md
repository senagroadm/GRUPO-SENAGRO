# DOMAIN-MODEL.md — Modelo de Domínio e Entidades

## 1. Visão Geral do Domínio

O domínio do sistema atende a operações industriais, comerciais e de serviços distribuídas entre 5 empresas com atividades complementares:
- **MWAM** (Serviços e Montagem Industrial)
- **Oliveira e Amorim** (Distribuição e Comércio de Matéria-Prima/Aço)
- **Senagro** (Fabricação de Maquinário/Equipamentos Agrícolas)
- **Tritech Corte Dobra** (Serviços Especializados de Corte Laser/Plasma e Dobra CNC)
- **Tritech Industrial** (Caldeiraria Pesada e Manufatura de Máquinas)

---

## 2. Mapa dos 20 Módulos do Sistema

| # | Módulo | Bounded Context | Escopo do Módulo |
|---|---|---|---|
| 1 | **Administração** | `Core / Admin` | Gestão de empresas (CNPJs), usuários, perfis, matriz de permissões RBAC, logs de auditoria e configurações gerais. |
| 2 | **CRM** | `Comercial / CRM` | Gestão de leads, prospecções, histórico de interações, funil de vendas, oportunidades por empresa. |
| 3 | **Comercial** | `Comercial` | Gestão de clientes, tabelas de preço, políticas comerciais, metas, comissões de vendedores e representantes. |
| 4 | **Orçamento** | `Comercial / Engenharia` | Formação de preços, orçamentação técnica (cálculo de horas-máquina, peso de chapa/perfil, insumos, margens e impostos). |
| 5 | **Pedido** | `Comercial / Vendas` | Gestão do ciclo de vida dos pedidos de venda (Digitação, Aprovação Comercial, Análise de Crédito, Liberação PCP, Faturamento). |
| 6 | **Crédito / Serasa** | `Financeiro / Crédito` | Políticas de limite de crédito por cliente, histórico de pagamentos internos, esteira de aprovação e integração Serasa (*TODO/decision-needed*). |
| 7 | **Engenharia** | `Engenharia de Produto` | Cadastro técnico de produtos, listas de materiais (BOM multinível), roteiros de fabricação, centros de trabalho, arquivos CAD/DXF/PDF. |
| 8 | **Estoque** | `Materiais / Estoque` | Saldos por almoxarifado/localização, controle de lotes e certificados de matéria-prima (rastreabilidade do aço), custo médio, inventário. |
| 9 | **Compras** | `Suprimentos / Compras` | Requisições de compra, cotações com fornecedores, ordens de compra, aprovação de alçadas, follow-up de entrega. |
| 10 | **PCP** | `Planejamento e Controle` | Plano Mestre de Produção (MPS), MRP I (cálculo de necessidades de materiais), sequenciamento de ordens de produção e balanceamento de carga de máquinas. |
| 11 | **Produção** | `Manufatura` | Gestão de Ordens de Produção (OP), apontamento de tempo e refugo, controle de paradas de máquina, fechamento de custo industrial. |
| 12 | **Corte** | `Manufatura Especializada` | Ordens de corte a laser, plasma e oxicorte, gestão de chapas, aproveitamento de retalhos (sobras úteis) e integração de arquivos de nesting. |
| 13 | **Dobra** | `Manufatura Especializada` | Ordens de dobra CNC, sequência de viradas, ferramentas/matrizes de dobra, controle de raios e tolerâncias dimensionais. |
| 14 | **Serviços** | `Serviços Industriais` | Ordens de Serviço (OS) para caldeiraria externa, usinagem, montagem em campo, manutenção em clientes e locação de mão de obra. |
| 15 | **Qualidade** | `Garantia da Qualidade` | Inspeção de recebimento (matéria-prima), inspeção em processo, inspeção final, Relatório de Não Conformidade (RNC), rastreabilidade de certificados. |
| 16 | **Manutenção** | `Ativos / TPM` | Cadastro de máquinas e equipamentos industriais, planos de manutenção preventiva, ordens de manutenção corretiva, MTBF e MTTR. |
| 17 | **Expedição** | `Logística / Expedição` | Conferência de embalagem, romaneios de carga, pesagem, picking de itens, agendamento de coletas e controle de transportadoras. |
| 18 | **Fiscal** | `Compliance Fiscal` | Regras tributárias (ICMS, IPI, PIS, COFINS, ISS), emissão de NF-e, NFS-e, MDF-e, importação de XML de fornecedores, geração de obrigações. |
| 19 | **Financeiro** | `Finanças` | Contas a pagar (AP), contas a receber (AR), fluxo de caixa previsto x realizado, conciliação bancária, emissão de boletos e remessas CNAB. |
| 20 | **RH Operacional** | `Recursos Humanos` | Cadastro de colaboradores fabris/técnicos, alocação em centros de custo, controle de horas/apontamentos, EPIs e treinamentos normativos (NR-12, NR-35). |
| 21 | **BI & Analytics** | `Gestão Estratégica` | Indicadores de OEE (Eficiência Global de Equipamentos), rentabilidade por pedido/cliente, giro de estoque, backlog de produção e DRE gerencial. |

---

## 3. Principais Entidades e Relacionamentos

### 3.1. Núcleo Multiempresa e Acesso (Core)

```
[ Empresas (5 CNPJs) ]
  |-- 1:N --> [ Filiais / Unidades Operacionais ]
  |-- 1:N --> [ ParametrosConfiguracao ]
  |-- N:N --> [ Usuarios ] (via [ UsuarioEmpresas ])
                 |-- N:N --> [ PerfisAcesso ] (via [ UsuarioPerfis ])
                                |-- 1:N --> [ Permissoes (empresa_id, modulo, acao) ]

[ AuditLogs (Append-Only) ]
  - id, empresa_id, user_id, module, entity_name, entity_id, action, before_state, after_state, ip_address, created_at
```

### 3.2. Parceiros e Cadastros Mestre (Comercial / Suprimentos)

```
[ Parceiros (Clientes / Fornecedores / Transportadoras) ]
  - id (Global/Shared UUID)
  - cnpj_cpf, razao_social, nome_fantasia, ie, im, regime_tributario, endereco, contatos
  |-- 1:N --> [ ParceiroEmpresaInfo ] (dados específicos por empresa: limite_credito, status, condicao_pagamento_padrao, bloqueio)
  |-- 1:N --> [ AnalisesCredito ] (score_serasa, limite_sugerido, parecer, data_validade)
```

### 3.3. Engenharia, Itens e Estoque

```
[ Itens / Produtos ] (id, codigo, descricao, ncm, unidade_medida, tipo: MP, PA, PI, SERVICO, SOBRA)
  |-- 1:N --> [ ItemEmpresaConfig ] (empresa_id, estoque_min, estoque_max, custo_medio, preco_venda, conta_contabil)
  |-- 1:N --> [ EstruturasBOM ] (empresa_id, versao, data_vigencia, ativo)
                 |-- 1:N --> [ EstruturaItens ] (item_componente_id, quantidade, percentual_perda)
  |-- 1:N --> [ RoteirosFabricacao ] (empresa_id, centro_trabalho_id, operacao, tempo_preparacao, tempo_ciclo)

[ Almoxarifados ] (id, empresa_id, codigo, nome, tipo)
  |-- 1:N --> [ PosicoesEstoque ] (rua, bloco, nivel)
                 |-- 1:N --> [ SaldosLote ] (item_id, lote_id, quantidade, certificado_mp_id)

[ MovimentacoesEstoque (Imutável) ]
  - id, empresa_id, item_id, almoxarifado_origem_id, almoxarifado_destino_id, lote_id, tipo_movimento (ENTRADA_COMPRA, SAIDA_OP, RETALHO_CORTE, AJUSTE_INVENTARIO, TRANSF_INTERCOMPANY), quantidade, custo_unitario, documento_origem_tipo, documento_origem_id, created_at, created_by
```

### 3.4. Ciclo Comercial: Orçamento, Pedido e Faturamento

```
[ Orcamentos ] (id, empresa_id, parceiro_id, vendedor_id, numero, revisao, valor_total, status: RASCUNHO, EM_ANALISE, ENGENHARIA, ENVIADO, APROVADO, REPROVADO)
  |-- 1:N --> [ OrcamentoItens ] (item_id, quantidade, custo_mp, custo_usinagem, custo_corte, custo_dobra, margem, valor_unitario)
  |
  +-- (Aprovado) --> [ PedidosVenda ] (id, empresa_id, orcamento_origem_id, parceiro_id, condicao_pagamento, status: AGUARDANDO_CREDITO, LIBERADO_PCP, EM_PRODUCAO, FATURADO_PARCIAL, FATURADO_TOTAL, CANCELADO)
                        |-- 1:N --> [ PedidoVendaItens ] (item_id, qtd_pedida, qtd_produzida, qtd_faturada, valor_unitario)
                        |-- 1:N --> [ OrdensProducao ] (Vinculadas ao pedido)
                        |-- 1:N --> [ DocumentosFiscais ] (NF-e de Faturamento)
```

### 3.5. Ciclo Fabril: PCP, Produção, Corte, Dobra e Serviços

```
[ OrdensProducao (OP) ] (id, empresa_id, numero_op, item_id, quantidade_planejada, quantidade_produzida, quantidade_refugo, data_inicio_prevista, data_fim_prevista, status: PLANEJADA, LIBERADA, EM_ANDAMENTO, PAUSADA, CONCLUIDA, CANCELADA)
  |-- 1:N --> [ OrdensCorte ] (maquina_id: LASER/PLASMA, chapa_item_id, espessura, aproveitamento_percentual, arquivo_nesting_ref)
  |              |-- 1:N --> [ RetalhosGerados ] (item_sobra_id, dimensao_x, dimensao_y, peso, lote_gerado)
  |-- 1:N --> [ OrdensDobra ] (maquina_id: DOBRADEIRA_CNC, programa_cnc, sequencia_dobras, matriz_id, puncao_id)
  |-- 1:N --> [ ApontamentosProducao ] (operador_id, centro_trabalho_id, hora_inicio, hora_fim, qtd_boa, qtd_refugo, motivo_parada_id)
  |-- 1:N --> [ InspecaoQualidade ] (amostragem, status: APROVADO, REPROVADO, APROVADO_CONDICIONAL)
                 |-- 1:N --> [ RNC_NaoConformidade ] (disposicao, causa_raiz, plano_acao)

[ OrdensServico (OS) ] (id, empresa_id, cliente_id, tipo: MONTAGEM_CAMPO, CALDEIRARIA_EXTERNA, MANUTENCAO, status, apontamento_horas, materiais_aplicados)
```

### 3.6. Ciclo Financeiro e Fiscal

```
[ TitulosReceber ] (id, empresa_id, parceiro_id, pedido_venda_id, documento_fiscal_id, parcela, valor_original, valor_saldo, data_emissao, data_vencimento, data_pagamento, status: ABERTO, PAGO_PARCIAL, LIQUIDADO, CANCELADO, EM_COBRANCA)
  |-- 1:N --> [ BoletosBancarios ] (nosso_numero, codigo_barras, linha_digitavel, status_remessa: PENDENTE, REGISTRADO, REJEITADO, BAIXADO)

[ TitulosPagar ] (id, empresa_id, parceiro_id, ordem_compra_id, documento_fiscal_id, parcela, valor_original, data_vencimento, data_pagamento, status)

[ DocumentosFiscais ] (id, empresa_id, modelo: 55_NFE, 65_NFCE, 57_CTE, NFS_E, serie, numero, chave_acesso, xml_storage_path, status_sefaz: DIGITACAO, TRANSMITIDO, AUTORIZADO, CANCELADO, DENEGADO)
  |-- 1:N --> [ DocumentoFiscalItens ] (cfop, ncm, cst_icms, base_calculo_icms, valor_icms, valor_ipi, valor_pis, valor_cofins)
```

---

## 4. Transações Intercompany (Entre os 5 CNPJs)

Devido à sinergia do grupo:
- **Exemplo 1**: Oliveira e Amorim vende chapas de aço cortadas para a Senagro produzir maquinário agrícola.
  - Gera `PedidoVenda` na empresa 2 (Oliveira e Amorim) -> gera `OrdemCompra` na empresa 3 (Senagro).
  - Ao emitir NF-e da empresa 2, o sistema oferece importação automática de XML na empresa 3, criando o `DocumentoFiscal` de entrada e alimentando o estoque da Senagro.
- **Exemplo 2**: Tritech Corte e Dobra presta serviço de corte a laser para a MWAM Engenharia.
  - Gera `OrdemServico` na empresa 4 (Tritech Corte Dobra) e apropriação de despesa de subcontratação na empresa 1 (MWAM).

Todas as transações intercompany preservam rigorosamente o isolamento contábil e fiscal de cada CNPJ, com conciliação automática cruzada por chave de NF-e e identificador de transação espelhada (`intercompany_transaction_id`).

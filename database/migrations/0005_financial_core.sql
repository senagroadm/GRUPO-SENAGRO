-- =============================================================================
-- MIGRATION: 0005_financial_core.sql
-- DESCRIPTION: Núcleo Financeiro Completo: Plano de Contas, Centros de Custo,
-- Categorias Financeiras, Contas a Pagar/Receber, Parcelas, Baixas Parciais,
-- Adiantamentos, Renegociação e Segregação de Funções (SoD).
-- =============================================================================

-- 1. PLANO DE CONTAS (Estrutura Contábil Gerencial / Fiscal)
CREATE TABLE IF NOT EXISTS plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo_estrutural VARCHAR(50) NOT NULL, -- Ex: 1.01.01.001, 3.01.02.005
    nome_conta VARCHAR(150) NOT NULL,
    tipo_conta VARCHAR(20) NOT NULL DEFAULT 'ANALITICA', -- SINTETICA, ANALITICA
    natureza VARCHAR(20) NOT NULL DEFAULT 'DEVEDORA', -- DEVEDORA, CREDORA
    nivel INT NOT NULL DEFAULT 1,
    conta_pai_id UUID NULL REFERENCES plano_contas(id) ON DELETE RESTRICT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, codigo_estrutural)
);
CREATE INDEX IF NOT EXISTS idx_plano_contas_empresa ON plano_contas(empresa_id, codigo_estrutural);

-- 2. CENTROS DE CUSTO (Rateio e Apropriação por Unidade / Setor Fabril)
CREATE TABLE IF NOT EXISTS centros_custo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL, -- Ex: CC-FAB-01, CC-ENG-02, CC-ADM-01
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'PRODUTIVO', -- PRODUTIVO, ADMINISTRATIVO, COMERCIAL, ENGENHARIA, LOGISTICA, MANUTENCAO
    responsavel VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, codigo)
);
CREATE INDEX IF NOT EXISTS idx_centros_custo_empresa ON centros_custo(empresa_id, codigo);

-- 3. CATEGORIAS FINANCEIRAS (Classificação de Receitas e Despesas)
CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- RECEITA, DESPESA, TRANSFERENCIA
    plano_conta_id UUID NULL REFERENCES plano_contas(id) ON DELETE SET NULL,
    cor_hex VARCHAR(10) DEFAULT '#3b82f6',
    dedutivel_fiscal BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, nome, tipo)
);

-- 4. CONTAS A PAGAR (CABEÇALHO DO TÍTULO AP) - NUNCA EXCLUIR FISICAMENTE
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    fornecedor_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    fornecedor_nome VARCHAR(200) NOT NULL,
    fornecedor_cnpj_cpf VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    origem VARCHAR(40) NOT NULL DEFAULT 'MANUAL', -- MANUAL, COMPRAS_ORDEM, FISCAL_NFE_ENTRADA, RENEGOCIACAO, CONTRATO_SERVICO
    ordem_compra_id UUID NULL,
    documento_fiscal_id UUID NULL,
    chave_nfe VARCHAR(44) NULL,
    categoria_financeira_id UUID NULL REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
    centro_custo_id UUID NULL REFERENCES centros_custo(id) ON DELETE SET NULL,
    plano_conta_id UUID NULL REFERENCES plano_contas(id) ON DELETE SET NULL,
    
    valor_original NUMERIC(15,2) NOT NULL,
    valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_liquido NUMERIC(15,2) NOT NULL,
    valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_saldo_restante NUMERIC(15,2) NOT NULL,
    
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento_primeira DATE NOT NULL,
    total_parcelas INT NOT NULL DEFAULT 1,
    
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- RASCUNHO, PENDENTE_APROVACAO, APROVADO, REJEITADO, ABERTO, PARCIALMENTE_PAGO, LIQUIDADO, CANCELADO, RENEGOCIADO
    
    -- SEGREGAÇÃO DE FUNÇÕES (SoD: Lançamento, Aprovação, Pagamento)
    criado_por_usuario_id UUID NOT NULL,
    criado_por_usuario_nome VARCHAR(100) NOT NULL,
    aprovado_por_usuario_id UUID NULL,
    aprovado_por_usuario_nome VARCHAR(100) NULL,
    data_aprovacao TIMESTAMP WITH TIME ZONE NULL,
    motivo_rejeicao TEXT NULL,
    
    motivo_cancelamento TEXT NULL,
    renegociacao_id UUID NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_status ON contas_pagar(empresa_id, status, data_emissao DESC);

-- 5. CONTAS A PAGAR PARCELAS (DETALHAMENTO DE VENCIMENTOS E BAIXAS)
CREATE TABLE IF NOT EXISTS contas_pagar_parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    conta_pagar_id UUID NOT NULL REFERENCES contas_pagar(id) ON DELETE RESTRICT,
    numero_parcela INT NOT NULL,
    total_parcelas INT NOT NULL,
    
    data_vencimento DATE NOT NULL,
    data_pagamento DATE NULL,
    
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_liquido NUMERIC(15,2) NOT NULL,
    valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_saldo NUMERIC(15,2) NOT NULL,
    
    status_parcela VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- ABERTO, PARCIAL, LIQUIDADO, CANCELADO, RENEGOCIADO
    forma_pagamento_prevista VARCHAR(30) DEFAULT 'BOLETO', -- BOLETO, PIX, TED, CHEQUE, DINHEIRO
    codigo_barras_boleto VARCHAR(60) NULL,
    linha_digitavel VARCHAR(60) NULL,
    chave_pix VARCHAR(100) NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (conta_pagar_id, numero_parcela)
);
CREATE INDEX IF NOT EXISTS idx_cp_parcelas_vencimento ON contas_pagar_parcelas(empresa_id, data_vencimento, status_parcela);

-- 6. CONTAS A RECEBER (CABEÇALHO DO TÍTULO AR) - NUNCA EXCLUIR FISICAMENTE
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    cliente_nome VARCHAR(200) NOT NULL,
    cliente_cnpj_cpf VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    origem VARCHAR(40) NOT NULL DEFAULT 'PEDIDO_VENDA', -- PEDIDO_VENDA, FISCAL_NFE_FATURAMENTO, FISCAL_NFSE_SERVICO, MANUAL, RENEGOCIACAO, CONTRATO
    pedido_venda_id UUID NULL REFERENCES pedidos_venda(id) ON DELETE SET NULL,
    documento_fiscal_id UUID NULL REFERENCES documentos_fiscais(id) ON DELETE SET NULL,
    chave_nfe VARCHAR(44) NULL,
    categoria_financeira_id UUID NULL REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
    centro_custo_id UUID NULL REFERENCES centros_custo(id) ON DELETE SET NULL,
    plano_conta_id UUID NULL REFERENCES plano_contas(id) ON DELETE SET NULL,
    
    valor_original NUMERIC(15,2) NOT NULL,
    valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_liquido NUMERIC(15,2) NOT NULL,
    valor_recebido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_saldo_restante NUMERIC(15,2) NOT NULL,
    
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento_primeira DATE NOT NULL,
    total_parcelas INT NOT NULL DEFAULT 1,
    
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- RASCUNHO, PENDENTE_APROVACAO, APROVADO, ABERTO, PARCIALMENTE_RECEBIDO, LIQUIDADO, CANCELADO, RENEGOCIADO, EM_COBRANCA_JUDICIAL
    
    -- SEGREGAÇÃO DE FUNÇÕES
    criado_por_usuario_id UUID NOT NULL,
    criado_por_usuario_nome VARCHAR(100) NOT NULL,
    aprovado_por_usuario_id UUID NULL,
    aprovado_por_usuario_nome VARCHAR(100) NULL,
    data_aprovacao TIMESTAMP WITH TIME ZONE NULL,
    
    motivo_cancelamento TEXT NULL,
    renegociacao_id UUID NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_status ON contas_receber(empresa_id, status, data_emissao DESC);

-- 7. CONTAS A RECEBER PARCELAS (DETALHAMENTO DE RECEBIMENTOS)
CREATE TABLE IF NOT EXISTS contas_receber_parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    conta_receber_id UUID NOT NULL REFERENCES contas_receber(id) ON DELETE RESTRICT,
    numero_parcela INT NOT NULL,
    total_parcelas INT NOT NULL,
    
    data_vencimento DATE NOT NULL,
    data_recebimento DATE NULL,
    
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_juros NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_multa NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_liquido NUMERIC(15,2) NOT NULL,
    valor_recebido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_saldo NUMERIC(15,2) NOT NULL,
    
    status_parcela VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- ABERTO, PARCIAL, LIQUIDADO, CANCELADO, RENEGOCIADO, PROTESTADO
    forma_recebimento_prevista VARCHAR(30) DEFAULT 'BOLETO', -- BOLETO, PIX, TED, CARTAO, DINHEIRO
    nosso_numero VARCHAR(30) NULL,
    linha_digitavel VARCHAR(60) NULL,
    qr_code_pix TEXT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (conta_receber_id, numero_parcela)
);
CREATE INDEX IF NOT EXISTS idx_cr_parcelas_vencimento ON contas_receber_parcelas(empresa_id, data_vencimento, status_parcela);

-- 8. BAIXAS E MOVIMENTAÇÕES FINANCEIRAS (PAGAMENTOS E RECEBIMENTOS PARCIAIS/TOTAIS)
CREATE TABLE IF NOT EXISTS baixas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    tipo_operacao VARCHAR(10) NOT NULL, -- PAGAMENTO, RECEBIMENTO
    conta_pagar_parcela_id UUID NULL REFERENCES contas_pagar_parcelas(id) ON DELETE RESTRICT,
    conta_receber_parcela_id UUID NULL REFERENCES contas_receber_parcelas(id) ON DELETE RESTRICT,
    
    data_baixa DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_pago NUMERIC(15,2) NOT NULL,
    valor_juros_aplicado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_multa_aplicada NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto_aplicado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    forma_pagamento VARCHAR(30) NOT NULL, -- PIX, TED, BOLETO, CARTAO, DINHEIRO, COMPENSACAO_ADIANTAMENTO
    conta_bancaria_id UUID NULL,
    autenticacao_bancaria VARCHAR(100) NULL,
    comprovante_storage_path TEXT NULL,
    observacoes TEXT NULL,
    
    usuario_baixa_id UUID NOT NULL,
    usuario_baixa_nome VARCHAR(100) NOT NULL,
    
    estornado BOOLEAN NOT NULL DEFAULT FALSE,
    data_estorno TIMESTAMP WITH TIME ZONE NULL,
    usuario_estorno_id UUID NULL,
    motivo_estorno TEXT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_baixas_empresa_data ON baixas_financeiras(empresa_id, data_baixa DESC);

-- 9. ADIANTAMENTOS FINANCEIROS (A FORNECEDOR / DE CLIENTE)
CREATE TABLE IF NOT EXISTS adiantamentos_financeiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL, -- A_FORNECEDOR (Pagar), DE_CLIENTE (Receber)
    parceiro_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    parceiro_nome VARCHAR(200) NOT NULL,
    parceiro_cnpj_cpf VARCHAR(20) NOT NULL,
    
    numero_documento VARCHAR(50) NOT NULL,
    data_adiantamento DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_original NUMERIC(15,2) NOT NULL,
    valor_compensado NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_saldo_disponivel NUMERIC(15,2) NOT NULL,
    
    status VARCHAR(30) NOT NULL DEFAULT 'DISPONIVEL', -- DISPONIVEL, PARCIALMENTE_COMPENSADO, TOTALMENTE_COMPENSADO, CANCELADO
    forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'PIX',
    
    usuario_lancamento_id UUID NOT NULL,
    usuario_lancamento_nome VARCHAR(100) NOT NULL,
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_adiantamentos_empresa_saldo ON adiantamentos_financeiros(empresa_id, status, valor_saldo_disponivel);

-- 10. RENEGOCIAÇÃO DE DÍVIDAS / TÍTULOS
CREATE TABLE IF NOT EXISTS renegociacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL, -- PAGAR, RECEBER
    parceiro_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    parceiro_nome VARCHAR(200) NOT NULL,
    
    numero_protocolo VARCHAR(50) NOT NULL,
    data_renegociacao DATE NOT NULL DEFAULT CURRENT_DATE,
    
    valor_total_original NUMERIC(15,2) NOT NULL,
    valor_juros_acordo NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto_acordo NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_renegociado NUMERIC(15,2) NOT NULL,
    
    quantidade_novas_parcelas INT NOT NULL,
    novo_titulo_gerado_id UUID NOT NULL,
    
    motivo_renegociacao TEXT NOT NULL,
    usuario_id UUID NOT NULL,
    usuario_nome VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

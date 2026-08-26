-- =============================================================================
-- MIGRATION: 0005_banking_and_billing.sql
-- DESCRIPTION: Módulo Bancário, Contas Correntes, Caixas, Cobrança (Boletos/PIX),
--              Adapters Bancários, Eventos de Cobrança e Movimentações Financeiras
-- =============================================================================

-- 1. CONTAS BANCÁRIAS MULTIEMPRESA
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    banco_codigo VARCHAR(10) NOT NULL, -- Ex: '341' (Itaú), '001' (Banco do Brasil), '237' (Bradesco), '033' (Santander), '756' (Sicoob)
    banco_nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    agencia_digito VARCHAR(5),
    conta_corrente VARCHAR(30) NOT NULL,
    conta_digito VARCHAR(5) NOT NULL,
    carteira VARCHAR(20) NOT NULL DEFAULT '109', -- Código da carteira de cobrança
    convenio VARCHAR(50), -- Número do convênio/contrato com o banco
    codigo_beneficiario VARCHAR(50), -- Código cedente/beneficiário
    chave_pix VARCHAR(150),
    tipo_chave_pix VARCHAR(20), -- CNPJ, EMAIL, TELEFONE, ALEATORIA
    tipo_conta VARCHAR(30) NOT NULL DEFAULT 'CONTA_CORRENTE', -- CONTA_CORRENTE, POUPANCA, APLICACAO
    saldo_atual NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo_disponivel NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ambiente VARCHAR(20) NOT NULL DEFAULT 'SANDBOX', -- SANDBOX, PRODUCAO
    metadata_credenciais JSONB DEFAULT '{}'::jsonb, -- [TODO/BANCO-DEPENDENT]: client_id, certificado_storage_path, etc.
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_empresa ON contas_bancarias(empresa_id, ativo);

-- 2. CAIXAS FÍSICOS E TESOURARIA
CREATE TABLE IF NOT EXISTS caixas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(40) NOT NULL DEFAULT 'TESOURARIA_CENTRAL', -- TESOURARIA_CENTRAL, FUNDO_FIXO, CAIXA_CHAO_FABRICA
    responsavel_usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    responsavel_nome VARCHAR(150),
    saldo_atual NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ABERTO', -- ABERTO, FECHADO, BLOQUEADO
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, codigo)
);
CREATE INDEX IF NOT EXISTS idx_caixas_empresa ON caixas(empresa_id, status);

-- 3. CONFIGURAÇÕES DE COBRANÇA BANCÁRIA
CREATE TABLE IF NOT EXISTS configuracoes_cobranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    conta_bancaria_id UUID NOT NULL REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
    descricao VARCHAR(150) NOT NULL,
    provider_type VARCHAR(40) NOT NULL DEFAULT 'MOCK', -- MOCK, ITAU_API, BB_API, BRADESCO_API, SANTANDER_API, SICOOB_API, CNAB240, CNAB400
    juros_mensal_percentual NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    multa_percentual NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    dias_protesto INT DEFAULT 0,
    dias_baixa_devolucao INT DEFAULT 30,
    instrucao_1 VARCHAR(200) DEFAULT 'NÃO RECEBER APÓS 30 DIAS DO VENCIMENTO.',
    instrucao_2 VARCHAR(200) DEFAULT 'JUROS DE 1% AO MÊS E MULTA DE 2% APÓS O VENCIMENTO.',
    aceita_pix_hibrido BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    ambiente VARCHAR(20) NOT NULL DEFAULT 'SANDBOX', -- SANDBOX, PRODUCAO
    client_id_config VARCHAR(255), -- [TODO/BANCO-DEPENDENT]
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_config_cobranca_empresa ON configuracoes_cobranca(empresa_id, ativo);

-- 4. COBRANÇAS (BOLETOS, PIX E BOLETOS HÍBRIDOS) - RASTREABILIDADE ESTREITA: EMPRESA + CONTA + TÍTULO + COBRANÇA
CREATE TABLE IF NOT EXISTS cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    conta_bancaria_id UUID NOT NULL REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
    titulo_id UUID NULL REFERENCES titulos_receber(id) ON DELETE RESTRICT,
    config_cobranca_id UUID NOT NULL REFERENCES configuracoes_cobranca(id) ON DELETE RESTRICT,
    nosso_numero VARCHAR(50) NOT NULL,
    seu_numero VARCHAR(50) NOT NULL,
    tipo_cobranca VARCHAR(30) NOT NULL DEFAULT 'BOLETO_HIBRIDO', -- BOLETO, PIX, BOLETO_HIBRIDO, CARTAO
    valor_original NUMERIC(15,2) NOT NULL,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_acrescimos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_cobrado NUMERIC(15,2) NOT NULL,
    valor_pago NUMERIC(15,2) DEFAULT 0.00,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_limite_pagamento DATE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'GERADA', -- GERADA, REGISTRADA, EM_ABERTO, PAGA_TOTAL, PAGA_PARCIAL, BAIXADA, CANCELADA, PROTESTADA, EXPIRADA
    pagador_nome VARCHAR(200) NOT NULL,
    pagador_cnpj_cpf VARCHAR(20) NOT NULL,
    pagador_email VARCHAR(150),
    pagador_telefone VARCHAR(30),
    pagador_endereco_completo VARCHAR(255),
    pagador_cep VARCHAR(10),
    pagador_cidade VARCHAR(100),
    pagador_uf VARCHAR(2),
    linha_digitavel VARCHAR(60),
    codigo_barras VARCHAR(50),
    qr_code_pix TEXT, -- EMV BR Code payload
    qr_code_emv TEXT,
    txid_pix VARCHAR(100),
    url_pdf TEXT,
    url_checkout TEXT,
    mensagem_banco TEXT,
    protocolo_bancario VARCHAR(100),
    raw_provider_payload JSONB DEFAULT '{}'::jsonb,
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, nosso_numero)
);
CREATE INDEX IF NOT EXISTS idx_cobrancas_empresa_venc ON cobrancas(empresa_id, status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cobrancas_rastreabilidade ON cobrancas(empresa_id, conta_bancaria_id, titulo_id);

-- 5. EVENTOS E TRILHA DE AUDITORIA DE COBRANÇAS (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS cobranca_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    cobranca_id UUID NOT NULL REFERENCES cobrancas(id) ON DELETE RESTRICT,
    tipo_evento VARCHAR(40) NOT NULL, -- CRIACAO, REGISTRO_API, CONSULTA_STATUS, ALTERACAO_VENCIMENTO, ALTERACAO_VALOR, BAIXA_MANUAL, BAIXA_RETORNO, WEBHOOK_RECEBIDO, ENVIO_EMAIL, SEGUNDA_VIA_EMITIDA, CANCELAMENTO
    descricao TEXT NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    provider_response JSONB,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(150),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cobranca_eventos ON cobranca_eventos(cobranca_id, timestamp DESC);

-- 6. MOVIMENTOS FINANCEIROS (EXTRATO / CONCILIAÇÃO BANCÁRIA)
CREATE TABLE IF NOT EXISTS movimentos_financeiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    conta_bancaria_id UUID NULL REFERENCES contas_bancarias(id) ON DELETE RESTRICT,
    caixa_id UUID NULL REFERENCES caixas(id) ON DELETE RESTRICT,
    cobranca_id UUID NULL REFERENCES cobrancas(id) ON DELETE SET NULL,
    titulo_id UUID NULL REFERENCES titulos_receber(id) ON DELETE SET NULL,
    tipo_movimento VARCHAR(20) NOT NULL, -- ENTRADA, SAIDA, TRANSFERENCIA
    origem_movimento VARCHAR(50) NOT NULL, -- LIQUIDACAO_COBRANCA, BAIXA_TITULO, TRANSFERENCIA_CONTA, SUPRIMENTO_CAIXA, SANGRIA_CAIXA, AJUSTE_SALDO, TARIFA_BANCARIA
    valor NUMERIC(15,2) NOT NULL,
    data_movimento DATE NOT NULL DEFAULT CURRENT_DATE,
    data_competencia DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao VARCHAR(255) NOT NULL,
    saldo_anterior NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo_posterior NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    conciliado BOOLEAN NOT NULL DEFAULT FALSE,
    data_conciliacao TIMESTAMP WITH TIME ZONE,
    documento_referencia VARCHAR(100),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mov_fin_empresa_data ON movimentos_financeiros(empresa_id, data_movimento DESC);

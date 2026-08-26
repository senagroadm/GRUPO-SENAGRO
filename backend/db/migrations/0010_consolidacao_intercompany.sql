-- 0010_consolidacao_intercompany.sql
-- NEXUS ERP (Grupo TRITECH) - Módulo de Consolidação Gerencial das 5 Empresas & Intercompany

CREATE TABLE IF NOT EXISTS consolidacao_regras_eliminacao (
    id VARCHAR(60) PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_operacao VARCHAR(50) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    eliminar_receita_custo BOOLEAN NOT NULL DEFAULT true,
    eliminar_ativo_passivo BOOLEAN NOT NULL DEFAULT true,
    eliminar_margem_estoque BOOLEAN NOT NULL DEFAULT false,
    observacao_contabil TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transacoes_intercompany (
    id VARCHAR(60) PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'VENDA_MERCANTIL', 'PRESTACAO_SERVICO', 'TRANSFERENCIA_ESTOQUE', 'RATEIO_CSC', 'MUTUO_FINANCEIRO'
    empresa_origem_id UUID NOT NULL REFERENCES empresas(id),
    empresa_destino_id UUID NOT NULL REFERENCES empresas(id),
    documento_ref VARCHAR(100) NOT NULL,
    cfop VARCHAR(20),
    data_emissao DATE NOT NULL,
    data_competencia VARCHAR(10) NOT NULL, -- 'YYYY-MM'
    descricao TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    valor_bruto NUMERIC(18, 4) NOT NULL,
    valor_deducoes_impostos NUMERIC(18, 4) NOT NULL DEFAULT 0,
    valor_liquido NUMERIC(18, 4) NOT NULL,
    custo_origem NUMERIC(18, 4) NOT NULL,
    margem_lucro_embutida NUMERIC(18, 4) NOT NULL DEFAULT 0,
    percentual_margem NUMERIC(8, 4) NOT NULL DEFAULT 0,
    status_reconciliacao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- 'CONCILIADO', 'PENDENTE', 'DIVERGENTE'
    valor_lancado_destino NUMERIC(18, 4) NOT NULL DEFAULT 0,
    divergencia_valor NUMERIC(18, 4) NOT NULL DEFAULT 0,
    motivo_divergencia TEXT,
    eliminavel BOOLEAN NOT NULL DEFAULT true,
    status_eliminacao VARCHAR(30) NOT NULL DEFAULT 'A_ELIMINAR', -- 'A_ELIMINAR', 'ELIMINADO', 'IGNORADO'
    reconciliado_por VARCHAR(255),
    reconciliado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transacoes_ic_origem ON transacoes_intercompany(empresa_origem_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_ic_destino ON transacoes_intercompany(empresa_destino_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_ic_competencia ON transacoes_intercompany(data_competencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_ic_status ON transacoes_intercompany(status_reconciliacao);

CREATE TABLE IF NOT EXISTS csc_rateios (
    id VARCHAR(60) PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    competencia VARCHAR(10) NOT NULL,
    departamento_origem VARCHAR(100) NOT NULL,
    empresa_origem_id UUID NOT NULL REFERENCES empresas(id),
    descricao TEXT NOT NULL,
    valor_total_rateado NUMERIC(18, 4) NOT NULL,
    criterio_rateio VARCHAR(50) NOT NULL, -- 'FATURAMENTO_SHARE', 'HEADCOUNT_COLABORADORES', 'FIXO_PARAMETRIZADO', 'CONSUMO_HORAS_ENG'
    distribuicao_json JSONB NOT NULL,
    aprovado_por VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consolidacao_exposicao_clientes (
    cliente_id VARCHAR(60) PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) NOT NULL,
    segmento VARCHAR(100) NOT NULL,
    score_credito_grupo INT NOT NULL,
    rating_risco VARCHAR(10) NOT NULL,
    limite_credito_global_aprovado NUMERIC(18, 4) NOT NULL,
    exposicao_total_grupo NUMERIC(18, 4) NOT NULL,
    percentual_utilizacao_global NUMERIC(8, 4) NOT NULL,
    titulos_vencidos_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    pdd_calculada_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    pedidos_carteira_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status_limite VARCHAR(30) NOT NULL, -- 'DENTRO_LIMITE', 'ALERTA_80', 'LIMITE_ESTOURADO'
    empresas_com_operacao INT NOT NULL,
    posicao_por_empresa_json JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

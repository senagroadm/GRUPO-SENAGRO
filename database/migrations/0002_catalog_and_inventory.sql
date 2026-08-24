-- =============================================================================
-- MIGRATION: 0002_catalog_and_inventory.sql
-- DESCRIPTION: Cadastros mestre, parceiros, itens, listas de materiais e estoque
-- =============================================================================

-- 1. PARCEIROS DE NEGÓCIOS (GLOBAL / COMPARTILHADO)
CREATE TABLE IF NOT EXISTS parceiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_pessoa VARCHAR(2) NOT NULL DEFAULT 'PJ', -- PJ / PF
    cnpj_cpf VARCHAR(18) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_estadual VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    is_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    is_fornecedor BOOLEAN NOT NULL DEFAULT FALSE,
    is_transportadora BOOLEAN NOT NULL DEFAULT FALSE,
    endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
    contatos JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_parceiros_documento ON parceiros(cnpj_cpf);

-- 2. DADOS ESPECÍFICOS DO PARCEIRO POR EMPRESA (CRÉDITO, CONDIÇÕES, BLOQUEIO)
CREATE TABLE IF NOT EXISTS parceiro_empresa_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    parceiro_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    limite_credito NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    limite_credito_disponivel NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    bloqueio_comercial BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_bloqueio TEXT,
    condicao_pagamento_padrao_id UUID NULL,
    score_credito INT NULL,
    data_ultima_analise_credito TIMESTAMP WITH TIME ZONE NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, parceiro_id)
);
CREATE INDEX IF NOT EXISTS idx_parceiro_empresa ON parceiro_empresa_info(empresa_id, parceiro_id);

-- 3. ITENS / MATERIAIS / PRODUTOS
CREATE TABLE IF NOT EXISTS itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL UNIQUE,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) NOT NULL, -- MATERIA_PRIMA, PRODUTO_ACABADO, PRODUTO_INTERMEDIARIO, RETALHO_SOBRA, CONSUMO, SERVICO
    ncm VARCHAR(10) NOT NULL,
    cest VARCHAR(10),
    unidade_medida VARCHAR(6) NOT NULL, -- KG, M2, UN, PC, M, L
    peso_liquido_kg NUMERIC(12,4) DEFAULT 0.0000,
    peso_bruto_kg NUMERIC(12,4) DEFAULT 0.0000,
    densidade NUMERIC(10,4), -- Ex: 7.85 para aço carbono
    especificacoes_tecnicas JSONB NOT NULL DEFAULT '{}'::jsonb, -- espessura_mm, liga, largura_mm, comprimento_mm
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 4. CONFIGURAÇÃO DE ITENS POR EMPRESA
CREATE TABLE IF NOT EXISTS item_empresa_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    estoque_minimo NUMERIC(15,4) NOT NULL DEFAULT 0,
    estoque_maximo NUMERIC(15,4) NOT NULL DEFAULT 0,
    ponto_pedido NUMERIC(15,4) NOT NULL DEFAULT 0,
    custo_medio NUMERIC(15,4) NOT NULL DEFAULT 0,
    custo_ultima_compra NUMERIC(15,4) NOT NULL DEFAULT 0,
    preco_venda_base NUMERIC(15,4) NOT NULL DEFAULT 0,
    lead_time_dias INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_item_empresa ON item_empresa_config(empresa_id, item_id);

-- 5. ALMOXARIFADOS E SALDOS
CREATE TABLE IF NOT EXISTS almoxarifados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'GERAL', -- MATERIA_PRIMA, PRODUTO_ACABADO, RETALHOS_CORTE, CONSUMO, TERCEIROS
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, codigo)
);

-- 6. LOTES E CERTIFICADOS DE MATÉRIA-PRIMA (RASTREABILIDADE DO AÇO)
CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    numero_lote VARCHAR(60) NOT NULL,
    numero_corrida VARCHAR(60), -- Corrida da usina siderúrgica
    fabricante VARCHAR(150),
    certificado_qualidade_storage_path TEXT,
    propriedades_mecanicas JSONB DEFAULT '{}'::jsonb,
    data_fabricacao DATE,
    data_validade DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, item_id, numero_lote)
);

-- 7. SALDO DE ESTOQUE POR LOCALIZAÇÃO E LOTE
CREATE TABLE IF NOT EXISTS saldos_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    almoxarifado_id UUID NOT NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    lote_id UUID NULL REFERENCES lotes(id) ON DELETE RESTRICT,
    quantidade_atual NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    quantidade_reservada NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, almoxarifado_id, item_id, lote_id)
);

-- 8. MOVIMENTAÇÕES DE ESTOQUE (IMUTÁVEL / NUNCA FAZER HARD DELETE)
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    lote_id UUID NULL REFERENCES lotes(id) ON DELETE RESTRICT,
    almoxarifado_origem_id UUID NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    almoxarifado_destino_id UUID NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    tipo_movimentacao VARCHAR(50) NOT NULL, -- ENTRADA_COMPRA, SAIDA_OP, RETORNO_OP, GERACAO_RETALHO, AJUSTE_INVENTARIO, TRANSF_INTERCOMPANY
    quantidade NUMERIC(15,4) NOT NULL,
    custo_unitario NUMERIC(15,4) NOT NULL,
    custo_total NUMERIC(15,2) NOT NULL,
    documento_origem_tipo VARCHAR(50), -- ORDEM_PRODUCAO, NOTA_FISCAL, INVENTARIO, ORDEM_SERVICO
    documento_origem_id VARCHAR(100),
    observacao TEXT,
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mov_estoque_empresa_item ON movimentacoes_estoque(empresa_id, item_id, created_at DESC);

-- Migration 0002: Catalog & Inventory Schema
CREATE TABLE IF NOT EXISTS parceiros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_origem_id UUID REFERENCES empresas(id) ON DELETE RESTRICT,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj_cpf VARCHAR(20) NOT NULL UNIQUE,
    tipo_parceiro VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_interno VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255) NOT NULL,
    tipo_material VARCHAR(50) NOT NULL,
    unidade_medida VARCHAR(10) NOT NULL,
    ncm VARCHAR(10),
    peso_especifico_kg_m3 NUMERIC(12,4),
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS almoxarifados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    numero_lote VARCHAR(50) NOT NULL,
    numero_corrida_usina VARCHAR(50),
    certificado_usina_url TEXT,
    data_fabricacao DATE,
    data_validade DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(empresa_id, item_id, numero_lote)
);

CREATE TABLE IF NOT EXISTS saldos_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    almoxarifado_id UUID NOT NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    quantidade_atual NUMERIC(15,4) DEFAULT 0 NOT NULL,
    quantidade_reservada NUMERIC(15,4) DEFAULT 0 NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(empresa_id, almoxarifado_id, item_id, lote_id)
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    almoxarifado_id UUID NOT NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    tipo_movimento VARCHAR(30) NOT NULL,
    quantidade NUMERIC(15,4) NOT NULL,
    documento_referencia VARCHAR(100),
    motivo TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

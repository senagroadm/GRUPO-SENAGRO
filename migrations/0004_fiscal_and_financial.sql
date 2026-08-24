-- Migration 0004: Fiscal & Financial
CREATE TABLE IF NOT EXISTS titulos_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    numero_documento VARCHAR(50) NOT NULL,
    parcela INTEGER DEFAULT 1 NOT NULL,
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_saldo NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_liquidacao DATE,
    status VARCHAR(30) DEFAULT 'ABERTO' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS titulos_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    fornecedor_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    numero_documento VARCHAR(50) NOT NULL,
    parcela INTEGER DEFAULT 1 NOT NULL,
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_saldo NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_liquidacao DATE,
    status VARCHAR(30) DEFAULT 'ABERTO' NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

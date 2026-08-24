-- Migration 0003: Manufacturing & Services
CREATE TABLE IF NOT EXISTS engenharia_bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_pai_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    item_filho_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    quantidade_necessaria NUMERIC(15,4) NOT NULL,
    fator_perda_percentual NUMERIC(5,2) DEFAULT 0 NOT NULL,
    versao VARCHAR(20) DEFAULT '1.0' NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ordens_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    numero_op VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    quantidade_planejada NUMERIC(15,4) NOT NULL,
    quantidade_produzida NUMERIC(15,4) DEFAULT 0 NOT NULL,
    status VARCHAR(30) DEFAULT 'CRIADA' NOT NULL,
    data_inicio_prevista DATE,
    data_fim_prevista DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(empresa_id, numero_op)
);

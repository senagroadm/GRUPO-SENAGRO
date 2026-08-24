-- =============================================================================
-- MIGRATION: 0004_fiscal_and_financial.sql
-- DESCRIPTION: Orçamentos, Pedidos, Financeiro (AP/AR), Boletos e Documentos Fiscais
-- =============================================================================

-- 1. ORÇAMENTOS COMERCIAIS / FORMAÇÃO DE PREÇO
CREATE TABLE IF NOT EXISTS orcamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    numero VARCHAR(50) NOT NULL,
    revisao INT NOT NULL DEFAULT 0,
    cliente_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_validade DATE NOT NULL,
    valor_produtos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_servicos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO', -- RASCUNHO, EM_ANALISE_TECNICA, ENVIADO, APROVADO, REPROVADO, CANCELADO
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, numero, revisao)
);

-- 2. PEDIDOS DE VENDA
CREATE TABLE IF NOT EXISTS pedidos_venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    orcamento_origem_id UUID NULL REFERENCES orcamentos(id) ON DELETE SET NULL,
    numero_pedido VARCHAR(50) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_entrega_prometida DATE,
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    condicao_pagamento VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_CREDITO', -- AGUARDANDO_CREDITO, APROVADO_COMERCIAL, LIBERADO_PCP, EM_PRODUCAO, EXPEDIDO, FATURADO_TOTAL, FATURADO_PARCIAL, CANCELADO
    motivo_cancelamento TEXT,
    intercompany_pedido_compra_id UUID NULL, -- Para vínculo de pedidos espelhados
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, numero_pedido)
);

-- 3. TÍTULOS A RECEBER (CONTAS A RECEBER - AR) - NUNCA EXCLUIR FISICAMENTE
CREATE TABLE IF NOT EXISTS titulos_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    pedido_venda_id UUID NULL REFERENCES pedidos_venda(id) ON DELETE RESTRICT,
    documento_fiscal_id UUID NULL,
    numero_documento VARCHAR(50) NOT NULL,
    parcela INT NOT NULL DEFAULT 1,
    total_parcelas INT NOT NULL DEFAULT 1,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE NULL,
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_juros NUMERIC(15,2) DEFAULT 0.00,
    valor_desconto NUMERIC(15,2) DEFAULT 0.00,
    valor_pago NUMERIC(15,2) DEFAULT 0.00,
    valor_saldo NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- ABERTO, PARCIAL, LIQUIDADO, CANCELADO, NEGATIVADO, EM_COBRANCA_JUDICIAL
    forma_pagamento VARCHAR(50) NOT NULL DEFAULT 'BOLETO', -- BOLETO, PIX, TRANSFERENCIA, CARTAO, DINHEIRO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_titulos_rec_empresa ON titulos_receber(empresa_id, status, data_vencimento);

-- 4. TÍTULOS A PAGAR (CONTAS A PAGAR - AP) - NUNCA EXCLUIR FISICAMENTE
CREATE TABLE IF NOT EXISTS titulos_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    fornecedor_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    ordem_compra_id UUID NULL,
    documento_fiscal_id UUID NULL,
    numero_documento VARCHAR(50) NOT NULL,
    parcela INT NOT NULL DEFAULT 1,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE NULL,
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_pago NUMERIC(15,2) DEFAULT 0.00,
    valor_saldo NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- ABERTO, PARCIAL, LIQUIDADO, CANCELADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 5. DOCUMENTOS FISCAIS (NF-E / NFS-E / CT-E / MDF-E) - NUNCA EXCLUIR FISICAMENTE
CREATE TABLE IF NOT EXISTS documentos_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    parceiro_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    tipo_operacao VARCHAR(10) NOT NULL, -- ENTRADA, SAIDA
    modelo VARCHAR(10) NOT NULL, -- 55 (NF-e), 65 (NFC-e), 57 (CT-e), NFSE
    serie VARCHAR(5) NOT NULL,
    numero INT NOT NULL,
    chave_acesso VARCHAR(44) UNIQUE,
    data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_saida_entrada TIMESTAMP WITH TIME ZONE,
    natureza_operacao VARCHAR(100) NOT NULL,
    valor_total_produtos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_servicos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_total_nota NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    xml_armazenamento_path TEXT,
    pdf_danfe_storage_path TEXT,
    protocolo_autorizacao VARCHAR(60),
    status_sefaz VARCHAR(30) NOT NULL DEFAULT 'DIGITACAO', -- DIGITACAO, TRANSMITIDO, AUTORIZADO, REJEITADO, CANCELADO, DENEGADO
    motivo_rejeicao_cancelamento TEXT,
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, modelo, serie, numero)
);
CREATE INDEX IF NOT EXISTS idx_doc_fiscal_empresa_emissao ON documentos_fiscais(empresa_id, data_emissao DESC);

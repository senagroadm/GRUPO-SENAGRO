-- =============================================================================
-- MIGRATION: 0005_nfe_inbound_and_inventory_ledger.sql
-- DESCRIPTION: Modelagem completa de Notas Fiscais de Entrada (NF-e Inbound),
-- Itens da NF-e com Rateio Tributário/Industrial e Integração com Ledger
-- de Movimentações de Estoque (estoque_movimentacoes).
-- =============================================================================

-- Habilita extensão de UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. NOTAS FISCAIS DE ENTRADA (Cabeçalho da NF-e Inbound)
CREATE TABLE IF NOT EXISTS notas_fiscais_entrada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    chave_acesso VARCHAR(44) NOT NULL UNIQUE,
    numero_documento VARCHAR(50) NOT NULL,
    serie VARCHAR(10) NOT NULL DEFAULT '1',
    cnpj_emissor VARCHAR(20) NOT NULL,
    razao_social_emissor VARCHAR(255) NOT NULL,
    inscricao_estadual_emissor VARCHAR(50),
    data_emissao TIMESTAMP WITH TIME ZONE NOT NULL,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valor_total NUMERIC(15,2) NOT NULL,
    valor_produtos NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_frete NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_seguro NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_outras_despesas NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_ipi NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_icms NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_icms_st NUMERIC(15,2) NOT NULL DEFAULT 0,
    natureza_operacao VARCHAR(255),
    protocolo_autorizacao VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'AUTORIZADO', -- 'AUTORIZADO', 'CANCELADO', 'DENEGADO'
    tipo_entrada VARCHAR(30) NOT NULL DEFAULT 'COMPRA_INSUMOS', -- 'COMPRA_INSUMOS', 'DEVOLUCAO', 'REMESSA_BENEFICIAMENTO', 'TRANSFERENCIA'
    xml_conteudo TEXT,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nfe_entrada_empresa ON notas_fiscais_entrada(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfe_entrada_chave ON notas_fiscais_entrada(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_nfe_entrada_cnpj_emissor ON notas_fiscais_entrada(empresa_id, cnpj_emissor);
CREATE INDEX IF NOT EXISTS idx_nfe_entrada_data_emissao ON notas_fiscais_entrada(empresa_id, data_emissao);

-- 2. ITENS DA NOTA FISCAL DE ENTRADA (Produtos / Insumos com rateio de custos)
CREATE TABLE IF NOT EXISTS nfe_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    nota_fiscal_entrada_id UUID NOT NULL REFERENCES notas_fiscais_entrada(id) ON DELETE CASCADE,
    numero_item INTEGER NOT NULL,
    item_id UUID REFERENCES itens(id) ON DELETE RESTRICT,
    codigo_produto VARCHAR(60) NOT NULL,
    descricao_produto VARCHAR(255) NOT NULL,
    ncm VARCHAR(10),
    cfop VARCHAR(10) NOT NULL,
    unidade_medida VARCHAR(10) NOT NULL,
    quantidade NUMERIC(15,4) NOT NULL,
    valor_unitario NUMERIC(15,4) NOT NULL,
    valor_total_bruto NUMERIC(15,2) NOT NULL,
    valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_frete_rateado NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_seguro_rateado NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_outras_despesas_rateado NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_ipi NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_icms NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_icms_st NUMERIC(15,2) NOT NULL DEFAULT 0,
    custo_aquisicao_unitario NUMERIC(15,4) NOT NULL,
    custo_aquisicao_total NUMERIC(15,2) NOT NULL,
    numero_lote VARCHAR(50),
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    almoxarifado_destino_id UUID REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nfe_itens_nota ON nfe_itens(nota_fiscal_entrada_id);
CREATE INDEX IF NOT EXISTS idx_nfe_itens_empresa_item ON nfe_itens(empresa_id, item_id);
CREATE INDEX IF NOT EXISTS idx_nfe_itens_codigo_produto ON nfe_itens(empresa_id, codigo_produto);

-- 3. TABELA / LEDGER DE MOVIMENTAÇÕES DE ESTOQUE (estoque_movimentacoes)
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    almoxarifado_id UUID NOT NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    tipo_movimento VARCHAR(50) NOT NULL, -- 'ENTRADA_COMPRA_NFE', 'SAIDA_PRODUCAO', 'SAIDA_VENDA', 'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SAIDA', 'AJUSTE_INVENTARIO'
    quantidade NUMERIC(15,4) NOT NULL,
    custo_unitario NUMERIC(15,4) NOT NULL DEFAULT 0,
    custo_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo_anterior NUMERIC(15,4) NOT NULL DEFAULT 0,
    saldo_posterior NUMERIC(15,4) NOT NULL DEFAULT 0,
    documento_origem_tipo VARCHAR(50) NOT NULL DEFAULT 'NOTA_FISCAL_ENTRADA', -- 'NOTA_FISCAL_ENTRADA', 'ORDEM_PRODUCAO', 'PEDIDO_VENDA', 'INVENTARIO'
    documento_origem_id UUID REFERENCES notas_fiscais_entrada(id) ON DELETE SET NULL,
    nfe_item_id UUID REFERENCES nfe_itens(id) ON DELETE SET NULL,
    chave_acesso_nfe VARCHAR(44),
    documento_referencia VARCHAR(100),
    motivo TEXT,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estoque_mov_empresa ON estoque_movimentacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_item ON estoque_movimentacoes(empresa_id, item_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_almox ON estoque_movimentacoes(empresa_id, almoxarifado_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_nfe_item ON estoque_movimentacoes(nfe_item_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_chave_nfe ON estoque_movimentacoes(empresa_id, chave_acesso_nfe);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_data ON estoque_movimentacoes(empresa_id, criado_em);

-- 4. VIEW / COMPATIBILIDADE COM movimentacoes_estoque
CREATE OR REPLACE VIEW v_ledger_estoque_unificado AS
SELECT 
    em.id,
    em.empresa_id,
    em.item_id,
    em.almoxarifado_id,
    em.lote_id,
    em.tipo_movimento,
    em.quantidade,
    em.custo_unitario,
    em.custo_total,
    em.saldo_anterior,
    em.saldo_posterior,
    em.documento_origem_tipo,
    em.documento_origem_id,
    em.chave_acesso_nfe,
    em.documento_referencia,
    em.motivo,
    em.usuario_id,
    em.criado_em
FROM estoque_movimentacoes em;

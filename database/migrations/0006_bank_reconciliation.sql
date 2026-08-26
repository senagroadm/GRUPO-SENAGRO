-- ============================================================================
-- MIGRATION: 0006_bank_reconciliation.sql
-- NEXUS ERP (Grupo TRITECH - 5 CNPJs)
-- MÓDULO BANCÁRIO & CONCILIAÇÃO BANCÁRIA
-- ============================================================================

-- 1. TABELA DE CABEÇALHO DE EXTRATOS BANCÁRIOS IMPORTADOS (OFX / CSV)
CREATE TABLE IF NOT EXISTS extratos_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    conta_bancaria_id UUID NOT NULL REFERENCES contas_bancarias(id),
    banco_codigo VARCHAR(10) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta_corrente VARCHAR(30) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    saldo_inicial NUMERIC(15,2),
    saldo_final NUMERIC(15,2),
    formato VARCHAR(10) NOT NULL CHECK (formato IN ('OFX', 'CSV')),
    nome_arquivo VARCHAR(255) NOT NULL,
    hash_arquivo VARCHAR(128) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IMPORTADO' CHECK (status IN ('IMPORTADO', 'PARCIALMENTE_CONCILIADO', 'TOTALMENTE_CONCILIADO', 'CANCELADO')),
    total_itens INTEGER NOT NULL DEFAULT 0,
    total_conciliados INTEGER NOT NULL DEFAULT 0,
    total_creditos INTEGER NOT NULL DEFAULT 0,
    total_debitos INTEGER NOT NULL DEFAULT 0,
    valor_total_creditos NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_total_debitos NUMERIC(15,2) NOT NULL DEFAULT 0,
    usuario_importador_id UUID,
    usuario_importador_nome VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_extratos_empresa_conta ON extratos_bancarios(empresa_id, conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_extratos_periodo ON extratos_bancarios(empresa_id, data_inicio, data_fim);

-- 2. TABELA DE ITENS / LINHAS DO EXTRATO BANCÁRIO
CREATE TABLE IF NOT EXISTS extrato_bancario_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extrato_id UUID NOT NULL REFERENCES extratos_bancarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    conta_bancaria_id UUID NOT NULL REFERENCES contas_bancarias(id),
    data_transacao DATE NOT NULL,
    tipo_transacao VARCHAR(10) NOT NULL CHECK (tipo_transacao IN ('CREDITO', 'DEBITO')),
    valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
    valor_original_sinal NUMERIC(15,2) NOT NULL,
    fitid VARCHAR(100) NOT NULL,
    checknum VARCHAR(50),
    refnum VARCHAR(50),
    memo TEXT NOT NULL,
    categoria_detectada VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'SUGERIDO', 'CONCILIADO', 'IGNORADO')),
    
    -- Metadados de Match Sugerido (JSONB)
    match_sugerido JSONB,
    
    -- Metadados de Conciliação Efetiva (JSONB)
    conciliacao_efetiva JSONB,
    
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restrição de Idempotência: Um FITID nunca pode ser duplicado na mesma conta bancária
    CONSTRAINT uq_extrato_item_fitid UNIQUE (empresa_id, conta_bancaria_id, fitid)
);

CREATE INDEX IF NOT EXISTS idx_extrato_itens_empresa_status ON extrato_bancario_itens(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_extrato_itens_data_valor ON extrato_bancario_itens(empresa_id, data_transacao, valor);
CREATE INDEX IF NOT EXISTS idx_extrato_itens_fitid ON extrato_bancario_itens(empresa_id, fitid);

-- 3. TABELA DE PRESETS DE MAPEAMENTO CSV CONFIGURÁVEIS
CREATE TABLE IF NOT EXISTS presets_mapeamento_csv (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    banco_codigo VARCHAR(10),
    config JSONB NOT NULL,
    is_sistema BOOLEAN DEFAULT true,
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRILHA DE AUDITORIA DE CONCILIAÇÃO BANCÁRIA (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS conciliacao_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    extrato_item_id UUID REFERENCES extrato_bancario_itens(id),
    fitid VARCHAR(100) NOT NULL,
    acao VARCHAR(50) NOT NULL,
    match_score NUMERIC(5,2),
    nivel_confianca VARCHAR(20),
    motivo TEXT NOT NULL,
    usuario_id UUID,
    usuario_nome VARCHAR(150),
    payload_before JSONB,
    payload_after JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conciliacao_auditoria ON conciliacao_auditoria_logs(empresa_id, extrato_item_id, timestamp);

-- 0010_auditoria_transversal.sql
-- NEXUS ERP (Grupo TRITECH) - Módulo 14: Auditoria Transversal & Trilha Imutável

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Contexto de Usuário
    usuario_id VARCHAR(100) NOT NULL,
    usuario_nome VARCHAR(255) NOT NULL,
    usuario_email VARCHAR(255) NOT NULL,
    usuario_perfil VARCHAR(100) NOT NULL,
    
    -- Contexto Multi-empresa (Isolamento e Escopo nos 5 CNPJs)
    empresa_id VARCHAR(100) NOT NULL,
    empresa_codigo VARCHAR(100) NOT NULL,
    empresa_cnpj VARCHAR(20) NOT NULL,
    
    -- Dados da Ação Crítica
    modulo VARCHAR(80) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(120) NOT NULL,
    entidade_id VARCHAR(120) NOT NULL,
    severidade VARCHAR(30) NOT NULL DEFAULT 'BAIXA', -- 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'
    
    -- Origem de Rede & Metadados Técnicos
    ip VARCHAR(50) NOT NULL,
    user_agent TEXT NOT NULL,
    justificativa TEXT,
    
    -- Snapshots de Estado (JSONB para consulta indexada)
    payload_before JSONB,
    payload_after JSONB,
    diff_campos JSONB,
    metadados_extras JSONB,
    
    -- Criptografia & Encadeamento de Integridade (Blockchain-like Hash Chain)
    hash_integridade VARCHAR(128) NOT NULL,
    hash_anterior VARCHAR(128),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices otimizados para consultas de auditoria, fiscalização e compliance
CREATE INDEX IF NOT EXISTS idx_audit_empresa_id ON audit_logs (empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_modulo ON audit_logs (modulo);
CREATE INDEX IF NOT EXISTS idx_audit_acao ON audit_logs (acao);
CREATE INDEX IF NOT EXISTS idx_audit_usuario_id ON audit_logs (usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidade_id ON audit_logs (entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_request_id ON audit_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_severidade ON audit_logs (severidade);
CREATE INDEX IF NOT EXISTS idx_audit_payload_before_gin ON audit_logs USING GIN (payload_before);
CREATE INDEX IF NOT EXISTS idx_audit_payload_after_gin ON audit_logs USING GIN (payload_after);

-- Tabela de Solicitações e Downloads de Exportação de Auditoria (Compliance)
CREATE TABLE IF NOT EXISTS audit_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(100) NOT NULL,
    usuario_nome VARCHAR(255) NOT NULL,
    empresa_id VARCHAR(100) NOT NULL,
    formato VARCHAR(20) NOT NULL, -- 'PDF', 'CSV', 'JSON'
    motivo TEXT NOT NULL,
    filtros_aplicados JSONB NOT NULL,
    quantidade_registros INT NOT NULL,
    hash_arquivo VARCHAR(128) NOT NULL,
    ip VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

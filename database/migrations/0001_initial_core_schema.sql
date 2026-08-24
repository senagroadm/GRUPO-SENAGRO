-- =============================================================================
-- MIGRATION: 0001_initial_core_schema.sql
-- DESCRIPTION: Estrutura inicial do núcleo multiempresa, RBAC e trilha de auditoria
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE EMPRESAS (5 CNPJs DO GRUPO)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    regime_tributario VARCHAR(50) NOT NULL DEFAULT 'LUCRO_REAL', -- LUCRO_REAL, LUCRO_PRESUMIDO, SIMPLES_NACIONAL
    ramo_atividade VARCHAR(100) NOT NULL,
    endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
    contato JSONB NOT NULL DEFAULT '{}'::jsonb,
    configuracoes_fiscais JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 2. USUÁRIOS DO SISTEMA
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    telefone VARCHAR(30),
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- 3. VÍNCULO DE USUÁRIOS COM EMPRESAS
CREATE TABLE IF NOT EXISTS usuario_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    is_empresa_padrao BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (usuario_id, empresa_id)
);
CREATE INDEX IF NOT EXISTS idx_usuario_empresas_user ON usuario_empresas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_empresas_empresa ON usuario_empresas(empresa_id);

-- 4. PERFIS DE ACESSO
CREATE TABLE IF NOT EXISTS perfis_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NULL REFERENCES empresas(id) ON DELETE RESTRICT, -- NULL = Perfil Global
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. PERMISSÕES GRANULARES (EMPRESA + MÓDULO + AÇÃO)
CREATE TABLE IF NOT EXISTS permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES perfis_acesso(id) ON DELETE CASCADE,
    empresa_id UUID NULL REFERENCES empresas(id) ON DELETE RESTRICT, -- NULL aplica a todas onde o perfil for válido
    modulo VARCHAR(50) NOT NULL, -- ADMINISTRACAO, CRM, COMERCIAL, ORCAMENTO, PEDIDO, CREDITO, ENGENHARIA, ESTOQUE, COMPRAS, PCP, PRODUCAO, CORTE, DOBRA, SERVICOS, QUALIDADE, MANUTENCAO, EXPEDICAO, FISCAL, FINANCEIRO, RH, BI
    acao VARCHAR(30) NOT NULL,   -- READ, CREATE, UPDATE, DELETE, APPROVE, CANCEL, EXPORT, ADMIN
    permitido BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (perfil_id, empresa_id, modulo, acao)
);
CREATE INDEX IF NOT EXISTS idx_permissoes_lookup ON permissoes(perfil_id, modulo, acao);

-- 6. ASSOCIAÇÃO USUÁRIO - PERFIL
CREATE TABLE IF NOT EXISTS usuario_perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    perfil_id UUID NOT NULL REFERENCES perfis_acesso(id) ON DELETE RESTRICT,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (usuario_id, perfil_id, empresa_id)
);

-- 7. TABELA DE AUDITORIA UNIFICADA (APPEND-ONLY, NUNCA EXCLUIR)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    modulo VARCHAR(50) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id VARCHAR(100) NOT NULL,
    acao VARCHAR(30) NOT NULL, -- INSERT, UPDATE, SOFT_DELETE, CANCEL, APPROVE, REJECT, EXPORT
    estado_anterior JSONB NULL,
    estado_posterior JSONB NULL,
    ip_origem VARCHAR(45),
    user_agent TEXT,
    correlation_id VARCHAR(100),
    motivo_justificativa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_empresa_created ON audit_logs(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_logs(empresa_id, entidade, entidade_id);

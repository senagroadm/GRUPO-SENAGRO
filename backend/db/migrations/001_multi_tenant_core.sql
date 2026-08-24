-- ==============================================================================
-- NEXUS ERP - MIGRATION 001: MULTI-TENANT CORE SCHEMA
-- ==============================================================================
-- Description: Core tables for multi-company isolation, users, profiles,
-- permissions, company associations, and audit trails.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA: EMPRESAS (Suporte a múltiplos CNPJs com unicidade estrita)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    regime_tributario VARCHAR(50) NOT NULL CHECK (regime_tributario IN ('LUCRO_REAL', 'LUCRO_PRESUMIDO', 'SIMPLES_NACIONAL')),
    ramo_atividade TEXT NOT NULL,
    is_matriz BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas (cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_codigo ON empresas (codigo);
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas (ativo);

-- 3. TABELA: USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14),
    cargo VARCHAR(100),
    senha_hash VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios (ativo);

-- 4. TABELA: PERFIS (Perfis de Acesso com Escopo)
CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel_acesso VARCHAR(50) NOT NULL DEFAULT 'EMPRESA' CHECK (nivel_acesso IN ('GRUPO', 'EMPRESA', 'OPERACIONAL')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_codigo ON perfis (codigo);

-- 5. TABELA: PERMISSOES (Catálogo Modular de Permissões)
CREATE TABLE IF NOT EXISTS permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(100) NOT NULL UNIQUE,
    modulo VARCHAR(50) NOT NULL,
    acao VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissoes_modulo ON permissoes (modulo);

-- 6. TABELA: PERFIL_PERMISSOES (N:N Perfil <-> Permissão)
CREATE TABLE IF NOT EXISTS perfil_permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_perfil_permissao UNIQUE (perfil_id, permissao_id)
);

CREATE INDEX IF NOT EXISTS idx_perfil_permissoes_perfil ON perfil_permissoes (perfil_id);

-- 7. TABELA: USUARIO_EMPRESAS (Vínculo N:N Usuário <-> Empresa com Perfil Específico)
CREATE TABLE IF NOT EXISTS usuario_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
    padrao BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_usuario_empresa UNIQUE (usuario_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_empresas_user ON usuario_empresas (usuario_id, ativo);
CREATE INDEX IF NOT EXISTS idx_usuario_empresas_empresa ON usuario_empresas (empresa_id, ativo);

-- 8. TABELA: AUDITORIA DE TROCA DE CONTEXTO DE EMPRESA
CREATE TABLE IF NOT EXISTS empresa_context_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_origem_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    empresa_destino_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    motivo VARCHAR(255),
    ip_origem VARCHAR(45),
    user_agent TEXT,
    correlation_id VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_context_user ON empresa_context_audit_logs (usuario_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_context_destino ON empresa_context_audit_logs (empresa_destino_id);

-- 9. TABELA: AUDIT_LOGS GERAIS (Toda mutação de dados carrega empresa_id)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    correlation_id VARCHAR(100),
    modulo VARCHAR(50) NOT NULL,
    acao VARCHAR(50) NOT NULL,
    tabela_afetada VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    estado_anterior JSONB,
    estado_novo JSONB,
    ip_origem VARCHAR(45),
    user_agent TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_data ON audit_logs (empresa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo ON audit_logs (modulo);

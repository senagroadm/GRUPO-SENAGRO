-- ==============================================================================
-- NEXUS ERP - MIGRATION 009
-- BI, ANALYTICS, INDICADORES & DASHBOARDS
-- ==============================================================================
--
-- Esta migration depende da:
--   001_multi_tenant_core.sql
--
-- Regras:
--   - empresa_id utiliza UUID e referencia empresas(id)
--   - Indicadores podem ter escopo EMPRESA ou GRUPO
--   - Para escopo GRUPO, empresa_id permanece NULL
--   - Dados históricos permanecem isolados por empresa
-- ==============================================================================


-- ==============================================================================
-- 1. INDICADORES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bi_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    codigo VARCHAR(60) NOT NULL UNIQUE,

    nome VARCHAR(255) NOT NULL,

    descricao TEXT,

    categoria VARCHAR(40) NOT NULL
        CHECK (
            categoria IN (
                'GRUPO',
                'FINANCEIRO',
                'INDUSTRIAL',
                'COMERCIAL',
                'ESTOQUE',
                'QUALIDADE'
            )
        ),

    unidade VARCHAR(30) NOT NULL
        CHECK (
            unidade IN (
                'BRL',
                'PERCENTUAL',
                'QUANTIDADE',
                'HORAS',
                'DIAS',
                'PONTOS'
            )
        ),

    formula TEXT NOT NULL,

    periodicidade VARCHAR(30) NOT NULL
        CHECK (
            periodicidade IN (
                'DIARIO',
                'SEMANAL',
                'MENSAL',
                'TRIMESTRAL',
                'ANUAL'
            )
        ),

    polaridade VARCHAR(30) NOT NULL
        CHECK (
            polaridade IN (
                'MAIOR_MELHOR',
                'MENOR_MELHOR',
                'ALVO_EXATO'
            )
        ),

    valor_referencia_mercado NUMERIC(15, 4),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bi_indicadores_categoria
    ON bi_indicadores(categoria);

CREATE INDEX IF NOT EXISTS idx_bi_indicadores_ativo
    ON bi_indicadores(ativo);


-- ==============================================================================
-- 2. METAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bi_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    indicador_id UUID NOT NULL
        REFERENCES bi_indicadores(id)
        ON DELETE CASCADE,

    -- NULL = meta consolidada do GRUPO
    -- UUID = meta específica de uma empresa
    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    escopo VARCHAR(20) NOT NULL DEFAULT 'EMPRESA'
        CHECK (escopo IN ('GRUPO', 'EMPRESA')),

    ano INT NOT NULL
        CHECK (ano >= 2000 AND ano <= 2100),

    mes INT
        CHECK (mes IS NULL OR (mes >= 1 AND mes <= 12)),

    valor_alvo NUMERIC(18, 4) NOT NULL,

    limite_alerta_amarelo NUMERIC(18, 4) NOT NULL,

    limite_critico_vermelho NUMERIC(18, 4) NOT NULL,

    responsavel_nome VARCHAR(255) NOT NULL,

    observacoes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_bi_metas_escopo_empresa
        CHECK (
            (escopo = 'GRUPO' AND empresa_id IS NULL)
            OR
            (escopo = 'EMPRESA' AND empresa_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_bi_metas_empresa
    ON bi_metas(empresa_id, ano);

CREATE INDEX IF NOT EXISTS idx_bi_metas_indicador
    ON bi_metas(indicador_id);

CREATE INDEX IF NOT EXISTS idx_bi_metas_periodo
    ON bi_metas(ano, mes);

CREATE INDEX IF NOT EXISTS idx_bi_metas_escopo
    ON bi_metas(escopo);


-- ==============================================================================
-- 3. HISTÓRICO DOS INDICADORES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bi_historico_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    indicador_id UUID NOT NULL
        REFERENCES bi_indicadores(id)
        ON DELETE CASCADE,

    -- NULL = histórico consolidado do GRUPO
    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    escopo VARCHAR(20) NOT NULL DEFAULT 'EMPRESA'
        CHECK (escopo IN ('GRUPO', 'EMPRESA')),

    periodo VARCHAR(20) NOT NULL,

    valor_realizado NUMERIC(18, 4) NOT NULL,

    valor_meta NUMERIC(18, 4) NOT NULL,

    variacao_percentual NUMERIC(10, 4) NOT NULL,

    status_alerta VARCHAR(30) NOT NULL
        CHECK (
            status_alerta IN (
                'NORMAL',
                'ATENCAO',
                'CRITICO'
            )
        ),

    detalhes_json JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_bi_historico_escopo_empresa
        CHECK (
            (escopo = 'GRUPO' AND empresa_id IS NULL)
            OR
            (escopo = 'EMPRESA' AND empresa_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_bi_historico_empresa_periodo
    ON bi_historico_indicadores(empresa_id, periodo);

CREATE INDEX IF NOT EXISTS idx_bi_historico_indicador
    ON bi_historico_indicadores(indicador_id);

CREATE INDEX IF NOT EXISTS idx_bi_historico_status
    ON bi_historico_indicadores(status_alerta);

CREATE INDEX IF NOT EXISTS idx_bi_historico_escopo
    ON bi_historico_indicadores(escopo);


-- ==============================================================================
-- 4. ALERTAS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bi_alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    escopo VARCHAR(20) NOT NULL DEFAULT 'EMPRESA'
        CHECK (escopo IN ('GRUPO', 'EMPRESA')),

    indicador_id UUID NOT NULL
        REFERENCES bi_indicadores(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL
        CHECK (
            status IN (
                'ATENCAO',
                'CRITICO'
            )
        ),

    valor_atual NUMERIC(18, 4) NOT NULL,

    valor_meta NUMERIC(18, 4) NOT NULL,

    limite_violado NUMERIC(18, 4) NOT NULL,

    data_disparo TIMESTAMPTZ NOT NULL,

    mensagem_diagnostico TEXT NOT NULL,

    plano_acao_sugerido TEXT NOT NULL,

    reconhecido BOOLEAN NOT NULL DEFAULT FALSE,

    reconhecido_por UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    data_reconhecimento TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_bi_alertas_escopo_empresa
        CHECK (
            (escopo = 'GRUPO' AND empresa_id IS NULL)
            OR
            (escopo = 'EMPRESA' AND empresa_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_bi_alertas_empresa
    ON bi_alertas(empresa_id, status);

CREATE INDEX IF NOT EXISTS idx_bi_alertas_indicador
    ON bi_alertas(indicador_id);

CREATE INDEX IF NOT EXISTS idx_bi_alertas_data
    ON bi_alertas(data_disparo DESC);

CREATE INDEX IF NOT EXISTS idx_bi_alertas_reconhecido
    ON bi_alertas(reconhecido);


-- ==============================================================================
-- 5. CONFIGURAÇÕES DOS DASHBOARDS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bi_dashboard_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    -- NULL = dashboard consolidado do GRUPO
    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    dashboard_tipo VARCHAR(40) NOT NULL
        CHECK (
            dashboard_tipo IN (
                'GRUPO',
                'EMPRESA',
                'INDUSTRIAL',
                'COMERCIAL',
                'FINANCEIRO'
            )
        ),

    auto_refresh_interval_segundos INT NOT NULL DEFAULT 60
        CHECK (auto_refresh_interval_segundos >= 10),

    tema_cores VARCHAR(40) NOT NULL DEFAULT 'PADRAO_TECNICO',

    widgets_config JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bi_dashboard_usuario
    ON bi_dashboard_configs(usuario_id);

CREATE INDEX IF NOT EXISTS idx_bi_dashboard_empresa
    ON bi_dashboard_configs(empresa_id);

CREATE INDEX IF NOT EXISTS idx_bi_dashboard_tipo
    ON bi_dashboard_configs(dashboard_tipo);


-- ==============================================================================
-- 6. AUDITORIA ESPECÍFICA DO BI
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bi_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    usuario_nome VARCHAR(255) NOT NULL,

    modulo VARCHAR(40) NOT NULL DEFAULT 'BI_ANALYTICS',

    acao VARCHAR(100) NOT NULL,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    payload_before JSONB,

    payload_after JSONB
);

CREATE INDEX IF NOT EXISTS idx_bi_auditoria_empresa
    ON bi_auditoria_logs(empresa_id);

CREATE INDEX IF NOT EXISTS idx_bi_auditoria_usuario
    ON bi_auditoria_logs(usuario_id);

CREATE INDEX IF NOT EXISTS idx_bi_auditoria_timestamp
    ON bi_auditoria_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_bi_auditoria_acao
    ON bi_auditoria_logs(acao);


-- ==============================================================================
-- FIM DA MIGRATION 009
-- ==============================================================================

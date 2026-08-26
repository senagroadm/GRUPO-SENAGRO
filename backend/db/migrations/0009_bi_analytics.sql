-- 0009_bi_analytics.sql
-- NEXUS ERP (Grupo TRITECH) - Módulo 13: BI, Analytics, Indicadores & Dashboards Consolidados

CREATE TABLE IF NOT EXISTS bi_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(40) NOT NULL, -- 'GRUPO', 'FINANCEIRO', 'INDUSTRIAL', 'COMERCIAL', 'ESTOQUE', 'QUALIDADE'
    unidade VARCHAR(30) NOT NULL, -- 'BRL', 'PERCENTUAL', 'QUANTIDADE', 'HORAS', 'DIAS', 'PONTOS'
    formula TEXT NOT NULL,
    periodicidade VARCHAR(30) NOT NULL, -- 'DIARIO', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'ANUAL'
    polaridade VARCHAR(30) NOT NULL, -- 'MAIOR_MELHOR', 'MENOR_MELHOR', 'ALVO_EXATO'
    valor_referencia_mercado NUMERIC(15, 4),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicador_id UUID NOT NULL REFERENCES bi_indicadores(id) ON DELETE CASCADE,
    empresa_id VARCHAR(60) NOT NULL, -- 'GRUPO' ou UUID da empresa
    ano INT NOT NULL,
    mes INT, -- 1 a 12 ou NULL para anual
    valor_alvo NUMERIC(18, 4) NOT NULL,
    limite_alerta_amarelo NUMERIC(18, 4) NOT NULL,
    limite_critico_vermelho NUMERIC(18, 4) NOT NULL,
    responsavel_nome VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi_historico_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicador_id UUID NOT NULL REFERENCES bi_indicadores(id) ON DELETE CASCADE,
    empresa_id VARCHAR(60) NOT NULL, -- 'GRUPO' ou UUID da empresa
    periodo VARCHAR(20) NOT NULL, -- '2026-08', '2026-08-26'
    valor_realizado NUMERIC(18, 4) NOT NULL,
    valor_meta NUMERIC(18, 4) NOT NULL,
    variacao_percentual NUMERIC(10, 4) NOT NULL,
    status_alerta VARCHAR(30) NOT NULL, -- 'NORMAL', 'ATENCAO', 'CRITICO'
    detalhes_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi_alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id VARCHAR(60) NOT NULL,
    indicador_id UUID NOT NULL REFERENCES bi_indicadores(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL, -- 'ATENCAO', 'CRITICO'
    valor_atual NUMERIC(18, 4) NOT NULL,
    valor_meta NUMERIC(18, 4) NOT NULL,
    limite_violado NUMERIC(18, 4) NOT NULL,
    data_disparo TIMESTAMP WITH TIME ZONE NOT NULL,
    mensagem_diagnostico TEXT NOT NULL,
    plano_acao_sugerido TEXT NOT NULL,
    reconhecido BOOLEAN NOT NULL DEFAULT false,
    reconhecido_por VARCHAR(255),
    data_reconhecimento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi_dashboard_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(60) NOT NULL,
    empresa_id VARCHAR(60) NOT NULL DEFAULT 'GRUPO',
    dashboard_tipo VARCHAR(40) NOT NULL, -- 'GRUPO', 'EMPRESA', 'INDUSTRIAL', 'COMERCIAL', 'FINANCEIRO'
    auto_refresh_interval_segundos INT NOT NULL DEFAULT 60,
    tema_cores VARCHAR(40) NOT NULL DEFAULT 'PADRAO_TECNICO',
    widgets_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bi_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id VARCHAR(60) NOT NULL,
    usuario_id VARCHAR(60) NOT NULL,
    usuario_nome VARCHAR(255) NOT NULL,
    modulo VARCHAR(40) NOT NULL DEFAULT 'BI_ANALYTICS',
    acao VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payload_before JSONB,
    payload_after JSONB
);

CREATE INDEX IF NOT EXISTS idx_bi_metas_empresa ON bi_metas(empresa_id, ano);
CREATE INDEX IF NOT EXISTS idx_bi_historico_periodo ON bi_historico_indicadores(empresa_id, periodo);
CREATE INDEX IF NOT EXISTS idx_bi_alertas_empresa ON bi_alertas(empresa_id, status);

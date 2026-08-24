-- =============================================================================
-- MIGRATION: 0003_manufacturing_and_services.sql
-- DESCRIPTION: Estruturas de engenharia (BOM), PCP, OPs, Corte, Dobra e Serviços
-- =============================================================================

-- 1. ESTRUTURA DE PRODUTO / LISTA DE MATERIAIS (BOM)
CREATE TABLE IF NOT EXISTS engenharia_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    item_pai_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    versao VARCHAR(20) NOT NULL DEFAULT '1.0',
    descricao VARCHAR(255),
    data_aprovacao DATE,
    aprovado_por UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    is_ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, item_pai_id, versao)
);

CREATE TABLE IF NOT EXISTS engenharia_bom_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL REFERENCES engenharia_bom(id) ON DELETE CASCADE,
    item_componente_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    quantidade NUMERIC(15,4) NOT NULL,
    percentual_perda NUMERIC(6,2) DEFAULT 0.00,
    observacao_montagem TEXT,
    posicao_desenho VARCHAR(50)
);

-- 2. CENTROS DE TRABALHO / MÁQUINAS INDUSTRIAIS
CREATE TABLE IF NOT EXISTS centros_trabalho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- LASER, PLASMA, OXICORTE, DOBRADEIRA_CNC, GUILHOTINA, CALANDRA, SOLDA_MIG_TIG, USINAGEM, PINTURA, MONTAGEM
    capacidade_nominal_horas_dia NUMERIC(6,2) NOT NULL DEFAULT 8.00,
    custo_hora NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (empresa_id, codigo)
);

-- 3. ORDENS DE PRODUÇÃO (OP)
CREATE TABLE IF NOT EXISTS ordens_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    numero_op VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    pedido_venda_id UUID NULL,
    quantidade_planejada NUMERIC(15,4) NOT NULL,
    quantidade_produzida NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    quantidade_refugo NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_inicio_prevista TIMESTAMP WITH TIME ZONE,
    data_fim_prevista TIMESTAMP WITH TIME ZONE,
    data_inicio_real TIMESTAMP WITH TIME ZONE,
    data_fim_real TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANEJADA', -- PLANEJADA, LIBERADA, EM_ANDAMENTO, PAUSADA, CONCLUIDA, CANCELADA
    prioridade INT DEFAULT 10,
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, numero_op)
);
CREATE INDEX IF NOT EXISTS idx_op_empresa_status ON ordens_producao(empresa_id, status);

-- 4. ORDENS DE CORTE (LASER / PLASMA / OXICORTE)
CREATE TABLE IF NOT EXISTS ordens_corte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    op_id UUID NOT NULL REFERENCES ordens_producao(id) ON DELETE RESTRICT,
    centro_trabalho_id UUID NOT NULL REFERENCES centros_trabalho(id) ON DELETE RESTRICT,
    chapa_item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    espessura_mm NUMERIC(8,2) NOT NULL,
    aproveitamento_estimado_percentual NUMERIC(6,2),
    tempo_corte_estimado_min INT,
    arquivo_nesting_storage_path TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_CHAPA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. RETALHOS / SOBRAS APROVEITÁVEIS GERADAS NO CORTE
CREATE TABLE IF NOT EXISTS retalhos_gerados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    ordem_corte_id UUID NOT NULL REFERENCES ordens_corte(id) ON DELETE RESTRICT,
    item_retalho_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
    largura_util_mm NUMERIC(10,2) NOT NULL,
    comprimento_util_mm NUMERIC(10,2) NOT NULL,
    peso_kg NUMERIC(12,4) NOT NULL,
    almoxarifado_destino_id UUID NOT NULL REFERENCES almoxarifados(id) ON DELETE RESTRICT,
    etiqueta_qr_code VARCHAR(100) UNIQUE,
    status VARCHAR(30) DEFAULT 'DISPONIVEL', -- DISPONIVEL, CONSUMIDO, DESCARTADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. ORDENS DE DOBRA CNC
CREATE TABLE IF NOT EXISTS ordens_dobra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    op_id UUID NOT NULL REFERENCES ordens_producao(id) ON DELETE RESTRICT,
    centro_trabalho_id UUID NOT NULL REFERENCES centros_trabalho(id) ON DELETE RESTRICT,
    programa_cnc_nome VARCHAR(100),
    quantidade_dobras_por_peca INT NOT NULL DEFAULT 1,
    matriz_id VARCHAR(50),
    puncao_id VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. APONTAMENTOS DE PRODUÇÃO / HORAS E REFUGOS (NUNCA EXCLUIR FISICAMENTE)
CREATE TABLE IF NOT EXISTS apontamentos_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    op_id UUID NOT NULL REFERENCES ordens_producao(id) ON DELETE RESTRICT,
    centro_trabalho_id UUID NOT NULL REFERENCES centros_trabalho(id) ON DELETE RESTRICT,
    operador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    hora_fim TIMESTAMP WITH TIME ZONE NULL,
    quantidade_apontada NUMERIC(15,4) NOT NULL DEFAULT 0,
    quantidade_refugo NUMERIC(15,4) NOT NULL DEFAULT 0,
    motivo_parada VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. ORDENS DE SERVIÇOS (OS) INDUSTRIAIS E CAMPO
CREATE TABLE IF NOT EXISTS ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    numero_os VARCHAR(50) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE RESTRICT,
    tipo_servico VARCHAR(50) NOT NULL, -- MONTAGEM_INDUSTRIAL, CALDEIRARIA_CAMPO, USINAGEM, MANUTENCAO_PREDIAL
    local_execucao VARCHAR(255),
    data_inicio_prevista DATE,
    data_fim_prevista DATE,
    valor_servico NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA', -- ABERTA, EM_EXECUCAO, AGUARDANDO_APROVACAO, CONCLUIDA, FATURADA, CANCELADA
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (empresa_id, numero_os)
);

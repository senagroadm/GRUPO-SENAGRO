-- ============================================================================
-- MIGRATION: 0007_cobranca_e_risco.sql
-- NEXUS ERP (Grupo TRITECH - 5 CNPJs)
-- MÓDULO FINANCEIRO: CENTRAL DE COBRANÇA, RÉGUA, GESTÃO DE RISCO & CRÉDITO
-- ============================================================================

-- 1. TABELA DE CONFIGURAÇÃO DA RÉGUA DE COBRANÇA POR EMPRESA
CREATE TABLE IF NOT EXISTS regras_cobranca_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    dias_tolerancia_antes_bloqueio INTEGER NOT NULL DEFAULT 10,
    bloquear_automatico_estouro_limite BOOLEAN NOT NULL DEFAULT TRUE,
    bloquear_automatico_atraso BOOLEAN NOT NULL DEFAULT TRUE,
    permitir_desbloqueio_com_promessa BOOLEAN NOT NULL DEFAULT TRUE,
    dias_validade_promessa_padrao INTEGER NOT NULL DEFAULT 5,
    juros_mora_mensal_perc NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    multa_atraso_perc NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_por_usuario_id UUID,
    CONSTRAINT uq_regra_cobranca_empresa UNIQUE (empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_regras_cobranca_empresa ON regras_cobranca_config(empresa_id);

-- 2. TABELA DE GATILHOS DA RÉGUA DE COBRANÇA (PARAMETRIZÁVEIS)
CREATE TABLE IF NOT EXISTS gatilhos_regua_cobranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regua_config_id UUID NOT NULL REFERENCES regras_cobranca_config(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    ordem INTEGER NOT NULL,
    dias_relativo_vencimento INTEGER NOT NULL, -- Ex: -7, -2, 0, +3, +7, +15, +30
    fase VARCHAR(30) NOT NULL CHECK (fase IN ('PRE_VENCIMENTO', 'VENCIMENTO', 'ATRASO_LEVE', 'ATRASO_MEDIO', 'ATRASO_GRAVE', 'JURIDICO_CARTORIO')),
    nome_regra VARCHAR(150) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    canais_habilitados TEXT[] NOT NULL DEFAULT ARRAY['EMAIL', 'WHATSAPP'],
    acao_automatica_bloqueio BOOLEAN NOT NULL DEFAULT FALSE,
    acao_automatica_protesto BOOLEAN NOT NULL DEFAULT FALSE,
    template_assunto_email VARCHAR(255) NOT NULL,
    template_mensagem TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gatilhos_regua ON gatilhos_regua_cobranca(regua_config_id, dias_relativo_vencimento);

-- 3. TABELA DE LEMBRETES E COMUNICAÇÕES DE COBRANÇA
CREATE TABLE IF NOT EXISTS lembretes_cobranca_enviados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cliente_id UUID NOT NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    cliente_cnpj_cpf VARCHAR(20) NOT NULL,
    cliente_email VARCHAR(150),
    cliente_telefone VARCHAR(30),
    conta_receber_id UUID NOT NULL,
    parcela_id UUID,
    numero_documento VARCHAR(100) NOT NULL,
    numero_parcela INTEGER NOT NULL DEFAULT 1,
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_total_liquido NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    dias_atraso_ou_antecedencia INTEGER NOT NULL,
    gatilho_id UUID REFERENCES gatilhos_regua_cobranca(id),
    nome_regra_gatilho VARCHAR(150),
    canal VARCHAR(30) NOT NULL CHECK (canal IN ('EMAIL', 'WHATSAPP', 'SMS', 'LIGACAO', 'NOTIFICACAO_SISTEMA', 'CARTA_REGISTRADA')),
    assunto VARCHAR(255) NOT NULL,
    conteudo_mensagem TEXT NOT NULL,
    link_pix_qr_code TEXT,
    linha_digitavel_boleto VARCHAR(100),
    link_segunda_via_boleto TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'ENVIADO', 'ENTREGUE', 'LIDO', 'RESPONDIDO', 'FALHA_ENVIO', 'CANCELADO')),
    agendado_para TIMESTAMP WITH TIME ZONE NOT NULL,
    disparado_em TIMESTAMP WITH TIME ZONE,
    entregue_em TIMESTAMP WITH TIME ZONE,
    resposta_recebida TEXT,
    usuario_disparador_id UUID,
    origem VARCHAR(30) NOT NULL DEFAULT 'REGUA_AUTOMATICA' CHECK (origem IN ('REGUA_AUTOMATICA', 'DISPARO_MANUAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lembretes_empresa_cliente ON lembretes_cobranca_enviados(empresa_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data_status ON lembretes_cobranca_enviados(empresa_id, status, disparado_em);

-- 4. TABELA DE BLOQUEIOS COMERCIAIS & GOVERNANÇA DE CRÉDITO
CREATE TABLE IF NOT EXISTS bloqueios_comerciais_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cliente_id UUID NOT NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'SUSPENSO_POR_PROMESSA', 'DESBLOQUEIO_TEMPORARIO', 'LIBERACAO_EXCEPCIONAL_AUDITADA', 'INATIVO')),
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('INADIMPLENCIA_TITULOS_VENCIDOS', 'EXPOSICAO_ACIMA_DO_LIMITE', 'QUEBRA_DE_PROMESSA', 'PROTESTO_OU_RESTRICAO_BUREAU', 'SCORE_CREDITO_REBAIXADO', 'CADASTRO_EXPIRADO', 'BLOQUEIO_MANUAL_ADMINISTRATIVO')),
    detalhes_motivo TEXT NOT NULL,
    valor_inadimplente NUMERIC(15,2) DEFAULT 0,
    dias_maior_atraso INTEGER DEFAULT 0,
    exposicao_no_momento NUMERIC(15,2) DEFAULT 0,
    limite_no_momento NUMERIC(15,2) DEFAULT 0,
    bloqueado_automatico BOOLEAN NOT NULL DEFAULT FALSE,
    bloqueado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bloqueado_por_usuario_id UUID,
    bloqueado_por_usuario_nome VARCHAR(150),
    
    -- Desbloqueio / Exceção
    desbloqueado_em TIMESTAMP WITH TIME ZONE,
    desbloqueado_por_usuario_id UUID,
    desbloqueado_por_usuario_nome VARCHAR(150),
    justificativa_desbloqueio TEXT,
    validade_desbloqueio_temporario_ate TIMESTAMP WITH TIME ZONE,
    promessa_id_vinculada UUID,
    historico_acoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bloqueios_empresa_status ON bloqueios_comerciais_credito(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_bloqueios_cliente ON bloqueios_comerciais_credito(empresa_id, cliente_id);

-- 5. TABELA DE PROMESSAS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS promessas_pagamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cliente_id UUID NOT NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_prometida DATE NOT NULL,
    valor_prometido NUMERIC(15,2) NOT NULL CHECK (valor_prometido > 0),
    forma_pagamento_prevista VARCHAR(30) NOT NULL,
    contato_nome VARCHAR(150) NOT NULL,
    contato_telefone_ou_email VARCHAR(150) NOT NULL,
    observacoes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CUMPRIDA', 'CUMPRIDA_PARCIAL', 'QUEBRADA', 'CANCELADA')),
    suspender_bloqueio BOOLEAN NOT NULL DEFAULT TRUE,
    suspensao_valida_ate TIMESTAMP WITH TIME ZONE,
    titulos_vinculados JSONB NOT NULL DEFAULT '[]'::jsonb,
    registrado_por_usuario_id UUID NOT NULL,
    registrado_por_usuario_nome VARCHAR(150) NOT NULL,
    data_resolucao TIMESTAMP WITH TIME ZONE,
    valor_efetivamente_pago NUMERIC(15,2),
    motivo_cancelamento_ou_quebra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promessas_empresa_status ON promessas_pagamento(empresa_id, status, data_prometida);
CREATE INDEX IF NOT EXISTS idx_promessas_cliente ON promessas_pagamento(empresa_id, cliente_id);

-- 6. TABELA DE HISTÓRICO DE CONTATO (CRM DE COBRANÇA)
CREATE TABLE IF NOT EXISTS cobranca_historico_contato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cliente_id UUID NOT NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tipo_contato VARCHAR(40) NOT NULL CHECK (tipo_contato IN ('LIGACAO_TELEFONICA', 'WHATSAPP', 'EMAIL_AUTOMATICO_REGUA', 'EMAIL_MANUAL', 'REUNIAO_PRESENCIAL', 'NOTIFICACAO_EXTRAJUDICIAL', 'PROTESTO_CARTORIO', 'ACORDO_RENEGOCIACAO', 'ANOTACAO_INTERNA')),
    canal VARCHAR(30) NOT NULL CHECK (canal IN ('EMAIL', 'WHATSAPP', 'SMS', 'LIGACAO', 'NOTIFICACAO_SISTEMA', 'CARTA_REGISTRADA')),
    contato_nome_cliente VARCHAR(150) NOT NULL,
    contato_cargo_ou_depto VARCHAR(100),
    telefone_ou_email_utilizado VARCHAR(150) NOT NULL,
    resumo_conversa TEXT NOT NULL,
    detalhes_acordo TEXT,
    sentimento_cliente VARCHAR(30) NOT NULL DEFAULT 'NEUTRO' CHECK (sentimento_cliente IN ('COOPERATIVO', 'NEUTRO', 'PROTESTANDO', 'EVASIVO', 'INCOMUNICAVEL', 'LITIGIOSO')),
    gerou_promessa_pagamento BOOLEAN NOT NULL DEFAULT FALSE,
    promessa_id UUID REFERENCES promessas_pagamento(id),
    data_proximo_follow_up TIMESTAMP WITH TIME ZONE,
    proxima_acao_descricao TEXT,
    operador_usuario_id UUID NOT NULL,
    operador_usuario_nome VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobranca_contatos_cliente ON cobranca_historico_contato(empresa_id, cliente_id, data_hora DESC);

-- 7. TABELA DE RENEGOCIAÇÕES DE DÍVIDAS & ACORDOS
CREATE TABLE IF NOT EXISTS renegociacoes_divida (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_acordo VARCHAR(50) NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cliente_id UUID NOT NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EFETIVADO' CHECK (status IN ('SIMULADO', 'AGUARDANDO_ASSINATURA', 'EFETIVADO', 'CANCELADO', 'QUEBRADO')),
    data_acordo DATE NOT NULL,
    total_principal_original NUMERIC(15,2) NOT NULL,
    total_juros_calculados NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_multa_calculada NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_divida_bruta NUMERIC(15,2) NOT NULL,
    desconto_concedido_principal NUMERIC(15,2) NOT NULL DEFAULT 0,
    desconto_concedido_juros_multa NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_desconto_geral NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_final_acordado NUMERIC(15,2) NOT NULL,
    valor_entrada NUMERIC(15,2) NOT NULL DEFAULT 0,
    data_vencimento_entrada DATE,
    quantidade_parcelas INTEGER NOT NULL,
    intervalo_dias_parcelas INTEGER NOT NULL DEFAULT 30,
    taxa_juros_parcelamento_mensal NUMERIC(5,2) NOT NULL DEFAULT 0,
    primeiro_vencimento_parcelas DATE NOT NULL,
    justificativa_comercial TEXT NOT NULL,
    negociador_usuario_id UUID NOT NULL,
    negociador_usuario_nome VARCHAR(150) NOT NULL,
    aprovador_usuario_id UUID,
    aprovador_usuario_nome VARCHAR(150),
    termo_confissao_divida_gerado BOOLEAN NOT NULL DEFAULT TRUE,
    termo_storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_renegociacao_codigo_empresa UNIQUE (empresa_id, codigo_acordo)
);

CREATE INDEX IF NOT EXISTS idx_renegociacoes_empresa ON renegociacoes_divida(empresa_id, cliente_id, data_acordo DESC);

-- 8. TABELA DE ITENS DE ORIGEM DA RENEGOCIAÇÃO (NÃO-DESTRUTIVO: AUDITA OS TÍTULOS ORIGINAIS)
CREATE TABLE IF NOT EXISTS renegociacoes_divida_titulos_origem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renegociacao_id UUID NOT NULL REFERENCES renegociacoes_divida(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    conta_receber_id UUID NOT NULL,
    parcela_id UUID,
    numero_documento VARCHAR(100) NOT NULL,
    numero_parcela INTEGER NOT NULL,
    data_vencimento_original DATE NOT NULL,
    dias_atraso INTEGER NOT NULL,
    valor_original NUMERIC(15,2) NOT NULL,
    valor_juros_original NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_multa_original NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_saldo_original NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_renegociacao_titulos_origem ON renegociacoes_divida_titulos_origem(renegociacao_id);

-- 9. TABELA DE NOVAS PARCELAS GERADAS NA RENEGOCIAÇÃO
CREATE TABLE IF NOT EXISTS renegociacoes_divida_novas_parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renegociacao_id UUID NOT NULL REFERENCES renegociacoes_divida(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    numero_parcela INTEGER NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_juros_embutidos NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_total_parcela NUMERIC(15,2) NOT NULL,
    forma_pagamento_prevista VARCHAR(30) NOT NULL,
    nova_conta_receber_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_renegociacao_novas_parcelas ON renegociacoes_divida_novas_parcelas(renegociacao_id);

-- 10. TABELA DE LIMITES E EXPOSIÇÃO DE CRÉDITO POR CLIENTE/EMPRESA
CREATE TABLE IF NOT EXISTS exposicao_credito_cliente_limites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    cliente_id UUID NOT NULL,
    limite_concedido NUMERIC(15,2) NOT NULL DEFAULT 0,
    limite_temporario NUMERIC(15,2) NOT NULL DEFAULT 0,
    validade_limite_temporario TIMESTAMP WITH TIME ZONE,
    data_ultima_revisao DATE DEFAULT CURRENT_DATE,
    proxima_revisao DATE,
    observacoes TEXT,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_por_usuario_id UUID,
    CONSTRAINT uq_limite_cliente_empresa UNIQUE (empresa_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_limites_cliente_empresa ON exposicao_credito_cliente_limites(empresa_id, cliente_id);

-- 11. TABELA DE AUDITORIA APPEND-ONLY DE COBRANÇA E RISCO
CREATE TABLE IF NOT EXISTS cobranca_risco_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    usuario_id UUID NOT NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modulo VARCHAR(50) NOT NULL,
    acao VARCHAR(60) NOT NULL,
    entidade_afetada VARCHAR(100) NOT NULL,
    entidade_id VARCHAR(100) NOT NULL,
    cliente_id VARCHAR(100),
    cliente_nome VARCHAR(200),
    justificativa TEXT,
    payload_before JSONB,
    payload_after JSONB,
    ip_origem VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_cobranca_empresa ON cobranca_risco_auditoria_logs(empresa_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_cobranca_cliente ON cobranca_risco_auditoria_logs(empresa_id, cliente_id);

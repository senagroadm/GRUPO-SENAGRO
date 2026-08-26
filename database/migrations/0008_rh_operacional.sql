-- ============================================================================
-- MIGRATION: 0008_rh_operacional.sql
-- NEXUS ERP (Grupo TRITECH - 5 CNPJs)
-- MÓDULO: RH OPERACIONAL & GESTÃO DO TRABALHO INDUSTRIAL
-- ============================================================================

-- 1. CLASSIFICAÇÃO BRASILEIRA DE OCUPAÇÕES (CBO) - Compartilhado
CREATE TABLE IF NOT EXISTS rh_cbo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    grande_grupo VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_cbo_codigo ON rh_cbo(codigo);

-- 2. SETORES E DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS rh_setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    codigo VARCHAR(30) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PRODUCAO_FABRIL', 'MANUTENCAO', 'QUALIDADE_METROLOGIA', 'ENGENHARIA_PCP', 'ALMOXARIFADO_ESTOQUE', 'EXPEDICAO_LOGISTICA', 'ADMINISTRATIVO_FINANCEIRO', 'COMERCIAL_VENDAS', 'DIRETORIA_EXECUTIVA')),
    centro_custo_codigo VARCHAR(50),
    responsavel_funcionario_id UUID,
    cor_identificacao VARCHAR(20) DEFAULT '#4f46e5',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rh_setor_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_rh_setores_empresa ON rh_setores(empresa_id);

-- 3. CARGOS
CREATE TABLE IF NOT EXISTS rh_cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cbo_id UUID REFERENCES rh_cbo(id),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    titulo VARCHAR(150) NOT NULL,
    nivel VARCHAR(30) NOT NULL CHECK (nivel IN ('OPERACIONAL_INICIAL', 'OPERACIONAL_PLENO', 'OPERACIONAL_SENIOR', 'LIDER_FABRIL', 'TECNICO_ESPECIALISTA', 'ANALISTA', 'SUPERVISOR', 'GERENTE', 'DIRETOR')),
    descricao_sumaria TEXT,
    requisitos_minimos TEXT,
    piso_salarial NUMERIC(12,2) DEFAULT 0,
    teto_salarial NUMERIC(12,2) DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_cargos_cbo ON rh_cargos(cbo_id);

-- 4. CADASTRO GERAL DE FUNCIONÁRIOS (Pessoa Física / Mestre Grupo TRITECH)
CREATE TABLE IF NOT EXISTS rh_funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg VARCHAR(20),
    rg_orgao_emissor VARCHAR(20),
    nome_completo VARCHAR(200) NOT NULL,
    nome_social VARCHAR(200),
    data_nascimento DATE NOT NULL,
    sexo VARCHAR(20) CHECK (sexo IN ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO')),
    estado_civil VARCHAR(30) CHECK (estado_civil IN ('SOLTEIRO', 'CASADO', 'UNIAO_ESTAVEL', 'DIVORCIADO', 'VIUVO')),
    nome_mae VARCHAR(200),
    pis_pasep VARCHAR(20),
    ctps_numero VARCHAR(30),
    ctps_serie VARCHAR(20),
    escolaridade VARCHAR(50),
    email_pessoal VARCHAR(150),
    email_corporativo VARCHAR(150),
    telefone_celular VARCHAR(30) NOT NULL,
    telefone_emergencia VARCHAR(30),
    contato_emergencia_nome VARCHAR(150),
    endereco_logradouro VARCHAR(200),
    endereco_numero VARCHAR(20),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_uf VARCHAR(2),
    endereco_cep VARCHAR(10),
    pcd BOOLEAN NOT NULL DEFAULT FALSE,
    pcd_detalhes TEXT,
    avatar_url TEXT,
    status_geral VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status_geral IN ('ATIVO', 'INATIVO', 'AFASTADO', 'BLOQUEADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_funcionarios_cpf ON rh_funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_rh_funcionarios_nome ON rh_funcionarios(nome_completo);

-- 5. VÍNCULOS EMPREGATÍCIOS COM AS EMPRESAS DO GRUPO (funcionario_empresas)
CREATE TABLE IF NOT EXISTS rh_funcionario_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    matricula VARCHAR(30) NOT NULL,
    cargo_id UUID NOT NULL REFERENCES rh_cargos(id),
    setor_id UUID NOT NULL REFERENCES rh_setores(id),
    turno_id UUID,
    tipo_contrato VARCHAR(30) NOT NULL DEFAULT 'CLT_INDETERMINADO' CHECK (tipo_contrato IN ('CLT_INDETERMINADO', 'CLT_DETERMINADO', 'PJ', 'ESTAGIO', 'APRENDIZ', 'TEMPORARIO')),
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    salario_base NUMERIC(12,2) NOT NULL DEFAULT 0,
    adicional_periculosidade_perc NUMERIC(5,2) DEFAULT 0,
    adicional_insalubridade_grau VARCHAR(20) DEFAULT 'NENHUM' CHECK (adicional_insalubridade_grau IN ('NENHUM', 'MINIMO_10', 'MEDIO_20', 'MAXIMO_40')),
    custo_hora_industrial_estimado NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'FERIAS', 'AFASTADO_INSS', 'LICENCA_MATERNIDADE', 'EM_AVISO_PREVIO', 'DESLIGADO')),
    regime_jornada VARCHAR(30) NOT NULL DEFAULT 'MENSALISTA_220H' CHECK (regime_jornada IN ('MENSALISTA_220H', 'MENSALISTA_180H', 'HORISTA', 'ESCALA_12X36')),
    gestor_direto_funcionario_id UUID REFERENCES rh_funcionarios(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rh_func_empresa_matricula UNIQUE (empresa_id, matricula)
);

CREATE INDEX IF NOT EXISTS idx_rh_func_empresa ON rh_funcionario_empresas(empresa_id, funcionario_id);
CREATE INDEX IF NOT EXISTS idx_rh_func_status ON rh_funcionario_empresas(empresa_id, status);

-- 6. HISTÓRICO DE CARGOS E SALÁRIOS
CREATE TABLE IF NOT EXISTS rh_historico_cargos_salarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    cargo_anterior_id UUID REFERENCES rh_cargos(id),
    novo_cargo_id UUID NOT NULL REFERENCES rh_cargos(id),
    salario_anterior NUMERIC(12,2),
    novo_salario NUMERIC(12,2) NOT NULL,
    setor_anterior_id UUID REFERENCES rh_setores(id),
    novo_setor_id UUID NOT NULL REFERENCES rh_setores(id),
    data_mudanca DATE NOT NULL,
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('ADMISSAO', 'PROMOCAO_MERITO', 'ENQUADRAMENTO_CCT_DISSIDIO', 'TRANSFERENCIA_SETOR', 'REESTRUTURACAO', 'AJUSTE_MERCADO')),
    justificativa TEXT,
    aprovado_por_usuario_id UUID,
    aprovado_por_nome VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_hist_cargos ON rh_historico_cargos_salarios(empresa_id, funcionario_id, data_mudanca DESC);

-- 7. COMPETÊNCIAS E HABILIDADES (Matriz de Polivalência / Skill Matrix)
CREATE TABLE IF NOT EXISTS rh_competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('OPERACIONAL_FABRIL', 'SOLDA_CALDEIRARIA', 'CORTE_USINAGEM_CNC', 'METROLOGIA_QUALIDADE', 'SEGURANCA_NR', 'MANUTENCAO_PREVENTIVA', 'LOGISTICA_MOVIMENTACAO', 'SOFT_SKILL_LIDERANCA')),
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. MATRIZ DE POLIVALÊNCIA POR FUNCIONÁRIO (funcionario_competencias)
CREATE TABLE IF NOT EXISTS rh_funcionario_competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES rh_competencias(id) ON DELETE RESTRICT,
    nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 4), -- 1: Aprendiz/Básico, 2: Autônomo, 3: Avançado/Multiplicador, 4: Especialista/Auditor
    data_avaliacao DATE NOT NULL,
    avaliador_funcionario_id UUID REFERENCES rh_funcionarios(id),
    avaliador_nome VARCHAR(150),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rh_func_competencia UNIQUE (funcionario_id, competencia_id)
);

CREATE INDEX IF NOT EXISTS idx_rh_func_comp ON rh_funcionario_competencias(funcionario_id);

-- 9. AUTORIZAÇÃO PARA MÁQUINAS E POSTOS DE TRABALHO FABRIS (funcionario_maquinas)
CREATE TABLE IF NOT EXISTS rh_funcionario_maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    maquina_equipamento_id VARCHAR(100) NOT NULL,
    maquina_nome VARCHAR(150) NOT NULL,
    nivel_autorizacao VARCHAR(40) NOT NULL CHECK (nivel_autorizacao IN ('OPERADOR_PLENO', 'OPERADOR_SOB_SUPERVISAO', 'PREPARADOR_SETUP', 'MANUTENTOR_AUTORIZADO', 'BLOQUEADO_RESTRITO')),
    data_autorizacao DATE NOT NULL,
    validade_autorizacao DATE,
    nr12_valida BOOLEAN NOT NULL DEFAULT TRUE,
    treinamento_especifico_concluido BOOLEAN NOT NULL DEFAULT TRUE,
    autorizado_por_nome VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'LIBERADO' CHECK (status IN ('LIBERADO', 'SUSPENSO', 'VENCIDO', 'REVOGADO')),
    motivo_bloqueio_revogacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rh_func_maquina UNIQUE (empresa_id, funcionario_id, maquina_equipamento_id)
);

CREATE INDEX IF NOT EXISTS idx_rh_func_maquinas ON rh_funcionario_maquinas(empresa_id, funcionario_id);

-- 10. CATÁLOGO DE TREINAMENTOS (NRs, Técnicos e Corporativos)
CREATE TABLE IF NOT EXISTS rh_treinamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('NORMA_REGULAMENTADORA_NR', 'TECNICO_OPERACIONAL', 'QUALIDADE_ISO9001', 'SEGURANCA_MEIO_AMBIENTE', 'INTEGRACAO_INSTITUCIONAL', 'DESENVOLVIMENTO_LIDERANCA')),
    norma_regulamentadora VARCHAR(50), -- Ex: NR-06, NR-10, NR-11, NR-12, NR-33, NR-35
    carga_horaria_horas NUMERIC(6,2) NOT NULL,
    periodicidade_reciclagem_meses INTEGER DEFAULT 12, -- 0 se não exige reciclagem
    obrigatorio_admissao BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. REGISTRO DE TREINAMENTOS E VALIDADES (funcionario_treinamentos)
CREATE TABLE IF NOT EXISTS rh_funcionario_treinamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    treinamento_id UUID NOT NULL REFERENCES rh_treinamentos(id),
    data_realizacao DATE NOT NULL,
    data_vencimento DATE,
    entidade_instrutor VARCHAR(200) NOT NULL,
    carga_horaria_cumprida NUMERIC(6,2) NOT NULL,
    nota_aproveitamento NUMERIC(4,2),
    frequencia_perc NUMERIC(5,2) DEFAULT 100.00,
    status VARCHAR(30) NOT NULL DEFAULT 'VALIDO' CHECK (status IN ('VALIDO', 'VENCENDO_30_DIAS', 'VENCIDO', 'RECICLAGEM_AGENDADA', 'CANCELADO')),
    certificado_anexo_url TEXT,
    custo_treinamento NUMERIC(10,2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_func_treinamentos ON rh_funcionario_treinamentos(empresa_id, funcionario_id, status);

-- 12. DOCUMENTOS E EXAMES OCUPACIONAIS DOS FUNCIONÁRIOS (documentos_funcionarios)
CREATE TABLE IF NOT EXISTS rh_documentos_funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    tipo_documento VARCHAR(50) NOT NULL CHECK (tipo_documento IN ('ASO_ADMISSIONAL', 'ASO_PERIODICO', 'ASO_RETORNO_TRABALHO', 'ASO_MUDANCA_RISCO', 'ASO_DEMISSIONAL', 'CNH_MOTORISTA_OPERADOR', 'CARTEIRA_VACINACAO', 'CERTIFICADO_TECNICO', 'FICHA_REGISTRO_CTPS', 'TERMO_CONFIDENCIALIDADE_LGPD', 'COMPROVANTE_RESIDENCIA', 'CONTRATO_TRABALHO')),
    numero_documento VARCHAR(100),
    data_emissao DATE NOT NULL,
    data_validade DATE,
    medico_crm_emissor VARCHAR(100),
    clinica_emissora VARCHAR(150),
    status_aptidao VARCHAR(30) DEFAULT 'APTO' CHECK (status_aptidao IN ('APTO', 'APTO_COM_RESTRICAO', 'INAPTO', 'NAO_APLICAVEL')),
    arquivo_url TEXT,
    status_validade VARCHAR(30) NOT NULL DEFAULT 'VALIDO' CHECK (status_validade IN ('VALIDO', 'VENCENDO', 'VENCIDO', 'PERMANENTE')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_docs_func ON rh_documentos_funcionarios(empresa_id, funcionario_id, tipo_documento);

-- 13. CATÁLOGO DE EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL (EPIS)
CREATE TABLE IF NOT EXISTS rh_epis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    tipo_protecao VARCHAR(50) NOT NULL CHECK (tipo_protecao IN ('AUDITIVA_AURICULAR', 'RESPIRATORIA_MASCARA', 'VISUAL_FACIAL_OCULOS', 'CABECA_CAPACETE', 'MAOS_BRACOS_LUVAS', 'PES_PERNAS_BOTINAS', 'ALTURA_CINTO_TALABARTE', 'CORPO_INTEIRO_AVENTAL_RASPA')),
    numero_ca VARCHAR(30) NOT NULL,
    validade_ca DATE NOT NULL,
    fabricante VARCHAR(150),
    durabilidade_estimada_dias INTEGER NOT NULL DEFAULT 90,
    custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
    estoque_atual INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 10,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. REGISTRO DE ENTREGAS E TERMO DE EPI (entregas_epi)
CREATE TABLE IF NOT EXISTS rh_entregas_epi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    epi_id UUID NOT NULL REFERENCES rh_epis(id),
    quantidade INTEGER NOT NULL DEFAULT 1,
    tamanho VARCHAR(20),
    data_entrega DATE NOT NULL,
    data_previsao_troca DATE NOT NULL,
    motivo_entrega VARCHAR(40) NOT NULL CHECK (motivo_entrega IN ('ADMISSAO_INTEGRACAO', 'SUBSTITUICAO_DESGASTE', 'EXTRAVIO_DANO', 'MUDANCA_POSTO_RISCO')),
    termo_assinado_digital BOOLEAN NOT NULL DEFAULT TRUE,
    autenticacao_termo_hash VARCHAR(100),
    entregue_por_usuario_id UUID,
    entregue_por_nome VARCHAR(150) NOT NULL,
    status_devolucao VARCHAR(30) NOT NULL DEFAULT 'EM_USO' CHECK (status_devolucao IN ('EM_USO', 'SUBSTITUIDO', 'DEVOLVIDO_DESLIGAMENTO', 'DESCARTADO')),
    data_devolucao DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_entregas_epi ON rh_entregas_epi(empresa_id, funcionario_id, status_devolucao);

-- 15. TURNOS DE TRABALHO
CREATE TABLE IF NOT EXISTS rh_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    codigo VARCHAR(30) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    horario_entrada TIME NOT NULL,
    horario_saida TIME NOT NULL,
    intervalo_inicio TIME,
    intervalo_fim TIME,
    total_horas_diarias NUMERIC(4,2) NOT NULL,
    tipo_jornada VARCHAR(30) NOT NULL CHECK (tipo_jornada IN ('COMERCIAL', 'TURNO_1_MANHA', 'TURNO_2_TARDE', 'TURNO_3_NOTURNO', 'ESCALA_12X36')),
    adicional_noturno_aplica BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rh_turno_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 16. ESCALAS DE ALOCAÇÃO DOS COLABORADORES
CREATE TABLE IF NOT EXISTS rh_escalas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    turno_id UUID NOT NULL REFERENCES rh_turnos(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    tipo_regime VARCHAR(30) NOT NULL DEFAULT 'SEMANAL_5X2' CHECK (tipo_regime IN ('SEMANAL_5X2', 'SEMANAL_6X1', 'REVEZAMENTO_6X2', 'CONTINUA_12X36')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_escalas_func ON rh_escalas(empresa_id, funcionario_id, ativo);

-- 17. APONTAMENTOS DE HORAS OPERACIONAIS PARA CUSTEIO INDUSTRIAL (apontamentos_horas)
CREATE TABLE IF NOT EXISTS rh_apontamentos_horas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    data_apontamento DATE NOT NULL,
    tipo_hora VARCHAR(40) NOT NULL CHECK (tipo_hora IN ('NORMAL_PRODUTIVA', 'EXTRA_50', 'EXTRA_100', 'BANCO_HORAS', 'PARADA_IMPRODUTIVA', 'TREINAMENTO_NR', 'AUSENCIA_JUSTIFICADA', 'FALTA_NAO_JUSTIFICADA')),
    quantidade_horas NUMERIC(5,2) NOT NULL,
    custo_hora_aplicado NUMERIC(10,2) NOT NULL,
    custo_total_calculado NUMERIC(12,2) NOT NULL,
    ordem_producao_id VARCHAR(100),
    operacao_id VARCHAR(100),
    maquina_id VARCHAR(100),
    status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status_aprovacao IN ('PENDENTE', 'APROVADO_LIDER', 'REJEITADO', 'CONCILIADO_CUSTO_INDUSTRIAL')),
    aprovador_usuario_id UUID,
    aprovador_nome VARCHAR(150),
    justificativa_observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_apont_horas ON rh_apontamentos_horas(empresa_id, data_apontamento, funcionario_id);

-- 18. GESTÃO DE VAGAS (Recrutamento Operacional)
CREATE TABLE IF NOT EXISTS rh_vagas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    codigo_vaga VARCHAR(30) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    cargo_id UUID NOT NULL REFERENCES rh_cargos(id),
    setor_id UUID NOT NULL REFERENCES rh_setores(id),
    quantidade_vagas INTEGER NOT NULL DEFAULT 1,
    regime_contratacao VARCHAR(30) NOT NULL DEFAULT 'CLT',
    salario_proposto_de NUMERIC(12,2),
    salario_proposto_ate NUMERIC(12,2),
    data_abertura DATE NOT NULL,
    data_previsao_fechamento DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'EM_TRIAGEM', 'ENTREVISTAS', 'FINALISTA', 'PREENCHIDA', 'CANCELADA')),
    motivo_abertura VARCHAR(40) NOT NULL CHECK (motivo_abertura IN ('AUMENTO_QUADRO_PRODUCAO', 'SUBSTITUICAO_DESLIGAMENTO', 'COBERTURA_LICENCA', 'NOVA_LINHA_MAQUINA')),
    requisitos_obrigatorios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rh_vaga_empresa_codigo UNIQUE (empresa_id, codigo_vaga)
);

-- 19. CANDIDATOS E FUNIL DE SELEÇÃO
CREATE TABLE IF NOT EXISTS rh_candidatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_id UUID NOT NULL REFERENCES rh_vagas(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome_completo VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(30) NOT NULL,
    cidade_uf VARCHAR(100),
    pretensao_salarial NUMERIC(12,2),
    etapa_funil VARCHAR(40) NOT NULL DEFAULT 'TRIAGEM' CHECK (etapa_funil IN ('INSCRITO', 'TRIAGEM', 'ENTREVISTA_RH', 'TESTE_PRATICO_FABRIL', 'EXAME_ASO_ADMISSAO', 'APROVADO_CONTRATADO', 'REPROVADO', 'BANCO_TALENTOS')),
    score_aderencia_perc INTEGER DEFAULT 80,
    parecer_entrevistador TEXT,
    curriculo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_candidatos_vaga ON rh_candidatos(vaga_id, etapa_funil);

-- 20. CHECKLIST DE ONBOARDING (Admissão e Integração)
CREATE TABLE IF NOT EXISTS rh_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    candidato_id UUID REFERENCES rh_candidatos(id),
    data_inicio DATE NOT NULL,
    previsao_conclusao DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO', 'CANCELADO')),
    progresso_percentual INTEGER NOT NULL DEFAULT 0,
    checklist_itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    responsavel_rh_nome VARCHAR(150) NOT NULL,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_onboarding_empresa ON rh_onboarding(empresa_id, status);

-- 21. CHECKLIST DE DESLIGAMENTO (Offboarding e Rescisão)
CREATE TABLE IF NOT EXISTS rh_desligamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    funcionario_id UUID NOT NULL REFERENCES rh_funcionarios(id),
    tipo_rescisao VARCHAR(50) NOT NULL CHECK (tipo_rescisao IN ('DISPENSA_SEM_JUSTA_CAUSA', 'DISPENSA_COM_JUSTA_CAUSA', 'PEDIDO_DEMISSAO_FUNCIONARIO', 'TERMINO_CONTRATO_EXPERIENCIA', 'ACORDO_MUTUO_ART484A')),
    data_comunicacao DATE NOT NULL,
    data_desligamento_efetivo DATE NOT NULL,
    cumpriu_aviso_previo BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_aviso_previo VARCHAR(30) DEFAULT 'INDENIZADO' CHECK (tipo_aviso_previo IN ('TRABALHADO', 'INDENIZADO', 'DISPENSADO')),
    checklist_itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    progresso_percentual INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
    entrevista_desligamento JSONB DEFAULT '{}'::jsonb,
    exportado_sistema_folha BOOLEAN NOT NULL DEFAULT FALSE,
    protocolo_exportacao_folha VARCHAR(100),
    data_conclusao TIMESTAMP WITH TIME ZONE,
    responsavel_rh_nome VARCHAR(150) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rh_desligamento_empresa ON rh_desligamento(empresa_id, status);

-- 22. TRILHA DE AUDITORIA APPEND-ONLY DE RECURSOS HUMANOS
CREATE TABLE IF NOT EXISTS rh_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    usuario_id UUID NOT NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modulo VARCHAR(50) NOT NULL DEFAULT 'RH_OPERACIONAL',
    acao VARCHAR(60) NOT NULL,
    entidade_afetada VARCHAR(100) NOT NULL,
    entidade_id VARCHAR(100) NOT NULL,
    funcionario_id VARCHAR(100),
    funcionario_nome VARCHAR(200),
    justificativa TEXT,
    payload_before JSONB,
    payload_after JSONB,
    ip_origem VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_rh_auditoria_empresa ON rh_auditoria_logs(empresa_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_rh_auditoria_func ON rh_auditoria_logs(empresa_id, funcionario_id);

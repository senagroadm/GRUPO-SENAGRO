-- ==============================================================================
-- NEXUS ERP - MIGRATION 002: SEED INITIAL DATA (5 GRUPO COMPANIES, PROFILES, USERS)
-- ==============================================================================

-- 1. SEED: 5 EMPRESAS DO GRUPO INDUSTRIAL
INSERT INTO empresas (id, codigo, razao_social, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal, regime_tributario, ramo_atividade, is_matriz, ativo)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'MWAM',
    'MWAM Engenharia e Serviços Industrial Ltda',
    'MWAM Engenharia',
    '44.566.045/0001-01',
    '001829102.00-33',
    '8839201',
    'LUCRO_PRESUMIDO',
    'Engenharia e Serviços Industriais de Montagem e Manutenção',
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'OLIVEIRA_AMORIM',
    'Oliveira e Amorim Distribuição Ltda',
    'Oliveira & Amorim Distribuição',
    '26.200.037/0001-57',
    '003291823.00-12',
    '9928102',
    'LUCRO_REAL',
    'Comércio Atacadista e Distribuição de Aço e Insumos Industriais',
    FALSE,
    TRUE
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'SENAGRO',
    'Senagro Indústria e Comércio Ltda',
    'Senagro Indústria',
    '23.280.366/0001-67',
    '002981921.00-45',
    '7748291',
    'LUCRO_REAL',
    'Indústria e Comércio de Máquinas e Equipamentos Agrícolas',
    FALSE,
    TRUE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'TRITECH_CORTE',
    'Tritech Corte Dobra e Fabricação Ltda',
    'Tritech Corte & Dobra',
    '48.082.502/0001-35',
    '004128912.00-88',
    '6639201',
    'LUCRO_REAL',
    'Serviços Especializados de Corte a Laser/Plasma, Dobra CNC e Caldeiraria Leve',
    FALSE,
    TRUE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'TRITECH_IND',
    'Tritech Industrial Ltda',
    'Tritech Industrial',
    '64.036.495/0001-91',
    '001928374.00-99',
    '5549201',
    'LUCRO_REAL',
    'Indústria e Fabricação de Estruturas Pesadas e Máquinas Industriais',
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  codigo = EXCLUDED.codigo,
  razao_social = EXCLUDED.razao_social,
  nome_fantasia = EXCLUDED.nome_fantasia,
  cnpj = EXCLUDED.cnpj,
  regime_tributario = EXCLUDED.regime_tributario,
  ramo_atividade = EXCLUDED.ramo_atividade,
  is_matriz = EXCLUDED.is_matriz,
  ativo = EXCLUDED.ativo;

-- 2. SEED: PERFIS DE ACESSO
INSERT INTO perfis (id, codigo, nome, descricao, nivel_acesso, ativo)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'SUPERADMIN_GRUPO',
    'Superadministrador do Grupo',
    'Acesso irrestrito a todas as empresas, configurações e auditorias do grupo industrial',
    'GRUPO',
    TRUE
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'DIRETOR_FINANCEIRO',
    'Diretor Financeiro & Controladoria',
    'Gestão completa de financeiro, crédito, faturamento e relatórios gerenciais consolidados',
    'GRUPO',
    TRUE
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'GERENTE_OPERACIONAL',
    'Gerente Operacional / Industrial',
    'Gestão de produção, corte, dobra, manutenção, estoque e compras na empresa atribuída',
    'EMPRESA',
    TRUE
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'RESPONSAVEL_FISCAL',
    'Responsável Fiscal & Contábil',
    'Emissão de notas fiscais (NF-e/NFS-e), apuração de tributos e relatórios de conformidade',
    'EMPRESA',
    TRUE
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    'OPERADOR_INDUSTRIAL',
    'Operador Industrial / Chão de Fábrica',
    'Apontamento de ordens de produção, corte, dobra e conferência física de estoque',
    'OPERACIONAL',
    TRUE
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    'CONSULTOR_LEITURA',
    'Auditor / Visualizador de Consulta',
    'Permissão exclusiva de leitura de relatórios e painéis operacionais',
    'EMPRESA',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- 3. SEED: CATÁLOGO DE PERMISSÕES MODULARES
INSERT INTO permissoes (id, codigo, modulo, acao, descricao)
VALUES
  -- Administração
  ('p0101010-0000-0000-0000-000000000001', 'ADMIN_FULL', 'ADMINISTRACAO', 'ADMIN', 'Administração completa do sistema e usuários'),
  ('p0101010-0000-0000-0000-000000000002', 'ADMIN_READ', 'ADMINISTRACAO', 'READ', 'Consulta de parâmetros administrativos'),
  
  -- Comercial & CRM
  ('p0202020-0000-0000-0000-000000000001', 'COMERCIAL_ADMIN', 'COMERCIAL', 'ADMIN', 'Gestão total de vendas e políticas comerciais'),
  ('p0202020-0000-0000-0000-000000000002', 'COMERCIAL_READ', 'COMERCIAL', 'READ', 'Consulta de pedidos e orçamentos'),
  ('p0202020-0000-0000-0000-000000000003', 'COMERCIAL_CREATE', 'COMERCIAL', 'CREATE', 'Criação de novos pedidos e propostas'),
  
  -- PCP & Produção
  ('p0303030-0000-0000-0000-000000000001', 'PRODUCAO_ADMIN', 'PRODUCAO', 'ADMIN', 'Controle total de ordens de produção e PCP'),
  ('p0303030-0000-0000-0000-000000000002', 'PRODUCAO_UPDATE', 'PRODUCAO', 'UPDATE', 'Apontamento de ordens e paradas de máquina'),
  ('p0303030-0000-0000-0000-000000000003', 'CORTE_DOBRA_OP', 'CORTE', 'UPDATE', 'Operação de planos de corte e dobras CNC'),

  -- Estoque & Compras
  ('p0404040-0000-0000-0000-000000000001', 'ESTOQUE_ADMIN', 'ESTOQUE', 'ADMIN', 'Gestão total de almoxarifado e movimentações'),
  ('p0404040-0000-0000-0000-000000000002', 'ESTOQUE_READ', 'ESTOQUE', 'READ', 'Consulta de saldos e lotes de matéria-prima'),

  -- Fiscal & Faturamento
  ('p0505050-0000-0000-0000-000000000001', 'FISCAL_ADMIN', 'FISCAL', 'ADMIN', 'Emissão e cancelamento de NF-e/NFS-e e parametrização fiscal'),
  ('p0505050-0000-0000-0000-000000000002', 'FISCAL_READ', 'FISCAL', 'READ', 'Consulta e exportação de XMLs e DANFEs'),

  -- Financeiro
  ('p0606060-0000-0000-0000-000000000001', 'FINANCEIRO_ADMIN', 'FINANCEIRO', 'ADMIN', 'Gestão de contas a pagar, receber, fluxo de caixa e DRE'),
  ('p0606060-0000-0000-0000-000000000002', 'FINANCEIRO_READ', 'FINANCEIRO', 'READ', 'Consulta de títulos e extratos financeiros')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED: USUÁRIOS INICIAIS
INSERT INTO usuarios (id, nome, email, cpf, cargo, senha_hash, is_super_admin, ativo)
VALUES
  (
    'u1111111-1111-1111-1111-111111111111',
    'Administrador Geral do Grupo',
    'superadmin@industrialgroup.com.br',
    '111.222.333-44',
    'CTO / Diretor de Operações',
    '$2a$12$e8Y4vKxN8YQ7QnZfA5lZg.SuperAdminHashedPassSecret2026',
    TRUE,
    TRUE
  ),
  (
    'u2222222-2222-2222-2222-222222222222',
    'Carlos Eduardo Mendonça',
    'carlos.financeiro@mwam.com.br',
    '222.333.444-55',
    'Diretor Financeiro',
    '$2a$12$e8Y4vKxN8YQ7QnZfA5lZg.CarlosFinanceiroHash2026',
    FALSE,
    TRUE
  ),
  (
    'u3333333-3333-3333-3333-333333333333',
    'Mariana Rocha Tritech',
    'mariana.tritech@tritech.com.br',
    '333.444.555-66',
    'Gerente Geral de Unidades Tritech',
    '$2a$12$e8Y4vKxN8YQ7QnZfA5lZg.MarianaTritechHash2026',
    FALSE,
    TRUE
  ),
  (
    'u4444444-4444-4444-4444-444444444444',
    'José Roberto Senagro',
    'jose.senagro@senagro.ind.br',
    '444.555.666-77',
    'Supervisor de Produção',
    '$2a$12$e8Y4vKxN8YQ7QnZfA5lZg.JoseSenagroHash2026',
    FALSE,
    TRUE
  ),
  (
    'u5555555-5555-5555-5555-555555555555',
    'Ana Paula Fiscal',
    'ana.fiscal@industrialgroup.com.br',
    '555.666.777-88',
    'Auditora Fiscal Corporativa',
    '$2a$12$e8Y4vKxN8YQ7QnZfA5lZg.AnaFiscalHash2026',
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- 5. SEED: ASSOCIAÇÕES USUARIO_EMPRESAS (Vínculos Multiempresa)
-- Superadmin vinculado a TODAS as 5 empresas
INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil_id, padrao, ativo)
VALUES
  ('u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', TRUE, TRUE),
  ('u1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', FALSE, TRUE),
  ('u1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', FALSE, TRUE),
  ('u1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', FALSE, TRUE),
  ('u1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', FALSE, TRUE)
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- Carlos (Diretor Financeiro): Vinculado a MWAM e Oliveira & Amorim
INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil_id, padrao, ativo)
VALUES
  ('u2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', TRUE, TRUE),
  ('u2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', FALSE, TRUE)
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- Mariana: Vinculada estritamente às duas Tritech (Corte/Dobra e Industrial)
INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil_id, padrao, ativo)
VALUES
  ('u3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', TRUE, TRUE),
  ('u3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', FALSE, TRUE)
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- José: Vinculado APENAS à Senagro
INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil_id, padrao, ativo)
VALUES
  ('u4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', TRUE, TRUE)
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- Ana Paula (Fiscal): Vinculada a todas as empresas com perfil fiscal
INSERT INTO usuario_empresas (usuario_id, empresa_id, perfil_id, padrao, ativo)
VALUES
  ('u5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', TRUE, TRUE),
  ('u5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', FALSE, TRUE),
  ('u5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', FALSE, TRUE),
  ('u5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', FALSE, TRUE),
  ('u5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', FALSE, TRUE)
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

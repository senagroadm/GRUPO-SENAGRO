-- =============================================================================
-- SEED: 0001_seed_initial_companies.sql
-- DESCRIPTION: Cadastro oficial das 5 empresas do grupo industrial
-- =============================================================================

INSERT INTO empresas (id, codigo, razao_social, nome_fantasia, cnpj, inscricao_estadual, ramo_atividade, regime_tributario)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'MWAM',
        'MWAM Engenharia e Serviços Industrial Ltda',
        'MWAM Engenharia',
        '44.566.045/0001-01',
        'ISENTO',
        'Engenharia e Serviços Industriais de Montagem e Manutenção',
        'LUCRO_PRESUMIDO'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'OLIVEIRA_AMORIM',
        'Oliveira e Amorim Distribuição Ltda',
        'Oliveira & Amorim Distribuição',
        '26.200.037/0001-57',
        '003291823.00-12',
        'Comércio Atacadista e Distribuição de Aço e Insumos Industriais',
        'LUCRO_REAL'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'SENAGRO',
        'Senagro Indústria e Comércio Ltda',
        'Senagro Indústria',
        '23.280.366/0001-67',
        '002981921.00-45',
        'Indústria e Comércio de Máquinas e Equipamentos Agrícolas',
        'LUCRO_REAL'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'TRITECH_CORTE',
        'Tritech Corte Dobra e Fabricação Ltda',
        'Tritech Corte & Dobra',
        '48.082.502/0001-35',
        '004128912.00-88',
        'Serviços Especializados de Corte a Laser/Plasma, Dobra CNC e Caldeiraria Leve',
        'LUCRO_REAL'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'TRITECH_IND',
        'Tritech Industrial Ltda',
        'Tritech Industrial',
        '64.036.495/0001-91',
        '001928374.00-99',
        'Indústria e Fabricação de Estruturas Pesadas e Máquinas Industriais',
        'LUCRO_REAL'
    )
ON CONFLICT (cnpj) DO UPDATE 
SET razao_social = EXCLUDED.razao_social,
    nome_fantasia = EXCLUDED.nome_fantasia,
    ramo_atividade = EXCLUDED.ramo_atividade;

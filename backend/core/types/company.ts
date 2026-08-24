export interface Empresa {
  id: string;
  codigo: 'MWAM' | 'OLIVEIRA_AMORIM' | 'SENAGRO' | 'TRITECH_CORTE' | 'TRITECH_IND' | string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributario: 'LUCRO_REAL' | 'LUCRO_PRESUMIDO' | 'SIMPLES_NACIONAL';
  ramoAtividade: string;
  isActive: boolean;
}

export const EMPRESAS_GRUPO: Empresa[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    codigo: 'MWAM',
    razaoSocial: 'MWAM Engenharia e Serviços Industrial Ltda',
    nomeFantasia: 'MWAM Engenharia',
    cnpj: '44.566.045/0001-01',
    regimeTributario: 'LUCRO_PRESUMIDO',
    ramoAtividade: 'Engenharia e Serviços Industriais de Montagem e Manutenção',
    isActive: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    codigo: 'OLIVEIRA_AMORIM',
    razaoSocial: 'Oliveira e Amorim Distribuição Ltda',
    nomeFantasia: 'Oliveira & Amorim Distribuição',
    cnpj: '26.200.037/0001-57',
    inscricaoEstadual: '003291823.00-12',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Comércio Atacadista e Distribuição de Aço e Insumos Industriais',
    isActive: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    codigo: 'SENAGRO',
    razaoSocial: 'Senagro Indústria e Comércio Ltda',
    nomeFantasia: 'Senagro Indústria',
    cnpj: '23.280.366/0001-67',
    inscricaoEstadual: '002981921.00-45',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Indústria e Comércio de Máquinas e Equipamentos Agrícolas',
    isActive: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    codigo: 'TRITECH_CORTE',
    razaoSocial: 'Tritech Corte Dobra e Fabricação Ltda',
    nomeFantasia: 'Tritech Corte & Dobra',
    cnpj: '48.082.502/0001-35',
    inscricaoEstadual: '004128912.00-88',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Serviços Especializados de Corte a Laser/Plasma, Dobra CNC e Caldeiraria Leve',
    isActive: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    codigo: 'TRITECH_IND',
    razaoSocial: 'Tritech Industrial Ltda',
    nomeFantasia: 'Tritech Industrial',
    cnpj: '64.036.495/0001-91',
    inscricaoEstadual: '001928374.00-99',
    regimeTributario: 'LUCRO_REAL',
    ramoAtividade: 'Indústria e Fabricação de Estruturas Pesadas e Máquinas Industriais',
    isActive: true,
  },
];

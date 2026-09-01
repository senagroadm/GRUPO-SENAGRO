import crypto from 'crypto';
import { BadRequestError, NotFoundError } from '../../core/errors';
import { logger } from '../../core/logger';

export interface CrmOrigem {
  id: string;
  empresaId?: string | null;
  nome: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}

export interface CrmMotivoPerda {
  id: string;
  empresaId?: string | null;
  nome: string;
  codigo: string;
  categoria: 'PRECO' | 'PRAZO' | 'TECNICO' | 'CONCORRENTE' | 'CREDITO' | 'DESISTENCIA';
  ativo: boolean;
}

export interface CrmEtapaFunil {
  id: string;
  empresaId?: string | null;
  nome: string;
  codigo: string;
  ordem: number;
  probabilidadePadrao: number; // 0-100
  corHex: string;
  isFinalGanha: boolean;
  isFinalPerdida: boolean;
  ativo: boolean;
}

export interface CrmCliente {
  id: string;
  empresaId: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  segmento: string;
  contatoNome?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  limiteCredito?: number;
  ativo: boolean;
  criadoEm: string;
}

export interface CrmLead {
  id: string;
  empresaId: string;
  origemId?: string;
  origemNome?: string;
  nomeContato: string;
  empresaLead: string;
  cargo?: string;
  email: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  segmentoIndustrial?: string;
  valorEstimado?: number;
  status: 'NOVO' | 'EM_QUALIFICACAO' | 'QUALIFICADO' | 'CONVERTIDO' | 'DESQUALIFICADO';
  motivoDesqualificacao?: string;
  atribuidoUsuarioId?: string;
  atribuidoUsuarioNome?: string;
  clienteGeradoId?: string;
  oportunidadeGeradaId?: string;
  dataPrimeiroContato?: string;
  convertidoEm?: string;
  notas?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CrmOportunidade {
  id: string;
  empresaId: string;
  codigo: string;
  titulo: string;
  clienteId?: string;
  clienteNome?: string;
  leadOrigemId?: string;
  origemId?: string;
  origemNome?: string;
  etapaId: string;
  etapaNome?: string;
  vendedorUsuarioId?: string;
  vendedorNome?: string;
  valorEstimado: number;
  valorFechado?: number;
  probabilidadePercentual: number;
  dataAbertura: string;
  dataPrevisaoFechamento?: string;
  dataFechamentoReal?: string;
  status: 'ABERTA' | 'GANHA' | 'PERDIDA' | 'CANCELADA';
  motivoPerdaId?: string;
  motivoPerdaNome?: string;
  detalhesPerda?: string;
  concorrenteVencedor?: string;
  itensSolicitados?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CrmAtividade {
  id: string;
  empresaId: string;
  oportunidadeId?: string;
  oportunidadeTitulo?: string;
  leadId?: string;
  leadNome?: string;
  clienteId?: string;
  clienteNome?: string;
  usuarioId: string;
  usuarioNome?: string;
  tipo: 'LIGACAO' | 'REUNIAO_PRESENCIAL' | 'REUNIAO_ONLINE' | 'EMAIL' | 'ENVIO_PROPOSTA' | 'VISITA_TECNICA' | 'WHATSAPP';
  titulo: string;
  dataInicio: string;
  duracaoMinutos: number;
  descricao: string;
  resultado: string; // Obrigatório: resultado do contato
  concluida: boolean;
  criadoEm: string;
}

export interface CrmFollowUp {
  id: string;
  empresaId: string;
  oportunidadeId?: string;
  oportunidadeTitulo?: string;
  leadId?: string;
  leadNome?: string;
  atividadeOrigemId?: string;
  usuarioResponsavelId: string;
  usuarioResponsavelNome?: string;
  tituloPendencia: string;
  descricao?: string;
  dataLimite: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  dataConclusao?: string;
  observacoesConclusao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CrmDashboardMetrics {
  totalLeads: number;
  leadsNovos: number;
  leadsQualificados: number;
  leadsConvertidos: number;
  taxaConversaoLeads: number; // %
  totalOportunidades: number;
  oportunidadesAbertas: number;
  oportunidadesGanhas: number;
  oportunidadesPerdidas: number;
  valorPotencialPipeline: number; // Soma das abertas
  valorPonderadoPipeline: number; // Soma das abertas * probabilidade
  valorTotalGanho: number; // Soma das ganhas
  taxaConversaoOportunidades: number; // % ganhas / (ganhas + perdidas)
  tempoMedioFechamentoDias: number;
  motivosDePerdaRanking: Array<{
    motivoId: string;
    motivoNome: string;
    categoria: string;
    quantidade: number;
    valorPerdidoTotal: number;
    percentual: number;
  }>;
  oportunidadesPorEtapa: Array<{
    etapaId: string;
    etapaNome: string;
    ordem: number;
    corHex: string;
    quantidade: number;
    valorTotal: number;
  }>;
  followUpsAtrasados: number;
  followUpsPendentesHoje: number;
}

class CrmService {
  private origens: CrmOrigem[] = [];
  private motivosPerda: CrmMotivoPerda[] = [];
  private etapasFunil: CrmEtapaFunil[] = [];
  private clientes: Map<string, CrmCliente> = new Map();
  private leads: Map<string, CrmLead> = new Map();
  private oportunidades: Map<string, CrmOportunidade> = new Map();
  private atividades: CrmAtividade[] = [];
  private followUps: Map<string, CrmFollowUp> = new Map();

  constructor() {
    this.seedMasterData();
    this.seedSampleCRM();
  }

  private seedMasterData() {
    // 1. Origens Padronizadas
    this.origens = [
      { id: 'orig-01', nome: 'Indicação / Networking', codigo: 'INDICACAO', ativo: true },
      { id: 'orig-02', nome: 'Website Institucional & Catálogo', codigo: 'WEBSITE', ativo: true },
      { id: 'orig-03', nome: 'Prospecção Ativa (Outbound Industrial)', codigo: 'OUTBOUND', ativo: true },
      { id: 'orig-04', nome: 'Feira Industrial / Expomafe', codigo: 'FEIRA', ativo: true },
      { id: 'orig-05', nome: 'Representante Comercial Regional', codigo: 'REPRESENTANTE', ativo: true },
      { id: 'orig-06', nome: 'Base de Clientes (Cross-sell / Recompra)', codigo: 'BASE_CLIENTES', ativo: true },
    ];

    // 2. Motivos de Perda Estruturados
    this.motivosPerda = [
      { id: 'mot-01', nome: 'Preço Superior ao Concorrente', codigo: 'PRECO_CONCORRENCIA', categoria: 'PRECO', ativo: true },
      { id: 'mot-02', nome: 'Prazo de Entrega Incompatível com a Obra', codigo: 'PRAZO_INCOMPATIVEL', categoria: 'PRAZO', ativo: true },
      { id: 'mot-03', nome: 'Especificação / Espessura Fora do Escopo', codigo: 'FORA_ESCOPO_MAQUINA', categoria: 'TECNICO', ativo: true },
      { id: 'mot-04', nome: 'Cancelamento / Congelamento de Projeto pelo Cliente', codigo: 'CANCELAMENTO_CLIENTE', categoria: 'DESISTENCIA', ativo: true },
      { id: 'mot-05', nome: 'Restrição de Crédito / Limite Insuficiente', codigo: 'RESTRICAO_CREDITO', categoria: 'CREDITO', ativo: true },
      { id: 'mot-06', nome: 'Lead Sem Retorno após 5 Contatos', codigo: 'SEM_RETORNO', categoria: 'DESISTENCIA', ativo: true },
    ];

    // 3. Etapas do Funil Industrial
    this.etapasFunil = [
      { id: 'etapa-01', nome: '1. Prospecção & Contato Inicial', codigo: 'PROSPECCAO', ordem: 1, probabilidadePadrao: 15, corHex: '#64748b', isFinalGanha: false, isFinalPerdida: false, ativo: true },
      { id: 'etapa-02', nome: '2. Qualificação Técnica & Desenhos', codigo: 'QUALIFICACAO', ordem: 2, probabilidadePadrao: 30, corHex: '#3b82f6', isFinalGanha: false, isFinalPerdida: false, ativo: true },
      { id: 'etapa-03', nome: '3. Levantamento & Orçamento CNC', codigo: 'ORCAMENTO', ordem: 3, probabilidadePadrao: 50, corHex: '#06b6d4', isFinalGanha: false, isFinalPerdida: false, ativo: true },
      { id: 'etapa-04', nome: '4. Proposta Comercial Enviada', codigo: 'PROPOSTA_ENVIADA', ordem: 4, probabilidadePadrao: 70, corHex: '#8b5cf6', isFinalGanha: false, isFinalPerdida: false, ativo: true },
      { id: 'etapa-05', nome: '5. Negociação Final & Prazos', codigo: 'NEGOCIACAO', ordem: 5, probabilidadePadrao: 85, corHex: '#f59e0b', isFinalGanha: false, isFinalPerdida: false, ativo: true },
      { id: 'etapa-06', nome: '6. Fechado / Ganho (Pedido Liberado)', codigo: 'FECHADO_GANHO', ordem: 6, probabilidadePadrao: 100, corHex: '#10b981', isFinalGanha: true, isFinalPerdida: false, ativo: true },
      { id: 'etapa-07', nome: '7. Fechado / Perdido', codigo: 'FECHADO_PERDIDO', ordem: 7, probabilidadePadrao: 0, corHex: '#ef4444', isFinalGanha: false, isFinalPerdida: true, ativo: true },
    ];
  }

  private seedSampleCRM() {
    const defaultEmpresaId = 'e1111111-1111-1111-1111-111111111111'; // Matriz Industrial

    // Clientes iniciais
    const clientesIniciais: CrmCliente[] = [
      {
        id: 'cli-001',
        empresaId: defaultEmpresaId,
        razaoSocial: 'CALDEIRARIA E MONTAGENS PAULISTA LTDA',
        nomeFantasia: 'Paulista Caldeiraria',
        cnpjCpf: '12.345.678/0001-90',
        segmento: 'CALDEIRARIA_PESADA',
        contatoNome: 'Eng. Marcelo Ribeiro',
        email: 'marcelo.ribeiro@paulistacaldeiraria.com.br',
        telefone: '(11) 98844-1234',
        cidade: 'Campinas',
        uf: 'SP',
        limiteCredito: 250000,
        ativo: true,
        criadoEm: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      },
      {
        id: 'cli-002',
        empresaId: defaultEmpresaId,
        razaoSocial: 'AGROMAQ IMPLEMENTOS AGRICOLAS S.A.',
        nomeFantasia: 'Agromaq Implementos',
        cnpjCpf: '23.456.789/0001-01',
        segmento: 'AGRONEGOCIO',
        contatoNome: 'Carlos Eduardo Silveira',
        email: 'carlos.silveira@agromaq.ind.br',
        telefone: '(16) 3322-9000',
        cidade: 'Ribeirão Preto',
        uf: 'SP',
        limiteCredito: 500000,
        ativo: true,
        criadoEm: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
      },
      {
        id: 'cli-003',
        empresaId: defaultEmpresaId,
        razaoSocial: 'MINERACAO VALE DO ACO INDUSTRIAL EIRELI',
        nomeFantasia: 'Vale do Aço Mineração',
        cnpjCpf: '34.567.890/0001-12',
        segmento: 'MINERACAO',
        contatoNome: 'Dra. Fernanda Lemos',
        email: 'fernanda.lemos@valedoaco.com.br',
        telefone: '(31) 99123-8888',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        limiteCredito: 1000000,
        ativo: true,
        criadoEm: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
      },
    ];

    clientesIniciais.forEach((c) => this.clientes.set(c.id, c));

    // Leads iniciais
    const leadsIniciais: CrmLead[] = [
      {
        id: 'lead-001',
        empresaId: defaultEmpresaId,
        origemId: 'orig-04',
        origemNome: 'Feira Industrial / Expomafe',
        nomeContato: 'Roberto Guimarães',
        empresaLead: 'Guimarães Estruturas Metálicas',
        cargo: 'Gerente de Suprimentos',
        email: 'roberto@guimaraesestruturas.com.br',
        telefone: '(19) 97123-4567',
        cidade: 'Piracicaba',
        uf: 'SP',
        segmentoIndustrial: 'ESTRUTURAS_METALICAS',
        valorEstimado: 185000,
        status: 'EM_QUALIFICACAO',
        atribuidoUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        atribuidoUsuarioNome: 'Dr. Roberto Admin',
        notas: 'Interesse em 40 toneladas de perfis soldados W e corte laser em chapas de 16mm.',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'lead-002',
        empresaId: defaultEmpresaId,
        origemId: 'orig-02',
        origemNome: 'Website Institucional & Catálogo',
        nomeContato: 'Mariana Duarte',
        empresaLead: 'Duarte Automação e Painéis',
        cargo: 'Diretora Técnica',
        email: 'm.duarte@duarteauto.com.br',
        telefone: '(11) 96543-2109',
        cidade: 'São Paulo',
        uf: 'SP',
        segmentoIndustrial: 'PAINEIS_ELETRICOS',
        valorEstimado: 92000,
        status: 'QUALIFICADO',
        atribuidoUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        atribuidoUsuarioNome: 'Dr. Roberto Admin',
        notas: 'Necessidade contínua de caixas e gabinetes em aço inox 304 escovado.',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'lead-003',
        empresaId: defaultEmpresaId,
        origemId: 'orig-01',
        origemNome: 'Indicação / Networking',
        nomeContato: 'Eng. Marcelo Ribeiro',
        empresaLead: 'Paulista Caldeiraria',
        cargo: 'Engenheiro Chefe',
        email: 'marcelo.ribeiro@paulistacaldeiraria.com.br',
        telefone: '(11) 98844-1234',
        cidade: 'Campinas',
        uf: 'SP',
        segmentoIndustrial: 'CALDEIRARIA_PESADA',
        valorEstimado: 340000,
        status: 'CONVERTIDO',
        clienteGeradoId: 'cli-001',
        oportunidadeGeradaId: 'opt-001',
        convertidoEm: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
        notas: 'Convertido com sucesso na Oportunidade OPT-2026-001.',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    ];

    leadsIniciais.forEach((l) => this.leads.set(l.id, l));

    // Oportunidades iniciais
    const oportunidadesIniciais: CrmOportunidade[] = [
      {
        id: 'opt-001',
        empresaId: defaultEmpresaId,
        codigo: 'OPT-2026-001',
        titulo: 'Fornecimento de 4 Tanques Cilíndricos Inox 316L',
        clienteId: 'cli-001',
        clienteNome: 'Paulista Caldeiraria',
        origemId: 'orig-01',
        origemNome: 'Indicação / Networking',
        etapaId: 'etapa-04', // Proposta Enviada
        etapaNome: '4. Proposta Comercial Enviada',
        vendedorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        vendedorNome: 'Dr. Roberto Admin',
        valorEstimado: 340000,
        probabilidadePercentual: 70,
        dataAbertura: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
        dataPrevisaoFechamento: new Date(Date.now() + 3600000 * 24 * 10).toISOString(),
        status: 'ABERTA',
        itensSolicitados: 'Caldeiraria pesada, solda TIG automatizada, decapagem química e teste hidrostático.',
        observacoes: 'Proposta enviada em 18/08. Cliente analisando cronograma de montagem em campo.',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'opt-002',
        empresaId: defaultEmpresaId,
        codigo: 'OPT-2026-002',
        titulo: 'Lote 500 Conjuntos Braço Articulado Plantadeira',
        clienteId: 'cli-002',
        clienteNome: 'Agromaq Implementos',
        origemId: 'orig-05',
        origemNome: 'Representante Comercial Regional',
        etapaId: 'etapa-05', // Negociação Final
        etapaNome: '5. Negociação Final & Prazos',
        vendedorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        vendedorNome: 'Dr. Roberto Admin',
        valorEstimado: 480000,
        probabilidadePercentual: 85,
        dataAbertura: new Date(Date.now() - 3600000 * 24 * 22).toISOString(),
        dataPrevisaoFechamento: new Date(Date.now() + 3600000 * 24 * 5).toISOString(),
        status: 'ABERTA',
        itensSolicitados: 'Corte laser fibra 12mm SAE 1045, dobra CNC 320t e usinagem de buchas.',
        observacoes: 'Ajuste de condições comerciais (30/60/90 dias com frete FOB fábrica).',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 22).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'opt-003',
        empresaId: defaultEmpresaId,
        codigo: 'OPT-2026-003',
        titulo: 'Revestimento de Chute de Minério em Chapa Bimetálica',
        clienteId: 'cli-003',
        clienteNome: 'Vale do Aço Mineração',
        origemId: 'orig-03',
        origemNome: 'Prospecção Ativa (Outbound Industrial)',
        etapaId: 'etapa-06', // Fechado Ganho
        etapaNome: '6. Fechado / Ganho (Pedido Liberado)',
        vendedorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        vendedorNome: 'Dr. Roberto Admin',
        valorEstimado: 620000,
        valorFechado: 615000,
        probabilidadePercentual: 100,
        dataAbertura: new Date(Date.now() - 3600000 * 24 * 35).toISOString(),
        dataFechamentoReal: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        status: 'GANHA',
        itensSolicitados: 'Chapas antidesgaste Hardox 450 com caldeiraria e furação escareada.',
        observacoes: 'Contrato fechado com sucesso! Ordem de produção liberada no PCP.',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 35).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'opt-004',
        empresaId: defaultEmpresaId,
        codigo: 'OPT-2026-004',
        titulo: 'Estrutura Metálica para Galpão Logístico 3.000m²',
        clienteId: 'cli-001',
        clienteNome: 'Paulista Caldeiraria',
        origemId: 'orig-04',
        origemNome: 'Feira Industrial / Expomafe',
        etapaId: 'etapa-07', // Fechado Perdido
        etapaNome: '7. Fechado / Perdido',
        vendedorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        vendedorNome: 'Dr. Roberto Admin',
        valorEstimado: 750000,
        probabilidadePercentual: 0,
        dataAbertura: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
        dataFechamentoReal: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        status: 'PERDIDA',
        motivoPerdaId: 'mot-01',
        motivoPerdaNome: 'Preço Superior ao Concorrente',
        detalhesPerda: 'Concorrente regional ofereceu 8% a menos com prazo de pagamento mais estendido.',
        concorrenteVencedor: 'Metalúrgica Aliança',
        itensSolicitados: 'Treliças metálicas 24m vão livre e pilares soldados.',
        observacoes: 'Cliente elogiou a precisão técnica, mas optou pelo menor valor global.',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    ];

    oportunidadesIniciais.forEach((o) => this.oportunidades.set(o.id, o));

    // Atividades iniciais
    this.atividades = [
      {
        id: 'ativ-001',
        empresaId: defaultEmpresaId,
        oportunidadeId: 'opt-001',
        oportunidadeTitulo: 'Fornecimento de 4 Tanques Cilíndricos Inox 316L',
        clienteId: 'cli-001',
        clienteNome: 'Paulista Caldeiraria',
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Dr. Roberto Admin',
        tipo: 'REUNIAO_ONLINE',
        titulo: 'Alinhamento Técnico sobre Tolerâncias de Soldagem',
        dataInicio: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        duracaoMinutos: 45,
        descricao: 'Reunião via Teams com Marcelo e equipe de engenharia para validar norma ASME VIII e ensaios de LP/Ultrassom.',
        resultado: 'Cliente aprovou o plano de inspeção e solicitou envio formal da minuta contratual.',
        concluida: true,
        criadoEm: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      },
      {
        id: 'ativ-002',
        empresaId: defaultEmpresaId,
        oportunidadeId: 'opt-002',
        oportunidadeTitulo: 'Lote 500 Conjuntos Braço Articulado Plantadeira',
        clienteId: 'cli-002',
        clienteNome: 'Agromaq Implementos',
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Dr. Roberto Admin',
        tipo: 'LIGACAO',
        titulo: 'Negociação de Lotes de Entrega e Faturamento Escalonado',
        dataInicio: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        duracaoMinutos: 25,
        descricao: 'Ligação com o Diretor Carlos para detalhar entrega de 125 conjuntos a cada 15 dias.',
        resultado: 'Acordo prévio fechado sobre o cronograma. Pendente validação da diretoria financeira da Agromaq.',
        concluida: true,
        criadoEm: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: 'ativ-003',
        empresaId: defaultEmpresaId,
        leadId: 'lead-001',
        leadNome: 'Guimarães Estruturas Metálicas',
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Dr. Roberto Admin',
        tipo: 'WHATSAPP',
        titulo: 'Envio de Especificações do Parque Fabril e Capacidade Laser',
        dataInicio: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        duracaoMinutos: 15,
        descricao: 'Envio do book institucional com fotos da mesa laser de 6x2.5m e dobradeiras CNC.',
        resultado: 'Roberto visualizou e prometeu encaminhar os arquivos DWG até sexta-feira para orçamento.',
        concluida: true,
        criadoEm: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      },
    ];

    // Follow-ups / Pendências iniciais
    const followUpsIniciais: CrmFollowUp[] = [
      {
        id: 'fol-001',
        empresaId: defaultEmpresaId,
        oportunidadeId: 'opt-001',
        oportunidadeTitulo: 'Fornecimento de 4 Tanques Cilíndricos Inox 316L',
        usuarioResponsavelId: 'u1111111-1111-1111-1111-111111111111',
        usuarioResponsavelNome: 'Dr. Roberto Admin',
        tituloPendencia: 'Follow-up de Assinatura da Minuta Comercial e Sinal',
        descricao: 'Ligar para Marcelo Ribeiro para confirmar recebimento e validação da minuta.',
        dataLimite: new Date(Date.now() + 3600000 * 24 * 2).toISOString(),
        prioridade: 'ALTA',
        status: 'PENDENTE',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'fol-002',
        empresaId: defaultEmpresaId,
        oportunidadeId: 'opt-002',
        oportunidadeTitulo: 'Lote 500 Conjuntos Braço Articulado Plantadeira',
        usuarioResponsavelId: 'u1111111-1111-1111-1111-111111111111',
        usuarioResponsavelNome: 'Dr. Roberto Admin',
        tituloPendencia: 'Checar Liberação do Limite de Crédito para Faturamento 30/60/90',
        descricao: 'Verificar com o financeiro interno e Serasa se o score comporta o pedido de R$ 480k.',
        dataLimite: new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
        prioridade: 'ALTA',
        status: 'EM_ANDAMENTO',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: 'fol-003',
        empresaId: defaultEmpresaId,
        leadId: 'lead-001',
        leadNome: 'Guimarães Estruturas Metálicas',
        usuarioResponsavelId: 'u1111111-1111-1111-1111-111111111111',
        usuarioResponsavelNome: 'Dr. Roberto Admin',
        tituloPendencia: 'Cobrar envio dos desenhos CAD/DWG para cálculo de corte',
        descricao: 'Verificar se Roberto enviou os arquivos para o setor de Engenharia/Orçamentos.',
        dataLimite: new Date(Date.now() + 3600000 * 24 * 4).toISOString(),
        prioridade: 'MEDIA',
        status: 'PENDENTE',
        criadoEm: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
    ];

    followUpsIniciais.forEach((f) => this.followUps.set(f.id, f));
  }

  // --- Auxiliares (Origens, Motivos, Etapas, Clientes) ---
  getAuxiliares(empresaId: string) {
    return {
      origens: this.origens.filter((o) => !o.empresaId || o.empresaId === empresaId),
      motivosPerda: this.motivosPerda.filter((m) => !m.empresaId || m.empresaId === empresaId),
      etapasFunil: this.etapasFunil.filter((e) => !e.empresaId || e.empresaId === empresaId).sort((a, b) => a.ordem - b.ordem),
      clientes: Array.from(this.clientes.values()).filter((c) => c.empresaId === empresaId && c.ativo),
    };
  }

  // --- Leads Management ---
  listarLeads(empresaId: string, filtros?: { status?: string; busca?: string }): CrmLead[] {
    return Array.from(this.leads.values())
      .filter((l) => {
        if (l.empresaId !== empresaId) return false;
        if (filtros?.status && l.status !== filtros.status) return false;
        if (filtros?.busca) {
          const b = filtros.busca.toLowerCase();
          const matchNome = l.nomeContato.toLowerCase().includes(b);
          const matchEmp = l.empresaLead.toLowerCase().includes(b);
          const matchEmail = l.email.toLowerCase().includes(b);
          if (!matchNome && !matchEmp && !matchEmail) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  criarLead(dados: Partial<CrmLead> & { empresaId: string; nomeContato: string; empresaLead: string; email: string }): CrmLead {
    if (!dados.empresaId) throw new BadRequestError('Empresa ID é obrigatório', { code: 'CRM_MISSING_TENANT' });
    if (!dados.nomeContato || !dados.empresaLead || !dados.email) {
      throw new BadRequestError('Nome do contato, empresa e e-mail são obrigatórios', { code: 'CRM_INVALID_LEAD_DATA' });
    }

    const leadId = `lead-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const origem = dados.origemId ? this.origens.find((o) => o.id === dados.origemId) : undefined;

    const lead: CrmLead = {
      id: leadId,
      empresaId: dados.empresaId,
      origemId: dados.origemId,
      origemNome: origem?.nome,
      nomeContato: dados.nomeContato.trim(),
      empresaLead: dados.empresaLead.trim(),
      cargo: dados.cargo?.trim(),
      email: dados.email.trim(),
      telefone: dados.telefone?.trim(),
      cidade: dados.cidade?.trim(),
      uf: dados.uf?.trim()?.toUpperCase(),
      segmentoIndustrial: dados.segmentoIndustrial || 'OUTROS',
      valorEstimado: Number(dados.valorEstimado) || 0,
      status: dados.status || 'NOVO',
      motivoDesqualificacao: dados.motivoDesqualificacao,
      atribuidoUsuarioId: dados.atribuidoUsuarioId,
      atribuidoUsuarioNome: dados.atribuidoUsuarioNome || 'Vendedor Comercial',
      notas: dados.notas,
      dataPrimeiroContato: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.leads.set(leadId, lead);
    logger.info('Lead industrial criado', { leadId, empresaId: dados.empresaId, empresaLead: lead.empresaLead });
    return lead;
  }

  atualizarLead(leadId: string, empresaId: string, dados: Partial<CrmLead>): CrmLead {
    const lead = this.leads.get(leadId);
    if (!lead || lead.empresaId !== empresaId) {
      throw new NotFoundError('Lead não encontrado ou acesso negado');
    }

    if (dados.origemId && dados.origemId !== lead.origemId) {
      const orig = this.origens.find((o) => o.id === dados.origemId);
      if (orig) lead.origemNome = orig.nome;
    }

    Object.assign(lead, dados, { atualizadoEm: new Date().toISOString() });
    this.leads.set(leadId, lead);
    return lead;
  }

  /**
   * CONVERSÃO DE LEAD EM CLIENTE + OPORTUNIDADE (Regra Obrigatória do Prompt)
   */
  converterLead(
    leadId: string,
    empresaId: string,
    params: {
      tituloOportunidade?: string;
      valorEstimado?: number;
      etapaInicialId?: string;
      cnpjCpf?: string;
      criarNovoCliente?: boolean;
      clienteExistenteId?: string;
      usuarioId?: string;
      usuarioNome?: string;
      leadData?: Partial<CrmLead>;
    }
  ): { lead: CrmLead; cliente: CrmCliente; oportunidade: CrmOportunidade } {
    let lead = this.leads.get(leadId);
    if (!lead) {
      // Busca em todos os leads em memória caso o ID tenha sido gerado dinamicamente
      lead = Array.from(this.leads.values()).find((l) => l.id === leadId);
    }
    
    // Se não encontrou o lead (ex: reinício de servidor), recria com os dados fornecidos no payload
    if (!lead && params.leadData) {
      const novoId = leadId.startsWith('lead-') ? leadId : `lead-${Date.now()}`;
      lead = {
        id: novoId,
        empresaId: empresaId,
        nomeContato: params.leadData.nomeContato || 'Contato Industrial',
        empresaLead: params.leadData.empresaLead || 'Empresa Industrial Ltda',
        cargo: params.leadData.cargo,
        email: params.leadData.email || 'contato@empresa.com.br',
        telefone: params.leadData.telefone || '(11) 99999-9999',
        cidade: params.leadData.cidade || 'São Paulo',
        uf: params.leadData.uf || 'SP',
        segmentoIndustrial: params.leadData.segmentoIndustrial || 'OUTROS',
        valorEstimado: Number(params.valorEstimado) || Number(params.leadData.valorEstimado) || 50000,
        status: 'EM_QUALIFICACAO',
        notas: params.leadData.notas,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      this.leads.set(lead.id, lead);
    }

    if (!lead) {
      throw new NotFoundError('Lead não encontrado ou acesso negado');
    }
    if (lead.status === 'CONVERTIDO') {
      throw new BadRequestError('Este lead já foi convertido anteriormente', { code: 'LEAD_ALREADY_CONVERTED' });
    }

    // 1. Resolver ou Criar Cliente
    let cliente: CrmCliente;
    if (params.clienteExistenteId) {
      const existente = this.clientes.get(params.clienteExistenteId);
      if (!existente || existente.empresaId !== empresaId) {
        throw new NotFoundError('Cliente existente selecionado não encontrado');
      }
      cliente = existente;
    } else {
      const novoClienteId = `cli-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      cliente = {
        id: novoClienteId,
        empresaId,
        razaoSocial: lead.empresaLead.toUpperCase(),
        nomeFantasia: lead.empresaLead,
        cnpjCpf: params.cnpjCpf || '00.000.000/0001-00',
        segmento: lead.segmentoIndustrial || 'COMERCIAL_GERAL',
        contatoNome: lead.nomeContato,
        email: lead.email,
        telefone: lead.telefone,
        cidade: lead.cidade,
        uf: lead.uf,
        limiteCredito: 100000,
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      this.clientes.set(cliente.id, cliente);
      logger.info('Cliente gerado a partir de conversão de lead', { clienteId: cliente.id, razaoSocial: cliente.razaoSocial });
    }

    // 2. Criar Oportunidade
    const optId = `opt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const etapaInicial = params.etapaInicialId
      ? this.etapasFunil.find((e) => e.id === params.etapaInicialId) || this.etapasFunil[0]
      : this.etapasFunil[0];

    const oportunidade: CrmOportunidade = {
      id: optId,
      empresaId,
      codigo: `OPT-${new Date().getFullYear()}-${String(this.oportunidades.size + 1).padStart(3, '0')}`,
      titulo: params.tituloOportunidade?.trim() || `Oportunidade - ${lead.empresaLead}`,
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia || cliente.razaoSocial,
      leadOrigemId: lead.id,
      origemId: lead.origemId,
      origemNome: lead.origemNome,
      etapaId: etapaInicial.id,
      etapaNome: etapaInicial.nome,
      vendedorUsuarioId: params.usuarioId || lead.atribuidoUsuarioId,
      vendedorNome: params.usuarioNome || lead.atribuidoUsuarioNome || 'Vendedor Comercial',
      valorEstimado: Number(params.valorEstimado) || Number(lead.valorEstimado) || 50000,
      probabilidadePercentual: etapaInicial.probabilidadePadrao,
      dataAbertura: new Date().toISOString(),
      dataPrevisaoFechamento: new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
      status: 'ABERTA',
      itensSolicitados: lead.notas || 'Conversão de Lead em Oportunidade Industrial',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    this.oportunidades.set(optId, oportunidade);

    // 3. Atualizar Lead para CONVERTIDO
    lead.status = 'CONVERTIDO';
    lead.clienteGeradoId = cliente.id;
    lead.oportunidadeGeradaId = oportunidade.id;
    lead.convertidoEm = new Date().toISOString();
    lead.atualizadoEm = new Date().toISOString();
    this.leads.set(lead.id, lead);

    // 4. Registrar Atividade de Conversão
    this.registrarAtividade({
      empresaId,
      oportunidadeId: oportunidade.id,
      leadId: lead.id,
      clienteId: cliente.id,
      usuarioId: params.usuarioId || 'u1111111-1111-1111-1111-111111111111',
      usuarioNome: params.usuarioNome || 'Sistema CRM',
      tipo: 'ENVIO_PROPOSTA',
      titulo: `Conversão de Lead em Oportunidade (${oportunidade.codigo})`,
      duracaoMinutos: 15,
      descricao: `Lead "${lead.nomeContato}" (${lead.empresaLead}) qualificado e convertido com sucesso no cliente "${cliente.nomeFantasia}" e oportunidade "${oportunidade.titulo}".`,
      resultado: 'Oportunidade aberta no funil e cliente cadastrado.',
      concluida: true,
    });

    // 5. Gerar Follow-up Inicial Obrigatório
    this.criarFollowUp({
      empresaId,
      oportunidadeId: oportunidade.id,
      usuarioResponsavelId: oportunidade.vendedorUsuarioId || 'u1111111-1111-1111-1111-111111111111',
      usuarioResponsavelNome: oportunidade.vendedorNome || 'Vendedor Comercial',
      tituloPendencia: `Primeiro Contato Comercial Técnico - ${cliente.nomeFantasia}`,
      descricao: `Realizar contato técnico inicial para levantamento de requisitos de corte/dobra/caldeiraria.`,
      dataLimite: new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
      prioridade: 'ALTA',
      status: 'PENDENTE',
    });

    logger.info('Lead convertido com sucesso em Cliente e Oportunidade', {
      leadId,
      clienteId: cliente.id,
      oportunidadeId: oportunidade.id,
    });

    return { lead, cliente, oportunidade };
  }

  // --- Oportunidades Management ---
  listarOportunidades(empresaId: string, filtros?: { etapaId?: string; status?: string; busca?: string }): CrmOportunidade[] {
    return Array.from(this.oportunidades.values())
      .filter((o) => {
        if (o.empresaId !== empresaId) return false;
        if (filtros?.etapaId && o.etapaId !== filtros.etapaId) return false;
        if (filtros?.status && o.status !== filtros.status) return false;
        if (filtros?.busca) {
          const b = filtros.busca.toLowerCase();
          const matchTit = o.titulo.toLowerCase().includes(b);
          const matchCod = o.codigo.toLowerCase().includes(b);
          const matchCli = o.clienteNome?.toLowerCase().includes(b);
          if (!matchTit && !matchCod && !matchCli) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  getOportunidadeById(oportunidadeId: string, empresaId: string): CrmOportunidade {
    const opt = this.oportunidades.get(oportunidadeId);
    if (!opt || opt.empresaId !== empresaId) {
      throw new NotFoundError('Oportunidade não encontrada ou acesso negado');
    }
    return opt;
  }

  criarOportunidade(dados: Partial<CrmOportunidade> & { empresaId: string; titulo: string; etapaId: string }): CrmOportunidade {
    if (!dados.empresaId) throw new BadRequestError('Empresa ID é obrigatório', { code: 'CRM_MISSING_TENANT' });
    if (!dados.titulo || !dados.etapaId) {
      throw new BadRequestError('Título e Etapa do funil são obrigatórios', { code: 'CRM_INVALID_OPPORTUNITY_DATA' });
    }

    const optId = `opt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const etapa = this.etapasFunil.find((e) => e.id === dados.etapaId) || this.etapasFunil[0];
    const cliente = dados.clienteId ? this.clientes.get(dados.clienteId) : undefined;
    const origem = dados.origemId ? this.origens.find((o) => o.id === dados.origemId) : undefined;

    const opt: CrmOportunidade = {
      id: optId,
      empresaId: dados.empresaId,
      codigo: `OPT-${new Date().getFullYear()}-${String(this.oportunidades.size + 1).padStart(3, '0')}`,
      titulo: dados.titulo.trim(),
      clienteId: dados.clienteId,
      clienteNome: cliente?.nomeFantasia || cliente?.razaoSocial || dados.clienteNome,
      leadOrigemId: dados.leadOrigemId,
      origemId: dados.origemId,
      origemNome: origem?.nome,
      etapaId: etapa.id,
      etapaNome: etapa.nome,
      vendedorUsuarioId: dados.vendedorUsuarioId,
      vendedorNome: dados.vendedorNome || 'Vendedor Comercial',
      valorEstimado: Number(dados.valorEstimado) || 0,
      valorFechado: dados.valorFechado,
      probabilidadePercentual: dados.probabilidadePercentual || etapa.probabilidadePadrao,
      dataAbertura: new Date().toISOString(),
      dataPrevisaoFechamento: dados.dataPrevisaoFechamento || new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
      status: 'ABERTA',
      itensSolicitados: dados.itensSolicitados,
      observacoes: dados.observacoes,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.oportunidades.set(optId, opt);
    return opt;
  }

  moverEtapaOportunidade(oportunidadeId: string, empresaId: string, novaEtapaId: string): CrmOportunidade {
    const opt = this.getOportunidadeById(oportunidadeId, empresaId);
    const etapa = this.etapasFunil.find((e) => e.id === novaEtapaId);
    if (!etapa) throw new BadRequestError('Etapa de funil inválida', { code: 'CRM_INVALID_STAGE' });

    opt.etapaId = etapa.id;
    opt.etapaNome = etapa.nome;
    opt.probabilidadePercentual = etapa.probabilidadePadrao;

    if (etapa.isFinalGanha) {
      opt.status = 'GANHA';
      opt.dataFechamentoReal = new Date().toISOString();
      opt.valorFechado = opt.valorFechado || opt.valorEstimado;
    } else if (etapa.isFinalPerdida) {
      // Se mover para perdida, exige fechamento com motivo
      throw new BadRequestError('Para marcar como perdida, utilize o fechamento com motivo de perda obrigatório', { code: 'CRM_LOSS_REASON_REQUIRED' });
    } else {
      opt.status = 'ABERTA';
    }

    opt.atualizadoEm = new Date().toISOString();
    this.oportunidades.set(opt.id, opt);
    return opt;
  }

  /**
   * FECHAMENTO DE OPORTUNIDADE (GANHA / PERDIDA)
   * REGRA: Motivo de perda é estritamente obrigatório se status === 'PERDIDA'
   */
  fecharOportunidade(
    oportunidadeId: string,
    empresaId: string,
    params: {
      status: 'GANHA' | 'PERDIDA' | 'CANCELADA';
      valorFechado?: number;
      motivoPerdaId?: string;
      detalhesPerda?: string;
      concorrenteVencedor?: string;
      usuarioId?: string;
      usuarioNome?: string;
    }
  ): CrmOportunidade {
    const opt = this.getOportunidadeById(oportunidadeId, empresaId);

    if (params.status === 'PERDIDA') {
      if (!params.motivoPerdaId) {
        throw new BadRequestError('O motivo da perda é estritamente OBRIGATÓRIO para encerrar a oportunidade como perdida', { code: 'CRM_MOTIVO_PERDA_OBRIGATORIO' });
      }
      const motivo = this.motivosPerda.find((m) => m.id === params.motivoPerdaId);
      if (!motivo) {
        throw new BadRequestError('Motivo de perda selecionado não é válido', { code: 'CRM_MOTIVO_PERDA_INVALIDO' });
      }
      opt.motivoPerdaId = motivo.id;
      opt.motivoPerdaNome = motivo.nome;
      opt.detalhesPerda = params.detalhesPerda?.trim();
      opt.concorrenteVencedor = params.concorrenteVencedor?.trim();
      opt.probabilidadePercentual = 0;

      // Move para etapa final perdida
      const etapaPerdida = this.etapasFunil.find((e) => e.isFinalPerdida) || this.etapasFunil[this.etapasFunil.length - 1];
      opt.etapaId = etapaPerdida.id;
      opt.etapaNome = etapaPerdida.nome;
    } else if (params.status === 'GANHA') {
      opt.valorFechado = Number(params.valorFechado) || opt.valorEstimado;
      opt.probabilidadePercentual = 100;
      const etapaGanha = this.etapasFunil.find((e) => e.isFinalGanha) || this.etapasFunil[this.etapasFunil.length - 2];
      opt.etapaId = etapaGanha.id;
      opt.etapaNome = etapaGanha.nome;
    }

    opt.status = params.status;
    opt.dataFechamentoReal = new Date().toISOString();
    opt.atualizadoEm = new Date().toISOString();
    this.oportunidades.set(opt.id, opt);

    // Registrar Atividade de Fechamento
    this.registrarAtividade({
      empresaId,
      oportunidadeId: opt.id,
      clienteId: opt.clienteId,
      usuarioId: params.usuarioId || 'u1111111-1111-1111-1111-111111111111',
      usuarioNome: params.usuarioNome || 'Vendedor Comercial',
      tipo: 'REUNIAO_ONLINE',
      titulo: `Oportunidade ${opt.status === 'GANHA' ? 'GANHA' : 'PERDIDA'} - ${opt.codigo}`,
      duracaoMinutos: 20,
      descricao: opt.status === 'GANHA'
        ? `Oportunidade fechada como GANHA no valor de R$ ${Number(opt.valorFechado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
        : `Oportunidade marcada como PERDIDA. Motivo: ${opt.motivoPerdaNome}. Detalhes: ${opt.detalhesPerda || 'Nenhum detalhe adicional'}.`,
      resultado: opt.status === 'GANHA' ? 'Contrato comercial fechado com sucesso.' : 'Encerrada sem êxito comercial.',
      concluida: true,
    });

    logger.info('Oportunidade finalizada', {
      oportunidadeId: opt.id,
      status: opt.status,
      motivoPerdaId: opt.motivoPerdaId,
    });

    return opt;
  }

  // --- Atividades Comerciais ---
  listarAtividades(empresaId: string, filtros?: { oportunidadeId?: string; leadId?: string }): CrmAtividade[] {
    return this.atividades
      .filter((a) => {
        if (a.empresaId !== empresaId) return false;
        if (filtros?.oportunidadeId && a.oportunidadeId !== filtros.oportunidadeId) return false;
        if (filtros?.leadId && a.leadId !== filtros.leadId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  }

  /**
   * REGISTRO DE ATIVIDADE (Usuário, Data, Tipo, Descrição e Resultado Obrigatório)
   * Se informado proximaAcao, gera pendência automaticamente no Follow-up
   */
  registrarAtividade(dados: Partial<CrmAtividade> & {
    empresaId: string;
    usuarioId: string;
    tipo: CrmAtividade['tipo'];
    titulo: string;
    descricao: string;
    resultado: string;
    proximaAcaoPendencia?: {
      titulo: string;
      dataLimite: string;
      prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA';
      responsavelId?: string;
    };
  }): CrmAtividade {
    if (!dados.empresaId) throw new BadRequestError('Empresa ID é obrigatório', { code: 'CRM_MISSING_TENANT' });
    if (!dados.usuarioId || !dados.tipo || !dados.descricao || !dados.resultado) {
      throw new BadRequestError('Usuário, tipo de atividade, descrição e resultado do contato são obrigatórios', { code: 'CRM_INVALID_ACTIVITY_DATA' });
    }

    const ativId = `ativ-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const atividade: CrmAtividade = {
      id: ativId,
      empresaId: dados.empresaId,
      oportunidadeId: dados.oportunidadeId,
      oportunidadeTitulo: dados.oportunidadeTitulo,
      leadId: dados.leadId,
      leadNome: dados.leadNome,
      clienteId: dados.clienteId,
      clienteNome: dados.clienteNome,
      usuarioId: dados.usuarioId,
      usuarioNome: dados.usuarioNome || 'Vendedor Comercial',
      tipo: dados.tipo,
      titulo: dados.titulo || `Contato Comercial (${dados.tipo})`,
      dataInicio: dados.dataInicio || new Date().toISOString(),
      duracaoMinutos: Number(dados.duracaoMinutos) || 30,
      descricao: dados.descricao.trim(),
      resultado: dados.resultado.trim(), // Obrigatório
      concluida: dados.concluida !== false,
      criadoEm: new Date().toISOString(),
    };

    this.atividades.unshift(atividade);

    // Se houver próxima ação definida, gerar pendência/follow-up
    if (dados.proximaAcaoPendencia?.titulo) {
      this.criarFollowUp({
        empresaId: dados.empresaId,
        oportunidadeId: dados.oportunidadeId,
        leadId: dados.leadId,
        atividadeOrigemId: ativId,
        usuarioResponsavelId: dados.proximaAcaoPendencia.responsavelId || dados.usuarioId,
        tituloPendencia: dados.proximaAcaoPendencia.titulo,
        dataLimite: dados.proximaAcaoPendencia.dataLimite || new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
        prioridade: dados.proximaAcaoPendencia.prioridade || 'MEDIA',
        status: 'PENDENTE',
      });
    }

    return atividade;
  }

  // --- Follow-ups / Pendências ---
  listarFollowUps(empresaId: string, filtros?: { status?: string; usuarioId?: string; apenasAtrasados?: boolean }): CrmFollowUp[] {
    const agora = new Date().getTime();
    return Array.from(this.followUps.values())
      .filter((f) => {
        if (f.empresaId !== empresaId) return false;
        if (filtros?.status && f.status !== filtros.status) return false;
        if (filtros?.usuarioId && f.usuarioResponsavelId !== filtros.usuarioId) return false;
        if (filtros?.apenasAtrasados) {
          const isAtrasado = f.status === 'PENDENTE' && new Date(f.dataLimite).getTime() < agora;
          if (!isAtrasado) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.dataLimite).getTime() - new Date(b.dataLimite).getTime());
  }

  criarFollowUp(dados: Partial<CrmFollowUp> & { empresaId: string; usuarioResponsavelId: string; tituloPendencia: string; dataLimite: string }): CrmFollowUp {
    if (!dados.empresaId || !dados.tituloPendencia || !dados.dataLimite) {
      throw new BadRequestError('Empresa, título da pendência e data limite são obrigatórios', { code: 'CRM_INVALID_FOLLOWUP_DATA' });
    }

    const folId = `fol-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const followUp: CrmFollowUp = {
      id: folId,
      empresaId: dados.empresaId,
      oportunidadeId: dados.oportunidadeId,
      oportunidadeTitulo: dados.oportunidadeTitulo,
      leadId: dados.leadId,
      leadNome: dados.leadNome,
      atividadeOrigemId: dados.atividadeOrigemId,
      usuarioResponsavelId: dados.usuarioResponsavelId,
      usuarioResponsavelNome: dados.usuarioResponsavelNome || 'Responsável Comercial',
      tituloPendencia: dados.tituloPendencia.trim(),
      descricao: dados.descricao?.trim(),
      dataLimite: dados.dataLimite,
      prioridade: dados.prioridade || 'MEDIA',
      status: dados.status || 'PENDENTE',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.followUps.set(folId, followUp);
    return followUp;
  }

  atualizarFollowUp(followUpId: string, empresaId: string, status: CrmFollowUp['status'], observacoes?: string): CrmFollowUp {
    const fol = this.followUps.get(followUpId);
    if (!fol || fol.empresaId !== empresaId) {
      throw new NotFoundError('Pendência de follow-up não encontrada');
    }

    fol.status = status;
    if (status === 'CONCLUIDO') {
      fol.dataConclusao = new Date().toISOString();
      fol.observacoesConclusao = observacoes || 'Concluído com sucesso.';
    }
    fol.atualizadoEm = new Date().toISOString();
    this.followUps.set(fol.id, fol);
    return fol;
  }

  // --- DASHBOARD COMERCIAL (Sem IA, cálculo determinístico) ---
  obterMetricasDashboard(empresaId: string): CrmDashboardMetrics {
    const leadsEmpresa = Array.from(this.leads.values()).filter((l) => l.empresaId === empresaId);
    const optsEmpresa = Array.from(this.oportunidades.values()).filter((o) => o.empresaId === empresaId);
    const followUpsEmpresa = Array.from(this.followUps.values()).filter((f) => f.empresaId === empresaId);

    // Leads Metrics
    const totalLeads = leadsEmpresa.length;
    const leadsNovos = leadsEmpresa.filter((l) => l.status === 'NOVO').length;
    const leadsQualificados = leadsEmpresa.filter((l) => l.status === 'QUALIFICADO').length;
    const leadsConvertidos = leadsEmpresa.filter((l) => l.status === 'CONVERTIDO').length;
    const taxaConversaoLeads = totalLeads > 0 ? Math.round((leadsConvertidos / totalLeads) * 100) : 0;

    // Opportunities Metrics
    const totalOportunidades = optsEmpresa.length;
    const abertas = optsEmpresa.filter((o) => o.status === 'ABERTA');
    const ganhas = optsEmpresa.filter((o) => o.status === 'GANHA');
    const perdidas = optsEmpresa.filter((o) => o.status === 'PERDIDA');

    const valorPotencialPipeline = abertas.reduce((acc, o) => acc + (Number(o.valorEstimado) || 0), 0);
    const valorPonderadoPipeline = abertas.reduce((acc, o) => acc + ((Number(o.valorEstimado) || 0) * (o.probabilidadePercentual / 100)), 0);
    const valorTotalGanho = ganhas.reduce((acc, o) => acc + (Number(o.valorFechado) || Number(o.valorEstimado) || 0), 0);

    const finalizadasCount = ganhas.length + perdidas.length;
    const taxaConversaoOportunidades = finalizadasCount > 0 ? Math.round((ganhas.length / finalizadasCount) * 100) : 0;

    // Tempo médio de fechamento (dias)
    let totalDias = 0;
    let finalizadasComDatas = 0;
    [...ganhas, ...perdidas].forEach((o) => {
      if (o.dataAbertura && o.dataFechamentoReal) {
        const diffMs = new Date(o.dataFechamentoReal).getTime() - new Date(o.dataAbertura).getTime();
        const dias = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        totalDias += dias;
        finalizadasComDatas++;
      }
    });
    const tempoMedioFechamentoDias = finalizadasComDatas > 0 ? Math.round(totalDias / finalizadasComDatas) : 18;

    // Ranking de Motivos de Perda
    const motivosMap = new Map<string, { count: number; valor: number; nome: string; categoria: string }>();
    perdidas.forEach((o) => {
      const motId = o.motivoPerdaId || 'desconhecido';
      const motNome = o.motivoPerdaNome || 'Motivo Não Especificado';
      const motivoObj = this.motivosPerda.find((m) => m.id === motId);
      const prev = motivosMap.get(motId) || {
        count: 0,
        valor: 0,
        nome: motNome,
        categoria: motivoObj?.categoria || 'OUTRO',
      };
      prev.count += 1;
      prev.valor += Number(o.valorEstimado) || 0;
      motivosMap.set(motId, prev);
    });

    const totalPerdidoValor = perdidas.reduce((acc, o) => acc + (Number(o.valorEstimado) || 0), 0);
    const motivosDePerdaRanking = Array.from(motivosMap.entries()).map(([motivoId, data]) => ({
      motivoId,
      motivoNome: data.nome,
      categoria: data.categoria,
      quantidade: data.count,
      valorPerdidoTotal: data.valor,
      percentual: totalPerdidoValor > 0 ? Math.round((data.valor / totalPerdidoValor) * 100) : 0,
    })).sort((a, b) => b.valorPerdidoTotal - a.valorPerdidoTotal);

    // Oportunidades por Etapa do Funil
    const oportunidadesPorEtapa = this.etapasFunil.map((etapa) => {
      const optsDaEtapa = optsEmpresa.filter((o) => o.etapaId === etapa.id);
      const valor = optsDaEtapa.reduce((acc, o) => acc + (Number(o.valorFechado) || Number(o.valorEstimado) || 0), 0);
      return {
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        ordem: etapa.ordem,
        corHex: etapa.corHex,
        quantidade: optsDaEtapa.length,
        valorTotal: valor,
      };
    }).sort((a, b) => a.ordem - b.ordem);

    // Follow-ups
    const agora = Date.now();
    const hoje = new Date().toISOString().substring(0, 10);
    const followUpsAtrasados = followUpsEmpresa.filter((f) => f.status === 'PENDENTE' && new Date(f.dataLimite).getTime() < agora).length;
    const followUpsPendentesHoje = followUpsEmpresa.filter((f) => f.status === 'PENDENTE' && f.dataLimite.startsWith(hoje)).length;

    return {
      totalLeads,
      leadsNovos,
      leadsQualificados,
      leadsConvertidos,
      taxaConversaoLeads,
      totalOportunidades,
      oportunidadesAbertas: abertas.length,
      oportunidadesGanhas: ganhas.length,
      oportunidadesPerdidas: perdidas.length,
      valorPotencialPipeline,
      valorPonderadoPipeline,
      valorTotalGanho,
      taxaConversaoOportunidades,
      tempoMedioFechamentoDias,
      motivosDePerdaRanking,
      oportunidadesPorEtapa,
      followUpsAtrasados,
      followUpsPendentesHoje,
    };
  }
}

export const crmService = new CrmService();

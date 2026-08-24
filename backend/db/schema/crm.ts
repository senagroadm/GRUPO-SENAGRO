import { pgTable, uuid, varchar, text, boolean, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { empresas, usuarios } from './core';

/**
 * TABELA: crm_origens
 * Origens de captação de leads e oportunidades comerciais.
 */
export const crmOrigens = pgTable('crm_origens', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').references(() => empresas.id), // null = padrão do sistema
  nome: varchar('nome', { length: 100 }).notNull(),
  codigo: varchar('codigo', { length: 50 }).notNull(),
  descricao: text('descricao'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_motivos_perda
 * Motivos padronizados para perda de oportunidades (obrigatório no fechamento com perda).
 */
export const crmMotivosPerda = pgTable('crm_motivos_perda', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').references(() => empresas.id), // null = padrão do sistema
  nome: varchar('nome', { length: 150 }).notNull(),
  codigo: varchar('codigo', { length: 50 }).notNull(),
  categoria: varchar('categoria', { length: 50 }).notNull().default('COMERCIAL'), // 'PRECO', 'PRAZO', 'TECNICO', 'CONCORRENTE', 'CREDITO', 'DESISTENCIA'
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_etapas_funil
 * Etapas sequenciais do pipeline de vendas industrial com probabilidade de conversão.
 */
export const crmEtapasFunil = pgTable('crm_etapas_funil', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').references(() => empresas.id), // null = padrão do sistema
  nome: varchar('nome', { length: 100 }).notNull(),
  codigo: varchar('codigo', { length: 50 }).notNull(),
  ordem: integer('ordem').notNull(),
  probabilidadePadrao: integer('probabilidade_padrao').notNull().default(10), // 0 a 100%
  corHex: varchar('cor_hex', { length: 20 }).default('#3b82f6'),
  isFinalGanha: boolean('is_final_ganha').notNull().default(false),
  isFinalPerdida: boolean('is_final_perdida').notNull().default(false),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_clientes
 * Base de clientes e empresas parceiras do CRM.
 */
export const crmClientes = pgTable('crm_clientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  razaoSocial: varchar('razao_social', { length: 255 }).notNull(),
  nomeFantasia: varchar('nome_fantasia', { length: 255 }).notNull(),
  cnpjCpf: varchar('cnpj_cpf', { length: 20 }).notNull(),
  segmento: varchar('segmento', { length: 100 }), // 'CALDEIRARIA', 'ESTRUTURAS_METALICAS', 'AUTOPEÇAS', 'AGRONEGOCIO', 'MINERACAO'
  contatoNome: varchar('contato_nome', { length: 150 }),
  email: varchar('email', { length: 255 }),
  telefone: varchar('telefone', { length: 30 }),
  cidade: varchar('cidade', { length: 100 }),
  uf: varchar('uf', { length: 2 }),
  limiteCredito: numeric('limite_credito', { precision: 14, scale: 2 }).default('0'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_leads
 * Leads industriais captados com suporte a qualificação e conversão em Cliente + Oportunidade.
 */
export const crmLeads = pgTable('crm_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  origemId: uuid('origem_id').references(() => crmOrigens.id),
  nomeContato: varchar('nome_contato', { length: 150 }).notNull(),
  empresaLead: varchar('empresa_lead', { length: 200 }).notNull(),
  cargo: varchar('cargo', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  telefone: varchar('telefone', { length: 30 }),
  cidade: varchar('cidade', { length: 100 }),
  uf: varchar('uf', { length: 2 }),
  segmentoIndustrial: varchar('segmento_industrial', { length: 100 }),
  valorEstimado: numeric('valor_estimado', { precision: 14, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).notNull().default('NOVO'), // 'NOVO', 'EM_QUALIFICACAO', 'QUALIFICADO', 'CONVERTIDO', 'DESQUALIFICADO'
  motivoDesqualificacao: text('motivo_desqualificacao'),
  atribuidoUsuarioId: uuid('atribuido_usuario_id').references(() => usuarios.id),
  clienteGeradoId: uuid('cliente_gerado_id').references(() => crmClientes.id),
  oportunidadeGeradaId: uuid('oportunidade_gerada_id'),
  dataPrimeiroContato: timestamp('data_primeiro_contato', { withTimezone: true }),
  convertidoEm: timestamp('convertido_em', { withTimezone: true }),
  notas: text('notas'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_oportunidades
 * Oportunidades comerciais ativas no funil de vendas B2B.
 */
export const crmOportunidades = pgTable('crm_oportunidades', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  codigo: varchar('codigo', { length: 50 }).notNull(), // Ex: OPT-2026-001
  titulo: varchar('titulo', { length: 255 }).notNull(),
  clienteId: uuid('cliente_id').references(() => crmClientes.id),
  leadOrigemId: uuid('lead_origem_id').references(() => crmLeads.id),
  origemId: uuid('origem_id').references(() => crmOrigens.id),
  etapaId: uuid('etapa_id').notNull().references(() => crmEtapasFunil.id),
  vendedorUsuarioId: uuid('vendedor_usuario_id').references(() => usuarios.id),
  valorEstimado: numeric('valor_estimado', { precision: 14, scale: 2 }).notNull().default('0'),
  valorFechado: numeric('valor_fechado', { precision: 14, scale: 2 }),
  probabilidadePercentual: integer('probabilidade_percentual').notNull().default(10),
  dataAbertura: timestamp('data_abertura', { withTimezone: true }).notNull().defaultNow(),
  dataPrevisaoFechamento: timestamp('data_previsao_fechamento', { withTimezone: true }),
  dataFechamentoReal: timestamp('data_fechamento_real', { withTimezone: true }),
  status: varchar('status', { length: 50 }).notNull().default('ABERTA'), // 'ABERTA', 'GANHA', 'PERDIDA', 'CANCELADA'
  motivoPerdaId: uuid('motivo_perda_id').references(() => crmMotivosPerda.id), // Obrigatório se status === 'PERDIDA'
  detalhesPerda: text('detalhes_perda'),
  concorrenteVencedor: varchar('concorrente_vencedor', { length: 150 }),
  itensSolicitados: text('itens_solicitados'), // Ex: "Corte laser 200 chapas SAE 1020 1/2', Caldeiraria de 2 tanques"
  observacoes: text('observacoes'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_atividades
 * Registro de interações e histórico comercial com clientes e oportunidades.
 */
export const crmAtividades = pgTable('crm_atividades', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  oportunidadeId: uuid('oportunidade_id').references(() => crmOportunidades.id),
  leadId: uuid('lead_id').references(() => crmLeads.id),
  clienteId: uuid('cliente_id').references(() => crmClientes.id),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
  tipo: varchar('tipo', { length: 50 }).notNull(), // 'LIGACAO', 'REUNIAO_PRESENCIAL', 'REUNIAO_ONLINE', 'EMAIL', 'ENVIO_PROPOSTA', 'VISITA_TECNICA', 'WHATSAPP'
  titulo: varchar('titulo', { length: 255 }).notNull(),
  dataInicio: timestamp('data_inicio', { withTimezone: true }).notNull().defaultNow(),
  duracaoMinutos: integer('duracao_minutos').default(30),
  descricao: text('descricao').notNull(),
  resultado: text('resultado').notNull(), // Obrigatório: feedback do contato
  concluida: boolean('concluida').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * TABELA: crm_follow_ups
 * Próximas ações e pendências comerciais geradas a partir de contatos.
 */
export const crmFollowUps = pgTable('crm_follow_ups', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  oportunidadeId: uuid('oportunidade_id').references(() => crmOportunidades.id),
  leadId: uuid('lead_id').references(() => crmLeads.id),
  atividadeOrigemId: uuid('atividade_origem_id').references(() => crmAtividades.id),
  usuarioResponsavelId: uuid('usuario_responsavel_id').notNull().references(() => usuarios.id),
  tituloPendencia: varchar('titulo_pendencia', { length: 255 }).notNull(),
  descricao: text('descricao'),
  dataLimite: timestamp('data_limite', { withTimezone: true }).notNull(),
  prioridade: varchar('prioridade', { length: 20 }).notNull().default('MEDIA'), // 'ALTA', 'MEDIA', 'BAIXA'
  status: varchar('status', { length: 50 }).notNull().default('PENDENTE'), // 'PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'
  dataConclusao: timestamp('data_conclusao', { withTimezone: true }),
  observacoesConclusao: text('observacoes_conclusao'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

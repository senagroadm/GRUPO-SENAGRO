import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const empresas = pgTable('empresas', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  razaoSocial: varchar('razao_social', { length: 255 }).notNull(),
  nomeFantasia: varchar('nome_fantasia', { length: 255 }).notNull(),
  cnpj: varchar('cnpj', { length: 18 }).notNull().unique(),
  inscricaoEstadual: varchar('inscricao_estadual', { length: 30 }),
  inscricaoMunicipal: varchar('inscricao_municipal', { length: 30 }),
  regimeTributario: varchar('regime_tributario', { length: 50 }).notNull(),
  ramoAtividade: text('ramo_atividade').notNull(),
  isMatriz: boolean('is_matriz').notNull().default(false),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  cpf: varchar('cpf', { length: 14 }),
  cargo: varchar('cargo', { length: 100 }),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const perfis = pgTable('perfis', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nome: varchar('nome', { length: 100 }).notNull(),
  descricao: text('descricao'),
  nivelAcesso: varchar('nivel_acesso', { length: 50 }).notNull().default('EMPRESA'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const permissoes = pgTable('permissoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: varchar('codigo', { length: 100 }).notNull().unique(),
  modulo: varchar('modulo', { length: 50 }).notNull(),
  acao: varchar('acao', { length: 50 }).notNull(),
  descricao: varchar('descricao', { length: 255 }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const perfilPermissoes = pgTable('perfil_permissoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  perfilId: uuid('perfil_id').notNull().references(() => perfis.id),
  permissaoId: uuid('permissao_id').notNull().references(() => permissoes.id),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const usuarioEmpresas = pgTable('usuario_empresas', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  perfilId: uuid('perfil_id').notNull().references(() => perfis.id),
  padrao: boolean('padrao').notNull().default(false),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const empresaContextAuditLogs = pgTable('empresa_context_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
  empresaOrigemId: uuid('empresa_origem_id').references(() => empresas.id),
  empresaDestinoId: uuid('empresa_destino_id').notNull().references(() => empresas.id),
  motivo: varchar('motivo', { length: 255 }),
  ipOrigem: varchar('ip_origem', { length: 45 }),
  userAgent: text('user_agent'),
  correlationId: varchar('correlation_id', { length: 100 }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  usuarioId: uuid('usuario_id'),
  correlationId: varchar('correlation_id', { length: 100 }),
  modulo: varchar('modulo', { length: 50 }).notNull(),
  acao: varchar('acao', { length: 50 }).notNull(),
  tabelaAfetada: varchar('tabela_afetada', { length: 100 }).notNull(),
  registroId: varchar('registro_id', { length: 100 }).notNull(),
  estadoAnterior: jsonb('estado_anterior'),
  estadoNovo: jsonb('estado_novo'),
  ipOrigem: varchar('ip_origem', { length: 45 }),
  userAgent: text('user_agent'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const schemaMigrations = pgTable('schema_migrations', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
});


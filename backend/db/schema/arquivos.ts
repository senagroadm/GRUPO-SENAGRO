import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, integer, bigint } from 'drizzle-orm/pg-core';
import { empresas, usuarios } from './core';

/**
 * TABELA: arquivos
 * Storage de metadados de arquivos e documentos polimórficos.
 * Binários armazenados no Object Storage (disco/cloud) com deduplicação por hash SHA-256.
 */
export const arquivos = pgTable('arquivos', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  modulo: varchar('modulo', { length: 50 }).notNull(), // 'CRM', 'ENGENHARIA', 'PCP', 'FISCAL', 'COMPRAS', 'QUALIDADE', etc.
  entidadeTipo: varchar('entidade_tipo', { length: 50 }).notNull(), // 'OPORTUNIDADE', 'LEAD', 'PROJETO', 'NFE', 'CERTIFICADO', 'ITEM', etc.
  entidadeId: varchar('entidade_id', { length: 100 }).notNull(), // ID do registro vinculado
  nomeOriginal: varchar('nome_original', { length: 255 }).notNull(),
  nomeArmazenado: varchar('nome_armazenado', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(),
  storageProvider: varchar('storage_provider', { length: 50 }).notNull().default('LOCAL_DISK'),
  mimeType: varchar('mime_type', { length: 150 }).notNull(),
  tamanhoBytes: bigint('tamanho_bytes', { mode: 'number' }).notNull(),
  hashSha256: varchar('hash_sha256', { length: 64 }).notNull(),
  versao: integer('versao').notNull().default(1),
  documentoOrigemId: uuid('documento_origem_id'),
  isVersaoAtual: boolean('is_versao_atual').notNull().default(true),
  categoria: varchar('categoria', { length: 50 }).notNull().default('GERAL'), // 'PROPOSTA', 'DESENHO_TECNICO', 'MANUAL', 'CERTIFICADO', 'COMPROVANTE', 'XML_FISCAL', 'OUTRO'
  descricao: text('descricao'),
  criadoPorUsuarioId: uuid('criado_por_usuario_id').references(() => usuarios.id),
  publico: boolean('publico').notNull().default(false),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  deletadoEm: timestamp('deletado_em', { withTimezone: true }),
});

/**
 * TABELA: arquivo_logs
 * Auditoria de operações de upload, download, visualização e deleção de arquivos.
 */
export const arquivoLogs = pgTable('arquivo_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  arquivoId: uuid('arquivo_id').notNull().references(() => arquivos.id),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id),
  usuarioId: uuid('usuario_id').references(() => usuarios.id),
  tipoEvento: varchar('tipo_evento', { length: 50 }).notNull(), // 'UPLOAD', 'DOWNLOAD', 'PREVIEW', 'DELETE', 'NEW_VERSION'
  ipOrigem: varchar('ip_origem', { length: 45 }),
  userAgent: text('user_agent'),
  detalhes: jsonb('detalhes'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

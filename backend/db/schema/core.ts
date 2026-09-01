import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';


// ==============================================================================
// EMPRESAS
// ==============================================================================

export const empresas = pgTable(
  'empresas',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    codigo: varchar('codigo', { length: 50 })
      .notNull()
      .unique(),

    razaoSocial: varchar('razao_social', { length: 255 })
      .notNull(),

    nomeFantasia: varchar('nome_fantasia', { length: 255 })
      .notNull(),

    cnpj: varchar('cnpj', { length: 18 })
      .notNull()
      .unique(),

    inscricaoEstadual: varchar('inscricao_estadual', { length: 30 }),

    inscricaoMunicipal: varchar('inscricao_municipal', { length: 30 }),

    regimeTributario: varchar('regime_tributario', { length: 50 })
      .notNull(),

    ramoAtividade: text('ramo_atividade')
      .notNull(),

    isMatriz: boolean('is_matriz')
      .notNull()
      .default(false),

    ativo: boolean('ativo')
      .notNull()
      .default(true),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    atualizadoEm: timestamp('atualizado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxEmpresasAtivo: index('idx_empresas_ativo')
      .on(table.ativo),
  })
);


// ==============================================================================
// USUARIOS
// ==============================================================================

export const usuarios = pgTable(
  'usuarios',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    nome: varchar('nome', { length: 255 })
      .notNull(),

    email: varchar('email', { length: 255 })
      .notNull()
      .unique(),

    cpf: varchar('cpf', { length: 14 }),

    cargo: varchar('cargo', { length: 100 }),

    senhaHash: varchar('senha_hash', { length: 255 })
      .notNull(),

    isSuperAdmin: boolean('is_super_admin')
      .notNull()
      .default(false),

    ativo: boolean('ativo')
      .notNull()
      .default(true),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    atualizadoEm: timestamp('atualizado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxUsuariosAtivo: index('idx_usuarios_ativo')
      .on(table.ativo),
  })
);


// ==============================================================================
// PERFIS
// ==============================================================================

export const perfis = pgTable(
  'perfis',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    codigo: varchar('codigo', { length: 50 })
      .notNull()
      .unique(),

    nome: varchar('nome', { length: 100 })
      .notNull(),

    descricao: text('descricao'),

    nivelAcesso: varchar('nivel_acesso', { length: 50 })
      .notNull()
      .default('EMPRESA'),

    ativo: boolean('ativo')
      .notNull()
      .default(true),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  }
);


// ==============================================================================
// PERMISSOES
// ==============================================================================

export const permissoes = pgTable(
  'permissoes',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    codigo: varchar('codigo', { length: 100 })
      .notNull()
      .unique(),

    modulo: varchar('modulo', { length: 50 })
      .notNull(),

    acao: varchar('acao', { length: 50 })
      .notNull(),

    descricao: varchar('descricao', { length: 255 }),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxPermissoesModulo: index('idx_permissoes_modulo')
      .on(table.modulo),
  })
);


// ==============================================================================
// PERFIL_PERMISSOES
// ==============================================================================

export const perfilPermissoes = pgTable(
  'perfil_permissoes',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    perfilId: uuid('perfil_id')
      .notNull()
      .references(() => perfis.id, {
        onDelete: 'cascade',
      }),

    permissaoId: uuid('permissao_id')
      .notNull()
      .references(() => permissoes.id, {
        onDelete: 'cascade',
      }),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ukPerfilPermissao: uniqueIndex('uk_perfil_permissao')
      .on(table.perfilId, table.permissaoId),

    idxPerfilPermissoesPerfil: index('idx_perfil_permissoes_perfil')
      .on(table.perfilId),
  })
);


// ==============================================================================
// USUARIO_EMPRESAS
// ==============================================================================

export const usuarioEmpresas = pgTable(
  'usuario_empresas',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, {
        onDelete: 'cascade',
      }),

    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id, {
        onDelete: 'cascade',
      }),

    perfilId: uuid('perfil_id')
      .notNull()
      .references(() => perfis.id, {
        onDelete: 'restrict',
      }),

    padrao: boolean('padrao')
      .notNull()
      .default(false),

    ativo: boolean('ativo')
      .notNull()
      .default(true),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ukUsuarioEmpresa: uniqueIndex('uk_usuario_empresa')
      .on(table.usuarioId, table.empresaId),

    idxUsuarioEmpresasUser: index('idx_usuario_empresas_user')
      .on(table.usuarioId, table.ativo),

    idxUsuarioEmpresasEmpresa: index('idx_usuario_empresas_empresa')
      .on(table.empresaId, table.ativo),
  })
);


// ==============================================================================
// AUDITORIA DE TROCA DE CONTEXTO
// ==============================================================================

export const empresaContextAuditLogs = pgTable(
  'empresa_context_audit_logs',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, {
        onDelete: 'cascade',
      }),

    empresaOrigemId: uuid('empresa_origem_id')
      .references(() => empresas.id, {
        onDelete: 'set null',
      }),

    empresaDestinoId: uuid('empresa_destino_id')
      .notNull()
      .references(() => empresas.id, {
        onDelete: 'cascade',
      }),

    motivo: varchar('motivo', { length: 255 }),

    ipOrigem: varchar('ip_origem', { length: 45 }),

    userAgent: text('user_agent'),

    correlationId: varchar('correlation_id', {
      length: 100,
    }),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxAuditContextUser: index('idx_audit_context_user')
      .on(table.usuarioId, table.criadoEm),

    idxAuditContextDestino: index('idx_audit_context_destino')
      .on(table.empresaDestinoId),
  })
);


// ==============================================================================
// AUDIT_LOGS
// ==============================================================================
//
// Esta é a tabela principal de auditoria transversal.
//
// A tabela foi originalmente criada na migration 001.
// A migration 010 adiciona os campos complementares.
//
// ==============================================================================

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    empresaId: uuid('empresa_id')
      .notNull()
      .references(() => empresas.id, {
        onDelete: 'cascade',
      }),

    usuarioId: uuid('usuario_id')
      .references(() => usuarios.id, {
        onDelete: 'set null',
      }),

    correlationId: varchar('correlation_id', {
      length: 100,
    }),

    requestId: varchar('request_id', {
      length: 100,
    }),

    modulo: varchar('modulo', {
      length: 80,
    }).notNull(),

    acao: varchar('acao', {
      length: 100,
    }).notNull(),

    tabelaAfetada: varchar('tabela_afetada', {
      length: 100,
    }).notNull(),

    registroId: varchar('registro_id', {
      length: 100,
    }).notNull(),

    entidade: varchar('entidade', {
      length: 120,
    }),

    entidadeId: varchar('entidade_id', {
      length: 120,
    }),

    usuarioNome: varchar('usuario_nome', {
      length: 255,
    }),

    usuarioEmail: varchar('usuario_email', {
      length: 255,
    }),

    usuarioPerfil: varchar('usuario_perfil', {
      length: 100,
    }),

    empresaCodigo: varchar('empresa_codigo', {
      length: 100,
    }),

    empresaCnpj: varchar('empresa_cnpj', {
      length: 20,
    }),

    severidade: varchar('severidade', {
      length: 30,
    })
      .notNull()
      .default('BAIXA'),

    estadoAnterior: jsonb('estado_anterior'),

    estadoNovo: jsonb('estado_novo'),

    diffCampos: jsonb('diff_campos'),

    metadadosExtras: jsonb('metadados_extras'),

    justificativa: text('justificativa'),

    ipOrigem: varchar('ip_origem', {
      length: 45,
    }),

    ip: varchar('ip', {
      length: 50,
    }),

    userAgent: text('user_agent'),

    timestamp: timestamp('timestamp', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    hashIntegridade: varchar('hash_integridade', {
      length: 128,
    }),

    hashAnterior: varchar('hash_anterior', {
      length: 128,
    }),

    criadoEm: timestamp('criado_em', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxAuditEmpresaData: index('idx_audit_logs_empresa_data')
      .on(table.empresaId, table.criadoEm),

    idxAuditModulo: index('idx_audit_logs_modulo')
      .on(table.modulo),

    idxAuditRequestId: index('idx_audit_request_id')
      .on(table.requestId),

    idxAuditUsuario: index('idx_audit_usuario_id')
      .on(table.usuarioId),

    idxAuditTimestamp: index('idx_audit_timestamp')
      .on(table.timestamp),

    idxAuditEntidade: index('idx_audit_entidade_id')
      .on(table.entidade, table.entidadeId),

    idxAuditSeveridade: index('idx_audit_severidade')
      .on(table.severidade),
  })
);


// ==============================================================================
// AUDIT_EXPORT_LOGS
// ==============================================================================

export const auditExportLogs = pgTable(
  'audit_export_logs',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, {
        onDelete: 'restrict',
      }),

    usuarioNome: varchar('usuario_nome', {
      length: 255,
    }).notNull(),

    empresaId: uuid('empresa_id')
      .references(() => empresas.id, {
        onDelete: 'restrict',
      }),

    formato: varchar('formato', {
      length: 20,
    }).notNull(),

    motivo: text('motivo')
      .notNull(),

    filtrosAplicados: jsonb('filtros_aplicados')
      .notNull()
      .default({}),

    quantidadeRegistros: integer('quantidade_registros')
      .notNull()
      .default(0),

    hashArquivo: varchar('hash_arquivo', {
      length: 128,
    }).notNull(),

    ip: varchar('ip', {
      length: 50,
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxAuditExportUsuario: index('idx_audit_export_usuario')
      .on(table.usuarioId),

    idxAuditExportEmpresa: index('idx_audit_export_empresa')
      .on(table.empresaId),

    idxAuditExportCreated: index('idx_audit_export_created')
      .on(table.createdAt),
  })
);


// ==============================================================================
// SCHEMA_MIGRATIONS
// ==============================================================================

export const schemaMigrations = pgTable(
  'schema_migrations',
  {
    id: integer('id')
      .primaryKey(),

    name: varchar('name', {
      length: 255,
    }).notNull(),

    appliedAt: timestamp('applied_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  }
);

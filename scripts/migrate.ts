import fs from 'fs';
import path from 'path';
import { getDatabasePool, closeDatabasePool } from '../backend/db/client';
import { logger } from '../backend/core/logger';

async function runMigrations() {
  logger.info('Iniciando execução de migrations do PostgreSQL...');
  const pool = getDatabasePool();
  if (!pool) {
    logger.warn('Banco de dados não configurado ou DATABASE_URL indisponível. Ignorando migrations.');
    return;
  }
  const client = await pool.connect();

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 2. Fetch applied migrations
    const res = await client.query<{ name: string }>('SELECT name FROM schema_migrations ORDER BY id ASC');
    const appliedSet = new Set(res.rows.map((r) => r.name));

   // 3. Read migration files from backend/db/migrations directory
const migrationsDir = path.join(
  process.cwd(),
  'backend',
  'db',
  'migrations'
);

if (!fs.existsSync(migrationsDir)) {
  logger.warn(`Diretório de migrations não encontrado: ${migrationsDir}`);
  return;
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

logger.info(`Encontrados ${files.length} arquivos de migration.`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.debug(`Migration já aplicada: ${file}`);
        continue;
      }

      logger.info(`Aplicando migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`Migration ${file} aplicada com sucesso!`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Erro ao aplicar migration ${file}`, err);
        throw err;
      }
    }

    logger.info('Todas as migrations pendentes foram processadas com sucesso.');
  } finally {
    client.release();
    await closeDatabasePool();
  }
}

// Only execute if run directly
if (require.main === module || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations().catch((err) => {
    logger.error('Falha fatal na execução das migrations', err);
    process.exit(1);
  });
}

export { runMigrations };

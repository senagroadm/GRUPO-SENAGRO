import { Pool, PoolClient } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { getAppConfig } from '../config/env';
import { logger } from '../core/logger';

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    const config = getAppConfig();
    const isSupabase = config.DATABASE_URL.includes('supabase.co');

    pool = new Pool({
      connectionString: config.DATABASE_URL,
      min: config.DATABASE_POOL_MIN,
      max: config.DATABASE_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client in pool', err);
    });
  }

  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    const p = getDatabasePool();
    dbInstance = drizzle(p, { schema });
  }
  return dbInstance;
}

export interface DbHealthResult {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  poolSize?: number;
  idleClients?: number;
  totalClients?: number;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DbHealthResult> {
  const start = Date.now();
  const config = getAppConfig();
  const isDefaultLocal =
    !process.env.DATABASE_URL ||
    config.DATABASE_URL.includes('nexus_password@localhost') ||
    config.DATABASE_URL.includes('[SUA-SENHA]');

  // In preview / container development without password configured,
  // return active fallback status without attempting connection
  if (isDefaultLocal) {
    return {
      status: 'healthy',
      latencyMs: 0,
      totalClients: 0,
      idleClients: 0,
    };
  }

  const p = getDatabasePool();

  try {
    const client: PoolClient = await p.connect();
    try {
      await client.query('SELECT 1 as ping');
      const latencyMs = Date.now() - start;
      return {
        status: 'healthy',
        latencyMs,
        totalClients: p.totalCount,
        idleClients: p.idleCount,
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn('PostgreSQL health check failed (operating in fallback/offline mode)', { error: errorMsg });
    return {
      status: 'unhealthy',
      latencyMs,
      error: errorMsg,
    };
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
    logger.info('PostgreSQL connection pool closed successfully');
  }
}

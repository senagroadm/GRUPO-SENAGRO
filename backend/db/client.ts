import { Pool, PoolClient } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { getAppConfig } from '../config/env';
import { logger } from '../core/logger';

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function isDatabaseConfigured(): boolean {
  const config = getAppConfig();
  if (!process.env.DATABASE_URL) return false;
  if (config.DATABASE_URL.includes('nexus_password@localhost')) return false;
  if (config.DATABASE_URL.includes('[SUA-SENHA]')) return false;
  return true;
}

export function getDatabasePool(): Pool | null {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    const config = getAppConfig();
    const isRemoteDb = 
      config.DATABASE_URL.includes('supabase.co') || 
      config.DATABASE_URL.includes('supabase.com') ||
      config.DATABASE_URL.includes('pooler.supabase.com') ||
      config.DATABASE_URL.includes('aws-0-') ||
      config.DATABASE_URL.includes('sslmode=') ||
      config.DATABASE_URL.includes('render.com') ||
      config.DATABASE_URL.includes('neon.tech') ||
      !config.DATABASE_URL.includes('localhost');

    // Remove ?sslmode=... ou &sslmode=... para permitir que o objeto ssl: { rejectUnauthorized: false } controle o handshake
    const sanitizedConnectionString = config.DATABASE_URL.replace(/[?&]sslmode=[^&]+/g, '');

    pool = new Pool({
      connectionString: sanitizedConnectionString,
      min: config.DATABASE_POOL_MIN,
      max: config.DATABASE_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client in pool', err);
    });
  }

  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> | null {
  if (!dbInstance) {
    const p = getDatabasePool();
    if (p) {
      dbInstance = drizzle(p, { schema });
    }
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
  if (!isDatabaseConfigured()) {
    return {
      status: 'healthy',
      latencyMs: 0,
      totalClients: 0,
      idleClients: 0,
    };
  }

  const p = getDatabasePool();
  if (!p) {
    return {
      status: 'healthy',
      latencyMs: 0,
      totalClients: 0,
      idleClients: 0,
    };
  }

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

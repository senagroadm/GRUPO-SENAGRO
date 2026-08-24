import postgres, { Sql } from 'postgres';
import { getAppConfig } from '../config/env';

let sqlInstance: Sql | null = null;

export function getPostgresSql(): Sql {
  if (!sqlInstance) {
    const config = getAppConfig();
    const isSupabase = config.DATABASE_URL.includes('supabase.co');
    
    sqlInstance = postgres(config.DATABASE_URL, {
      ssl: isSupabase ? 'require' : undefined,
      max: config.DATABASE_POOL_MAX || 10,
      idle_timeout: 30,
      connect_timeout: 5,
    });
  }
  return sqlInstance;
}

export default getPostgresSql;

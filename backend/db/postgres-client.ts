import postgres, { Sql } from 'postgres';
import { getAppConfig } from '../config/env';

let sqlInstance: Sql | null = null;

export function getPostgresSql(): Sql {
  if (!sqlInstance) {
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
    
    // Remove ?sslmode=... ou &sslmode=... para permitir que a configuração ssl controle a conexão
    const sanitizedConnectionString = config.DATABASE_URL.replace(/[?&]sslmode=[^&]+/g, '');

    sqlInstance = postgres(sanitizedConnectionString, {
      ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
      max: config.DATABASE_POOL_MAX || 10,
      idle_timeout: 30,
      connect_timeout: 5,
    });
  }
  return sqlInstance;
}

export default getPostgresSql;

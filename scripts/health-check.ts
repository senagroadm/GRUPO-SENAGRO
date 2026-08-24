import { checkDatabaseHealth, closeDatabasePool } from '../backend/db/client';
import { getAppConfig } from '../backend/config/env';
import { logger } from '../backend/core/logger';

async function main() {
  const config = getAppConfig();
  logger.info(`Checking system health on ${config.APP_URL}...`, { env: config.NODE_ENV });

  const dbHealth = await checkDatabaseHealth();

  const healthReport = {
    status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    nodeVersion: process.version,
    memoryUsageMb: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    database: dbHealth,
    environment: config.NODE_ENV,
    apiVersion: config.API_VERSION,
  };

  logger.info('Health check result:', healthReport);
  await closeDatabasePool();

  if (process.env.NODE_ENV === 'production' && dbHealth.status !== 'healthy') {
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.endsWith('health-check.ts')) {
  main().catch((err) => {
    logger.error('Health check script failed', err);
    process.exit(1);
  });
}

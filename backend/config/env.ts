import { z } from 'zod';
import { Environment, getSecurityProfile, SecurityProfile } from './environments';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://nexus_user:nexus_password@localhost:5432/nexus_erp'),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
  JWT_SECRET: z.string().min(16).default('development_jwt_secret_must_be_overridden_in_production_12345'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_QUERY_LOGS: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  API_VERSION: z.string().default('v1'),
  ALLOWED_ORIGINS: z.string().optional(),
});

export interface AppConfig extends z.infer<typeof envSchema> {
  security: SecurityProfile;
}

let configInstance: AppConfig | null = null;

export function validateAndLoadConfig(): AppConfig {
  const rawEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ENABLE_QUERY_LOGS: process.env.ENABLE_QUERY_LOGS,
    API_VERSION: process.env.API_VERSION,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    const currentEnv = String(process.env.NODE_ENV || 'development');
    const isProdOrStaging = currentEnv === 'production' || currentEnv === 'staging';

    if (isProdOrStaging) {
      throw new Error(`[ConfigStartupFatal] Falha crítica de validação de variáveis de ambiente:\n${errorDetails}`);
    }

    console.warn(`[ConfigWarning] Variáveis de ambiente incompletas em modo ${process.env.NODE_ENV || 'dev'}, aplicando defaults:\n${errorDetails}`);
    const fallback = envSchema.parse({});
    const security = getSecurityProfile(fallback.NODE_ENV as Environment);
    configInstance = { ...fallback, security };
    return configInstance;
  }

  const baseConfig = parsed.data;
  const envKey = baseConfig.NODE_ENV as Environment;
  const security = getSecurityProfile(envKey);

  // Allow overriding allowed origins via comma-separated env var if present
  if (baseConfig.ALLOWED_ORIGINS) {
    const parsedOrigins = baseConfig.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
    if (parsedOrigins.length > 0) {
      security.cors.allowedOrigins = parsedOrigins;
    }
  }

  // Stricter production checks
  if (baseConfig.NODE_ENV === 'production') {
    if (baseConfig.JWT_SECRET.includes('development') || baseConfig.JWT_SECRET.length < 32) {
      throw new Error('[ConfigStartupFatal] JWT_SECRET em produção deve ter pelo menos 32 caracteres seguros e não pode conter valores padrão de desenvolvimento.');
    }
    if (baseConfig.DATABASE_URL.includes('nexus_password@localhost')) {
      throw new Error('[ConfigStartupFatal] DATABASE_URL em produção não pode utilizar credenciais padrão de desenvolvimento locais.');
    }
  }

  configInstance = {
    ...baseConfig,
    security,
  };

  return configInstance;
}

export function getAppConfig(): AppConfig {
  if (!configInstance) {
    configInstance = validateAndLoadConfig();
  }
  return configInstance;
}

// Reset instance for testing purposes
export function resetAppConfigForTesting(): void {
  configInstance = null;
}

import { z } from 'zod';

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface SecurityProfile {
  environment: Environment;
  isProduction: boolean;
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAgeSeconds: number;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    authWindowMs: number;
    authMaxRequests: number;
  };
  requestTimeoutMs: number;
  maxUploadSizeBytes: number;
  passwordPolicy: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxConsecutiveRepeats: number;
    disallowCommonPasswords: boolean;
  };
  mfa: {
    enforceForCriticalRoles: boolean;
    criticalRoles: string[];
    allowedMethods: Array<'totp' | 'sms' | 'security_key'>;
    sessionDurationSeconds: number;
  };
  logging: {
    maskSensitiveData: boolean;
    exposeStackTraces: boolean;
    detailedQueryLogs: boolean;
  };
}

export const ENVIRONMENT_CONFIGS: Record<Environment, SecurityProfile> = {
  development: {
    environment: 'development',
    isProduction: false,
    cors: {
      allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-correlation-id', 'x-empresa-id'],
      exposedHeaders: ['x-request-id', 'x-correlation-id', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'],
      credentials: true,
      maxAgeSeconds: 3600,
    },
    rateLimit: {
      enabled: true,
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 300,
      authWindowMs: 60 * 1000,
      authMaxRequests: 30,
    },
    requestTimeoutMs: 30000, // 30s
    maxUploadSizeBytes: 15 * 1024 * 1024, // 15MB
    passwordPolicy: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxConsecutiveRepeats: 3,
      disallowCommonPasswords: true,
    },
    mfa: {
      enforceForCriticalRoles: false,
      criticalRoles: ['SUPERADMIN', 'DIRETOR_FINANCEIRO', 'RESPONSAVEL_FISCAL'],
      allowedMethods: ['totp'],
      sessionDurationSeconds: 28800, // 8h
    },
    logging: {
      maskSensitiveData: true,
      exposeStackTraces: true,
      detailedQueryLogs: true,
    },
  },
  staging: {
    environment: 'staging',
    isProduction: false,
    cors: {
      allowedOrigins: ['https://staging.nexuserp.internal', 'https://stg-app.nexuserp.internal'],
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-correlation-id', 'x-empresa-id'],
      exposedHeaders: ['x-request-id', 'x-correlation-id', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'],
      credentials: true,
      maxAgeSeconds: 7200,
    },
    rateLimit: {
      enabled: true,
      windowMs: 60 * 1000,
      maxRequests: 150,
      authWindowMs: 60 * 1000,
      authMaxRequests: 10,
    },
    requestTimeoutMs: 15000, // 15s
    maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
    passwordPolicy: {
      minLength: 10,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxConsecutiveRepeats: 2,
      disallowCommonPasswords: true,
    },
    mfa: {
      enforceForCriticalRoles: true,
      criticalRoles: ['SUPERADMIN', 'DIRETOR_FINANCEIRO', 'RESPONSAVEL_FISCAL'],
      allowedMethods: ['totp'],
      sessionDurationSeconds: 14400, // 4h
    },
    logging: {
      maskSensitiveData: true,
      exposeStackTraces: false,
      detailedQueryLogs: false,
    },
  },
  production: {
    environment: 'production',
    isProduction: true,
    cors: {
      allowedOrigins: ['https://app.nexuserp.com.br', 'https://erp.nexuserp.com.br'],
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-correlation-id', 'x-empresa-id'],
      exposedHeaders: ['x-request-id', 'x-correlation-id', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'],
      credentials: true,
      maxAgeSeconds: 86400,
    },
    rateLimit: {
      enabled: true,
      windowMs: 60 * 1000,
      maxRequests: 100,
      authWindowMs: 60 * 1000,
      authMaxRequests: 5,
    },
    requestTimeoutMs: 10000, // 10s
    maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
    passwordPolicy: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxConsecutiveRepeats: 2,
      disallowCommonPasswords: true,
    },
    mfa: {
      enforceForCriticalRoles: true,
      criticalRoles: ['SUPERADMIN', 'DIRETOR_FINANCEIRO', 'RESPONSAVEL_FISCAL'],
      allowedMethods: ['totp', 'security_key'],
      sessionDurationSeconds: 7200, // 2h
    },
    logging: {
      maskSensitiveData: true,
      exposeStackTraces: false,
      detailedQueryLogs: false,
    },
  },
  test: {
    environment: 'test',
    isProduction: false,
    cors: {
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['*'],
      exposedHeaders: ['*'],
      credentials: true,
      maxAgeSeconds: 0,
    },
    rateLimit: {
      enabled: false,
      windowMs: 60 * 1000,
      maxRequests: 10000,
      authWindowMs: 60 * 1000,
      authMaxRequests: 1000,
    },
    requestTimeoutMs: 5000,
    maxUploadSizeBytes: 10 * 1024 * 1024,
    passwordPolicy: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      maxConsecutiveRepeats: 5,
      disallowCommonPasswords: false,
    },
    mfa: {
      enforceForCriticalRoles: false,
      criticalRoles: [],
      allowedMethods: ['totp'],
      sessionDurationSeconds: 86400,
    },
    logging: {
      maskSensitiveData: true,
      exposeStackTraces: true,
      detailedQueryLogs: false,
    },
  },
};

export function getSecurityProfile(env: Environment): SecurityProfile {
  return ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS.development;
}

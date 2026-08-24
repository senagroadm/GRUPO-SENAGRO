export interface HealthCheckResponse {
  success: boolean;
  status: 'pass' | 'degraded' | 'fail';
  version: string;
  apiVersion: string;
  environment: string;
  timestamp: string;
  uptime: number;
  system: {
    nodeVersion: string;
    memoryUsageMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latencyMs: number;
      message?: string;
    };
  };
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  requestId: string;
  timestamp: string;
}

export interface UserSessionData {
  user: {
    id: string;
    email: string;
    isSuperAdmin: boolean;
  };
  tenant: {
    empresaAtiva: {
      id: string;
      codigo: string;
      razaoSocial: string;
      nomeFantasia: string;
      cnpj: string;
      regimeTributario: string;
    };
    empresasAutorizadas: Array<{
      id: string;
      codigo: string;
      nomeFantasia: string;
      cnpj: string;
    }>;
  };
  permissions: unknown[];
}

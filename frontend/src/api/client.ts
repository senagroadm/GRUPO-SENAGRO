import { HealthCheckResponse, PaginatedApiResponse, UserSessionData } from '../types';

export interface ApiClientOptions {
  baseUrl?: string;
  token?: string;
  empresaId?: string;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string;
  private empresaId?: string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.token = options.token;
    this.empresaId = options.empresaId;
  }

  public setTenant(empresaId: string) {
    this.empresaId = empresaId;
  }

  public setToken(token: string) {
    this.token = token;
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
    }

    if (this.empresaId) {
      headers['x-empresa-id'] = this.empresaId;
    }

    return headers;
  }

  public async getHealth(): Promise<HealthCheckResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/health`, {
      method: 'GET',
      headers: this.getHeaders(),
      cache: 'no-store',
    });

    const data = await res.json();
    return data as HealthCheckResponse;
  }

  public async getCurrentSession(): Promise<UserSessionData> {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
      cache: 'no-store',
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error?.message || 'Falha ao obter sessão do usuário');
    }
    return body.data as UserSessionData;
  }

  public async getCompanies(page: number = 1, limit: number = 10, query?: string): Promise<PaginatedApiResponse<unknown>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (query) {
      params.set('q', query);
    }

    const res = await fetch(`${this.baseUrl}/api/v1/companies?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error?.message || 'Falha ao buscar empresas');
    }
    return body;
  }
}

export const apiClient = new ApiClient();

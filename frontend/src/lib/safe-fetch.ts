export interface SafeFetchResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackData?: T
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      return {
        success: false,
        status: res.status,
        error: `Servidor retornou resposta inesperada (${res.status})`,
        data: fallbackData,
      };
    }

    const json = await res.json().catch(() => null);

    if (!json) {
      return {
        success: false,
        status: res.status,
        error: 'Falha ao decodificar JSON.',
        data: fallbackData,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: json.error || json.message || `Erro HTTP ${res.status}`,
        data: json.data || fallbackData,
      };
    }

    return {
      success: json.success !== undefined ? json.success : true,
      data: json.data !== undefined ? json.data : json,
      message: json.message,
      error: json.error,
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Erro de conexão.',
      data: fallbackData,
    };
  }
}

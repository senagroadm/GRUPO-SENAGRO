/**
 * Utilitário de requisição segura para o NEXUS ERP.
 * Trata respostas de erro de rate-limit (ex: 'Rate exceeded.'), falhas transitórias
 * e evita exceções de parsing JSON (Unexpected token 'R'...) em todo o frontend.
 */

export interface SafeFetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  retries: number = 1
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    const text = await res.text();

    // Tenta fazer o parse JSON se a resposta parecer um payload JSON
    let parsedJson: any = null;
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        parsedJson = JSON.parse(text);
      } catch {
        parsedJson = null;
      }
    }

    // Se a requisição retornou 429 ou o texto contém rate exceeded, faz retry se configurado
    if (res.status === 429 || text.toLowerCase().includes('rate exceeded')) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return safeFetchJson<T>(url, options, retries - 1);
      }

      return {
        success: false,
        status: res.status || 429,
        error: 'Limite de requisições temporariamente excedido pelo proxy. Aguarde um instante.',
      };
    }

    if (!res.ok) {
      const errorMsg =
        parsedJson?.error ||
        parsedJson?.message ||
        (text.length > 0 && text.length < 150 ? text.trim() : `Erro HTTP ${res.status}`);

      return {
        success: false,
        status: res.status,
        error: errorMsg,
      };
    }

    // Se houve parse JSON com sucesso
    if (parsedJson !== null) {
      return {
        success: parsedJson.success !== undefined ? parsedJson.success : true,
        data: parsedJson.data !== undefined ? parsedJson.data : parsedJson,
        error: parsedJson.error,
        status: res.status,
      };
    }

    // Resposta 200/204 vazia ou de texto
    return {
      success: true,
      data: undefined,
      status: res.status,
    };
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return safeFetchJson<T>(url, options, retries - 1);
    }

    return {
      success: false,
      status: 0,
      error: err?.message || 'Falha de comunicação com o servidor.',
    };
  }
}

export const SENSITIVE_KEYS = [
  'password',
  'senha',
  'secret',
  'token',
  'authorization',
  'apikey',
  'api_key',
  'jwt',
  'cert',
  'certificate',
  'privatekey',
  'private_key',
  'cvv',
  'cartao',
  'cardnumber',
  'cpf',
  'cnpj',
  'salt',
  'hash',
];

export function maskString(val: string, visiblePrefix = 2, visibleSuffix = 2): string {
  if (!val || val.length <= visiblePrefix + visibleSuffix) {
    return '***';
  }
  const prefix = val.substring(0, visiblePrefix);
  const suffix = val.substring(val.length - visibleSuffix);
  return `${prefix}${'*'.repeat(Math.min(val.length - visiblePrefix - visibleSuffix, 8))}${suffix}`;
}

export function maskSensitiveData<T>(obj: T, depth = 0): T {
  if (depth > 6 || obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

      if (isSensitive) {
        if (typeof value === 'string') {
          if (lowerKey.includes('cpf')) {
            // Mask CPF (ex: 123.***.***-99)
            result[key] = value.length >= 11 ? `${value.slice(0, 3)}.***.***-${value.slice(-2)}` : '***.***.***-**';
          } else if (lowerKey.includes('cnpj')) {
            // Mask CNPJ (ex: 12.345.***/0001-99)
            result[key] = value.length >= 14 ? `${value.slice(0, 6)}.***/***${value.slice(-3)}` : '**...**/****-**';
          } else {
            result[key] = '[REDACTED]';
          }
        } else if (typeof value === 'number') {
          result[key] = '[REDACTED]';
        } else {
          result[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = maskSensitiveData(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return obj;
}

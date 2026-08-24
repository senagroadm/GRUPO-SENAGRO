import { describe, it, expect, beforeEach } from 'vitest';
import { validatePassword } from '../../backend/core/security/password-policy';
import { maskSensitiveData, maskString } from '../../backend/core/security/masking';
import { checkRateLimit, rateLimiterStore } from '../../backend/core/security/rate-limit';
import { getSecurityHeaders, getCorsHeaders } from '../../backend/core/security/headers';
import { sanitizeString, sanitizePayload, validateUploadSize, PayloadTooLargeError } from '../../backend/core/security/sanitization';
import { mfaService } from '../../backend/core/security/mfa';
import { formatErrorResponse, BadRequestError } from '../../backend/core/errors';

describe('Security Layer - Comprehensive Unit & Integration Tests', () => {
  beforeEach(() => {
    rateLimiterStore.reset();
  });

  describe('1. Password Policy Validation', () => {
    it('should reject passwords shorter than min length', () => {
      const res = validatePassword('123', 'production');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('no mínimo 12 caracteres'))).toBe(true);
    });

    it('should reject common weak passwords', () => {
      const res = validatePassword('password', 'development');
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('comum e insegura'))).toBe(true);
    });

    it('should require uppercase, lowercase, numbers, and symbols in production', () => {
      const res = validatePassword('nexuscorp2026', 'production');
      expect(res.valid).toBe(false);
      // missing uppercase and special char
      expect(res.errors.some((e) => e.includes('maiúscula'))).toBe(true);
      expect(res.errors.some((e) => e.includes('especial'))).toBe(true);
    });

    it('should accept strong compliant password in production', () => {
      const res = validatePassword('Nexus@Industrial2026#Secure', 'production');
      expect(res.valid).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.errors.length).toBe(0);
    });
  });

  describe('2. Sensitive Data Masking', () => {
    it('should mask simple strings appropriately', () => {
      const masked = maskString('mySecretApiKey12345');
      expect(masked.startsWith('my')).toBe(true);
      expect(masked.endsWith('45')).toBe(true);
      expect(masked.includes('***')).toBe(true);
    });

    it('should mask sensitive keys in nested object payloads', () => {
      const sensitivePayload = {
        user: {
          id: 'usr-1',
          name: 'Carlos Silva',
          password: 'SecretPassword123!',
          cpf: '12345678901',
          apiKey: 'sec_live_9988776655',
        },
        metadata: {
          sessionToken: 'jwt.token.secret',
          cnpj: '44566045000101',
        },
      };

      const masked = maskSensitiveData(sensitivePayload);

      expect(masked.user.password).toBe('[REDACTED]');
      expect(masked.user.apiKey).toBe('[REDACTED]');
      expect(masked.metadata.sessionToken).toBe('[REDACTED]');
      expect(masked.user.cpf).toContain('.***.***-');
      expect(masked.user.name).toBe('Carlos Silva');
    });
  });

  describe('3. Rate Limiting Control', () => {
    it('should allow requests within rate limit window', () => {
      const r1 = checkRateLimit('192.168.1.1', 'auth', 'production');
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(4); // 5 max in prod auth
    });

    it('should block requests exceeding threshold', () => {
      const ip = '10.0.0.99';
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(ip, 'auth', 'production');
        expect(res.allowed).toBe(true);
      }

      // 6th request must be blocked
      const blocked = checkRateLimit(ip, 'auth', 'production');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('4. Security Headers and Restrictive CORS', () => {
    it('should produce OWASP recommended security headers in production', () => {
      const headers = getSecurityHeaders('production');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['Strict-Transport-Security']).toBeDefined();
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });

    it('should enforce strict CORS origin validation', () => {
      const prodCors = getCorsHeaders('https://app.nexuserp.com.br', 'production');
      expect(prodCors['Access-Control-Allow-Origin']).toBe('https://app.nexuserp.com.br');

      const rejectedCors = getCorsHeaders('https://malicious-site.com', 'production');
      expect(rejectedCors['Access-Control-Allow-Origin']).toBe('https://app.nexuserp.com.br');
    });
  });

  describe('5. Input Sanitization & Upload Limits', () => {
    it('should strip malicious script tags and event handlers', () => {
      const dirty = '<script>alert("hack")</script>Hello <b onclick="evil()">World</b>';
      const clean = sanitizeString(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onclick=');
      expect(clean).toContain('Hello');
    });

    it('should sanitize nested payload objects', () => {
      const payload = {
        name: 'Nexus <script>alert(1)</script>',
        tags: ['safe', 'javascript:evil()'],
      };
      const cleaned = sanitizePayload(payload);
      expect(cleaned.name).toBe('Nexus');
      expect(cleaned.tags[1]).toBe('evil()');
    });

    it('should throw PayloadTooLargeError when Content-Length exceeds threshold', () => {
      const max10Mb = 10 * 1024 * 1024;
      const size15Mb = (15 * 1024 * 1024).toString();

      expect(() => validateUploadSize(size15Mb, max10Mb)).toThrow(PayloadTooLargeError);
    });
  });

  describe('6. MFA Policy & Extension Point', () => {
    it('should identify critical roles requiring MFA in staging/prod', () => {
      expect(mfaService.isMfaRequiredForRole('SUPERADMIN', 'production')).toBe(true);
      expect(mfaService.isMfaRequiredForRole('DIRETOR_FINANCEIRO', 'production')).toBe(true);
      expect(mfaService.isMfaRequiredForRole('OPERADOR_FABRICA', 'production')).toBe(false);
      expect(mfaService.isMfaRequiredForRole('SUPERADMIN', 'development')).toBe(false);
    });

    it('should validate 6-digit TOTP verification token pattern', async () => {
      const valid = await mfaService.verifyToken('usr-1', 'secret', '123456');
      expect(valid.success).toBe(true);

      const invalidLength = await mfaService.verifyToken('usr-1', 'secret', '123');
      expect(invalidLength.success).toBe(false);
    });
  });

  describe('7. Safe Error Formatting without Stack Leaks', () => {
    it('should hide stack trace for generic errors in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const sensitiveErr = new Error('Database password incorrect at server.internal:5432');
        const formatted = formatErrorResponse(sensitiveErr, 'req-sec-01');

        expect(formatted.error.stack).toBeUndefined();
        expect(formatted.error.message).toContain('Ocorreu um erro interno');
        expect(formatted.requestId).toBe('req-sec-01');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should preserve controlled AppError details safely', () => {
      const err = new BadRequestError('CNPJ inválido');
      const formatted = formatErrorResponse(err, 'req-02');
      expect(formatted.error.code).toBe('BAD_REQUEST');
      expect(formatted.error.message).toBe('CNPJ inválido');
    });
  });
});

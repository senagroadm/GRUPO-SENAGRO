import { describe, it, expect } from 'vitest';
import { generateRequestId, extractRequestId, extractCorrelationId } from '../../backend/core/middlewares/request-id';

describe('Request ID & Correlation ID Middleware Unit Tests', () => {
  it('should generate unique request ids', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1.startsWith('req-')).toBe(true);
    expect(id2.startsWith('req-')).toBe(true);
    expect(id1).not.toBe(id2);
  });

  it('should preserve incoming request id if present', () => {
    const existing = 'req-custom-client-12345';
    const extracted = extractRequestId(existing);

    expect(extracted).toBe(existing);
  });

  it('should generate new request id if header is empty or undefined', () => {
    const extracted = extractRequestId(undefined);
    expect(extracted.startsWith('req-')).toBe(true);
  });

  it('should extract or fallback correlation id with prefix', () => {
    const customCorr = 'corr-gateway-987';
    expect(extractCorrelationId(customCorr, 'fallback-req')).toBe(customCorr);
    expect(extractCorrelationId(undefined, 'req-001')).toBe('corr-req-001');
  });
});

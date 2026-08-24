import { describe, it, expect } from 'vitest';
import { Logger } from '../../backend/core/logger';

describe('Structured Logger Unit Tests', () => {
  it('should emit structured log message with correct fields', () => {
    const logger = new Logger('debug', { service: 'nexus-core' });
    const log = logger.info('Test message', { userId: 'usr-123', empresaId: 'emp-456' });

    expect(log.level).toBe('info');
    expect(log.message).toBe('Test message');
    expect(log.context?.service).toBe('nexus-core');
    expect(log.context?.userId).toBe('usr-123');
    expect(log.context?.empresaId).toBe('emp-456');
    expect(log.timestamp).toBeDefined();
  });

  it('should serialize error stack and details in error logs', () => {
    const logger = new Logger('error');
    const customErr = new Error('Database connection timeout');
    const log = logger.error('Operation failed', customErr, { requestId: 'req-001' });

    expect(log.level).toBe('error');
    expect(log.error?.name).toBe('Error');
    expect(log.error?.message).toBe('Database connection timeout');
    expect(log.error?.stack).toBeDefined();
    expect(log.context?.requestId).toBe('req-001');
  });

  it('should support child loggers with merged context', () => {
    const rootLogger = new Logger('info', { app: 'erp', env: 'test' });
    const childLogger = rootLogger.child({ module: 'fiscal', correlationId: 'corr-999' });

    const log = childLogger.info('Emitting NF-e', { nfeId: 'nfe-001' });

    expect(log.context?.app).toBe('erp');
    expect(log.context?.env).toBe('test');
    expect(log.context?.module).toBe('fiscal');
    expect(log.context?.correlationId).toBe('corr-999');
    expect(log.context?.nfeId).toBe('nfe-001');
  });
});

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

import { maskSensitiveData } from '../security/masking';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  empresaId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
}

export interface StructuredLogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    details?: unknown;
  };
}

export class Logger {
  private minLevel: LogLevel;
  private defaultContext: LogContext;
  private shouldMask: boolean;

  constructor(minLevel: LogLevel = 'info', defaultContext: LogContext = {}, shouldMask = true) {
    this.minLevel = minLevel;
    this.defaultContext = defaultContext;
    this.shouldMask = shouldMask;
  }

  public child(context: LogContext): Logger {
    return new Logger(this.minLevel, { ...this.defaultContext, ...context }, this.shouldMask);
  }

  private shouldLog(level: LogLevel): boolean {
    const currentSeverity = LOG_LEVEL_SEVERITY[this.minLevel] || 20;
    const targetSeverity = LOG_LEVEL_SEVERITY[level] || 20;
    return targetSeverity >= currentSeverity;
  }

  private formatError(err: unknown) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (err instanceof Error) {
      return {
        name: err.name,
        message: err.message,
        // Omit stack trace in production logs unless explicit debug override
        stack: isProduction ? undefined : err.stack,
        code: (err as { code?: string }).code,
        details: this.shouldMask
          ? maskSensitiveData((err as { details?: unknown }).details)
          : (err as { details?: unknown }).details,
      };
    }
    if (typeof err === 'string') {
      return { name: 'Error', message: err };
    }
    return err ? { name: 'UnknownError', message: String(err) } : undefined;
  }

  private emit(level: LogLevel, message: string, meta?: LogContext, err?: unknown): StructuredLogMessage {
    const mergedContext = { ...this.defaultContext, ...meta };
    const sanitizedContext = this.shouldMask ? maskSensitiveData(mergedContext) : mergedContext;

    const payload: StructuredLogMessage = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: sanitizedContext,
    };

    if (err) {
      payload.error = this.formatError(err);
    }

    if (this.shouldLog(level)) {
      const serialized = JSON.stringify(payload);
      if (level === 'error') {
        console.error(serialized);
      } else if (level === 'warn') {
        console.warn(serialized);
      } else {
        console.log(serialized);
      }
    }

    return payload;
  }

  public debug(message: string, meta?: LogContext): StructuredLogMessage {
    return this.emit('debug', message, meta);
  }

  public info(message: string, meta?: LogContext): StructuredLogMessage {
    return this.emit('info', message, meta);
  }

  public warn(message: string, meta?: LogContext, err?: unknown): StructuredLogMessage {
    return this.emit('warn', message, meta, err);
  }

  public error(message: string, err?: unknown, meta?: LogContext): StructuredLogMessage {
    return this.emit('error', message, meta, err);
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'test' ? 'error' : 'info')
);

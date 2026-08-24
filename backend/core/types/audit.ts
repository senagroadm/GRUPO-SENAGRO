import { ModuloSistema } from './permissions';

export type AuditAction =
  | 'INSERT'
  | 'UPDATE'
  | 'SOFT_DELETE'
  | 'CANCEL'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'LOGIN'
  | 'SECURITY_EVENT';

export interface AuditLogEntry {
  id?: string;
  empresaId: string;
  userId?: string;
  modulo: ModuloSistema;
  entidade: string;
  entidadeId: string;
  acao: AuditAction;
  estadoAnterior?: Record<string, unknown> | null;
  estadoPosterior?: Record<string, unknown> | null;
  ipOrigem?: string;
  userAgent?: string;
  correlationId?: string;
  motivoJustificativa?: string;
  createdAt?: string | Date;
}

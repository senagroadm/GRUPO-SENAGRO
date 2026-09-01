'use server';

import { revalidatePath } from 'next/cache';
import { getDatabasePool } from '@/backend/db/client';

export type OpportunityOutcomeStatus = 'won' | 'lost';

export interface UpdateOpportunityOutcomeParams {
  opportunityId: string;
  status: OpportunityOutcomeStatus;
  reason?: string;
  closedValue?: number;
  competitor?: string;
  empresaId?: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action para registrar desfecho (Ganho/Perda) de Oportunidade no CRM
 */
export async function updateOpportunityOutcome({
  opportunityId,
  status,
  reason = '',
  closedValue,
  competitor,
  empresaId,
}: UpdateOpportunityOutcomeParams): Promise<ActionResult<{ id: string; status: OpportunityOutcomeStatus }>> {
  try {
    if (!opportunityId) {
      return { success: false, error: 'O ID da oportunidade é obrigatório.' };
    }

    if (status !== 'won' && status !== 'lost') {
      return { success: false, error: 'Status inválido. Deve ser "won" ou "lost".' };
    }

    if (status === 'lost' && !reason.trim()) {
      return { success: false, error: 'O motivo da perda é obrigatório.' };
    }

    const pool = getDatabasePool();
    if (!pool) {
      return { success: false, error: 'Conexão com o banco de dados Supabase/PostgreSQL indisponível.' };
    }

    const client = await pool.connect();
    try {
      const dbStatus = status === 'won' ? 'GANHA' : 'PERDIDA';
      
      const query = `
        UPDATE crm_oportunidades
        SET 
          status = $1,
          detalhes_perda = CASE WHEN $1 = 'PERDIDA' THEN $2 ELSE detalhes_perda END,
          feedback_cliente = $2,
          valor_fechado = CASE WHEN $1 = 'GANHA' AND $3::numeric IS NOT NULL THEN $3::numeric ELSE valor_fechado END,
          concorrente_vencedor = $4,
          data_fechamento_real = NOW(),
          atualizado_em = NOW()
        WHERE id = $5
          ${empresaId ? 'AND empresa_id = $6' : ''}
        RETURNING id, status;
      `;

      const params = [
        dbStatus,
        reason.trim(),
        closedValue ?? null,
        competitor?.trim() ?? null,
        opportunityId,
        ...(empresaId ? [empresaId] : []),
      ];

      const result = await client.query(query, params);

      if (result.rowCount === 0) {
        return {
          success: false,
          error: 'Oportunidade não encontrada ou usuário sem permissão para alterá-la.',
        };
      }

      // Revalida os caminhos relevantes no App Router do Next.js
      revalidatePath('/crm');
      revalidatePath('/orcamentos');

      return {
        success: true,
        data: {
          id: opportunityId,
          status,
        },
      };
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno ao processar o desfecho da oportunidade.';
    return {
      success: false,
      error: message,
    };
  }
}

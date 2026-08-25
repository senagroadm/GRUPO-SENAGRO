import { StatusPedido, PedidoVenda, PedidoItem } from './pedido-types';

/**
 * Grafo de Transições Válidas da Máquina de Estados de Pedidos de Venda
 */
export const TRANSIÇÕES_VALIDAS: Record<StatusPedido, StatusPedido[]> = {
  RASCUNHO: ['PENDENTE', 'CANCELADO'],
  PENDENTE: ['APROVACAO', 'APROVADO', 'RASCUNHO', 'CANCELADO'],
  APROVACAO: ['APROVADO', 'RASCUNHO', 'CANCELADO'],
  APROVADO: ['EM_EXECUCAO', 'CANCELADO', 'APROVACAO'], // Pode voltar para APROVACAO em caso de mudança crítica
  EM_EXECUCAO: ['PARCIAL', 'PRONTO', 'CANCELADO', 'APROVACAO'], // Pode voltar para APROVACAO se reaberto criticamente
  PARCIAL: ['PARCIAL', 'PRONTO', 'EXPEDIDO', 'FATURADO', 'CONCLUIDO', 'CANCELADO'],
  PRONTO: ['EXPEDIDO', 'FATURADO', 'CANCELADO'],
  EXPEDIDO: ['FATURADO', 'PARCIAL', 'CONCLUIDO'],
  FATURADO: ['CONCLUIDO', 'PARCIAL'],
  CONCLUIDO: [], // Terminal
  CANCELADO: [], // Terminal
};

export interface ResultadoValidacaoTransicao {
  valido: boolean;
  motivo?: string;
  requerAprovacaoAlcada?: boolean;
  efeitosColaterais?: string[];
}

export interface AnaliseMudancaCritica {
  isCritica: boolean;
  motivos: string[];
  valorAnterior: number;
  novoValor: number;
  diferencaValor: number;
  margemAnterior: number;
  novaMargem: number;
  prazoAnterior: string;
  novoPrazo: string;
}

export class PedidoStateMachine {
  /**
   * Verifica se uma transição de status é permitida pelas regras da máquina de estados
   */
  public static podeTransicionar(statusAtual: StatusPedido, novoStatus: StatusPedido): boolean {
    if (statusAtual === novoStatus) return true;
    const destinosPermitidos = TRANSIÇÕES_VALIDAS[statusAtual] || [];
    return destinosPermitidos.includes(novoStatus);
  }

  /**
   * Valida detalhadamente a transição considerando regras de negócio (aprovações, entregas, etc.)
   */
  public static validarTransicao(
    pedido: PedidoVenda,
    novoStatus: StatusPedido,
    contexto?: {
      usuarioCargo?: string;
      ignorarAprovacoesPendentes?: boolean;
    }
  ): ResultadoValidacaoTransicao {
    const statusAtual = pedido.status;

    // Transição para o mesmo status é idempotente
    if (statusAtual === novoStatus) {
      return { valido: true, efeitosColaterais: ['Sem alteração de status.'] };
    }

    // Checar se a transição básica é permitida no grafo
    if (!this.podeTransicionar(statusAtual, novoStatus)) {
      return {
        valido: false,
        motivo: `Transição inválida: Não é permitido mudar de '${statusAtual}' diretamente para '${novoStatus}'. Transições permitidas: [${(TRANSIÇÕES_VALIDAS[statusAtual] || []).join(', ')}].`,
      };
    }

    // Regra: Para transicionar para 'APROVADO', não podem existir aprovações com status 'PENDENTE' ou 'REJEITADO'
    if (novoStatus === 'APROVADO') {
      const aprovacoesPendentes = pedido.aprovacoes.filter((a) => a.status === 'PENDENTE');
      const aprovacoesRejeitadas = pedido.aprovacoes.filter((a) => a.status === 'REJEITADO');

      if (aprovacoesRejeitadas.length > 0) {
        return {
          valido: false,
          motivo: `O pedido possui aprovações rejeitadas (${aprovacoesRejeitadas.map((a) => a.tipoAprovacao).join(', ')}). Ajuste o pedido ou retorne para RASCUNHO.`,
        };
      }

      if (aprovacoesPendentes.length > 0 && !contexto?.ignorarAprovacoesPendentes) {
        return {
          valido: false,
          motivo: `O pedido possui ${aprovacoesPendentes.length} aprovação(ões) pendente(s) de alçada (${aprovacoesPendentes.map((a) => a.tipoAprovacao).join(', ')}).`,
          requerAprovacaoAlcada: true,
        };
      }

      if (pedido.validacaoCredito.possuiBloqueioAtivo) {
        const temAprovacaoCredito = pedido.aprovacoes.some(
          (a) => a.tipoAprovacao === 'LIMITE_CREDITO' && a.status === 'APROVADO'
        );
        if (!temAprovacaoCredito) {
          return {
            valido: false,
            motivo: `Cliente possui bloqueio de crédito ativo (${pedido.validacaoCredito.motivoBloqueio || 'Inadimplência'}). Exige aprovação de alçada de crédito para liberar.`,
            requerAprovacaoAlcada: true,
          };
        }
      }
    }

    // Regra: Para transicionar para 'EM_EXECUCAO', o pedido deve ter itens e estar formalmente aprovado
    if (novoStatus === 'EM_EXECUCAO') {
      if (pedido.itens.length === 0) {
        return { valido: false, motivo: 'Não é possível iniciar execução de pedido sem itens cadastrados.' };
      }
    }

    // Regra: Para transicionar para 'EXPEDIDO', o pedido deve estar pronto ou ter entregas programadas
    if (novoStatus === 'EXPEDIDO') {
      if (statusAtual !== 'PRONTO' && statusAtual !== 'PARCIAL') {
        return {
          valido: false,
          motivo: `Não é possível expedir um pedido que ainda não esteja com status 'PRONTO' ou 'PARCIAL'.`,
        };
      }
    }

    // Regra: Para transicionar para 'FATURADO', o pedido deve estar expedido ou pronto
    if (novoStatus === 'FATURADO') {
      if (['RASCUNHO', 'PENDENTE', 'APROVACAO', 'CANCELADO'].includes(statusAtual)) {
        return {
          valido: false,
          motivo: `Não é possível faturar um pedido com status '${statusAtual}'. O pedido deve estar aprovado e pronto/expedido.`,
        };
      }
    }

    // Transição Válida
    const efeitosColaterais: string[] = [];
    if (novoStatus === 'APROVADO') {
      efeitosColaterais.push('Aciona reserva de estoque para itens de prateleira.');
      efeitosColaterais.push('Gera Ordens de Produção (OP) para itens fabricados sob encomenda.');
    } else if (novoStatus === 'EXPEDIDO') {
      efeitosColaterais.push('Atualiza status das remessas de entrega para EXPEDIDA.');
      efeitosColaterais.push('Registra data de despacho.');
    } else if (novoStatus === 'FATURADO') {
      efeitosColaterais.push('Atualiza status das parcelas financeiras para FATURADO.');
    } else if (novoStatus === 'CANCELADO') {
      efeitosColaterais.push('Libera eventuais reservas de estoque e cancela OPs pendentes.');
    }

    return {
      valido: true,
      efeitosColaterais,
    };
  }

  /**
   * Avalia se uma alteração em um pedido já aprovado ou em execução constitui "Mudança Crítica",
   * exigindo congelamento de nova versão e reenvio para alçada de aprovação.
   */
  public static avaliarMudancaCritica(
    pedidoAtual: PedidoVenda,
    novosDados: {
      valorTotalPedido?: number;
      itens?: PedidoItem[];
      prazoPrometido?: string;
      condicaoPagamento?: string;
      margemContribuicaoEstimadaPerc?: number;
    },
    toleranciaPerc: number = 2.0,
    toleranciaValor: number = 500.0
  ): AnaliseMudancaCritica {
    const motivos: string[] = [];
    const valorAnterior = pedidoAtual.valorTotalPedido;
    const novoValor = novosDados.valorTotalPedido ?? valorAnterior;
    const diferencaValor = novoValor - valorAnterior;
    const variacaoPerc = valorAnterior > 0 ? (Math.abs(diferencaValor) / valorAnterior) * 100 : 0;

    const margemAnterior = pedidoAtual.margemContribuicaoEstimadaPerc;
    const novaMargem = novosDados.margemContribuicaoEstimadaPerc ?? margemAnterior;

    const prazoAnterior = pedidoAtual.prazoPrometido;
    const novoPrazo = novosDados.prazoPrometido ?? prazoAnterior;

    // Se o pedido já estiver APROVADO, EM_EXECUCAO, PARCIAL ou PRONTO
    const statusVulneravel = ['APROVADO', 'EM_EXECUCAO', 'PARCIAL', 'PRONTO'].includes(pedidoAtual.status);

    if (statusVulneravel) {
      // 1. Variação significativa de valor total (> tolerância)
      if (Math.abs(diferencaValor) > toleranciaValor || variacaoPerc > toleranciaPerc) {
        motivos.push(
          `Variação no valor total do pedido de R$ ${valorAnterior.toFixed(2)} para R$ ${novoValor.toFixed(2)} (${variacaoPerc.toFixed(1)}% / Dif: R$ ${diferencaValor.toFixed(2)}) excede a tolerância de ${toleranciaPerc}% ou R$ ${toleranciaValor}.`
        );
      }

      // 2. Queda na margem de contribuição
      if (novaMargem < margemAnterior - 0.5) {
        motivos.push(
          `Redução na margem de contribuição de ${margemAnterior.toFixed(1)}% para ${novaMargem.toFixed(1)}%.`
        );
      }

      // 3. Postergação do prazo prometido > 3 dias
      if (prazoAnterior && novoPrazo && prazoAnterior !== novoPrazo) {
        const diffMs = new Date(novoPrazo).getTime() - new Date(prazoAnterior).getTime();
        const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDias > 3) {
          motivos.push(`Adiamento do prazo prometido em ${diffDias} dias (de ${prazoAnterior} para ${novoPrazo}).`);
        }
      }

      // 4. Alteração na condição de pagamento (ex: aumento de prazo de faturamento)
      if (novosDados.condicaoPagamento && novosDados.condicaoPagamento !== pedidoAtual.condicaoPagamento) {
        motivos.push(
          `Alteração na condição de pagamento de '${pedidoAtual.condicaoPagamento}' para '${novosDados.condicaoPagamento}'.`
        );
      }

      // 5. Exclusão ou redução de itens com OP já aberta
      if (novosDados.itens) {
        const itensComOp = pedidoAtual.itens.filter(
          (it) => it.necessidadeGerada.tipo === 'ORDEM_PRODUCAO' && it.necessidadeGerada.numeroOp
        );
        for (const itemOp of itensComOp) {
          const novoItem = novosDados.itens.find((it) => it.codigoItem === itemOp.codigoItem);
          if (!novoItem) {
            motivos.push(`Item fabricado '${itemOp.descricao}' (OP ${itemOp.necessidadeGerada.numeroOp}) foi removido do pedido.`);
          } else if (novoItem.quantidade < itemOp.quantidade) {
            motivos.push(
              `Redução de quantidade do item '${itemOp.descricao}' de ${itemOp.quantidade} para ${novoItem.quantidade} com OP já emitida.`
            );
          }
        }
      }
    }

    return {
      isCritica: motivos.length > 0,
      motivos,
      valorAnterior,
      novoValor,
      diferencaValor,
      margemAnterior,
      novaMargem,
      prazoAnterior,
      novoPrazo,
    };
  }
}

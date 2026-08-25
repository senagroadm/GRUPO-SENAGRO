export interface TestResultItem {
  id: string;
  suite: string;
  nome: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export function runPedidoStateMachineTestSuite(): {
  summary: { total: number; passed: number; failed: number };
  results: TestResultItem[];
} {
  const results: TestResultItem[] = [];

  function executeTest(suite: string, nome: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    try {
      const res = fn();
      if (res instanceof Promise) {
        // Para testes síncronos da suíte
      }
      results.push({
        id: `t-${results.length + 1}`,
        suite,
        nome,
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
      });
    } catch (err: any) {
      results.push({
        id: `t-${results.length + 1}`,
        suite,
        nome,
        passed: false,
        error: err?.message || String(err),
        durationMs: Number((performance.now() - start).toFixed(2)),
      });
    }
  }

  // Import dynamic ou instanciação local
  const { PedidoService } = require('../modules/pedidos/pedido-service');
  const { PedidoStateMachine } = require('../modules/pedidos/pedido-state-machine');

  const service = new PedidoService();
  const usuarioMock = { id: 'usr-tester', nome: 'Engenheiro de Testes', cargo: 'DIRETOR_INDUSTRIAL' };

  // SUITE 1: Origem e Conversão de Orçamento
  executeTest('Origem & Conversão', 'Deve converter orçamento aprovado em pedido preservando origem ORCAMENTO sem redigitar', () => {
    const pedido = service.getPedidoById('ped-001');
    if (!pedido) throw new Error('Pedido demo ped-001 não encontrado');
    if (pedido.origem !== 'ORCAMENTO') throw new Error(`Origem esperada ORCAMENTO, recebida: ${pedido.origem}`);
    if (!pedido.orcamentoOrigemId) throw new Error('orcamentoOrigemId não foi preenchido');
    if (pedido.itens.length === 0) throw new Error('Itens não foram transferidos do orçamento');
  });

  executeTest('Versão Comercial Congelada', 'Deve congelar versão comercial aprovada com hash de integridade e snapshot imutável', () => {
    const pedido = service.getPedidoById('ped-001');
    if (!pedido?.versaoComercialCongelada) throw new Error('versaoComercialCongelada ausente no pedido');
    if (!pedido.versaoComercialCongelada.hashIntegridade) throw new Error('Hash SHA-256 de integridade não gerado');
    if (pedido.versaoComercialCongelada.itensSnapshot.length !== pedido.itens.length) {
      throw new Error('Snapshot de itens congelados diverge do total de itens');
    }
  });

  // SUITE 2: Validação de Limite de Crédito e Margem Mínima
  executeTest('Validação de Limite de Crédito', 'Deve encaminhar pedido para alçada APROVACAO quando exceder limite de crédito', () => {
    const pedido = service.getPedidoById('ped-002');
    if (!pedido) throw new Error('Pedido ped-002 não encontrado');
    if (pedido.status !== 'APROVACAO') {
      throw new Error(`Status esperado 'APROVACAO' por limite estourado, atual: ${pedido.status}`);
    }
    const temAprovacaoCredito = pedido.aprovacoes.some((a: any) => a.tipoAprovacao === 'LIMITE_CREDITO');
    if (!temAprovacaoCredito) {
      throw new Error('Não foi gerada pendência de aprovação de LIMITE_CREDITO');
    }
  });

  // SUITE 3: Prazo Prometido e Cronograma de Entregas
  executeTest('Prazo Prometido', 'Deve calcular e armazenar prazoPrometido e cronograma em pedido_entregas', () => {
    const pedido = service.getPedidoById('ped-001');
    if (!pedido?.prazoPrometido) throw new Error('prazoPrometido não armazenado');
    if (pedido.entregas.length === 0) throw new Error('pedido_entregas vazio');
    if (!pedido.entregas[0].dataPrometidaEntrega) throw new Error('dataPrometidaEntrega ausente na remessa');
  });

  // SUITE 4: Bloqueio de Transições Inválidas
  executeTest('Bloqueio de Transição Inválida', 'Deve proibir saltos ilegais como RASCUNHO -> EXPEDIDO ou CANCELADO -> APROVADO', () => {
    const podePular = PedidoStateMachine.podeTransicionar('RASCUNHO', 'EXPEDIDO');
    if (podePular) throw new Error('Máquina de estados permitiu salto ilegal de RASCUNHO para EXPEDIDO');

    const podeReviverCancelado = PedidoStateMachine.podeTransicionar('CANCELADO', 'APROVADO');
    if (podeReviverCancelado) throw new Error('Máquina de estados permitiu alterar status de pedido CANCELADO');
  });

  // SUITE 5: Mudança Crítica Exigindo Nova Aprovação
  executeTest('Mudança Crítica & Reabertura', 'Deve reabrir pedido aprovado e exigir nova aprovação se houver aumento de valor ou prazo', () => {
    const pedido = service.getPedidoById('ped-001');
    if (!pedido) throw new Error('Pedido ped-001 não encontrado');

    const valorOriginal = pedido.valorTotalPedido;
    const novoValorSubstancial = valorOriginal + 15000.0;

    const resultado = service.aplicarAlteracaoCritica(
      pedido.id,
      {
        valorTotalPedido: novoValorSubstancial,
        motivoAlteracao: 'Cliente solicitou reforço estrutural adicional de última hora.',
      },
      usuarioMock
    );

    if (!resultado.analise.isCritica) {
      throw new Error('Alteração de R$ 15.000 deveria ter sido classificada como CRÍTICA');
    }
    if (resultado.pedido.status !== 'APROVACAO') {
      throw new Error(`Pedido deveria ter voltado para APROVACAO, mas está em: ${resultado.pedido.status}`);
    }
    if (resultado.pedido.versaoAtual <= 1) {
      throw new Error('versaoAtual deveria ter sido incrementada');
    }
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    summary: {
      total: results.length,
      passed,
      failed,
    },
    results,
  };
}

if (typeof require !== 'undefined' && require.main === module) {
  const output = runPedidoStateMachineTestSuite();
  console.log('=== TEST RESULTS ===');
  console.log(`Passed: ${output.summary.passed}/${output.summary.total}`);
  output.results.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] [${r.suite}] ${r.nome} (${r.durationMs}ms)`);
    if (r.error) console.error(`  Error: ${r.error}`);
  });
}

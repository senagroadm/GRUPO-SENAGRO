import { describe, it, expect } from 'vitest';
import { comprasService } from '../../backend/modules/compras/compras-service';

describe('Compras & Suprimentos - Regras de Negócio Industriais', () => {
  const empresaId = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica

  it('1. Deve criar solicitação de compra por diferentes origens (Manual, OP, etc)', () => {
    const solManual = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'MANUAL',
      prioridade: 'NORMAL',
      solicitanteNome: 'Comprador Teste',
      departamento: 'Suprimentos',
      dataNecessidade: '2026-03-10',
      justificativa: 'Reposição de rotina',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço SAE 1020 4.75mm',
          quantidade: 15,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1100,
        },
      ],
    });
    expect(solManual.numero.startsWith('SC-')).toBe(true);
    expect(solManual.status).toBe('RASCUNHO');

    const solOP = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'ORDEM_PRODUCAO',
      prioridade: 'URGENTE',
      solicitanteNome: 'PCP',
      departamento: 'PCP',
      numeroOp: 'OP-2026-999',
      clienteNome: 'AgroSilus',
      dataNecessidade: '2026-03-05',
      justificativa: 'Material para fabricação de funil',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço SAE 1020 4.75mm',
          quantidade: 10,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1120,
        },
      ],
    });
    expect(solOP.numeroOp).toBe('OP-2026-999');
  });

  it('2. Deve aprovar solicitação de compra para cotação', () => {
    const sol = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'MANUAL',
      prioridade: 'NORMAL',
      solicitanteNome: 'Comprador Teste',
      departamento: 'Suprimentos',
      dataNecessidade: '2026-03-10',
      justificativa: 'Reposição',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço',
          quantidade: 5,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1100,
        },
      ],
    });
    const solAprovada = comprasService.aprovarSolicitacao(sol.id, 'Engenheiro Chefe', 'Aprovado para cotação');
    expect(solAprovada.status).toBe('APROVADA');
  });

  it('3. Deve criar cotação multi-critério comparando preço, frete, prazo, qualidade e histórico', () => {
    const sol = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'MANUAL',
      prioridade: 'NORMAL',
      solicitanteNome: 'Comprador Teste',
      departamento: 'Suprimentos',
      dataNecessidade: '2026-03-10',
      justificativa: 'Reposição',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço',
          quantidade: 5,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1100,
        },
      ],
    });
    const solAprovada = comprasService.aprovarSolicitacao(sol.id, 'Engenheiro Chefe', 'Aprovado');

    const cotacao = comprasService.criarCotacao(empresaId, {
      solicitacaoId: solAprovada.id,
      compradorNome: 'Comprador Especialista',
      fornecedoresIds: ['forn-usiminas-01', 'forn-gerdau-03', 'forn-csn-02'],
      pesosCriterios: {
        pesoPreco: 40,
        pesoFrete: 20,
        pesoPrazo: 20,
        pesoQualidade: 10,
        pesoHistorico: 10,
      },
      prazoLimiteResposta: '2026-03-01T18:00:00.000Z',
    });

    expect(cotacao.fornecedores.length).toBe(3);
    expect(cotacao.fornecedores.every((f) => f.pontuacaoGeralFinal > 0)).toBe(true);
    expect(cotacao.fornecedores.some((f) => f.rankingGeral === 1)).toBe(true);
  });

  it('4. NÃO deve permitir escolher fornecedor fora do 1º lugar sem justificativa formal', () => {
    const sol = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'MANUAL',
      prioridade: 'NORMAL',
      solicitanteNome: 'Comprador Teste',
      departamento: 'Suprimentos',
      dataNecessidade: '2026-03-10',
      justificativa: 'Reposição',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço',
          quantidade: 5,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1100,
        },
      ],
    });
    const solAprovada = comprasService.aprovarSolicitacao(sol.id, 'Engenheiro Chefe', 'Aprovado');
    const cotacao = comprasService.criarCotacao(empresaId, {
      solicitacaoId: solAprovada.id,
      compradorNome: 'Comprador Especialista',
      fornecedoresIds: ['forn-usiminas-01', 'forn-gerdau-03', 'forn-csn-02'],
    });

    const segundoLugar = cotacao.fornecedores.find((f) => f.rankingGeral === 2)!;
    expect(() =>
      comprasService.aprovarCotacaoEEfetivarPedido(cotacao.id, {
        fornecedorIdVencedor: segundoLugar.fornecedorId,
        aprovadorNome: 'Diretor',
        justificativaEscolha: '', // Sem justificativa
      })
    ).toThrow(/justificativa formal/);
  });

  it('5. Deve aprovar cotação e gerar Pedido de Compra automaticamente', () => {
    const sol = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'MANUAL',
      prioridade: 'NORMAL',
      solicitanteNome: 'Comprador Teste',
      departamento: 'Suprimentos',
      dataNecessidade: '2026-03-10',
      justificativa: 'Reposição',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço',
          quantidade: 5,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1100,
        },
      ],
    });
    const solAprovada = comprasService.aprovarSolicitacao(sol.id, 'Engenheiro Chefe', 'Aprovado');
    const cotacao = comprasService.criarCotacao(empresaId, {
      solicitacaoId: solAprovada.id,
      compradorNome: 'Comprador Especialista',
      fornecedoresIds: ['forn-usiminas-01', 'forn-gerdau-03'],
    });

    const vencedor = cotacao.fornecedores[0];
    const resultado = comprasService.aprovarCotacaoEEfetivarPedido(cotacao.id, {
      fornecedorIdVencedor: vencedor.fornecedorId,
      aprovadorNome: 'Diretor',
      justificativaEscolha: 'Vencedor com melhor pontuação global.',
    });

    expect(resultado.pedido.numero.startsWith('PC-')).toBe(true);
    expect(resultado.pedido.status).toBe('APROVADO');
  });

  it('6. Deve processar recebimento com integração de estoque, financeiro e fiscal', () => {
    const sol = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: 'MANUAL',
      prioridade: 'NORMAL',
      solicitanteNome: 'Comprador Teste',
      departamento: 'Suprimentos',
      dataNecessidade: '2026-03-10',
      justificativa: 'Reposição',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço',
          quantidade: 5,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1100,
        },
      ],
    });
    const solAprovada = comprasService.aprovarSolicitacao(sol.id, 'Engenheiro Chefe', 'Aprovado');
    const cotacao = comprasService.criarCotacao(empresaId, {
      solicitacaoId: solAprovada.id,
      compradorNome: 'Comprador Especialista',
      fornecedoresIds: ['forn-usiminas-01'],
    });
    const { pedido } = comprasService.aprovarCotacaoEEfetivarPedido(cotacao.id, {
      fornecedorIdVencedor: cotacao.fornecedores[0].fornecedorId,
      aprovadorNome: 'Diretor',
      justificativaEscolha: 'Menor custo total.',
    });

    const recebimentoRes = comprasService.processarRecebimento(empresaId, {
      pedidoCompraId: pedido.id,
      numeroNf: '000.123.999',
      serieNf: '1',
      chaveAcessoNfe: '31260260870004000140550010001239991098421099',
      dataEmissaoNf: '2026-02-25',
      responsavelRecebimentoNome: 'Almoxarife Marcelo',
      conferenteQualidadeNome: 'Inspetor Carlos',
      itens: [
        {
          pedidoCompraItemId: pedido.itens[0].id,
          quantidadeEntregue: 5,
          quantidadeAprovada: 5,
          quantidadeRejeitada: 0,
          numeroLoteUsina: 'LOT-TEST-100',
        },
      ],
    });

    expect(recebimentoRes.recebimento.status).toBe('RECEBIDO_TOTAL');
    expect(recebimentoRes.financeiro.valorTotal).toBeGreaterThan(0);
    expect(recebimentoRes.fiscal.valorTotalNf).toBeGreaterThan(0);
    expect(recebimentoRes.recebimento.movimentoEstoqueIds.length).toBeGreaterThan(0);
  });

  it('7. Deve processar devolução a fornecedor com estorno no estoque', () => {
    const pedidos = comprasService.getPedidos(empresaId);
    const pedido = pedidos[0];
    const recebimentos = comprasService.getRecebimentos(empresaId, pedido.id);
    const rec = recebimentos[0];

    const devolucao = comprasService.processarDevolucao(empresaId, {
      recebimentoId: rec.id,
      tipoDevolucao: 'PARCIAL',
      motivoGeral: 'Espessura fora de padrão',
      numeroNfDevolucao: '000.888.777',
      serieNfDevolucao: '1',
      chaveAcessoNfeDevolucao: '31260244444444000140550010008887771098421000',
      responsavelNome: 'Inspetor Carlos',
      itens: [
        {
          recebimentoItemId: rec.itens[0].id,
          quantidadeDevolvida: 1,
          motivo: 'Espessura 4.50mm ao invés de 4.75mm',
        },
      ],
    });

    expect(devolucao.numero.startsWith('DEV-')).toBe(true);
    expect(devolucao.itens.length).toBe(1);
  });

  it('8. Deve manter histórico de preços de compras e IQF dos fornecedores', () => {
    const historico = comprasService.getHistoricoPrecos(empresaId);
    expect(historico.length).toBeGreaterThan(0);

    const avaliacoes = comprasService.getAvaliacoesFornecedores(empresaId);
    expect(avaliacoes.length).toBeGreaterThan(0);
    expect(avaliacoes[0].iqfPontuacaoGeral).toBeGreaterThan(0);
  });
});

// backend/tests/estoque_rules.test.ts
// Testes automatizados das regras do Estoque Multiempresa

import { estoqueService } from '../modules/estoque/estoque-service';

async function runTests() {
  console.log('===============================================================');
  console.log('INICIANDO SUÍTE DE TESTES: ESTOQUE MULTIEMPRESA & REGRAS INDUSTRIAIS');
  console.log('===============================================================\n');

  const empresaTritech = '44444444-4444-4444-4444-444444444444'; // TRITECH_CORTE
  const empresaMwam = '11111111-1111-1111-1111-111111111111'; // MWAM

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      testsFailed++;
    }
  }

  try {
    // 1. Teste: Saldo por Empresa (Isolamento Multi-tenant)
    const saldosTritech = estoqueService.getSaldos(empresaTritech);
    const saldosMwam = estoqueService.getSaldos(empresaMwam);
    assert(
      saldosTritech.length > 0 && saldosMwam.length === 0,
      'Regra 1: Isolamento estrito de saldos por empresa (TRITECH vs MWAM)'
    );

    // 2. Teste: Cálculo de Disponibilidade e Reserva (Reduz Disponibilidade, NÃO Saldo Físico)
    const saldoInicialChapa = saldosTritech.find((s) => s.codigoProduto === 'MP-CH-1020-4.75')!;
    const fisicoAntes = saldoInicialChapa.quantidadeFisica;
    const dispAntes = saldoInicialChapa.quantidadeDisponivel;

    const resReserva = estoqueService.criarReserva(empresaTritech, {
      produtoId: saldoInicialChapa.produtoId,
      codigoProduto: saldoInicialChapa.codigoProduto,
      descricaoProduto: saldoInicialChapa.descricaoProduto,
      almoxarifadoId: saldoInicialChapa.almoxarifadoId,
      localizacaoId: saldoInicialChapa.localizacaoId,
      loteId: saldoInicialChapa.loteId,
      quantidadeReservada: 3,
      unidadeMedida: 'CHAPA',
      tipoOrigem: 'PEDIDO_VENDA',
      documentoOrigemId: 'pv-teste-001',
      documentoOrigemNumero: 'PV-TESTE-001',
      usuarioId: 'user-01',
      usuarioNome: 'Vendedor Teste',
    });

    const saldoAposReserva = resReserva.saldoAtualizado;
    assert(
      saldoAposReserva.quantidadeFisica === fisicoAntes &&
        saldoAposReserva.quantidadeDisponivel === dispAntes - 3 &&
        saldoAposReserva.quantidadeReservada >= 3,
      'Regra 2: Reserva reduz disponibilidade sem alterar o saldo físico'
    );

    // 3. Teste: Bloqueio de Saldo Negativo (Política da Empresa)
    let erroSaldoNegativo = false;
    try {
      estoqueService.executarMovimento(empresaTritech, {
        tipoMovimento: 'SAIDA_PRODUCAO_OP',
        produtoId: saldoInicialChapa.produtoId,
        codigoProduto: saldoInicialChapa.codigoProduto,
        descricaoProduto: saldoInicialChapa.descricaoProduto,
        quantidade: 99999, // Quantidade exorbitante
        unidadeMedida: 'CHAPA',
        almoxarifadoOrigemId: saldoInicialChapa.almoxarifadoId,
        localizacaoOrigemId: saldoInicialChapa.localizacaoId,
        documentoOrigemTipo: 'ORDEM_PRODUCAO',
        documentoOrigemNumero: 'OP-TESTE-INV',
        motivo: 'Consumo teste de chapa',
        usuarioId: 'user-01',
        usuarioNome: 'Operador Teste',
      });
    } catch (err: any) {
      if (err.message.includes('Política de Estoque da Empresa Violada')) {
        erroSaldoNegativo = true;
      }
    }
    assert(erroSaldoNegativo, 'Regra 3: Rejeição rigorosa de saldo negativo quando a política proíbe');

    // 4. Teste: Movimento Exige Motivo Obrigatório
    let erroMotivoObrigatorio = false;
    try {
      estoqueService.executarMovimento(empresaTritech, {
        tipoMovimento: 'ENTRADA_COMPRA',
        produtoId: saldoInicialChapa.produtoId,
        codigoProduto: saldoInicialChapa.codigoProduto,
        descricaoProduto: saldoInicialChapa.descricaoProduto,
        quantidade: 1,
        unidadeMedida: 'CHAPA',
        almoxarifadoDestinoId: saldoInicialChapa.almoxarifadoId,
        documentoOrigemTipo: 'NOTA_FISCAL_ENTRADA',
        motivo: '', // Motivo vazio!
        usuarioId: 'user-01',
        usuarioNome: 'Almoxarife Teste',
      });
    } catch (err: any) {
      if (err.message.includes('exige motivo obrigatório')) {
        erroMotivoObrigatorio = true;
      }
    }
    assert(erroMotivoObrigatorio, 'Regra 4: Qualquer ajuste ou movimentação exige motivo obrigatório');

    // 5. Teste: Estorno com Movimento de Reversão e Rastreabilidade
    const movEntradaTeste = estoqueService.executarMovimento(empresaTritech, {
      tipoMovimento: 'ENTRADA_COMPRA',
      produtoId: saldoInicialChapa.produtoId,
      codigoProduto: saldoInicialChapa.codigoProduto,
      descricaoProduto: saldoInicialChapa.descricaoProduto,
      quantidade: 2,
      unidadeMedida: 'CHAPA',
      custoUnitario: 1000,
      almoxarifadoDestinoId: saldoInicialChapa.almoxarifadoId,
      localizacaoDestinoId: saldoInicialChapa.localizacaoId,
      documentoOrigemTipo: 'NOTA_FISCAL_ENTRADA',
      documentoOrigemNumero: 'NF-TESTE-ESTORNO',
      motivo: 'Entrada para teste de reversão posterior',
      usuarioId: 'user-01',
      usuarioNome: 'Almoxarife Teste',
    });

    const resEstorno = estoqueService.estornarMovimento(
      empresaTritech,
      movEntradaTeste.movimento.id,
      'Entrada digitada incorretamente pela recepção fiscal',
      { id: 'user-sup', nome: 'Supervisor Estoque' }
    );

    assert(
      resEstorno.sucesso &&
        resEstorno.movimentoEstorno.tipoMovimento === 'REVERSAO_ESTORNO' &&
        resEstorno.movimentoEstorno.movimentoOriginalId === movEntradaTeste.movimento.id,
      'Regra 5: Reversão gera movimento de estorno com link auditável para o movimento original'
    );

    // 6. Teste: Chapas Industriais (Controle de Área m², Peso Teórico e Lote)
    const lotesTritech = estoqueService.getLotes(empresaTritech);
    const locsTritech = estoqueService.getLocalizacoes(empresaTritech);
    const chapaNova = estoqueService.cadastrarChapa(empresaTritech, {
      codigoChapa: 'CH-TEST-1020-6.35-1500x6000',
      produtoId: 'prod-chapa-1020-635',
      material: 'Aço Carbono SAE 1020',
      espessuraMm: 6.35,
      larguraMm: 1500,
      comprimentoMm: 6000,
      loteId: lotesTritech[0].id,
      custoPorKg: 7.2,
      almoxarifadoId: saldoInicialChapa.almoxarifadoId,
      localizacaoId: locsTritech[0].id,
      observacoes: 'Chapa naval grossa para teste',
    });

    // Área: 1.5m * 6m = 9m². Peso: 9m² * 6.35mm * 7850kg/m³ / 1000 = 448.635 kg
    assert(
      chapaNova.areaM2 === 9 && chapaNova.pesoKg > 440 && chapaNova.numeroLote === lotesTritech[0].numeroLote,
      'Regra 6: Controle de chapas calcula área m², peso teórico e vincula lote/corrida de usina'
    );

    // 7. Teste: Retalhos de Corte (Dimensões, Peso, Origem Chapa Mãe e Aproveitamento %)
    const retalhoNovo = estoqueService.cadastrarRetalho(empresaTritech, {
      codigoRetalho: 'RET-TEST-01',
      loteOrigemId: lotesTritech[0].id,
      chapaMaeId: chapaNova.id,
      ordemProducaoOrigemId: 'OP-CORTE-LASER-99',
      material: 'Aço Carbono SAE 1020',
      espessuraMm: 6.35,
      larguraMm: 600,
      comprimentoMm: 1500,
      formatoGeometrico: 'RETANGULAR',
      aproveitamentoEstimadoPerc: 85,
      almoxarifadoId: saldoInicialChapa.almoxarifadoId,
      localizacaoId: locsTritech[0].id,
      custoUnitarioKg: 7.2,
      observacoes: 'Sobra útil de teste',
    });

    assert(
      retalhoNovo.areaM2 === 0.9 &&
        retalhoNovo.chapaMaeId === chapaNova.id &&
        retalhoNovo.aproveitamentoEstimadoPerc === 85,
      'Regra 7: Cadastro de retalhos rastreia chapa mãe, OP de origem e percentual de aproveitamento'
    );

    // 8. Teste: Inventário, Contagem e Apuração de Divergências
    const { sessao: novaSessao, itens: itensSessao } = estoqueService.iniciarInventario(empresaTritech, {
      titulo: 'Inventário Teste Contagem Cega',
      tipo: 'ROTATIVO_CICLICO',
      almoxarifadoId: saldoInicialChapa.almoxarifadoId,
      responsavelNome: 'Auditor de Estoque',
    });

    const contagemComDivergencia = estoqueService.registrarContagemInventario(empresaTritech, novaSessao.id, [
      {
        itemId: itensSessao[0].id,
        contagemFisica: itensSessao[0].saldoSistemaQuantidade + 2, // 2 a mais físico
        justificativa: 'Sobra física encontrada no rack',
      },
    ]);

    assert(
      contagemComDivergencia.sessao.totalDivergenciasEncontradas === 1 &&
        contagemComDivergencia.itens[0].divergenciaQuantidade === 2 &&
        contagemComDivergencia.itens[0].statusItem === 'DIVERGENCIA_POSITIVA',
      'Regra 8: Apuração de inventário detecta divergências físicas vs sistema com cálculo de impacto financeiro'
    );
  } catch (err: any) {
    console.error('Erro fatal durante execução dos testes:', err);
    testsFailed++;
  }

  console.log('\n===============================================================');
  console.log(`RESULTADO FINAL: ${testsPassed} PASSARAM | ${testsFailed} FALHARAM`);
  console.log('===============================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();

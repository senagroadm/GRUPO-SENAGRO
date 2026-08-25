import { describe, it, expect } from 'vitest';
import { pcpService } from '../../backend/modules/pcp/pcp-service';

describe('PCP & MRP Inicial - Regras de Negócio e Algoritmos Determinísticos', () => {
  const empresaId = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica

  it('1. Deve calcular Necessidades Líquidas considerando Demanda Bruta, Estoque, Material Bloqueado, Reservas e Compras Abertas', () => {
    const res = pcpService.executarCalculoMRP(empresaId);

    expect(res.necessidadesLiquidas.length).toBeGreaterThan(0);

    // Testar item MP-CH-A516-12.7 (Chapa Caldeiraria):
    // Demanda Bruta do Vaso 12m³ (2 un x 3 chapas x 1.06 perda = 6.36 chapas)
    // Estoque Físico = 8, Bloqueado = 2, Reservado = 3 => Saldo Livre = 3
    // Compras Abertas = 5 => Cobertura Total = 3 + 5 = 8 >= 6.36 => Necessidade Líquida = 0 (totalmente coberto)
    const necChapaA516 = res.necessidadesLiquidas.find((n) => n.codigoItem === 'MP-CH-A516-12.7');
    expect(necChapaA516).toBeDefined();
    expect(necChapaA516?.materialBloqueado).toBe(2);
    expect(necChapaA516?.reservasAtivas).toBe(3);
    expect(necChapaA516?.estoqueLiquidoDisponivel).toBe(3); // 8 - 2 - 3 = 3
    expect(necChapaA516?.comprasAbertasEmTransito).toBe(5);
    expect(necChapaA516?.necessidadeLiquidaCalculada).toBe(0); // Coberto por compras em trânsito!

    // Testar item MP-TUBO-SCH40-4POL:
    // Demanda Bruta do Vaso (2 un x 2 barras x 1.05 perda = 4.2 barras)
    // Estoque Físico = 4, Bloqueado = 1, Reservado = 3 => Saldo Livre = 0!
    // Compras Abertas = 0 => Necessidade Líquida = 4.2 barras
    const necTubo = res.necessidadesLiquidas.find((n) => n.codigoItem === 'MP-TUBO-SCH40-4POL');
    expect(necTubo).toBeDefined();
    expect(necTubo?.materialBloqueado).toBe(1);
    expect(necTubo?.reservasAtivas).toBe(3);
    expect(necTubo?.estoqueLiquidoDisponivel).toBe(0);
    expect(necTubo?.necessidadeLiquidaCalculada).toBe(4.2);
  });

  it('2. NÃO deve criar compra duplicada se já houver compra aberta que cubra a necessidade', () => {
    const res = pcpService.executarCalculoMRP(empresaId);

    // O item COMP-FLANGE-WN-150-4POL já possui 6 unidades em compra aberta (PC-2026-0048) para suprir demanda
    const sugFlange = res.sugestoesCompra.find((s) => s.codigoItem === 'COMP-FLANGE-WN-150-4POL');
    // Como a compra aberta cobre toda a necessidade, a necessidade líquida é 0 e não gera nova sugestão de compra duplicada
    expect(sugFlange).toBeUndefined();

    // Validar na lista de necessidades líquidas que o item registrou a compra aberta
    const necFlange = res.necessidadesLiquidas.find((n) => n.codigoItem === 'COMP-FLANGE-WN-150-4POL');
    expect(necFlange).toBeDefined();
    expect(necFlange?.comprasAbertasEmTransito).toBe(8);
    expect(necFlange?.necessidadeLiquidaCalculada).toBe(0);
  });

  it('3. Toda sugestão de compra e de produção deve ter ORIGEM RASTREÁVEL', () => {
    const res = pcpService.executarCalculoMRP(empresaId);

    // Sugestão de produção
    expect(res.sugestoesProducao.length).toBeGreaterThan(0);
    const sugProd = res.sugestoesProducao[0];
    expect(sugProd.origemRastreavel.length).toBeGreaterThan(0);
    expect(sugProd.origemRastreavel[0].documentoOrigemNumero).toBeDefined();
    expect(sugProd.origemRastreavel[0].justificativaCalculo).toBeDefined();
    expect(sugProd.origemRastreavel[0].tipoOrigem).toBe('PEDIDO_VENDA');

    // Sugestão de compra
    expect(res.sugestoesCompra.length).toBeGreaterThan(0);
    const sugCompra = res.sugestoesCompra[0];
    expect(sugCompra.origemRastreavel.length).toBeGreaterThan(0);
    expect(sugCompra.origemRastreavel[0].justificativaCalculo).toContain('Explosão da BOM');
  });

  it('4. Deve considerar Lead Time configurado e calcular data de disparo para trás (Backward Scheduling)', () => {
    const res = pcpService.executarCalculoMRP(empresaId);

    const sugTubo = res.sugestoesCompra.find((s) => s.codigoItem === 'MP-TUBO-SCH40-4POL');
    expect(sugTubo).toBeDefined();
    expect(sugTubo?.leadTimeCompraDias).toBe(10);

    const dataEntregaFabrica = new Date(sugTubo!.dataNecessidadeFabrica);
    const dataDisparo = new Date(sugTubo!.dataSugeridaEmissaoCompra);

    // A data de emissão deve ser 10 dias antes da data limite na fábrica
    const diffDias = Math.round((dataEntregaFabrica.getTime() - dataDisparo.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDias).toBe(10);
  });

  it('5. Deve detectar riscos determinísticos de atraso (gargalo de capacidade, suprimento atrasado e manutenção)', () => {
    const res = pcpService.executarCalculoMRP(empresaId);

    expect(res.riscosAtraso.length).toBeGreaterThan(0);

    // Risco de sobrecarga de máquina
    const riscoSobrecarga = res.riscosAtraso.find((r) => r.tipoRisco === 'SOBRECARGA_CAPACIDADE');
    expect(riscoSobrecarga).toBeDefined();
    expect(riscoSobrecarga?.maquinaNome).toContain('Dobradeira');

    // Risco de manutenção
    const riscosManut = res.riscosAtraso.filter((r) => r.tipoRisco === 'MANUTENCAO_MAQUINA');
    expect(riscosManut.length).toBeGreaterThan(0);
    expect(riscosManut.some((r) => r.maquinaNome?.includes('Mandrilhadora') || r.maquinaNome?.includes('Laser'))).toBe(true);

    // Risco de estoque bloqueado
    const riscoBloqueio = res.riscosAtraso.find((r) => r.tipoRisco === 'SUPRIMENTO_ATRASADO');
    expect(riscoBloqueio).toBeDefined();
  });

  it('6. Deve calcular capacidade e taxa de ocupação por máquina e por setor', () => {
    const res = pcpService.executarCalculoMRP(empresaId);

    expect(res.capacidadeMaquinas.length).toBeGreaterThan(0);
    expect(res.capacidadeSetores.length).toBeGreaterThan(0);

    const setorDobra = res.capacidadeSetores.find((s) => s.setor === 'DOBRA_CNC');
    expect(setorDobra).toBeDefined();
    expect(setorDobra?.capacidadeTotalHorasDia).toBeGreaterThan(0);
    expect(setorDobra?.taxaOcupacaoPercentual).toBeGreaterThan(100);
    expect(setorDobra?.status).toBe('GARGALO');
  });

  it('7. Fila de produção deve suportar reordenação determinística por Critical Ratio, EDD, SPT e FIFO', () => {
    const filaCR = pcpService.sequenciarFilaProducao(empresaId, 'maq-dobra-cnc-01', 'CRITICAL_RATIO');
    expect(filaCR).toBeDefined();
    expect(filaCR.length).toBeGreaterThanOrEqual(1);
    expect(filaCR[0].posicaoFila).toBe(1);

    const filaSPT = pcpService.sequenciarFilaProducao(empresaId, 'maq-dobra-cnc-01', 'SHORTEST_PROCESSING_TIME');
    expect(filaSPT).toBeDefined();
    expect(filaSPT[0].posicaoFila).toBe(1);
  });

  it('8. Deve converter sugestão de produção do MRP em Ordem de Produção (OP) com materiais e operações alocadas', () => {
    const res = pcpService.executarCalculoMRP(empresaId);
    const sugProd = res.sugestoesProducao[0];
    expect(sugProd).toBeDefined();

    const opGerada = pcpService.converterSugestaoProducaoEmOP(empresaId, sugProd.id);
    expect(opGerada.id).toBeDefined();
    expect(opGerada.origemTipo).toBe('SUGESTAO_MRP');
    expect(opGerada.codigoItem).toBe(sugProd.codigoItem);
    expect(opGerada.quantidadePlanejada).toBe(sugProd.quantidadeSugerida);
    expect(opGerada.operacoes.length).toBeGreaterThan(0);
    expect(opGerada.materiaisRequeridos.length).toBeGreaterThan(0);
  });
});
